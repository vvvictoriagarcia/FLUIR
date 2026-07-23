// ─────────────────────────────────────────────────────────────────
// FLUIR — Capa de datos unificada
// Si hay sesión de Supabase → guarda/lee de la base (entre dispositivos).
// Si no → cae en localStorage (el demo sin login sigue funcionando).
// La UI llama a estas funciones y no le importa de dónde vienen los datos.
// ─────────────────────────────────────────────────────────────────

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import * as local from "@/lib/budget-store";
import {
  calculateBudget,
  recalcFromLimits,
  type BudgetCategory,
  type BudgetResult,
  type ClothesLevel,
  type GoesOutLevel,
  type OnboardingAnswers,
} from "@/lib/calculators/budget";
import type { Expense, Goal, SavedBudget } from "@/lib/budget-store";

function firstOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/**
 * Id del usuario logueado, o null en modo demo.
 *
 * Usa `getSession()` (lee el storage local) y no `getUser()`, que pega a la red
 * en cada llamada: con cinco módulos preguntando por la sesión, eran 8 requests
 * a /auth/v1/user por carga. La seguridad no depende de esto — los datos los
 * protege RLS del lado del servidor.
 */
async function getUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await createClient().auth.getSession();
  return data.session?.user.id ?? null;
}

/** Guarda el presupuesto. Supabase si hay sesión; siempre cachea local. */
export async function persistBudget(
  income: number,
  answers: OnboardingAnswers,
  result: BudgetResult
) {
  local.saveBudget(income, answers, result);
  const uid = await getUserId();
  if (!uid) return;

  const supabase = createClient();
  const month = firstOfMonth();

  const { data: budget, error: budgetError } = await supabase
    .from("budgets")
    .upsert({ user_id: uid, month, income }, { onConflict: "user_id,month" })
    .select("id")
    .single();
  if (budgetError || !budget) {
    throw new Error(budgetError?.message ?? "No se pudo guardar el presupuesto");
  }

  await supabase.from("budget_categories").delete().eq("budget_id", budget.id);
  const { error: catError } = await supabase.from("budget_categories").insert(
    result.categories.map((c) => ({
      budget_id: budget.id,
      category: c.category,
      allocated: c.allocated,
      limit_amount: c.limit,
      is_fixed: c.is_fixed,
    }))
  );
  if (catError) throw new Error(catError.message);

  await supabase
    .from("onboarding_answers")
    .update({
      income,
      pays_rent: answers.pays_rent,
      has_car: answers.has_car,
      goes_out_often: answers.goes_out_often,
      spends_on_clothes: answers.spends_on_clothes,
      has_debt: answers.has_debt,
    })
    .eq("user_id", uid);
  await supabase
    .from("profiles")
    .update({ onboarding_completed: true })
    .eq("id", uid);
}

/** Construye OnboardingAnswers desde una fila de onboarding_answers. */
function buildAnswers(
  income: number,
  ans: {
    pays_rent?: boolean | null;
    has_car?: boolean | null;
    goes_out_often?: string | null;
    spends_on_clothes?: string | null;
    has_debt?: boolean | null;
  } | null
): OnboardingAnswers {
  return {
    income,
    pays_rent: !!ans?.pays_rent,
    has_car: !!ans?.has_car,
    goes_out_often: (ans?.goes_out_often as GoesOutLevel) ?? "seguido",
    spends_on_clothes: (ans?.spends_on_clothes as ClothesLevel) ?? "moderado",
    has_debt: !!ans?.has_debt,
  };
}

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/** 'YYYY-MM' o 'YYYY-MM-01' → 'Junio 2026'. */
function monthLabel(month: string): string {
  const [y, m] = month.split("-");
  return `${MONTHS_ES[Number(m) - 1] ?? m} ${y}`;
}

export interface MonthSummary {
  month: string; // 'YYYY-MM-01'
  label: string; // 'Junio 2026'
  income: number;
  spent: number;
  saved: number; // income - spent
  savedPct: number; // saved / income (0 si income 0)
  topCategory: { category: string; amount: number } | null;
  txCount: number;
}

function buildSummary(
  month: string,
  income: number,
  expenses: { category: string; amount: number }[]
): MonthSummary {
  const spent = expenses.reduce((s, e) => s + e.amount, 0);
  const saved = income - spent;
  const byCat = new Map<string, number>();
  for (const e of expenses) {
    byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
  }
  let topCategory: MonthSummary["topCategory"] = null;
  for (const [category, amount] of byCat) {
    if (!topCategory || amount > topCategory.amount) topCategory = { category, amount };
  }
  return {
    month,
    label: monthLabel(month),
    income,
    spent,
    saved,
    savedPct: income > 0 ? saved / income : 0,
    topCategory,
    txCount: expenses.length,
  };
}

