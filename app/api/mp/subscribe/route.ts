import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSubscription, mpConfigured, type PaidPlan } from "@/lib/mercadopago/client";

// Crea una suscripción de Mercado Pago (1er mes gratis) para el usuario logueado
// y devuelve el link de checkout. 503 si los pagos todavía no están configurados.
export async function POST(request: NextRequest) {
  if (!mpConfigured()) {
    return NextResponse.json(
      { error: "Los pagos todavía no están habilitados." },
      { status: 503 }
    );
  }

  let body: { plan?: PaidPlan };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }
  if (body.plan !== "plus" && body.plan !== "gold") {
    return NextResponse.json({ error: "Plan inválido." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: "Iniciá sesión primero." }, { status: 401 });
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

  try {
    const sub = await createSubscription({
      plan: body.plan,
      userId: user.id,
      email: user.email,
      backUrl: `${origin}/perfil?suscripcion=ok`,
    });
    if (!sub) {
      return NextResponse.json({ error: "Pagos no configurados." }, { status: 503 });
    }
    return NextResponse.json({ initPoint: sub.initPoint });
  } catch {
    return NextResponse.json(
      { error: "No pudimos iniciar la suscripción. Probá de nuevo." },
      { status: 502 }
    );
  }
}
