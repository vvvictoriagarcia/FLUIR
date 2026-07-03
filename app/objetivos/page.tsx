"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Target,
  Trash2,
  Sparkles,
  PartyPopper,
} from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/components/toast";
import {
  loadGoals,
  createGoal,
  addToGoal,
  deleteGoal,
  loadDashboard,
} from "@/lib/data";
import type { Goal } from "@/lib/budget-store";
import { totalSpent } from "@/lib/budget-store";
import { useInflation } from "@/hooks/useInflation";
import { projectGoal } from "@/lib/goal-math";
import { formatARS, cn } from "@/lib/utils";

const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function deadlineLabel(targetDate: string): string {
  const d = new Date(`${targetDate}T00:00:00`);
  return `${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
}

function dateInMonths(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

export default function ObjetivosPage() {
  const toast = useToast();
  const { inflation } = useInflation();
  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [monthlySavings, setMonthlySavings] = useState(0);
  const [showNew, setShowNew] = useState(false);
  const [contribFor, setContribFor] = useState<Goal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function refresh() {
    const g = await loadGoals();
    setGoals(g);
  }

  useEffect(() => {
    loadGoals().then(setGoals);
    loadDashboard().then(({ budget, expenses }) => {
      if (budget) setMonthlySavings(Math.max(0, budget.income - totalSpent(expenses)));
    });
  }, []);

  async function handleCreate(name: string, target: number, months: number) {
    try {
      await createGoal(name, target, dateInMonths(months));
      setShowNew(false);
      await refresh();
      toast("¡Objetivo creado! A meterle 💪");
    } catch {
      toast("No se pudo crear el objetivo.", "error");
    }
  }

  async function handleContribute(amount: number) {
    if (!contribFor) return;
    const goal = contribFor;
    setContribFor(null);
    try {
      const newSaved = await addToGoal(goal.id, amount);
      await refresh();
      if (newSaved >= goal.targetAmount) toast("¡Llegaste al objetivo! 🎉");
      else toast("Aporte sumado 🐷");
    } catch {
      toast("No se pudo guardar el aporte.", "error");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);
    try {
      await deleteGoal(id);
      await refresh();
      toast("Objetivo eliminado.");
    } catch {
      toast("No se pudo eliminar.", "error");
    }
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="mx-auto max-w-xl px-5 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Inicio
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold">Tus objetivos</h1>
            <p className="mt-1 text-muted-foreground">
              Ponele nombre, monto y fecha a lo que querés lograr.
            </p>
            {inflation.lastValue != null && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                📈 Proyectado con inflación de {inflation.lastValue}%/mes
                {inflation.source === "INDEC" ? " (INDEC)" : " (estimado)"}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
          >
            <Plus size={16} />
            Nuevo
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {goals === null ? (
            [0, 1].map((i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-card border border-border bg-card"
              />
            ))
          ) : goals.length === 0 ? (
            <EmptyState onNew={() => setShowNew(true)} />
          ) : (
            goals.map((g, i) => (
              <GoalCard
                key={g.id}
                goal={g}
                index={i}
                monthlyRate={inflation.monthlyRate}
                onContribute={() => setContribFor(g)}
                onDelete={() => setDeleteId(g.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Sin AnimatePresence a propósito: en este stack su `exit` se cuelga y
          deja los modales montados. Entran animados (initial→animate) y cierran
          al instante desmontándose, que es confiable. */}
      {showNew && (
        <NewGoalModal
          monthlyRate={inflation.monthlyRate}
          onCreate={handleCreate}
          onClose={() => setShowNew(false)}
        />
      )}
      {contribFor && (
        <ContributeModal
          goal={contribFor}
          monthlySavings={monthlySavings}
          onContribute={handleContribute}
          onClose={() => setContribFor(null)}
        />
      )}
      {deleteId && (
        <ConfirmDialog
          title="¿Eliminar objetivo?"
          message="Se borra el objetivo y lo que llevabas ahorrado en él. No afecta tu plata real."
          confirmLabel="Eliminar"
          cancelLabel="Cancelar"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      <BottomNav />
    </div>
  );
}

function GoalCard({
  goal,
  index,
  monthlyRate,
  onContribute,
  onDelete,
}: {
  goal: Goal;
  index: number;
  monthlyRate: number;
  onContribute: () => void;
  onDelete: () => void;
}) {
  const { remaining, pct, done, overdue, perMonth, inflatedTarget, nominalShare } =
    projectGoal(goal, monthlyRate);
  const inflated = inflatedTarget > goal.targetAmount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={cn(
        "rounded-card border bg-card p-5",
        done ? "border-positive/40" : "border-border"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target size={18} className={done ? "text-positive" : "text-brand"} />
          <h2 className="font-display text-lg font-semibold">{goal.name}</h2>
        </div>
        <button
          onClick={onDelete}
          aria-label="Eliminar objetivo"
          className="text-muted-foreground transition-colors hover:text-negative"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mt-3 flex items-baseline justify-between text-sm">
        <span className="font-display text-xl font-semibold tabular-nums">
          {formatARS(goal.savedAmount)}
        </span>
        <span className="text-muted-foreground">
          de {formatARS(goal.targetAmount)}
        </span>
      </div>

      {inflated && !done && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          📈 Con inflación, a {deadlineLabel(goal.targetDate)} va a costar{" "}
          <span className="font-medium text-foreground">
            ~{formatARS(inflatedTarget)}
          </span>
        </p>
      )}

      {/* Barra: fondo dividido (precio de hoy | ajuste por inflación) + ahorro */}
      <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-brand/15">
        {inflated && (
          <div
            className="absolute inset-y-0 right-0 bg-negative/25"
            style={{ left: `${nominalShare * 100}%` }}
          />
        )}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            done ? "bg-positive" : "bg-brand"
          )}
        />
      </div>

      {inflated && !done && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand" />
            Ahorrado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand/25" />
            Precio de hoy
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-negative/30" />
            Suma la inflación
          </span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-sm">
        {done ? (
          <span className="flex items-center gap-1.5 font-medium text-positive">
            <PartyPopper size={15} />
            ¡Objetivo cumplido!
          </span>
        ) : overdue ? (
          <span className="text-negative">
            Se pasó la fecha · te faltan {formatARS(remaining)}
          </span>
        ) : (
          <span className="text-muted-foreground">
            Te faltan{" "}
            <span className="font-medium text-foreground">
              {formatARS(remaining)}
            </span>{" "}
            · {formatARS(Math.round(perMonth))}/mes para {deadlineLabel(goal.targetDate)}
          </span>
        )}
      </div>

      {!done && (
        <button
          onClick={onContribute}
          className="mt-4 w-full rounded-full border border-brand/40 py-2.5 text-sm font-medium text-brand transition-colors hover:bg-brand/10"
        >
          Aportar
        </button>
      )}
    </motion.div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="rounded-card border border-dashed border-border bg-card/50 p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand">
        <Target size={26} />
      </div>
      <p className="mt-4 font-medium">Todavía no tenés objetivos</p>
      <p className="mt-1.5 text-sm text-muted-foreground">
        ¿Un viaje? ¿Un celu nuevo? ¿Un colchón para imprevistos? Ponele nombre y
        fecha, y seguí cuánto te falta.
      </p>
      <button
        onClick={onNew}
        className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground"
      >
        <Plus size={16} />
        Crear mi primer objetivo
      </button>
    </div>
  );
}

// ── Modales ────────────────────────────────────────────────────────

const MONTH_OPTIONS = [3, 6, 12, 24];

function NewGoalModal({
  monthlyRate,
  onCreate,
  onClose,
}: {
  monthlyRate: number;
  onCreate: (name: string, target: number, months: number) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [months, setMonths] = useState(6);
  const [error, setError] = useState<string | null>(null);

  const target = Number(amount) || 0;
  const inflatedTarget = Math.round(target * Math.pow(1 + monthlyRate, months));
  const perMonth = target > 0 ? Math.round(inflatedTarget / months) : 0;

  function submit() {
    if (!name.trim()) return setError("Ponele un nombre.");
    if (target <= 0) return setError("¿Cuánta plata querés juntar?");
    onCreate(name.trim(), target, months);
  }

  return (
    <ModalShell title="Nuevo objetivo" onClose={onClose}>
      <label className="block">
        <span className="text-sm text-muted-foreground">¿Qué querés lograr?</span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Viaje a Bariloche"
          className="mt-1 w-full rounded-2xl border-2 border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-brand placeholder:text-muted-foreground/50"
        />
      </label>

      <label className="mt-4 block">
        <span className="text-sm text-muted-foreground">¿Cuánto necesitás?</span>
        <div className="mt-1 flex items-center rounded-2xl border-2 border-border bg-background px-4 focus-within:border-brand">
          <span className="text-muted-foreground">$</span>
          <input
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            placeholder="0"
            className="w-full bg-transparent px-2 py-3 text-sm outline-none placeholder:text-muted-foreground/50"
          />
        </div>
      </label>

      <div className="mt-4">
        <span className="text-sm text-muted-foreground">¿En cuánto tiempo?</span>
        <div className="mt-2 flex gap-2">
          {MONTH_OPTIONS.map((m) => (
            <button
              key={m}
              onClick={() => setMonths(m)}
              className={cn(
                "flex-1 rounded-full border py-2.5 text-sm font-medium transition-colors",
                months === m
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-border hover:bg-muted"
              )}
            >
              {m < 12 ? `${m} m` : `${m / 12} ${m === 12 ? "año" : "años"}`}
            </button>
          ))}
        </div>
      </div>

      {perMonth > 0 && (
        <p className="mt-4 rounded-2xl bg-brand/10 px-4 py-3 text-sm text-brand">
          <Sparkles size={14} className="mr-1 inline" />
          Poné <strong>{formatARS(perMonth)}/mes</strong> para llegar en {months}{" "}
          {months === 1 ? "mes" : "meses"}.
          {inflatedTarget > target && (
            <span className="mt-1 block text-xs text-brand/80">
              Contempla que con inflación va a costar ~{formatARS(inflatedTarget)}.
            </span>
          )}
        </p>
      )}

      {error && <p className="mt-3 text-sm text-negative">{error}</p>}

      <button
        onClick={submit}
        className="mt-5 w-full rounded-full bg-brand py-3.5 font-medium text-brand-foreground transition-opacity hover:opacity-90"
      >
        Crear objetivo
      </button>
    </ModalShell>
  );
}

function ContributeModal({
  goal,
  monthlySavings,
  onContribute,
  onClose,
}: {
  goal: Goal;
  monthlySavings: number;
  onContribute: (amount: number) => void;
  onClose: () => void;
}) {
  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
  const [amount, setAmount] = useState("");
  const value = Number(amount) || 0;

  return (
    <ModalShell title={`Aportar a "${goal.name}"`} onClose={onClose}>
      <p className="text-sm text-muted-foreground">
        Te faltan {formatARS(remaining)} para llegar.
      </p>

      <div className="mt-4 flex items-center rounded-2xl border-2 border-border bg-background px-4 focus-within:border-brand">
        <span className="text-muted-foreground">$</span>
        <input
          autoFocus
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
          placeholder="0"
          className="w-full bg-transparent px-2 py-3 text-sm outline-none placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Atajos: ahorro del mes + completar */}
      <div className="mt-3 flex flex-wrap gap-2">
        {monthlySavings > 0 && (
          <button
            onClick={() => setAmount(String(monthlySavings))}
            className="rounded-full border border-positive/40 px-3 py-1.5 text-xs font-medium text-positive transition-colors hover:bg-positive/10"
          >
            Mi ahorro del mes ({formatARS(monthlySavings)})
          </button>
        )}
        {remaining > 0 && (
          <button
            onClick={() => setAmount(String(remaining))}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
          >
            Completar ({formatARS(remaining)})
          </button>
        )}
      </div>

      <button
        onClick={() => value > 0 && onContribute(value)}
        disabled={value <= 0}
        className="mt-5 w-full rounded-full bg-brand py-3.5 font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        Sumar {value > 0 ? formatARS(value) : "aporte"}
      </button>
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/50"
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-xl rounded-t-3xl border border-border bg-card p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
      >
        <h3 className="font-display text-xl font-semibold">{title}</h3>
        <div className="mt-4">{children}</div>
      </motion.div>
    </>
  );
}