/**
 * Historial de meses cerrados (Plus), del más reciente al más viejo.
 * Con sesión lee todos los `budgets` del usuario; en demo devuelve el único
 * mes que vive en localStorage (el historial se llena mes a mes en la nube).
 */
export async function loadHistory(): Promise<MonthSummary[]> {
  const uid = await getUserId();

  if (!uid) {
    const b = local.loadBudget();
    if (!b) return [];
    const exps = local.loadExpenses();
    return [buildSummary(`${b.month}-01`, b.income, exps)];
  }

  const supabase = createClient();
  const { data: budgets } = await supabase
    .from("budgets")
    .select("id, month, income")
    .eq("user_id", uid)
    .order("month", { ascending: false });
  if (!budgets?.length) return [];

  const ids = budgets.map((b) => b.id);
  const { data: exps } = await supabase
    .from("expenses")
    .select("budget_id, category, amount")
    .in("budget_id", ids);

  return budgets.map((b) => {
    const mine = (exps ?? [])
      .filter((e) => e.budget_id === b.id)
      .map((e) => ({ category: e.category as string, amount: Number(e.amount) }));
    return buildSummary(b.month as string, Number(b.income), mine);
  });
}

export interface PreviousMonth {
  income: number;
  answers: OnboardingAnswers;
  categories: BudgetCategory[];
  expenses: Expense[];
}

/**
 * Carga el presupuesto del mes ANTERIOR (el más reciente que no es el actual),
 * con sus categorías reales y gastos. Para el rollover y el resumen de cierre.
 */
export async function loadPreviousMonth(): Promise<PreviousMonth | null> {
  const uid = await getUserId();

  if (!uid) {
    const b = local.loadBudget();
    if (!b) return null;
    const d = new Date();
    const cur = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (b.month === cur) return null; // es el mes actual, no hay anterior
    return {
      income: b.income,
      answers: b.answers,
      categories: b.result.categories,
      expenses: local.loadExpenses(),
    };
  }

  const supabase = createClient();
  const month = firstOfMonth();
  const { data: prev } = await supabase
    .from("budgets")
    .select("id, income")
    .eq("user_id", uid)
    .neq("month", month)
    .order("month", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!prev) return null;

  const { data: ans } = await supabase
    .from("onboarding_answers")
    .select("*")
    .eq("user_id", uid)
    .maybeSingle();

  const { data: catRows } = await supabase
    .from("budget_categories")
    .select("category, allocated, limit_amount, is_fixed")
    .eq("budget_id", prev.id);

  const { data: exps } = await supabase
    .from("expenses")
    .select("id, category, amount, description, date")
    .eq("budget_id", prev.id);

  return {
    income: Number(prev.income),
    answers: buildAnswers(Number(prev.income), ans),
    categories: (catRows ?? []).map((c) => ({
      category: c.category as string,
      allocated: Number(c.allocated),
      limit: Number(c.limit_amount),
      percent: 0,
      is_fixed: !!c.is_fixed,
    })),
    expenses: (exps ?? []).map((e) => ({
      id: e.id,
      category: e.category,
      amount: Number(e.amount),
      description: e.description ?? "",
      date: e.date,
    })),
  };
}

/**
 * Si el usuario armó un presupuesto en el demo (localStorage) y luego se logueó,
 * migra ese presupuesto y sus gastos a su cuenta de Supabase. Idempotente:
 * si ya tiene datos del mes en la nube, no pisa nada y limpia el local.
 */
export async function migrateLocalToSupabase(): Promise<boolean> {
  const uid = await getUserId();
  if (!uid) return false;

  const localBudget = local.loadBudget();
  if (!localBudget) return false;

  const supabase = createClient();
  const month = firstOfMonth();
  const { data: existing } = await supabase
    .from("budgets")
    .select("id")
    .eq("user_id", uid)
    .eq("month", month)
    .maybeSingle();

  if (existing) {
    // Ya tiene datos en la nube — no los pisamos. Limpiamos el local.
    local.clearAll();
    return false;
  }

  const localExpenses = local.loadExpenses();
  await persistBudget(localBudget.income, localBudget.answers, localBudget.result);
  for (const e of localExpenses) {
    await persistExpense(e.category, e.amount, e.description);
  }
  local.clearAll();
  return true;
}

