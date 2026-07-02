"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Plus, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { FullScreenLoader } from "@/components/loading";
import { useToast } from "@/components/toast";
import { loadDashboard, persistBudget } from "@/lib/data";
import { getSavingsGoal, setSavingsGoal } from "@/lib/budget-store";
import {
  recalcFromLimits,
  type BudgetCategory,
  type OnboardingAnswers,
} from "@/lib/calculators/budget";
import { formatARS } from "@/lib/utils";

export default function PresupuestoPage() {
  const router = useRouter();
  const toast = useToast();
  const [income, setIncome] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers | null>(null);
  const [base, setBase] = useState<BudgetCategory[]>([]); // categorías sin Ahorro
  const [limits, setLimits] = useState<Record<string, number>>({});
  const [newCat, setNewCat] = useState("");
  const [goalStr, setGoalStr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    loadDashboard().then(({ budget }) => {
      if (!active) return;
      if (!budget) {
        router.replace("/onboarding");
        return;
      }
      const others = budget.result.categories.filter(
        (c) => c.category !== "Ahorro"
      );
      setIncome(budget.income);
      setAnswers(budget.answers);
      setBase(others);
      setLimits(Object.fromEntries(others.map((c) => [c.category, c.limit])));
      const goal = getSavingsGoal();
      if (goal > 0) setGoalStr(String(goal));
    });
    return () => {
      active = false;
    };
  }, [router]);

  const sumOthers = useMemo(
    () => Object.values(limits).reduce((s, v) => s + (v || 0), 0),
    [limits]
  );
  const ahorro = income - sumOthers;

  if (!answers) {
    return <FullScreenLoader />;
  }

  function setLimit(category: string, raw: string) {
    const n = Number(raw.replace(/\D/g, ""));
    setLimits((prev) => ({ ...prev, [category]: n }));
  }

  function addCategory() {
    const name = newCat.trim();
    if (!name) return;
    if (base.some((c) => c.category.toLowerCase() === name.toLowerCase())) {
      toast("Ya existe una categoría con ese nombre", "error");
      return;
    }
    setBase((prev) => [
      ...prev,
      { category: name, allocated: 0, limit: 0, percent: 0, is_fixed: false },
    ]);
    setLimits((prev) => ({ ...prev, [name]: 0 }));
    setNewCat("");
  }

  function removeCategory(category: string) {
    setBase((prev) => prev.filter((c) => c.category !== category));
    setLimits((prev) => {
      const next = { ...prev };
      delete next[category];
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    const edited: BudgetCategory[] = base.map((c) => ({
      ...c,
      limit: limits[c.category] ?? c.limit,
      allocated: limits[c.category] ?? c.limit,
    }));
    const result = recalcFromLimits(income, edited);
    setSavingsGoal(Number(goalStr.replace(/\D/g, "")));
    try {
      await persistBudget(income, answers!, result);
      toast("Presupuesto actualizado");
      router.push("/dashboard");
    } catch {
      setSaving(false);
      toast("No se pudo guardar. Revisá tu conexión.", "error");
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

        <h1 className="font-display text-3xl font-semibold">Mi presupuesto</h1>
        <p className="mt-1 mb-6 text-muted-foreground">
          Ajustá cuánto destinás a cada cosa. Poné los montos reales — tu alquiler,
          tus cuotas — y tu ahorro se acomoda solo.
        </p>

        {/* Ahorro residual en vivo */}
        <div
          className={`mb-6 rounded-card border p-5 ${
            ahorro < 0
              ? "border-negative/40 bg-negative/10"
              : "border-positive/40 bg-positive/10"
          }`}
        >
          <p className="text-sm text-muted-foreground">
            {ahorro < 0 ? "Te estás pasando por" : "Te queda para ahorrar"}
          </p>
          <p
            className={`font-display text-3xl font-semibold tabular-nums ${
              ahorro < 0 ? "text-negative" : "text-positive"
            }`}
          >
            {formatARS(Math.abs(ahorro))}
          </p>
          {ahorro < 0 && (
            <p className="mt-1 text-sm text-negative">
              Bajá algún monto para que el mes cierre.
            </p>
          )}
        </div>

        {/* Editor de montos */}
        <div className="space-y-3">
          {base.map((c) => (
            <div
              key={c.category}
              className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3"
            >
              <span className="flex min-w-0 items-center gap-2 font-medium">
                <span className="truncate">{c.category}</span>
                {c.is_fixed && (
                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    fijo
                  </span>
                )}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                <div className="flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5">
                  <span className="text-sm text-muted-foreground">$</span>
                  <input
                    inputMode="numeric"
                    value={
                      limits[c.category]
                        ? limits[c.category].toLocaleString("es-AR")
                        : ""
                    }
                    onChange={(e) => setLimit(c.category, e.target.value)}
                    placeholder="0"
                    className="w-20 bg-transparent text-right text-sm font-medium tabular-nums outline-none placeholder:text-muted-foreground/40"
                  />
                </div>
                <button
                  onClick={() => removeCategory(c.category)}
                  aria-label={`Borrar ${c.category}`}
                  className="text-muted-foreground/40 transition-colors hover:text-negative"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Nueva categoría */}
        <div className="mt-3 flex items-center gap-2">
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCategory();
              }
            }}
            placeholder="Nueva categoría (ej: Mascota, Gimnasio…)"
            className="flex-1 rounded-xl border-2 border-dashed border-border bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-brand placeholder:text-muted-foreground/50"
          />
          <button
            onClick={addCategory}
            aria-label="Agregar categoría"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground transition-opacity hover:opacity-90"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Meta de ahorro */}
        <div className="mt-8 rounded-card border border-border bg-card p-4">
          <label className="text-sm font-medium">🎯 Meta de ahorro del mes</label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Cuánto querés guardar este mes. Te mostramos el progreso en el inicio.
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <span className="text-sm text-muted-foreground">$</span>
            <input
              inputMode="numeric"
              value={
                goalStr
                  ? Number(goalStr.replace(/\D/g, "")).toLocaleString("es-AR")
                  : ""
              }
              onChange={(e) => setGoalStr(e.target.value)}
              placeholder="0 — opcional"
              className="w-full bg-transparent text-sm font-medium tabular-nums outline-none placeholder:text-muted-foreground/40"
            />
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={saving}
          onClick={handleSave}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-4 font-medium text-brand-foreground transition-opacity disabled:opacity-50"
        >
          <Check size={18} />
          {saving ? "Guardando…" : "Guardar presupuesto"}
        </motion.button>
      </div>
    </div>
  );
}
