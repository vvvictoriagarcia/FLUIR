"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { FullScreenLoader } from "@/components/loading";
import { useToast } from "@/components/toast";
import { loadDashboard, persistBudget } from "@/lib/data";
import {
  recalcFromLimits,
  type BudgetCategory,
  type ClothesLevel,
  type GoesOutLevel,
  type OnboardingAnswers,
} from "@/lib/calculators/budget";
import { cn } from "@/lib/utils";

const QUESTIONS = [
  {
    id: "pays_rent" as const,
    label: "¿Pagás alquiler o expensas?",
    options: [
      { value: true, label: "Sí" },
      { value: false, label: "No" },
    ],
  },
  {
    id: "has_car" as const,
    label: "¿Tenés auto o moto?",
    options: [
      { value: true, label: "Sí" },
      { value: false, label: "No" },
    ],
  },
  {
    id: "has_debt" as const,
    label: "¿Tenés deudas fijas?",
    options: [
      { value: true, label: "Sí" },
      { value: false, label: "No" },
    ],
  },
];

const GOES_OUT: { value: GoesOutLevel; label: string }[] = [
  { value: "poco", label: "Poco" },
  { value: "seguido", label: "Seguido" },
  { value: "mucho", label: "Mucho" },
];

const CLOTHES: { value: ClothesLevel; label: string }[] = [
  { value: "poco", label: "Poco" },
  { value: "moderado", label: "Moderado" },
  { value: "mucho", label: "Mucho" },
];

export default function PerfilFinancieroPage() {
  const router = useRouter();
  const toast = useToast();
  const [answers, setAnswers] = useState<OnboardingAnswers | null>(null);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [incomeStr, setIncomeStr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    loadDashboard().then(({ budget }) => {
      if (!active) return;
      if (!budget) {
        router.replace("/onboarding");
        return;
      }
      setAnswers(budget.answers);
      setCategories(budget.result.categories);
      setIncomeStr(String(budget.income));
    });
    return () => {
      active = false;
    };
  }, [router]);

  if (!answers) {
    return <FullScreenLoader />;
  }

  const income = Number(incomeStr.replace(/\D/g, ""));

  async function handleSave() {
    if (!answers || income < 1000) return;
    setSaving(true);
    const updated: OnboardingAnswers = { ...answers, income };
    // Recalculamos preservando los montos que el usuario ajustó en Mi presupuesto.
    // Solo cambia el ahorro (residual) si cambió el ingreso.
    const result = recalcFromLimits(income, categories);
    try {
      await persistBudget(income, updated, result);
      toast("Actualizamos tu presupuesto");
      router.push("/dashboard");
    } catch {
      setSaving(false);
      toast("No se pudo guardar. Revisá tu conexión.", "error");
    }
  }

  function set<K extends keyof OnboardingAnswers>(
    key: K,
    value: OnboardingAnswers[K]
  ) {
    setAnswers((a) => (a ? { ...a, [key]: value } : a));
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

        <h1 className="font-display text-3xl font-semibold">Perfil financiero</h1>
        <p className="mt-1 mb-2 text-muted-foreground">
          Al guardar, recalculamos tu ahorro con el ingreso nuevo.
        </p>
        <p className="mb-6 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
          Mantenemos los montos que ajustaste en{" "}
          <Link href="/perfil/presupuesto" className="text-brand">
            Mi presupuesto
          </Link>
          . Para cambiarlos, editalos ahí.
        </p>

        {/* Ingreso */}
        <label className="text-sm text-muted-foreground">Ingreso mensual</label>
        <div className="mt-1.5 mb-5 flex items-center gap-2 rounded-2xl border-2 border-border bg-card p-4">
          <span className="font-display text-2xl text-muted-foreground">$</span>
          <input
            inputMode="numeric"
            value={income ? income.toLocaleString("es-AR") : ""}
            onChange={(e) => setIncomeStr(e.target.value)}
            placeholder="0"
            className="w-full bg-transparent font-display text-2xl font-semibold tabular-nums outline-none placeholder:text-muted-foreground/40"
          />
        </div>

        {/* Preguntas sí/no */}
        <div className="space-y-5">
          {QUESTIONS.map((q) => (
            <Segmented
              key={q.id}
              label={q.label}
              options={q.options.map((o) => ({ ...o, value: String(o.value) }))}
              selected={String(answers[q.id])}
              onSelect={(v) => set(q.id, v === "true")}
            />
          ))}

          <Segmented
            label="¿Con qué frecuencia salís?"
            options={GOES_OUT.map((o) => ({ label: o.label, value: o.value }))}
            selected={answers.goes_out_often}
            onSelect={(v) => set("goes_out_often", v as GoesOutLevel)}
          />
          <Segmented
            label="¿Cuánto gastás en ropa?"
            options={CLOTHES.map((o) => ({ label: o.label, value: o.value }))}
            selected={answers.spends_on_clothes}
            onSelect={(v) => set("spends_on_clothes", v as ClothesLevel)}
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={saving || income < 1000}
          onClick={handleSave}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-4 font-medium text-brand-foreground transition-opacity disabled:opacity-50"
        >
          <Check size={18} />
          {saving ? "Guardando…" : "Guardar y recalcular"}
        </motion.button>
      </div>
    </div>
  );
}

function Segmented({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <div className="flex gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onSelect(o.value)}
            className={cn(
              "flex-1 rounded-xl border-2 py-2.5 text-sm font-medium transition-colors",
              selected === o.value
                ? "border-brand bg-brand/10 text-brand"
                : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
