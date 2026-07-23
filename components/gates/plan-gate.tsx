"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Sparkles } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";
import { PLAN_LABELS, planMeets, type Plan } from "@/lib/plan";
import { trackOnce } from "@/lib/analytics";

/**
 * Muestra `children` solo si el plan del usuario alcanza `need`.
 * Si no, muestra un paywall que invita a mejorar el plan.
 */
export function PlanGate({
  need,
  feature,
  benefits,
  children,
}: {
  need: Exclude<Plan, "free">;
  feature: string;
  benefits?: string[];
  children: React.ReactNode;
}) {
  const { plan, loading } = usePlan();

  if (loading) return null;
  if (planMeets(plan, need)) return <>{children}</>;

  return <Paywall need={need} feature={feature} benefits={benefits} />;
}

function Paywall({
  need,
  feature,
  benefits,
}: {
  need: Exclude<Plan, "free">;
  feature: string;
  benefits?: string[];
}) {
  const isGold = need === "gold";

  // Cuánta gente choca con el paywall, y con cuál. Sin esto no se puede saber
  // si una feature paga vende o solo molesta.
  useEffect(() => {
    trackOnce("paywall_viewed", { need, feature });
  }, [need, feature]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-md text-center"
    >
      <div
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
          isGold ? "bg-gold/15 text-gold" : "bg-brand/15 text-brand"
        }`}
      >
        <Lock size={28} />
      </div>

      <span
        className={`mt-5 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
          isGold
            ? "bg-gold/15 text-gold"
            : "bg-brand/15 text-brand"
        }`}
      >
        {PLAN_LABELS[need]}
      </span>

      <h2 className="mt-3 font-display text-2xl font-semibold">{feature}</h2>
      <p className="mt-2 text-muted-foreground">
        Esto es parte del plan <strong>{PLAN_LABELS[need]}</strong>. Mejorá tu
        plan y desbloqueá esta función.
      </p>

      {benefits && benefits.length > 0 && (
        <ul className="mx-auto mt-5 max-w-xs space-y-2 text-left">
          {benefits.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm">
              <Sparkles
                size={16}
                className={`mt-0.5 shrink-0 ${isGold ? "text-gold" : "text-brand"}`}
              />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/planes"
        className={`mt-7 inline-flex w-full items-center justify-center rounded-full py-3.5 font-medium transition-opacity hover:opacity-90 ${
          isGold
            ? "bg-gold text-gold-foreground"
            : "bg-brand text-brand-foreground"
        }`}
      >
        Ver planes
      </Link>
    </motion.div>
  );
}
