import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { emailConfigured, sendEmail } from "@/lib/email/client";
import { welcomeEmail } from "@/lib/email/templates";

// Manda el mail de bienvenida al usuario recién registrado, UNA sola vez.
//
// Se puede llamar en cada carga sin miedo: si `welcome_sent_at` ya está puesto,
// no hace nada. Así también cubre a quien entra con Google (que llega por un
// redirect y no tiene un momento claro de "recién me registré").
//
// Solo al mail de la sesión actual: nadie puede usar la ruta para mandarle
// mails a terceros. Si el envío está apagado (falta RESEND_API_KEY), responde
// 200 igual — el registro no puede fallar porque el mail no salió.

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ ok: true, skipped: "sin sesión" });
  }

  // ¿Ya se le mandó? Si la columna no existe todavía (migración sin correr),
  // el error se ignora y seguimos: mejor mandar que trabarse.
  const { data: profile } = await supabase
    .from("profiles")
    .select("welcome_sent_at")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.welcome_sent_at) {
    return NextResponse.json({ ok: true, skipped: "ya enviado" });
  }

  if (!emailConfigured()) {
    return NextResponse.json({ ok: true, skipped: "envío apagado" });
  }

  const nombre =
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    undefined;
  const { subject, html } = welcomeEmail(nombre);
  const res = await sendEmail({ to: user.email, subject, html });

  if (res.ok) {
    // Lo marcamos para no repetirlo. Si esto falla, en el peor caso mandamos el
    // mail dos veces alguna vez — molesto pero no grave.
    await supabase
      .from("profiles")
      .update({ welcome_sent_at: new Date().toISOString() })
      .eq("id", user.id);
  } else if (!res.skipped) {
    console.warn("[email/welcome] no se pudo enviar:", res.error);
  }

  return NextResponse.json({ ok: res.ok });
}