/** Carga el presupuesto del mes + sus gastos. */
export async function loadDashboard(): Promise<{
  budget: SavedBudget | null;
  expenses: Expense[];
}> {
  const uid = await getUserId();
  if (!uid) {
    return { budget: local.loadBudget(), expenses: local.loadExpenses() };
  }

  const supabase = createClient();
  const month = firstOfMonth();

  const { data: budget } = await supabase
    .from("budgets")
    .select("id, income, month")
    .eq("user_id", uid)
    .eq("month", month)
    .maybeSingle();
  if (!budget) return { budget: null, expenses: [] };

  const { data: answers } = await supabase
    .from("onboarding_answers")
    .select("*")
    .eq("user_id", uid)
    .maybeSingle();

  const a: OnboardingAnswers = {
    income: Number(budget.income),
    pays_rent: !!answers?.pays_rent,
    has_car: !!answers?.has_car,
    goes_out_often: (answers?.goes_out_often as GoesOutLevel) ?? "seguido",
    spends_on_clothes: (answers?.spends_on_clothes as ClothesLevel) ?? "moderado",
    has_debt: !!answers?.has_debt,
  };

  // Leer las categorías guardadas (con los montos reales que editó el usuario).
  // Si existen, se usan tal cual y el ahorro se recalcula como residual.
  // Si no, se cae en la sugerencia del algoritmo.
  const { data: catRows } = await supabase
    .from("budget_categories")
    .select("category, allocated, limit_amount, is_fixed")
    .eq("budget_id", budget.id);

  let result: BudgetResult;
  if (catRows && catRows.length > 0) {
    const cats: BudgetCategory[] = catRows.map((c) => ({
      category: c.category as string,
      allocated: Number(c.allocated),
      limit: Number(c.limit_amount),
      percent: 0,
      is_fixed: !!c.is_fixed,
    }));
    result = recalcFromLimits(a.income, cats);
  } else {
    result = calculateBudget(a);
  }

  const saved: SavedBudget = {
    income: a.income,
    answers: a,
    result,
    month: budget.month,
    createdAt: new Date().toISOString(),
  };

  const { data: exps } = await supabase
    .from("expenses")
    .select("id, category, amount, description, date")
    .eq("budget_id", budget.id)
    .order("date", { ascending: false });

  const expenses: Expense[] = (exps ?? []).map((e) => ({
    id: e.id,
    category: e.category,
    amount: Number(e.amount),
    description: e.description ?? "",
    date: e.date,
  }));

  return { budget: saved, expenses };
}

/** Registra un gasto. Supabase si hay sesión; si no, localStorage. */
export async function persistExpense(
  category: string,
  amount: number,
  description: string
): Promise<Expense> {
  const uid = await getUserId();
  if (!uid) return local.addExpense({ category, amount, description });

  const supabase = createClient();
  const month = firstOfMonth();
  const { data: budget } = await supabase
    .from("budgets")
    .select("id")
    .eq("user_id", uid)
    .eq("month", month)
    .maybeSingle();

  const { data: row, error } = await supabase
    .from("expenses")
    .insert({
      user_id: uid,
      budget_id: budget?.id ?? null,
      category,
      amount,
      description,
    })
    .select("id, category, amount, description, date")
    .single();

  if (error || !row) throw new Error(error?.message ?? "No se pudo guardar el gasto");

  return {
    id: row.id,
    category: row.category,
    amount: Number(row.amount),
    description: row.description ?? "",
    date: row.date,
  };
}

