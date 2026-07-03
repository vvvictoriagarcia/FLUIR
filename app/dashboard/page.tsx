"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { BottomNav } from "@/components/bottom-nav";
import { BudgetDonut } from "@/components/budget-donut";
import { ExpenseModal } from "@/components/expense-modal";
import { AnimatedNumber } from "@/components/animated-number";
import { ProgressRing } from "@/components/progress-ring";
import { DashboardSkeleton } from "@/components/skeletons";
import { useToast } from "@/components/toast";
import { useUser } from "@/hooks/useUser";
import { formatARS } from "@/lib/utils";
import {
  getMonthState,
  loadDashboard,
  migrateLocalToSupabase,
  persistExpense,
} from "@/lib/data";
import {
  getSavingsGoal,
  spentByCategory,
  type Expense,
  type SavedBudget,
} from "@/lib/budget-store";

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useUser();
  const [budget, setBudget] = useState<SavedBudget | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goal, setGoal] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // Carga inicial: Supabase si hay sesión, si no localStorage. Async porque
    // consulta la base / el storage, que solo existen en el cliente.
    let active = true;
    // Migra datos del demo a la cuenta (si recién te logueaste) y luego carga.
    migrateLocalToSupabase()
      .catch(() => {})
      .then(() => loadDashboard())
      .then(({ budget, expenses }) => {
        if (!active) return;
        if (!budget) {
          // ¿No hay presupuesto del mes? Decidir entre Nuevo Mes y onboarding.
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
        setGoal(getSavingsGoal());
        setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [router]);

  const spent = useMemo(() => spentByCategory(expenses), [expenses]);

  if (!loaded || !budget) {
    return <DashboardSkeleton />;
  }

  const income = budget.income;
  const cats = budget.result.categories;

  // Fijos (alquiler, transporte, deuda): se dan por comprometidos del mes.
  const fixedCats = cats.filter((c) => c.is_fixed);
  // Variables (comida, salidas, ropa, suscripciones): lo que trackeás al gastar.
  const variableCats = cats.filter((c) => !c.is_fixed && c.category !== "Ahorro");
  const variableNames = new Set(variableCats.map((c) => c.category));

  const comprometido = fixedCats.reduce((s, c) => s + c.limit, 0);
  const variableBudget = variableCats.reduce((s, c) => s + c.limit, 0);
  const variableSpent = expenses
    .filter((e) => variableNames.has(e.category))
    .reduce((s, e) => s + e.amount, 0);
  // Lo que realmente te queda para gastar: presupuesto variable − lo gastado.
  const paraGastar = variableBudget - variableSpent;
  const ahorro = budget.result.total_savings;

  // Anillo: cuánto del presupuesto variable ya gastaste, con color semáforo.
  const usedRatio = variableBudget > 0 ? variableSpent / variableBudget : 0;
  const ringColor =
    usedRatio >= 1
      ? "var(--negative)"
      : usedRatio >= 0.9
        ? "#f97316"
        : usedRatio >= 0.7
          ? "var(--gold)"
          : "var(--positive)";

  const firstName = (
    (user?.user_metadata?.full_name as string) ||
    user?.email?.split("@")[0] ||
    ""
  ).split(" ")[0];

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

  return (
    <div className="min-h-screen pb-28">
      <div className="mx-auto max-w-xl px-5 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-tight text-brand"
          >
            fluir
          </Link>
          <ThemeToggle />
        </div>

        {/* Saludo + mensaje dinámico */}
        <div className="text-center">
          {firstName && (
            <p className="font-display text-lg font-semibold">
              Hola {firstName} 👋
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {monthGreeting(budget, variableSpent)}
          </p>
        </div>

        {/* Hero: anillo con lo que te queda para gastar */}
        <h1 className="sr-only">Te quedan {formatARS(paraGastar)} para gastar</h1>
        <div className="mt-5 flex justify-center">
          <ProgressRing ratio={usedRatio} color={ringColor}>
            <span className="text-xs text-muted-foreground">Te quedan</span>
            <AnimatedNumber
              value={paraGastar}
              className={`font-display text-3xl font-semibold tabular-nums ${
                paraGastar >= 0 ? "text-foreground" : "text-negative"
              }`}
            />
            <span className="text-xs text-muted-foreground">para gastar</span>
          </ProgressRing>
        </div>

        {/* KPIs */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Kpi label="Ingreso" value={income} />
          <Kpi label="Comprometido" value={comprometido} />
          <Kpi label="Ahorro" value={ahorro} accent="positive" />
        </div>

        {/* Meta de ahorro */}
        {goal > 0 && (
          <div className="mt-6 rounded-card border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">🎯 Meta de ahorro</span>
              <span className="tabular-nums text-sm text-muted-foreground">
                {formatARS(ahorro)} / {formatARS(goal)}
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((ahorro / goal) * 100, 100)}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  ahorro >= goal ? "bg-positive" : "bg-brand"
                }`}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {ahorro >= goal
                ? "¡Llegaste a tu meta! 🎉"
                : `Te faltan ${formatARS(goal - ahorro)} para tu meta`}
            </p>
          </div>
        )}

        {/* Acceso a Objetivos */}
        <Link
          href="/objetivos"
          className="mt-4 flex items-center gap-3 rounded-card border border-border bg-card p-4 transition-colors hover:bg-muted"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
            🎯
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">Tus objetivos</p>
            <p className="text-xs text-muted-foreground">
              Ahorrá para lo que querés, con plazo y monto
            </p>
          </div>
          <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-muted-foreground" />
        </Link>

        {/* Distribución del presupuesto */}
        <div className="mt-8 mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Distribución
          </h2>
          <Link
            href="/perfil/presupuesto"
            className="text-xs font-medium text-brand transition-opacity hover:opacity-80"
          >
            Ajustar montos
          </Link>
        </div>
        <div className="rounded-card border border-border bg-card p-5">
          <BudgetDonut categories={budget.result.categories} />
        </div>

        {/* Para gastar — categorías variables */}
        <h2 className="mt-8 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Para gastar
        </h2>

        {expenses.length === 0 && <EmptyState onAdd={() => setModalOpen(true)} />}

        <div className="space-y-3">
          {variableCats.map((c) => (
            <CategoryRow
              key={c.category}
              name={c.category}
              used={spent[c.category] ?? 0}
              limit={c.limit}
            />
          ))}
        </div>

        {/* Comprometido — gastos fijos ya descontados */}
        {fixedCats.length > 0 && (
          <>
            <h2 className="mt-8 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Comprometido este mes
            </h2>
            <div className="rounded-card border border-border bg-card p-4">
              <div className="space-y-3">
                {fixedCats.map((c) => (
                  <div
                    key={c.category}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      {c.category}
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        fijo
                      </span>
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatARS(c.limit)}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                Ya descontados de tu ingreso. Ajustá los montos reales desde{" "}
                <Link href="/perfil/presupuesto" className="text-brand">
                  Mi presupuesto
                </Link>
                .
              </p>
            </div>
          </>
        )}

        {/* Gastos recientes */}
        {expenses.length > 0 && (
          <>
            <h2 className="mt-8 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Últimos movimientos
            </h2>
            <div className="space-y-2">
              {expenses.slice(0, 8).map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm"
                >
                  <div>
                    <div className="font-medium">{e.category}</div>
                    {e.description && (
                      <div className="text-xs text-muted-foreground">
                        {e.description}
                      </div>
                    )}
                  </div>
                  <span className="tabular-nums font-medium text-negative">
                    −{formatARS(e.amount)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* FAB — centrado dentro de la columna de contenido, alineado a la derecha */}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-30 px-5">
        <div className="mx-auto flex max-w-xl justify-end">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setModalOpen(true)}
            aria-label="Registrar gasto"
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-brand px-5 py-4 font-medium text-brand-foreground shadow-lg shadow-brand/30"
          >
            <Plus className="h-5 w-5" />
            Cargar gasto
          </motion.button>
        </div>
      </div>

      {/* Modal de carga */}
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
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "positive" | "negative";
}) {
  const color =
    accent === "positive"
      ? "text-positive"
      : accent === "negative"
        ? "text-negative"
        : "";
  return (
    <div className="rounded-card border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <AnimatedNumber
        value={value}
        className={`mt-1 block text-sm font-semibold tabular-nums ${color}`}
      />
    </div>
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

  let barColor = "bg-positive";
  let note = `${formatARS(Math.max(limit - used, 0))} disponible`;
  if (ratio >= 1) {
    barColor = "bg-negative";
    note = `Llegaste al límite de ${name}`;
  } else if (ratio >= 0.9) {
    barColor = "bg-orange-500";
    note = `Quedan ${formatARS(limit - used)} — frenate un poco`;
  } else if (ratio >= 0.7) {
    barColor = "bg-gold";
    note = "Casi llegando al límite";
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium">{name}</span>
        <span className="tabular-nums text-muted-foreground">
          {formatARS(used)} / {formatARS(limit)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="mb-4 rounded-card border border-dashed border-border bg-card p-6 text-center">
      <div className="text-3xl">📋</div>
      <p className="mt-2 font-medium">Todavía no cargaste nada</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Tocá el botón para registrar tu primer gasto del mes
      </p>
      <button
        onClick={onAdd}
        className="mt-4 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground"
      >
        Registrar mi primer gasto
      </button>
    </div>
  );
}

// Mensaje dinámico del header según el día del mes y cómo viene el gasto.
function monthGreeting(budget: SavedBudget, gastado: number): string {
  const day = new Date().getDate();
  const variableLimit = budget.result.categories
    .filter((c) => !c.is_fixed && c.category !== "Ahorro")
    .reduce((s, c) => s + c.limit, 0);
  const daysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ).getDate();
  const expected = variableLimit * (day / daysInMonth);
  const overspending = gastado > expected * 1.1;

  if (day <= 5) return "Arrancaste el mes — ¿cómo va?";
  if (day <= 15) return overspending ? "Ojo con los gastos esta semana" : "Vas bien este mes 🙌";
  if (day <= 25)
    return overspending
      ? "La recta final — cuidá el margen"
      : "Segunda mitad del mes, vas prolijo";
  return overspending
    ? "Este mes fue movidito. El próximo arrancás de cero."
    : "Casi llegás — cerrá fuerte";
}
