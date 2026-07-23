"use client";

import { useEffect, useState } from "react";
import { FlaskConical } from "lucide-react";
import { getPlanPreview, setPlanPreview, type Plan } from "@/lib/plan";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Plan; label: string }[] = [
  { value: "free", label: "Free" },
  { value: "plus", label: "Pro" },
  { value: "gold", label: "Gold" },
];

/**
 * Toggle de PRUEBA para previsualizar los tiers pagos sin pagar.
 * Escribe un override en localStorage que `usePlan` respeta. Temporal:
 * se quita cuando Mercado Pago setee el plan real en `profiles.plan`.
 */
export function PlanPreviewToggle() {
  const [active, setActive] = useState<Plan | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura única de localStorage al montar
    setActive(getPlanPreview());
  }, []);

  function pick(plan: Plan) {
    // "Free" limpia el override (vuelve al plan real).
    const next = plan === "free" ? null : plan;
    setPlanPreview(next);
    setActive(next);
    // Recargamos para que todos los gates y hooks tomen el nuevo plan.
    window.location.reload();
  }

  return (
    <div className="mt-4 rounded-card border border-dashed border-border bg-muted/30 p-4">
      <div className="flex items-center gap-2">
        <FlaskConical size={16} className="text-muted-foreground" />
        <p className="text-sm font-medium">Modo prueba de plan</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Solo para desarrollo: previsualizá las features pagas sin pagar. No
        afecta tu plan real.
      </p>
      <div className="mt-3 flex gap-1.5 rounded-full bg-background p-1">
        {OPTIONS.map((o) => {
          const selected =
            (o.value === "free" && !active) || o.value === active;
          return (
            <button
              key={o.value}
              onClick={() => pick(o.value)}
              className={cn(
                "flex-1 rounded-full py-2 text-xs font-medium transition-colors",
                selected
                  ? o.value === "gold"
                    ? "bg-gold text-gold-foreground"
                    : o.value === "plus"
                      ? "bg-brand text-brand-foreground"
                      : "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
