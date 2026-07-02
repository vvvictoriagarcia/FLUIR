"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, RotateCcw } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  calculateBudget,
  type ClothesLevel,
  type GoesOutLevel,
  type OnboardingAnswers,
} from "@/lib/calculators/budget";
import { persistBudget } from "@/lib/data";
import { useUser } from "@/hooks/useUser";
import { AnimatedNumber } from "@/components/animated-number";
import { formatARS } from "@/lib/utils";

type ChoiceValue = string;

type ChoiceQuestion = {
  id: "pays_rent" | "has_car" | "goes_out_often" | "spends_on_clothes" | "has_debt";
  kind: "choice";
  emoji: string;
  question: string;
  subtitle: string;
  options: { value: ChoiceValue; label: string; desc: string }[];
};

const CHOICES: ChoiceQuestion[] = [
  {
    id: "pays_rent",
    kind: "choice",
    emoji: "🏠",
    question: "¿Pagás alquiler o expensas?",
    subtitle: "Eso cambia bastante cómo distribuimos tu plata",
    options: [
      { value: "yes", label: "Sí", desc: "Alquiler y/o expensas todos los meses" },
      { value: "no", label: "No", desc: "Vivo con familia o tengo vivienda propia" },
    ],
  },
  {
    id: "has_car",
    kind: "choice",
    emoji: "🚗",
    question: "¿Tenés auto o moto?",
    subtitle: "Nafta, seguro y patente cuentan como gasto fijo",
    options: [
      { value: "yes", label: "Sí", desc: "Tengo vehículo propio" },
      { value: "no", label: "No", desc: "Uso transporte público" },
    ],
  },
  {
    id: "goes_out_often",
    kind: "choice",
    emoji: "🍻",
    question: "¿Con qué frecuencia salís?",
    subtitle: "Bares, restaurantes, shows, delivery — lo que sea",
    options: [
      { value: "poco", label: "Poco", desc: "1 o 2 veces por mes" },
      { value: "seguido", label: "Seguido", desc: "Casi todos los fines de semana" },
      { value: "mucho", label: "Mucho", desc: "Varias veces por semana" },
    ],
  },
  {
    id: "spends_on_clothes",
    kind: "choice",
    emoji: "👕",
    question: "¿Cuánto gastás en ropa?",
    subtitle: "Incluye ropa, zapatillas y accesorios",
    options: [
      { value: "poco", label: "Poco", desc: "Compro lo necesario" },
      { value: "moderado", label: "Moderado", desc: "Me gusta vestirme bien" },
      { value: "mucho", label: "Mucho", desc: "Es algo importante para mí" },
    ],
  },
  {
    id: "has_debt",
    kind: "choice",
    emoji: "💳",
    question: "¿Tenés deudas fijas este mes?",
    subtitle: "Cuotas, tarjeta, préstamo — pagos que se repiten",
    options: [
      { value: "yes", label: "Sí", desc: "Tengo pagos fijos de deuda" },
      { value: "no", label: "No", desc: "Estoy al día" },
    ],
  },
];

const TOTAL_STEPS = 1 + CHOICES.length; // income + 5 choices

