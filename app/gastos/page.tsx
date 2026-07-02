"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { BottomNav } from "@/components/bottom-nav";
import { ExpenseModal } from "@/components/expense-modal";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FullScreenLoader } from "@/components/loading";
import { useToast } from "@/components/toast";
import { formatARS } from "@/lib/utils";
import {
  editExpense,
  loadDashboard,
  persistExpense,
  removeExpense,
} from "@/lib/data";
import { totalSpent, type Expense } from "@/lib/budget-store";
import type { BudgetCategory } from "@/lib/calculators/budget";

type ModalState =
  | { mode: "add" }
  | { mode: "edit"; expense: Expense }
  | null;

export default function GastosPage() {
  const router = useRouter();
  const toast = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);

  useEffect(() => {
    let active = true;
    loadDashboard().then(({ budget, expenses }) => {
      if (!active) return;
      if (!budget) {
        router.replace("/onboarding");
        return;
      }
      setExpenses(expenses);
      setCategories(
        budget.result.categories
          .filter((c: BudgetCategory) => !c.is_fixed && c.category !== "Ahorro")
          .map((c) => c.category)
      );
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [router]);

  const gastado = useMemo(() => totalSpent(expenses), [expenses]);
  const groups = useMemo(() => groupByDay(expenses), [expenses]);

  async function handleDelete(id: string) {
    setPendingDelete(null);
    try {
      await removeExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast("Gasto eliminado");
    } catch {
      toast("No se pudo eliminar. Revisá tu conexión.", "error");
    }
  }

  async function handleAdd(category: string, amount: number, description: string) {
    try {
      const expense = await persistExpense(category, amount, description);
      setExpenses((prev) => [expense, ...prev]);
      setModal(null);
      toast("Gasto guardado");
    } catch {
      toast("No se pudo guardar. Revisá tu conexión.", "error");
    }
  }

  async function handleEdit(
    id: string,
    category: string,
    amount: number,
    description: string
  ) {
    try {
      await editExpense(id, category, amount, description);
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, category, amount, description } : e))
      );
      setModal(null);
      toast("Gasto actualizado");
    } catch {
      toast("No se pudo guardar. Revisá tu conexión.", "error");
    }
  }

  if (!loaded) {
    return <FullScreenLoader />;
  }

  return (
    <div className="min-h-screen pb-28">
      <div className="mx-auto max-w-xl px-5 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="font-display text-xl font-semibold tracking-tight text-brand"
          >
            fluir
          </Link>
          <ThemeToggle />
        </div>

        <h1 className="font-display text-3xl font-semibold">Gastos</h1>
        <p className="mt-1 text-muted-foreground">
          Gastaste{" "}
          <span className="font-medium text-foreground">{formatARS(gastado)}</span>{" "}
          este mes
        </p>

        {expenses.length === 0 ? (
          <div className="mt-8 rounded-card border border-dashed border-border bg-card p-8 text-center">
            <div className="text-3xl">🧾</div>
            <p className="mt-2 font-medium">Todavía no cargaste gastos</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tocá el botón para registrar tu primer gasto
            </p>
            <button
              onClick={() => setModal({ mode: "add" })}
              className="mt-4 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground"
            >
              Registrar mi primer gasto
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {groups.map((group) => (
              <div key={group.label}>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </h2>
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {group.items.map((e) => (
                      <motion.div
                        key={e.id}
                        layout
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
                      >
                        <button
                          onClick={() => setModal({ mode: "edit", expense: e })}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="font-medium">{e.category}</div>
                          {e.description && (
                            <div className="truncate text-xs text-muted-foreground">
                              {e.description}
                            </div>
                          )}
                        </button>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setModal({ mode: "edit", expense: e })}
                            className="tabular-nums font-medium text-negative"
                          >
                            −{formatARS(e.amount)}
                          </button>
                          <button
                            onClick={() => setPendingDelete(e)}
                            aria-label="Eliminar gasto"
                            className="text-muted-foreground/50 transition-colors hover:text-negative"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB — centrado dentro de la columna de contenido, alineado a la derecha */}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-30 px-5">
        <div className="mx-auto flex max-w-xl justify-end">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setModal({ mode: "add" })}
            aria-label="Registrar gasto"
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-brand px-5 py-4 font-medium text-brand-foreground shadow-lg shadow-brand/30"
          >
            <Plus className="h-5 w-5" />
            Cargar gasto
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {modal?.mode === "add" && (
          <ExpenseModal
            categories={categories}
            title="Registrar gasto"
            onClose={() => setModal(null)}
            onSave={handleAdd}
          />
        )}
        {modal?.mode === "edit" && (
          <ExpenseModal
            categories={categories}
            title="Editar gasto"
            saveLabel="Guardar cambios"
            initial={{
              amount: modal.expense.amount,
              category: modal.expense.category,
              description: modal.expense.description,
            }}
            onClose={() => setModal(null)}
            onSave={(category, amount, description) =>
              handleEdit(modal.expense.id, category, amount, description)
            }
          />
        )}
        {pendingDelete && (
          <ConfirmDialog
            title="¿Borrar este gasto?"
            message={`${pendingDelete.category} · ${formatARS(pendingDelete.amount)}`}
            onConfirm={() => handleDelete(pendingDelete.id)}
            onCancel={() => setPendingDelete(null)}
          />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}

type DayGroup = { label: string; items: Expense[] };

function groupByDay(expenses: Expense[]): DayGroup[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const map = new Map<string, Expense[]>();
  for (const e of expenses) {
    const d = new Date(e.date);
    d.setHours(0, 0, 0, 0);
    let label: string;
    if (d.getTime() === today.getTime()) label = "Hoy";
    else if (d.getTime() === yesterday.getTime()) label = "Ayer";
    else
      label = d.toLocaleDateString("es-AR", { day: "numeric", month: "long" });
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(e);
  }
  return Array.from(map, ([label, items]) => ({ label, items }));
}
