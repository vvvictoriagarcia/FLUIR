import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Movement } from "@/lib/import/types";

// Guarda los movimientos revisados en Supabase. Idempotente: el índice único
// (user_id, dedup_key) evita duplicar reimportaciones. Además aprende las
// correcciones de categoría del usuario (comercio → categoría).
export async function POST(request: NextRequest) {
  let body: { movements?: Movement[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const movements = (body.movements ?? []).filter((m) => m.amount > 0);
  if (movements.length === 0) {
    return NextResponse.json({ error: "No hay movimientos." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Necesitás iniciar sesión." }, { status: 401 });
  }

  // Presupuesto del mes actual (los gastos cuelgan de él).
  const d = new Date();
  const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  const { data: budget } = await supabase
    .from("budgets")
    .select("id")
    .eq("user_id", user.id)
    .eq("month", month)
    .maybeSingle();
  if (!budget) {
    return NextResponse.json(
      { error: "Todavía no tenés presupuesto de este mes." },
      { status: 409 }
    );
  }

  // Insert idempotente (ignora los que ya existían por dedup_key).
  const rows = movements.map((m) => ({
    user_id: user.id,
    budget_id: budget.id,
    category: m.category ?? "Sin categoría",
    amount: m.amount,
    description: m.merchant,
    merchant: m.merchantNorm,
    date: m.date,
    source: "import",
    dedup_key: m.dedupKey,
  }));

  const { data: inserted, error } = await supabase
    .from("expenses")
    .upsert(rows, { onConflict: "user_id,dedup_key", ignoreDuplicates: true })
    .select("id");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Aprender las categorías confirmadas (comercioNorm → categoría).
  const learned = movements
    .filter((m) => m.category)
    .map((m) => ({
      user_id: user.id,
      merchant: m.merchantNorm,
      category: m.category as string,
    }));
  if (learned.length > 0) {
    await supabase
      .from("merchant_overrides")
      .upsert(learned, { onConflict: "user_id,merchant" });
  }

  return NextResponse.json({
    ok: true,
    imported: inserted?.length ?? 0,
    total: movements.length,
  });
}
