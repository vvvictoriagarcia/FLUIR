"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    anchor: "Tu plan actual",
    current: true,
    accent: "border",
    features: [
      "Presupuesto mensual personalizado",
      "Tracking de gastos diario",
      "Montos ajustables por categoría",
    ],
    cta: "Tu plan actual",
  },
  {
    name: "Plus",
    price: "$4.000/mes",
    anchor: "= 1 café por mes",
    badge: "Más popular",
    accent: "brand",
    features: [
      "Todo lo de Free",
      "Historial mes a mes",
      "Comparativa de meses",
      "Insights automáticos",
    ],
    cta: "Próximamente",
    soon: true,
  },
  {
    name: "Gold",
    price: "$9.000/mes",
    anchor: "= 2 cafés por mes",
    badge: "Para los que invierten",
    accent: "gold",
    features: [
      "Todo lo de Plus",
      "Tracker de portafolio",
      "P&L y TIR en tiempo real",
      "Benchmark vs mercado",
      "Guía para empezar a invertir",
    ],
    cta: "Próximamente",
    soon: true,
  },
];

function inactive(plan: (typeof PLANS)[number]): boolean {
  return (
    !!("current" in plan && plan.current) || !!("soon" in plan && plan.soon)
  );
}

export default function PlanesPage() {
  return (
    <div className="min-h-screen px-5 py-6">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/perfil"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Volver
          </Link>
          <ThemeToggle />
        </div>

        <h1 className="font-display text-3xl font-semibold">Elegí tu plan</h1>
        <p className="mt-1 mb-6 text-muted-foreground">
          Empezá gratis. Mejorá cuando quieras.
        </p>

        <div className="space-y-4">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                "rounded-card border bg-card p-5",
                plan.accent === "brand" && "border-brand",
                plan.accent === "gold" && "border-gold",
                plan.accent === "border" && "border-border"
              )}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold">{plan.name}</h2>
                {plan.badge && (
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      plan.accent === "gold"
                        ? "bg-gold/15 text-gold"
                        : "bg-brand/15 text-brand"
                    )}
                  >
                    {plan.badge}
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-2xl font-semibold">
                  {plan.price}
                </span>
                <span className="text-xs text-muted-foreground">{plan.anchor}</span>
              </div>

              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check
                      size={16}
                      className={
                        plan.accent === "gold" ? "text-gold" : "text-positive"
                      }
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                disabled={inactive(plan)}
                className={cn(
                  "mt-5 w-full rounded-full py-3 text-sm font-medium transition-opacity",
                  inactive(plan)
                    ? "cursor-default border border-border text-muted-foreground"
                    : plan.accent === "brand"
                      ? "bg-brand text-brand-foreground hover:opacity-90"
                      : plan.accent === "gold"
                        ? "bg-gold text-gold-foreground hover:opacity-90"
                        : ""
                )}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Los pagos se activan próximamente con Mercado Pago.
        </p>
      </div>
    </div>
  );
}
