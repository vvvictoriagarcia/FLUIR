import type { Goal } from "@/lib/budget-store";

/** Meses enteros desde hoy hasta la fecha límite (puede ser 0 o negativo). */
export function monthsLeft(targetDate: string): number {
  const to = new Date(`${targetDate}T00:00:00`);
  const now = new Date();
  return (
    (to.getFullYear() - now.getFullYear()) * 12 +
    (to.getMonth() - now.getMonth())
  );
}

export interface GoalProjection {
  monthsLeft: number;
  /** Costo estimado del objetivo en la fecha límite, ajustado por inflación. */
  inflatedTarget: number;
  /** Cuánto falta en pesos de la fecha límite (ya restado lo ahorrado). */
  remaining: number;
  /** Aporte por mes sugerido para llegar, contemplando inflación. */
  perMonth: number;
  done: boolean;
  overdue: boolean;
  /** % ahorrado sobre el costo REAL (ajustado por inflación) — para la barra. */
  pct: number;
  /** Dónde queda el precio de hoy dentro del costo futuro (0..1). */
  nominalShare: number;
}

/**
 * Proyecta un objetivo con la tasa de inflación MENSUAL.
 * El objetivo nominal crece: target * (1 + r)^meses. Como lo ahorrado queda
 * en pesos (nominal), el aporte que falta se calcula contra el costo futuro:
 * así el sugerido/mes ya absorbe la pérdida de poder de compra de lo guardado.
 */
export function projectGoal(goal: Goal, monthlyRate: number): GoalProjection {
  const left = monthsLeft(goal.targetDate);
  const factor = Math.pow(1 + monthlyRate, Math.max(0, left));
  const inflatedTarget = Math.round(goal.targetAmount * factor);
  const done = goal.savedAmount >= inflatedTarget;
  const remaining = Math.max(0, inflatedTarget - goal.savedAmount);
  const perMonth = remaining / Math.max(1, left);
  const pct =
    inflatedTarget > 0 ? Math.min(1, goal.savedAmount / inflatedTarget) : 0;
  const nominalShare =
    inflatedTarget > 0 ? Math.min(1, goal.targetAmount / inflatedTarget) : 1;
  return {
    monthsLeft: left,
    inflatedTarget,
    remaining,
    perMonth,
    done,
    overdue: left < 0 && !done,
    pct,
    nominalShare,
  };
}
