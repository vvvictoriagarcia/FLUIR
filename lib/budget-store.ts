// ─────────────────────────────────────────────────────────────────
// FLUIR — Almacenamiento local del presupuesto y los gastos
// Por ahora todo vive en localStorage (sin login). Cuando entre
// Supabase, estas funciones se reemplazan por queries — la UI no cambia.
// ─────────────────────────────────────────────────────────────────

import type { BudgetResult, OnboardingAnswers } from "@/lib/calculators/budget";

const BUDGET_KEY = "fluir_budget";
const EXPENSES_KEY = "fluir_expenses";
const SAVINGS_GOAL_KEY = "fluir_savings_goal";

export interface SavedBudget {
  income: number;
  answers: OnboardingAnswers;
  result: BudgetResult;
  month: string; // "2026-06"
  createdAt: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string; // ISO
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ── Presupuesto ────────────────────────────────────────────────────

export function saveBudget(income: number, answers: OnboardingAnswers, result: BudgetResult) {
  const data: SavedBudget = {
    income,
    answers,
    result,
    month: currentMonth(),
    createdAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(data));
  } catch {}
}

export function loadBudget(): SavedBudget | null {
  try {
    const raw = localStorage.getItem(BUDGET_KEY);
    return raw ? (JSON.parse(raw) as SavedBudget) : null;
  } catch {
    return null;
  }
}

export function clearAll() {
  try {
    localStorage.removeItem(BUDGET_KEY);
    localStorage.removeItem(EXPENSES_KEY);
  } catch {}
}

// ── Gastos ─────────────────────────────────────────────────────────

export function loadExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(EXPENSES_KEY);
    return raw ? (JSON.parse(raw) as Expense[]) : [];
  } catch {
    return [];
  }
}

export function addExpense(expense: Omit<Expense, "id" | "date">): Expense {
  const full: Expense = {
    ...expense,
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
  };
  const all = [full, ...loadExpenses()];
  try {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(all));
  } catch {}
  return full;
}

export function deleteExpense(id: string): Expense[] {
  const all = loadExpenses().filter((e) => e.id !== id);
  try {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(all));
  } catch {}
  return all;
}

export function updateExpense(
  id: string,
  patch: { category: string; amount: number; description: string }
): Expense[] {
  const all = loadExpenses().map((e) => (e.id === id ? { ...e, ...patch } : e));
  try {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(all));
  } catch {}
  return all;
}

// ── Derivados ──────────────────────────────────────────────────────

/** Suma de gastos por categoría: { Salidas: 12000, Comida: 8000, ... } */
export function spentByCategory(expenses: Expense[]): Record<string, number> {
  return expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});
}

export function totalSpent(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

// ── Meta de ahorro (por ahora local, por dispositivo) ──────────────

export function getSavingsGoal(): number {
  try {
    return Number(localStorage.getItem(SAVINGS_GOAL_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function setSavingsGoal(amount: number) {
  try {
    localStorage.setItem(SAVINGS_GOAL_KEY, String(amount));
  } catch {}
}
