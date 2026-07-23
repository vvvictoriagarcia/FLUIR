// ─────────────────────────────────────────────────────────────────
// FLUIR — Mercado Pago: suscripciones (preapproval) con 1er mes gratis.
// SOLO servidor (usa MP_ACCESS_TOKEN, secreta). Queda "apagado" con gracia:
// si falta el token, mpConfigured() devuelve false y las rutas responden 503.
// ─────────────────────────────────────────────────────────────────

export type { PaidPlan } from "./links";
import type { PaidPlan } from "./links";
export { PLAN_AMOUNT, encodeRef, decodeRef, planFromPlanId } from "./links";
import { PLAN_AMOUNT, encodeRef } from "./links";

const API = "https://api.mercadopago.com";

export function mpConfigured(): boolean {
  return !!process.env.MP_ACCESS_TOKEN;
}

/**
 * Crea una suscripción con 1 mes de prueba gratis y devuelve el init_point
 * (link de checkout donde el usuario carga la tarjeta). null si no está configurado.
 */
export async function createSubscription(opts: {
  plan: PaidPlan;
  userId: string;
  email: string;
  backUrl: string;
}): Promise<{ initPoint: string } | null> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return null;

  const res = await fetch(`${API}/preapproval`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reason: `Fluir ${opts.plan === "gold" ? "Gold" : "Plus"}`,
      external_reference: encodeRef(opts.userId, opts.plan),
      payer_email: opts.email,
      back_url: opts.backUrl,
      status: "pending",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: PLAN_AMOUNT[opts.plan],
        currency_id: "ARS",
        free_trial: { frequency: 1, frequency_type: "months" },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`MP ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { init_point?: string };
  if (!json.init_point) throw new Error("MP no devolvió init_point");
  return { initPoint: json.init_point };
}

export interface Preapproval {
  status: string; // "authorized" | "paused" | "cancelled" | "pending"
  external_reference?: string;
  /** Viene cuando la suscripción se hizo desde un plan del panel. */
  preapproval_plan_id?: string;
  /** Mail con el que pagó: es el plan B para encontrar la cuenta. */
  payer_email?: string;
}

/**
 * Da de baja una suscripción en Mercado Pago. Se usa cuando la persona cancela
 * desde la app y, sobre todo, cuando mejora de plan: hay que cortar la vieja o
 * le siguen cobrando las dos.
 */
export async function cancelPreapproval(id: string): Promise<boolean> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return false;
  const res = await fetch(`${API}/preapproval/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "cancelled" }),
  });
  return res.ok;
}

/** Trae una suscripción por id (para verificar en el webhook). */
export async function getPreapproval(id: string): Promise<Preapproval | null> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return null;
  const res = await fetch(`${API}/preapproval/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as Preapproval;
}
