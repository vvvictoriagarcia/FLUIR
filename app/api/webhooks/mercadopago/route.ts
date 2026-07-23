import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  cancelPreapproval,
  decodeRef,
  getPreapproval,
  planFromPlanId,
} from "@/lib/mercadopago/client";

// Webhook de Mercado Pago: cuando una suscripción cambia de estado, MP nos avisa.
// Verificamos la firma, traemos la suscripción real desde MP, y activamos/bajamos
// el plan del usuario (profiles.plan) con el cliente admin (service role).
// Requiere MP_WEBHOOK_SECRET (firma) y SUPABASE_SERVICE_ROLE_KEY (update).

/** Verifica la firma x-signature de MP (esquema ts/v1 con HMAC-SHA256). */
function verifySignature(request: NextRequest, dataId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // "apagado": sin secreto, no verificamos (dev)

  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id") ?? "";
  if (!xSignature) return false;

  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => p.split("=").map((s) => s.trim()))
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;
  const hmac = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(v1));
  } catch {
    return false;
  }
}

/**
 * Busca el id de usuario por email entre los usuarios de auth. Es el plan B
 * cuando el checkout no nos devuelve el external_reference. Recorre de a
 * páginas; con el volumen de Fluir hoy alcanza y sobra.
 */
async function findUserIdByEmail(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  email: string,
): Promise<string | null> {
  const target = email.trim().toLowerCase();
  for (let page = 1; page <= 5; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error || !data?.users?.length) return null;
    const hit = data.users.find((u) => u.email?.toLowerCase() === target);
    if (hit) return hit.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

export async function POST(request: NextRequest) {
  // El id del recurso viene en query (?data.id=) o en el body.
  const url = request.nextUrl;
  let dataId = url.searchParams.get("data.id") ?? "";
  let type = url.searchParams.get("type") ?? "";

  let body: { type?: string; action?: string; data?: { id?: string } } = {};
  try {
    body = await request.json();
  } catch {}
  if (!dataId && body.data?.id) dataId = body.data.id;
  if (!type && body.type) type = body.type;

  // Solo nos interesan los eventos de suscripción.
  if (!dataId || !type.includes("preapproval")) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (!verifySignature(request, dataId)) {
    return NextResponse.json({ error: "Firma inválida." }, { status: 401 });
  }

  const sub = await getPreapproval(dataId);
  if (!sub) return NextResponse.json({ ok: true, note: "no data" });

  const admin = createAdminClient();
  if (!admin) {
    // Sin service role no podemos actualizar el plan (queda para cuando la cargues).
    return NextResponse.json({ ok: true, note: "sin service role" });
  }

  // A quién activarle el plan. Camino 1: el external_reference que le colgamos
  // al link de checkout. Camino 2 (si MP no lo propagó): el mail del pagador.
  const ref = decodeRef(sub.external_reference ?? "");
  let userId = ref?.userId ?? null;
  const plan = ref?.plan ?? planFromPlanId(sub.preapproval_plan_id);

  if (!userId && sub.payer_email) {
    userId = await findUserIdByEmail(admin, sub.payer_email);
  }

  if (!userId || !plan) {
    // No la pudimos matchear sola: queda para activar a mano desde Supabase.
    return NextResponse.json({
      ok: true,
      note: "no pudimos identificar al usuario",
      payer_email: sub.payer_email ?? null,
      preapproval_plan_id: sub.preapproval_plan_id ?? null,
    });
  }

  // authorized → activa el plan. paused (pago rechazado / mes no pagado) y
  // cancelled → vuelve a free. Es la baja automática por falta de pago.
  const activa = sub.status === "authorized";
  const newPlan = activa ? plan : "free";

  // Si venía de otra suscripción (p. ej. pasó de Pro a Gold), damos de baja la
  // anterior en MP: si no, le cobrarían las dos.
  const { data: prev } = await admin
    .from("profiles")
    .select("mp_preapproval_id")
    .eq("id", userId)
    .maybeSingle();

  const previo = prev?.mp_preapproval_id as string | null | undefined;
  if (activa && previo && previo !== dataId) {
    await cancelPreapproval(previo).catch(() => false);
  }

  const { error } = await admin
    .from("profiles")
    .update({
      plan: newPlan,
      mp_preapproval_id: activa ? dataId : null,
      plan_status: sub.status,
      plan_updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, plan: newPlan, status: sub.status });
}
