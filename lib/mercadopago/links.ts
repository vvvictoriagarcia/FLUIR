// ─────────────────────────────────────────────────────────────────
// FLUIR — Links de suscripción de Mercado Pago (planes ya creados en el panel).
// Este archivo NO tiene secretos: se puede importar desde el cliente.
// Los links cortos (mpago.la) redirigen a estas mismas URLs; usamos la larga
// para poder colgarle el external_reference y saber quién pagó.
// ─────────────────────────────────────────────────────────────────

export type PaidPlan = "plus" | "gold";

/** Precio mensual en ARS, tal como está cargado en Mercado Pago. */
export const PLAN_AMOUNT: Record<PaidPlan, number> = {
  plus: 4000,
  gold: 9000,
};

/** id del preapproval_plan creado en el panel de Mercado Pago. */
export const MP_PLAN_ID: Record<PaidPlan, string> = {
  plus: "5de49e918f7a415d8b0c7b331baeec94", // "Pro Plan - Fluir" · $4.000/mes
  gold: "9f864b707c394367b2146c95d79d103e", // "Gold Plan - Fluir" · $9.000/mes
};

/** Plan al que corresponde un preapproval_plan_id (para el webhook). */
export function planFromPlanId(planId: string | undefined): PaidPlan | null {
  if (!planId) return null;
  if (planId === MP_PLAN_ID.plus) return "plus";
  if (planId === MP_PLAN_ID.gold) return "gold";
  return null;
}

/** external_reference = "<userId>|<plan>" para saber a quién y qué activar. */
export function encodeRef(userId: string, plan: PaidPlan): string {
  return `${userId}|${plan}`;
}

export function decodeRef(ref: string): { userId: string; plan: PaidPlan } | null {
  const [userId, plan] = (ref ?? "").split("|");
  if (!userId || (plan !== "plus" && plan !== "gold")) return null;
  return { userId, plan };
}

/**
 * URL del checkout de suscripción. Si hay sesión le pasamos el
 * external_reference; si Mercado Pago lo propaga, el webhook activa el plan
 * solo. Si no lo propaga, el webhook cae al match por email del pagador.
 */
export function checkoutUrl(plan: PaidPlan, userId?: string | null): string {
  const base = `https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=${MP_PLAN_ID[plan]}`;
  return userId
    ? `${base}&external_reference=${encodeURIComponent(encodeRef(userId, plan))}`
    : base;
}
