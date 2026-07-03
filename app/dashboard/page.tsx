"use client";

import { createElement, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ChevronRight,
  ChevronDown,
  Target,
  Receipt,
  RotateCw,
  Home,
  ShoppingBag,
  Car,
  Beer,
  Shirt,
  Tv,
  CreditCard,
  Zap,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { BottomNav } from "@/components/bottom-nav";
import { ExpenseModal } from "@/components/expense-modal";
import { AnimatedNumber } from "@/components/animated-number";
import { DashboardSkeleton } from "@/components/skeletons";
import { useToast } from "@/components/toast";
import { useInflation } from "@/hooks/useInflation";
import { projectGoal } from "@/lib/goal-math";
import { formatARS } from "@/lib/utils";
import {
  getMonthState,
  loadDashboard,
  loadGoals,
  loadHistory,
  migrateLocalToSupabase,
  persistExpense,
} from "@/lib/data";
import {
  spentByCategory,
  type Expense,
  type Goal,
  type SavedBudget,
} from "@/lib/budget-store";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// Tonos del desglose de gastos (cobalto → neutro), no un arcoíris.
const SHADES = ["#1D4ED8", "#5B7EE8", "#93A8F0", "#E8A317", "#B8BBA6", "#CBCEBD"];

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const { inflation } = useInflation();
  const [budget, setBudget] = useState<SavedBudget | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [topGoal, setTopGoal] = useState<Goal | null>(null);
  const [savings, setSavings] = useState<{ rate: number; delta: number | null }>({
    rate: 0,
    delta: null,
  });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    migrateLocalToSupabase()
      .catch(() => {})
      .then(() => loadDashboard())
      .then(({ budget, expenses }) => {
        if (!active) return;
        if (!budget) {
          getMonthState().then((st) => {
            if (active)
              router.replace(
                st.state === "rollover" ? "/nuevo-mes" : "/onboarding"
              );
          });
          return;
        }
        setBudget(budget);
        setExpenses(expenses);
        setLoaded(true);
      })
      .catch(() => {
        if (active) setError(true);
      });
    loadGoals().then((gs) => {
      if (!active || gs.length === 0) return;
      const next = [...gs].sort((a, b) =>
        a.targetDate.localeCompare(b.targetDate)
      )[0];
      setTopGoal(next);
    });
    loadHistory().then((h) => {
      if (!active || h.length === 0) return;
      setSavings({
        rate: h[0].savedPct,
        delta: h[1] ? h[0].savedPct - h[1].savedPct : null,
      });
    });
    return () => {
      active = false;
    };
  }, [router]);

  const spent = useMemo(() => spentByCategory(expenses), [expenses]);

  if (error) return <DashboardError />;
  if (!loaded || !budget) return <DashboardSkeleton />;

  const now = new Date();
  const monthName = MESES[now.getMonth()];

  const income = budget.income;
  const cats = budget.result.categories;
  const fixedCats = cats.filter((c) => c.is_fixed);
  const variableCats = cats.filter(
    (c) => !c.is_fixed && c.category !== "Ahorro"
  );
  const variableNames = new Set(variableCats.map((c) => c.category));

  const comprometido = fixedCats.reduce((s, c) => s + c.limit, 0);
  const variableBudget = variableCats.reduce((s, c) => s + c.limit, 0);
  const variableSpent = expenses
    .filter((e) => variableNames.has(e.category))
    .reduce((s, e) => s + e.amount, 0);
  const paraGastar = variableBudget - variableSpent;

  const usedRatio = variableBudget > 0 ? variableSpent / variableBudget : 0;
  const barColor =
    usedRatio >= 1
      ? "var(--negative)"
      : usedRatio >= 0.9
        ? "#f97316"
        : usedRatio >= 0.7
          ? "var(--gold)"
          : "var(--positive)";

  return (
    <div className="min-h-screen pb-28">
      <div className="mx-auto max-w-xl px-5 py-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight text-brand"
          >
            fluir
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/nuevo-mes"
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[13px] font-medium capitalize"
            >
              {monthName}
              <ChevronDown size={14} className="text-muted-foreground" />
            </Link>
            <ThemeToggle />
          </div>
        </div>

        {/* Hero: disponible para gastar */}
        <h1 className="sr-only">Te quedan {formatARS(paraGastar)} para gastar</h1>
        <Eyebrow>Disponible para gastar</Eyebrow>
        <AnimatedNumber
          value={paraGastar}
          className={`tabular mt-1.5 block text-[46px] font-semibold leading-none tracking-tight ${
            paraGastar >= 0 ? "text-foreground" : "text-negative"
          }`}
        />
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(usedRatio * 100, 100)}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: barColor }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>
            Gastaste <span className="tabular">{formatARS(variableSpent)}</span>
          </span>
          <span>
            de <span className="tabular">{formatARS(variableBudget)}</span>
          </span>
        </div>

        {/* Tira de stats */}
        <div className="mt-6 flex items-stretch gap-4 border-y border-border py-4">
          <Stat label="Ingresos" value={formatARS(income)} tone="positive" />
          <div className="w-px self-stretch bg-border" />
          <Stat label="Gastos" value={formatARS(variableSpent)} tone="negative" />
          <div className="w-px self-stretch bg-border" />
          <SavingsStat rate={savings.rate} delta={savings.delta} />
        </div>

        {/* En qué se te va */}
        <SpendingBreakdown
          cats={variableCats.map((c) => ({
            name: c.category,
            amount: spent[c.category] ?? 0,
          }))}
          total={variableSpent}
        />

        {/* Objetivo más cercano */}
        {topGoal ? (
          <TopGoalRow goal={topGoal} monthlyRate={inflation.monthlyRate} />
        ) : (
          <Link href="/objetivos" className="mt-7 flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-brand/10 text-brand">
              <Target size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Ponete un objetivo</p>
              <p className="text-xs text-muted-foreground">
                Ahorrá para lo que querés, con plazo y monto
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          </Link>
        )}

        {/* Presupuesto por categoría */}
        <SectionHeader
          title="Presupuesto por categoría"
          action={{ href: "/perfil/presupuesto", label: "Ajustar" }}
        />
        {expenses.length === 0 && <EmptyState onAdd={() => setModalOpen(true)} />}
        <div className="divide-y divide-border">
          {variableCats.map((c) => (
            <CategoryRow
              key={c.category}
              name={c.category}
              used={spent[c.category] ?? 0}
              limit={c.limit}
            />
          ))}
        </div>

        {/* Comprometido — fijos ya descontados */}
        {fixedCats.length > 0 && (
          <>
            <SectionHeader title="Comprometido este mes" />
            <div className="divide-y divide-border">
              {fixedCats.map((c) => (
                <div
                  key={c.category}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-muted text-muted-foreground">
                      <CategoryIcon name={c.category} />
                    </span>
                    <span className="truncate font-medium">{c.category}</span>
                  </span>
                  <span className="tabular shrink-0 text-muted-foreground">
                    {formatARS(c.limit)}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {formatARS(comprometido)} ya descontados de tu ingreso.
            </p>
          </>
        )}

        {/* Movimientos */}
        {expenses.length > 0 && (
          <>
            <SectionHeader title="Movimientos" />
            <div className="divide-y divide-border">
              {expenses.slice(0, 8).map((e) => (
                <MovementRow key={e.id} expense={e} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* FAB */}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-30 px-5">
        <div className="mx-auto flex max-w-xl justify-end">
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => setModalOpen(true)}
            aria-label="Registrar gasto"
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-brand px-5 py-3.5 font-medium text-brand-foreground shadow-md"
          >
            <Plus className="h-5 w-5" />
            Cargar gasto
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <ExpenseModal
            categories={variableCats.map((c) => c.category)}
            onClose={() => setModalOpen(false)}
            onSave={handleAdd}
          />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );

  async function handleAdd(category: string, amount: number, description: string) {
    try {
      const expense = await persistExpense(category, amount, description);
      setExpenses((prev) => [expense, ...prev]);
      setModalOpen(false);
      toast("Gasto guardado");
    } catch {
      toast("No se pudo guardar. Revisá tu conexión.", "error");
    }
  }
}

// ── Piezas de UI ───────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
      {children}
    </p>
  );
}

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mt-8 mb-1 flex items-center justify-between">
      <Eyebrow>{title}</Eyebrow>
      {action && (
        <Link
          href={action.href}
          className="text-xs font-medium text-brand transition-opacity hover:opacity-80"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}) {
  const color =
    tone === "positive"
      ? "text-positive"
      : tone === "negative"
        ? "text-negative"
        : "";
  return (
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </p>
      <p className={`tabular mt-1 truncate text-[15px] font-semibold ${color}`}>
        {value}
      </p>
    </div>
  );
}

function SavingsStat({ rate, delta }: { rate: number; delta: number | null }) {
  const pct = Math.round(rate * 100);
  const d = delta != null ? Math.round(delta * 100) : null;
  const up = (d ?? 0) >= 0;
  return (
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        Ahorro
      </p>
      <p className="tabular mt-1 text-[15px] font-semibold">
        {pct}%
        {d != null && d !== 0 && (
          <span
            className={`ml-1 text-[11px] font-medium ${
              up ? "text-positive" : "text-negative"
            }`}
          >
            {up ? "↑" : "↓"}
            {Math.abs(d)}
          </span>
        )}
      </p>
    </div>
  );
}

function SpendingBreakdown({
  cats,
  total,
}: {
  cats: { name: string; amount: number }[];
  total: number;
}) {
  const rows = cats
    .filter((r) => r.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="mt-7">
      <Eyebrow>En qué se te va</Eyebrow>
      {total <= 0 || rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Todavía no cargaste gastos este mes.
        </p>
      ) : (
        <>
          <div className="mt-3 flex h-2.5 gap-0.5 overflow-hidden rounded-full">
            {rows.map((r, i) => (
              <div
                key={r.name}
                style={{
                  flexGrow: r.amount,
                  background: SHADES[Math.min(i, SHADES.length - 1)],
                }}
              />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2">
            {rows.slice(0, 6).map((r, i) => (
              <div
                key={r.name}
                className="flex items-center justify-between gap-2 text-[13px]"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-[3px]"
                    style={{ background: SHADES[Math.min(i, SHADES.length - 1)] }}
                  />
                  <span className="truncate">{r.name}</span>
                </span>
                <span className="tabular shrink-0 text-muted-foreground">
                  {formatARS(r.amount)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TopGoalRow({ goal, monthlyRate }: { goal: Goal; monthlyRate: number }) {
  const { pct, perMonth, done, overdue } = projectGoal(goal, monthlyRate);
  const d = new Date(`${goal.targetDate}T00:00:00`);
  const deadline = `${MESES[d.getMonth()]} ${d.getFullYear()}`;

  return (
    <Link href="/objetivos" className="mt-7 block">
      <div className="flex items-center justify-between">
        <Eyebrow>Objetivo</Eyebrow>
        <span className="text-xs font-medium text-brand">Ver</span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-brand/10 text-brand">
          <Target size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium">{goal.name}</span>
            <span className="tabular shrink-0 text-xs text-muted-foreground">
              {Math.round(pct * 100)}%
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct * 100}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className={`h-full rounded-full ${done ? "bg-positive" : "bg-brand"}`}
            />
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {done
          ? "Objetivo cumplido"
          : overdue
            ? `Se pasó la fecha — te faltan ${formatARS(goal.targetAmount - goal.savedAmount)}`
            : `Poné ${formatARS(Math.round(perMonth))}/mes para llegar en ${deadline}`}
      </p>
    </Link>
  );
}

function CategoryRow({
  name,
  used,
  limit,
}: {
  name: string;
  used: number;
  limit: number;
}) {
  const ratio = limit > 0 ? used / limit : 0;
  const pct = Math.min(ratio * 100, 100);

  let color = "bg-positive";
  if (ratio >= 1) color = "bg-negative";
  else if (ratio >= 0.7) color = "bg-gold";

  return (
    <div className="py-3">
      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0 truncate font-medium">{name}</span>
        <span className="tabular shrink-0 text-muted-foreground">
          <span className="text-foreground">{formatARS(used)}</span> /{" "}
          {formatARS(limit)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

function MovementRow({ expense }: { expense: Expense }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-muted text-muted-foreground">
          <CategoryIcon name={expense.category} />
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">
            {expense.description || expense.category}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {shortDate(expense.date)} · {expense.category}
          </div>
        </div>
      </div>
      <span className="tabular shrink-0 text-sm font-medium text-negative">
        −{formatARS(expense.amount)}
      </span>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="mt-2 rounded-card border border-dashed border-border bg-card p-6 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Receipt size={20} />
      </div>
      <p className="mt-3 font-medium">Todavía no cargaste gastos</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Registrá tu primer gasto del mes para ver cómo venís
      </p>
      <button
        onClick={onAdd}
        className="mt-4 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
      >
        Cargar mi primer gasto
      </button>
    </div>
  );
}

function DashboardError() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <RotateCw size={22} />
        </div>
        <p className="mt-4 font-medium">No pudimos cargar tu plata</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Puede ser un problema de conexión. Probá de nuevo.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-5 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────

function CategoryIcon({ name, size = 17 }: { name: string; size?: number }) {
  return createElement(categoryIcon(name), { size });
}

function categoryIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (/vivienda|alquiler|hogar|casa/.test(n)) return Home;
  if (/comida|super|comes|delivery/.test(n)) return ShoppingBag;
  if (/transporte|auto|nafta|sube|uber/.test(n)) return Car;
  if (/salida|salir|boliche|bar/.test(n)) return Beer;
  if (/ropa|indument/.test(n)) return Shirt;
  if (/suscrip|streaming|netflix|spotify/.test(n)) return Tv;
  if (/deuda|tarjeta|crédito|credito/.test(n)) return CreditCard;
  if (/servicio|luz|gas|internet|expensas/.test(n)) return Zap;
  return Tag;
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Hoy";
  const ayer = new Date(now);
  ayer.setDate(now.getDate() - 1);
  if (d.toDateString() === ayer.toDateString()) return "Ayer";
  return `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`;
}
