// ─────────────────────────────────────────────────────────────────
// FLUIR — Planes (Free / Plus / Gold)
// La fuente de verdad del plan es `profiles.plan` en Supabase (lo setea el
// webhook de Mercado Pago cuando se paga). Mientras tanto, hay un override de
// "vista previa" en localStorage para poder construir y probar las features
// pagas sin tener los pagos andando. El override es SOLO UX (previsualización):
// la protección real de datos la da RLS por usuario, no el gate visual.
// ─────────────────────────────────────────────────────────────────

export type Plan = "free" | "plus" | "gold";

const RANK: Record<Plan, number> = { free: 0, plus: 1, gold: 2 };

/** True si `plan` alcanza (o supera) el nivel `need`. */
export function planMeets(plan: Plan, need: Plan): boolean {
  return RANK[plan] >= RANK[need];
}

export const PLAN_LABELS: Record<Plan, string> = {
  free: "Free",
  plus: "Pro", // el plan se llama "Pro" en Mercado Pago; la clave interna sigue siendo "plus"
  gold: "Gold",
};

const PREVIEW_KEY = "fluir_plan_preview";

/**
 * Lee el override de previsualización de plan (o null si no hay).
 * En producción SIEMPRE devuelve null: el override es una herramienta de
 * desarrollo y dejarlo vivo regalaría las features pagas.
 */
export function getPlanPreview(): Plan | null {
  if (process.env.NODE_ENV === "production") return null;
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(PREVIEW_KEY);
  return v === "free" || v === "plus" || v === "gold" ? v : null;
}

/** Setea (o limpia con null) el override de previsualización de plan. */
export function setPlanPreview(plan: Plan | null): void {
  if (typeof window === "undefined") return;
  if (plan) localStorage.setItem(PREVIEW_KEY, plan);
  else localStorage.removeItem(PREVIEW_KEY);
}