const STORAGE_KEY = "fluir_budget_demo";

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [income, setIncome] = useState("");
  const [choices, setChoices] = useState<Record<string, ChoiceValue>>({});
  const [done, setDone] = useState(false);

  const incomeNumber = Number(income.replace(/\D/g, ""));
  const progress = (Math.min(step, TOTAL_STEPS) / TOTAL_STEPS) * 100;

  function answerChoice(qId: string, value: ChoiceValue) {
    const next = { ...choices, [qId]: value };
    setChoices(next);
    setTimeout(() => {
      if (step >= TOTAL_STEPS - 1) {
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ income: incomeNumber, choices: next })
          );
        } catch {}
        setDone(true);
      } else {
        setStep((s) => s + 1);
      }
    }, 160);
  }

  function restart() {
    setStep(0);
    setIncome("");
    setChoices({});
    setDone(false);
  }

  if (done) {
    const answers: OnboardingAnswers = {
      income: incomeNumber,
      pays_rent: choices.pays_rent === "yes",
      has_car: choices.has_car === "yes",
      goes_out_often: choices.goes_out_often as GoesOutLevel,
      spends_on_clothes: choices.spends_on_clothes as ClothesLevel,
      has_debt: choices.has_debt === "yes",
    };
    return <Result answers={answers} onRestart={restart} />;
  }

  const isIncomeStep = step === 0;
  const choice = CHOICES[step - 1];

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-tight text-brand"
          >
            fluir
          </Link>
          <ThemeToggle />
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-muted-foreground">
              Paso {step + 1} de {TOTAL_STEPS}
            </span>
            <span className="font-medium text-brand">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              className="h-full rounded-full bg-gradient-to-r from-brand to-gold"
            />
          </div>
        </div>

        <div>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
          >
            {isIncomeStep ? (
              <IncomeStep
                income={income}
                incomeNumber={incomeNumber}
                onChange={setIncome}
                onNext={() => setStep(1)}
              />
            ) : (
              <div>
                <div className="mb-6">
                  <div className="mb-3 text-4xl">{choice.emoji}</div>
                  <h2 className="font-display text-2xl font-semibold">
                    {choice.question}
                  </h2>
                  <p className="mt-1 text-muted-foreground">{choice.subtitle}</p>
                </div>

                <div className="space-y-3">
                  {choice.options.map((option) => {
                    const selected = choices[choice.id] === option.value;
                    return (
                      <motion.button
                        key={option.value}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => answerChoice(choice.id, option.value)}
                        className={`flex w-full items-center justify-between rounded-2xl border-2 p-4 text-left transition-colors ${
                          selected
                            ? "border-brand bg-brand/10"
                            : "border-border bg-card hover:border-muted-foreground/40"
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{option.label}</div>
                          <div className="mt-0.5 text-sm text-muted-foreground">
                            {option.desc}
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="mt-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function IncomeStep({
  income,
  incomeNumber,
  onChange,
  onNext,
}: {
  income: string;
  incomeNumber: number;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  const valid = incomeNumber >= 1000;
  return (
    <div>
      <div className="mb-6">
        <div className="mb-3 text-4xl">💰</div>
        <h2 className="font-display text-2xl font-semibold">
          ¿Cuánto ganás por mes?
        </h2>
        <p className="mt-1 text-muted-foreground">
          Tu sueldo o ingreso neto en pesos. Es el dato más importante.
        </p>
      </div>

      <div className="rounded-2xl border-2 border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <span className="font-display text-3xl text-muted-foreground">$</span>
          <input
            autoFocus
            inputMode="numeric"
            value={income ? Number(income.replace(/\D/g, "")).toLocaleString("es-AR") : ""}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && valid) onNext();
            }}
            placeholder="0"
            className="w-full bg-transparent font-display text-3xl font-semibold tabular-nums outline-none placeholder:text-muted-foreground/40"
          />
        </div>
      </div>

      {/* Montos rápidos — un toque en vez de tipear */}
      <div className="mt-3 flex flex-wrap gap-2">
        {[300000, 500000, 800000, 1200000].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(String(v))}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              incomeNumber === v
                ? "border-brand bg-brand/10 text-brand"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            ${v.toLocaleString("es-AR")}
          </button>
        ))}
      </div>

      {/* Microcopy de confianza */}
      <p className="mt-4 text-xs text-muted-foreground">
        🔒 Solo lo usamos para armar tu presupuesto. No lo compartimos con nadie.
      </p>

      <motion.button
        whileHover={valid ? { scale: 1.02 } : undefined}
        whileTap={valid ? { scale: 0.98 } : undefined}
        disabled={!valid}
        onClick={onNext}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-4 font-medium text-brand-foreground transition-opacity disabled:opacity-40"
      >
        Siguiente
        <ArrowRight className="h-5 w-5" />
      </motion.button>
    </div>
  );
}

function Result({
  answers,
  onRestart,
}: {
  answers: OnboardingAnswers;
  onRestart: () => void;
}) {
  const router = useRouter();
  const { user, loading } = useUser();
  const loggedIn = !loading && !!user;
  const budget = useMemo(() => calculateBudget(answers), [answers]);
  const salidas =
    budget.categories.find((c) => c.category === "Salidas")?.allocated ?? 0;
  const maxAllocated = Math.max(...budget.categories.map((c) => c.allocated), 1);

  async function goToDashboard() {
    try {
      await persistBudget(answers.income, answers, budget);
    } catch {
      // En el demo sin sesión no falla; si hay sesión y falla, igual seguimos
      // con los datos locales y se reintenta al migrar.
    }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-tight text-brand"
          >
            fluir
          </Link>
          <ThemeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-muted-foreground">Tu presupuesto está listo 🎉</p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight">
            Este mes podés gastar{" "}
            <AnimatedNumber value={salidas} className="text-brand" /> en salidas
          </h1>

          {/* KPIs */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <Kpi label="Ingreso" value={formatARS(answers.income)} />
            <Kpi
              label="Gastos fijos"
              value={formatARS(budget.total_fixed)}
            />
            <Kpi
              label="Ahorro"
              value={formatARS(budget.total_savings)}
              accent="positive"
            />
          </div>

          {/* Distribución */}
          <h2 className="mt-8 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Así queda tu mes
          </h2>
          <div className="space-y-3 rounded-card border border-border bg-card p-5">
            {budget.categories.map((c, i) => (
              <motion.div
                key={c.category}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 + i * 0.06 }}
              >
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    {c.category}
                    {c.is_fixed && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        fijo
                      </span>
                    )}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatARS(c.allocated)} · {c.percent}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(c.allocated / maxAllocated) * 100}%` }}
                    transition={{ delay: 0.15 + i * 0.06, duration: 0.5 }}
                    className={`h-full rounded-full ${
                      c.category === "Ahorro" ? "bg-positive" : "bg-brand"
                    }`}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mensaje honesto si el margen es ajustado */}
          {budget.tight_message && (
            <div className="mt-4 rounded-card border border-gold/40 bg-gold/10 p-4 text-sm">
              {budget.tight_message}
            </div>
          )}

          <p className="mt-4 text-center text-sm text-positive">
            Tasa de ahorro: {(budget.savings_rate * 100).toFixed(1)}%
          </p>

          {/* Acciones */}
          <div className="mt-8 space-y-3">
            {!loggedIn && (
              <div className="rounded-card border border-brand/40 bg-brand/10 p-4">
                <p className="font-medium">Guardá tu presupuesto en la nube</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Creá tu cuenta gratis y accedé desde cualquier dispositivo.
                </p>
                <Link
                  href="/register?from=onboarding"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3.5 font-medium text-brand-foreground"
                >
                  Crear mi cuenta gratis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={goToDashboard}
              className={
                loggedIn
                  ? "flex w-full items-center justify-center gap-2 rounded-full bg-brand py-4 font-medium text-brand-foreground shadow-lg shadow-brand/25"
                  : "flex w-full items-center justify-center gap-2 rounded-full border border-border py-3.5 text-sm font-medium transition-colors hover:bg-muted"
              }
            >
              {loggedIn ? "Empezar a usar Fluir" : "Empezar sin cuenta"}
              {loggedIn && <ArrowRight className="h-5 w-5" />}
            </motion.button>
            <button
              onClick={onRestart}
              className="flex w-full items-center justify-center gap-2 rounded-full py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" />
              Probar con otros datos
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "positive";
}) {
  return (
    <div className="rounded-card border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-1 font-semibold tabular-nums ${
          accent === "positive" ? "text-positive" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
