import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Borrado de cuenta (derecho de supresión — Ley 25.326).
//
// Ideal: con SERVICE_ROLE_KEY borramos la fila de auth.users y todo cae en
// cascada (profiles y sus tablas hijas tienen `on delete cascade`).
// Fallback sin service role: borramos la fila de `profiles` con la sesión del
// usuario (RLS permite lo propio), lo que arrastra en cascada onboarding,
// presupuestos, categorías y gastos. La cuenta de auth queda huérfana (sin
// datos) hasta que se cargue la service role key.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No hay sesión." }, { status: 401 });
  }

  const admin = createAdminClient();

  if (admin) {
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, authDeleted: true });
  }

  // Fallback: borrar los datos con la sesión del propio usuario.
  const { error } = await supabase.from("profiles").delete().eq("id", user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, authDeleted: false });
}
