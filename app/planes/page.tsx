"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/components/toast";
import { useUser } from "@/hooks/useUser";
import { usePlan } from "@/hooks/usePlan";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PLAN_LABELS } from "@/lib/plan";
import { checkoutUrl } from "@/lib/mercadopago/links";
import { cn } from "@/lib/utils";

type PlanId = "free" | "plus" | "gold";

const PLANS = [
  {
    id: "free" as PlanId,
    name: "Free",
    price: "$0",
    anchor: "Tu plan actual",
    current: true,
    accent: "border",
    features: [
      "Presupuesto mensual personalizado",
      "Tracking de gastos diario",
      "Importar movimientos (foto o CSV)",
    ],
    cta: "Tu plan actual",
  },
  {
    id: "plus" as PlanId,
    name: "Pro",
    price: "$4.000/mes",
    anchor: "Cancelás cuando quieras",
    badge: "Más popular",
    accent: "brand",
    features: [
      "Todo lo de Free",
      "Historial mes a mes",
      "Comparativa de meses",
      "Insights automáticos",
    ],
    cta: "Suscribirme",
  },
  {
    id: "gold" as PlanId,
    name: "Gold",
    price: "$9.000/mes",
    anchor: "Cancelás cuando quieras",
    badge: "Para los que invierten",
    accent: "gold",
    features: [
      "Todo lo de Pro",
      "Fluir Invertí: guía paso a paso",
      "Seguimiento de tu cartera",
      "Insights de tus inversiones",
    ],
    cta: "Suscribirme",
  },
];

function inactive(plan: (typeof PLANS)[number], current: PlanId): boolean {
  return plan.id === current;
}

export default function PlanesPage() {
  const toast = useToast();
  const router = useRouter();
  const { user } = useUser();
  const { plan: current } = usePlan();
  const [loading, setLoading] = useState<PlanId | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  function subscribe(plan: PlanId) {
    if (plan === "free") return;

    // Sin cuenta no podemos activarle el plan a nadie: primero que se registre.
    if (!user) {
      toast("Creá tu cuenta primero así te activamos el plan.");
      router.push(`/register?next=/planes`);
      return;
    }

    setLoading(plan);
    window.location.assign(checkoutUrl(plan));
  }

  async function cancelar() {
    setCancelling(true);
    try {
      const res = await fetch("/api/mp/cancel", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(json.error ?? "No pudimos dar de baja la suscripción.", "error");
        return;
      }
      toast("Listo, cancelamos tu suscripción. Seguís con Free.");
      setTimeout(() => window.location.reload(), 800);
    } catch {
      toast("Algo falló. Probá de nuevo.", "error");
    } finally {
      setCancelling(false);
      setConfirmCancel(false);
    }
  }

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
                disabled={inactive(plan, current) || loading === plan.id}
                onClick={() => subscribe(plan.id)}
                className={cn(
                  "mt-5 w-full rounded-full py-3 text-sm font-medium transition-opacity",
                  inactive(plan, current)
                    ? "cursor-default border border-border text-muted-foreground"
                    : plan.accent === "brand"
                      ? "bg-brand text-brand-foreground hover:opacity-90 disabled:opacity-60"
                      : plan.accent === "gold"
                        ? "bg-gold text-gold-foreground hover:opacity-90 disabled:opacity-60"
                        : ""
                )}
              >
                {loading === plan.id
                  ? "Abriendo…"
                  : inactive(plan, current)
                    ? "Tu plan actual"
                    : plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        {current !== "free" && (
          <div className="mt-6 rounded-card border border-border bg-card p-4">
            <p className="text-sm font-medium">
              Tenés el plan {PLAN_LABELS[current]}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Si cambiás de plan, damos de baja el anterior para que no te
              cobren los dos.
            </p>
            <button
              onClick={() => setConfirmCancel(true)}
              disabled={cancelling}
              className="mt-3 text-sm font-medium text-negative disabled:opacity-60"
            >
              {cancelling ? "Cancelando…" : "Cancelar mi suscripción"}
            </button>
          </div>
        )}

        {confirmCancel && (
          <ConfirmDialog
            title="¿Cancelar tu suscripción?"
            message="Se corta el débito automático y volvés al plan Free. Tus datos quedan intactos."
            confirmLabel="Sí, cancelar"
            cancelLabel="Me quedo"
            onConfirm={cancelar}
            onCancel={() => setConfirmCancel(false)}
          />
        )}

        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
          Pagás con Mercado Pago, se debita todos los meses y lo cortás cuando
          quieras.{" "}
          <Link href="/contacto#arrepentimiento" className="underline">
            Cómo dar de baja
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
