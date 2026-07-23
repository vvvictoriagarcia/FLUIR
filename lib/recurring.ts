// ─────────────────────────────────────────────────────────────────
// FLUIR — Pagos fijos con vencimiento.
// Mismo criterio que el resto: Supabase si hay sesión, localStorage si no.
// Requiere `supabase/add_pagos_fijos.sql` corrido para la parte con cuenta.
// ─────────────────────────────────────────────────────────────────

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { persistExpense } from "@/lib/data";
import * as local from "@/lib/budget-store";

export interface RecurringPayment {
  id: string;
  name: string;
  category: string;
  amount: number;
  /** Día del mes en que vence (1–31). */
  dueDay: number;
  /** Cuántos días antes queremos el aviso. */
  remindDays: number;
  isActive: boolean;
}

export type PaymentStatus = "pagado" | "vencido" | "hoy" | "proximo";

export interface UpcomingPayment extends RecurringPayment {
  status: PaymentStatus;
  /** Días hasta el vencimiento de este mes (negativo = ya pasó). */
  daysLeft: number;
  /** Fecha de vencimiento de este mes, "YYYY-MM-DD". */
  dueDate: string;
}

const LOCAL_KEY = "fluir_recurring";
const LOCAL_PAID_KEY = "fluir_recurring_paid"; // { "<id>": "YYYY-MM" }

const COLS = "id, name, category, amount, due_day, remind_days, is_active";

async function getUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await createClient().auth.getUser();
  return data.user?.id ?? null;
}

export function currentMonthKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** El día de vencimiento acotado a los días que tiene el mes (31 → 28/30). */
export function dueDateFor(dueDay: number, ref = new Date()): Date {
  const daysInMonth = new Date(
    ref.getFullYear(),
    ref.getMonth() + 1,
    0,
  ).getDate();
  return new Date(ref.getFullYear(), ref.getMonth(), Math.min(dueDay, daysInMonth));
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** Cuántos días faltan (0 = hoy, negativo = ya venció). */
export function daysUntil(date: Date, today = new Date()): number {
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const b = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

// ── Local (demo sin cuenta) ────────────────────────────────────────

function readLocal(): RecurringPayment[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLocal(items: RecurringPayment[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
  } catch {}
}

function readLocalPaid(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LOCAL_PAID_KEY) || "{}");
  } catch {
    return {};
  }
}

// ── API ────────────────────────────────────────────────────────────

export async function loadRecurring(): Promise<RecurringPayment[]> {
  const uid = await getUserId();
  if (!uid) return readLocal();

  const { data, error } = await createClient()
    .from("recurring_payments")
    .select(COLS)
    .eq("user_id", uid)
    .order("due_day");
  if (error || !data) return [];

  return data.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    amount: Number(r.amount),
    dueDay: r.due_day,
    remindDays: r.remind_days,
    isActive: r.is_active,
  }));
}

export async function createRecurring(input: {
  name: string;
  category: string;
  amount: number;
  dueDay: number;
  remindDays?: number;
}): Promise<RecurringPayment> {
  const item: RecurringPayment = {
    id: crypto.randomUUID(),
    name: input.name,
    category: input.category,
    amount: input.amount,
    dueDay: input.dueDay,
    remindDays: input.remindDays ?? 3,
    isActive: true,
  };

  const uid = await getUserId();
  if (!uid) {
    writeLocal([...readLocal(), item]);
    return item;
  }

  const { data, error } = await createClient()
    .from("recurring_payments")
    .insert({
      user_id: uid,
      name: item.name,
      category: item.category,
      amount: item.amount,
      due_day: item.dueDay,
      remind_days: item.remindDays,
    })
    .select(COLS)
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo guardar el pago fijo");
  }
  return { ...item, id: data.id };
}

export async function deleteRecurring(id: string): Promise<void> {
  const uid = await getUserId();
  if (!uid) {
    writeLocal(readLocal().filter((r) => r.id !== id));
    return;
  }
  const { error } = await createClient()
    .from("recurring_payments")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Ids de los pagos fijos ya saldados en el mes en curso. */
export async function loadPaidThisMonth(): Promise<Set<string>> {
  const uid = await getUserId();
  if (!uid) {
    const month = currentMonthKey();
    return new Set(
      Object.entries(readLocalPaid())
        .filter(([, m]) => m === month)
        .map(([id]) => id),
    );
  }

  const first = new Date();
  const from = toISODate(new Date(first.getFullYear(), first.getMonth(), 1));
  const { data } = await createClient()
    .from("expenses")
    .select("recurring_id")
    .eq("user_id", uid)
    .gte("date", from)
    .not("recurring_id", "is", null);

  return new Set((data ?? []).map((r) => r.recurring_id as string));
}

/**
 * Marca un pago fijo como pagado este mes: crea el gasto (para que impacte en
 * el presupuesto) y lo deja vinculado al pago fijo.
 */
export async function markPaid(item: RecurringPayment): Promise<void> {
  const uid = await getUserId();

  if (!uid) {
    local.addExpense({
      category: item.category,
      amount: item.amount,
      description: item.name,
    });
    const paid = readLocalPaid();
    paid[item.id] = currentMonthKey();
    try {
      localStorage.setItem(LOCAL_PAID_KEY, JSON.stringify(paid));
    } catch {}
    return;
  }

  const expense = await persistExpense(item.category, item.amount, item.name);
  const { error } = await createClient()
    .from("expenses")
    .update({ recurring_id: item.id })
    .eq("id", expense.id);
  if (error) throw new Error(error.message);
}

/** Arma la vista "qué se viene" ordenada por urgencia. */
export function buildUpcoming(
  items: RecurringPayment[],
  paidIds: Set<string>,
  today = new Date(),
): UpcomingPayment[] {
  return items
    .filter((i) => i.isActive)
    .map((i) => {
      const due = dueDateFor(i.dueDay, today);
      const daysLeft = daysUntil(due, today);
      const status: PaymentStatus = paidIds.has(i.id)
        ? "pagado"
        : daysLeft < 0
          ? "vencido"
          : daysLeft === 0
            ? "hoy"
            : "proximo";
      return { ...i, status, daysLeft, dueDate: toISODate(due) };
    })
    .sort((a, b) => {
      const rank = { vencido: 0, hoy: 1, proximo: 2, pagado: 3 };
      if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
      return a.daysLeft - b.daysLeft;
    });
}

/** Texto corto de estado, listo para mostrar. */
export function statusLabel(p: UpcomingPayment): string {
  switch (p.status) {
    case "pagado":
      return "Pagado este mes";
    case "hoy":
      return "Vence hoy";
    case "vencido":
      return p.daysLeft === -1 ? "Venció ayer" : `Venció hace ${-p.daysLeft} días`;
    default:
      return p.daysLeft === 1 ? "Vence mañana" : `Vence en ${p.daysLeft} días`;
  }
}
