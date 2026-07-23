import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cancelPreapproval, mpConfigured } from "@/lib/mercadopago/client";

/**
 * Baja de la suscripción, pedida por la propia persona desde la app.
 * Cancela en Mercado Pago y deja el perfil en Free. El webhook igual va a
 * confirmar el cambio cuando MP nos avise.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Iniciá sesión primero." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("mp_preapproval_id, plan")
    .eq("id", user.id)
    .maybeSingle();

  const preapprovalId = profile?.mp_preapproval_id as string | null | undefined;

  // Si tiene suscripción viva en MP, la cortamos ahí primero.
  if (preapprovalId) {
    if (!mpConfigured()) {
      return NextResponse.json(
        { error: "No podemos cancelar automáticamente. Escribinos y lo hacemos." },
        { status: 503 },
      );
    }
    const ok = await cancelPreapproval(preapprovalId);
    if (!ok) {
      return NextResponse.json(
        { error: "Mercado Pago no aceptó la baja. Escribinos y lo resolvemos." },
        { status: 502 },
      );
    }
  }

  // Bajamos el plan. Con service role si está cargada; si no, con la sesión
  // (la política RLS "own profile" deja que cada quien edite su fila).
  const admin = createAdminClient();
  const db = admin ?? supabase;
  const { error } = await db
    .from("profiles")
    .update({
      plan: "free",
      mp_preapproval_id: null,
      plan_status: "cancelled",
      plan_updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