/** Edita un gasto existente. */
export async function editExpense(
  id: string,
  category: string,
  amount: number,
  description: string
): Promise<void> {
  const uid = await getUserId();
  if (!uid) {
    local.updateExpense(id, { category, amount, description });
    return;
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("expenses")
    .update({ category, amount, description })
    .eq("id", id)
    .eq("user_id", uid);
  if (error) throw new Error(error.message);
}

export type MonthState = "current" | "rollover" | "none";

/**
 * Determina si el usuario ya tiene presupuesto del mes en curso ("current"),
 * tiene uno de un mes anterior ("rollover" → pantalla Nuevo Mes), o ninguno
 * ("none" → onboarding). Devuelve también el ingreso y respuestas para precargar.
 */
export async function getMonthState(): Promise<{
  state: MonthState;
  income: number;
  answers: OnboardingAnswers | null;
}> {
  const uid = await getUserId();

  if (!uid) {
    const b = local.loadBudget();
    if (!b) return { state: "none", income: 0, answers: null };
    const d = new Date();
    const cur = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return {
      state: b.month === cur ? "current" : "rollover",
      income: b.income,
      answers: b.answers,
    };
  }

  const supabase = createClient();
  const month = firstOfMonth();

  const { data: ans } = await supabase
    .from("onboarding_answers")
    .select("*")
    .eq("user_id", uid)
    .maybeSingle();
  const answers: OnboardingAnswers | null =
    ans && ans.income != null
      ? {
          income: Number(ans.income),
          pays_rent: !!ans.pays_rent,
          has_car: !!ans.has_car,
          goes_out_often: (ans.goes_out_often as GoesOutLevel) ?? "seguido",
          spends_on_clothes: (ans.spends_on_clothes as ClothesLevel) ?? "moderado",
          has_debt: !!ans.has_debt,
        }
      : null;

  const { data: cur } = await supabase
    .from("budgets")
    .select("income")
    .eq("user_id", uid)
    .eq("month", month)
    .maybeSingle();
  if (cur) return { state: "current", income: Number(cur.income), answers };

  const { data: latest } = await supabase
    .from("budgets")
    .select("income")
    .eq("user_id", uid)
    .order("month", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest) return { state: "rollover", income: Number(latest.income), answers };

  return { state: "none", income: 0, answers };
}

/** Elimina un gasto. */
export async function removeExpense(id: string): Promise<void> {
  const uid = await getUserId();
  if (!uid) {
    local.deleteExpense(id);
    return;
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("user_id", uid);
  if (error) throw new Error(error.message);
}

// ── Objetivos con plazo y monto (Free) ─────────────────────────────

type GoalRow = {
  id: string;
  name: string;
  target_amount: number | string;
  target_date: string;
  saved_amount: number | string;
  created_at: string;
};

function mapGoal(r: GoalRow): Goal {
  return {
    id: r.id,
    name: r.name,
    targetAmount: Number(r.target_amount),
    targetDate: r.target_date,
    savedAmount: Number(r.saved_amount),
    createdAt: r.created_at,
  };
}

const GOAL_COLS = "id, name, target_amount, target_date, saved_amount, created_at";

/** Lista los objetivos del usuario (más viejos primero). */
export async function loadGoals(): Promise<Goal[]> {
  const uid = await getUserId();
  if (!uid) return local.loadGoals();

  const supabase = createClient();
  const { data } = await supabase
    .from("goals")
    .select(GOAL_COLS)
    .eq("user_id", uid)
    .order("created_at", { ascending: true });
  return (data ?? []).map(mapGoal);
}

/** Crea un objetivo. `targetDate` en 'YYYY-MM-DD'. */
export async function createGoal(
  name: string,
  targetAmount: number,
  targetDate: string
): Promise<Goal> {
  const uid = await getUserId();
  if (!uid) {
    const goal: Goal = {
      id: crypto.randomUUID(),
      name,
      targetAmount,
      targetDate,
      savedAmount: 0,
      createdAt: new Date().toISOString(),
    };
    local.saveGoals([...local.loadGoals(), goal]);
    return goal;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: uid,
      name,
      target_amount: targetAmount,
      target_date: targetDate,
    })
    .select(GOAL_COLS)
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo crear el objetivo");
  }
  return mapGoal(data);
}

/**
 * Suma `amount` a lo ahorrado de un objetivo (puede ser negativo para corregir).
 * Nunca baja de 0. Devuelve el nuevo total ahorrado.
 */
export async function addToGoal(id: string, amount: number): Promise<number> {
  const uid = await getUserId();
  if (!uid) {
    let saved = 0;
    const next = local.loadGoals().map((g) => {
      if (g.id !== id) return g;
      saved = Math.max(0, g.savedAmount + amount);
      return { ...g, savedAmount: saved };
    });
    local.saveGoals(next);
    return saved;
  }

  const supabase = createClient();
  const { data: cur } = await supabase
    .from("goals")
    .select("saved_amount")
    .eq("id", id)
    .eq("user_id", uid)
    .maybeSingle();
  const saved = Math.max(0, Number(cur?.saved_amount ?? 0) + amount);
  const { error } = await supabase
    .from("goals")
    .update({ saved_amount: saved })
    .eq("id", id)
    .eq("user_id", uid);
  if (error) throw new Error(error.message);
  return saved;
}

/** Elimina un objetivo. */
export async function deleteGoal(id: string): Promise<void> {
  const uid = await getUserId();
  if (!uid) {
    local.saveGoals(local.loadGoals().filter((g) => g.id !== id));
    return;
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", id)
    .eq("user_id", uid);
  if (error) throw new Error(error.message);
}
