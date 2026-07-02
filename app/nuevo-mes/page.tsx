"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import {
  getMonthState,
  loadPreviousMonth,
  persistBudget,
  type PreviousMonth,
} from "@/lib/data";
import {
  calculateBudget,
  recalcFromLimits,
} from "@/lib/calculators/budget";
import { FullScreenLoader } from "@/components/loading";
import { useToast } from "@/components/toast";
import { formatARS } from "@/lib/utils";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function NuevoMesPage() {
  const router = useRouter();
  const toast = useToast();
  const [prev, setPrev] = useState<PreviousMonth | null>(null);
  const [incomeStr, setIncomeStr] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getMonthState().then((st) => {
      if (!active) return;
      if (st.state === "current") {
        router.replace("/dashboard");
        return;
      }
      if (st.state === "none") {
        router.replace("/onboarding");
        return;
      }
      loadPreviousMonth().then((p) => {
        if (!active) return;
        if (!p) {
          router.replace("/onboarding");
          return;
        }
        setPrev(p);
        setIncomeStr(String(p.income));
        setReady(true);
      });
    });
    return () => {
      active = false;
    };
  }, [router]);

  // Resumen del mes anterior
  const summary = useMemo(() => {
    if (!prev) return null;
    const total = prev.expenses.reduce((s, e) => s + e.amount, 0);
    const byCat: Record<string, number> = {};
    for (const e of prev.expenses) byCat[e.category] = (byCat[e.category] ?? 0) + e.amount;
    const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
    const overspent = prev.categories
      .filter((c) => !c.is_fixed && c.category !== "Ahorro")
      .filter((c) => (byCat[c.category] ?? 0) > c.limit)
      .map((c) => c.category);
    return { total, top: top ? { name: top[0], amount: top[1] } : null, overspent };
  }, [prev]);

  const now = new Date();
  const monthName = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  const income = Number(incomeStr.replace(/\D/g, ""));

  async function start(useSame: boolean) {
    if (!prev) return;
    const finalIncome = useSame ? prev.income : income;
    if (finalIncome < 1000) return;
    setSaving(true);
    const updated = { ...prev.answers, income: finalIncome };
    // Copiamos los montos reales del mes anterior; solo cambia el ahorro si cambió el ingreso.
    const result =
      prev.categories.length > 0
        ? recalcFromLimits(finalIncome, prev.categories)
        : calculateBudget(updated);
    try {
      await persistBudget(finalIncome, updated, result);
      router.push("/dashboard");
    } catch {
      setSaving(false);
      toast("No se pudo armar el mes. Revisá tu conexión.", "error");
    }
  }

  if (!ready || !prev) {
    return <FullScreenLoader />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm text-center"
      >
        <span className="inline-block rounded-full bg-brand/10 px-4 py-1.5 text-sm font-medium text-brand">
          {monthName}
        </span>
        <h1 className="mt-5 font-display text-3xl font-semibold">
          Arrancó {MONTHS[now.getMonth()]}
        </h1>

        {/* Resumen del mes anterior */}
        {summary && summary.total > 0 && (
          <div className="mt-5 rounded-card border border-border bg-card p-4 text-left text-sm">
            <p className="text-muted-foreground">El mes pasado</p>
            <p className="mt-0.5">
              Gastaste{" "}
              <span className="font-semibold">{formatARS(summary.total)}</span>
              {summary.top && (
                <>
                  {" "}— donde más fue en{" "}
                  <span className="font-semibold">{summary.top.name}</span>
                </>
              )}
              .
            </p>
            {summary.overspent.length > 0 && (
              <p className="mt-1 text-negative">
                Te pasaste en {summary.overspent.join(", ")}.
              </p>
            )}
          </div>
        )}

        <p className="mt-5 text-muted-foreground">
          ¿Arrancamos parecido o ajustás el ingreso?
        </p>

        <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card p-5">
          <span className="font-display text-3xl text-muted-foreground">$</span>
          <input
            autoFocus
            inputMode="numeric"
            value={income ? income.toLocaleString("es-AR") : ""}
            onChange={(e) => setIncomeStr(e.target.value)}
            className="w-full bg-transparent text-center font-display text-3xl font-semibold tabular-nums outline-none"
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Copiamos los montos del mes pasado; podés ajustarlos cuando quieras.
        </p>

        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={saving || income < 1000}
          onClick={() => start(false)}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-4 font-medium text-brand-foreground transition-opacity disabled:opacity-50"
        >
          {saving ? "Armando tu mes…" : "Arrancar el mes"}
          <ArrowRight size={18} />
        </motion.button>

        <button
          onClick={() => start(true)}
          disabled={saving}
          className="mt-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Mi ingreso no cambió — usar el mismo
        </button>
      </motion.div>
    </div>
  );
}
