import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Métricas para el panel /admin. SOLO servidor: usa la service_role (saltea
 * RLS) para leer datos de TODOS los usuarios y agregarlos acá en TS.
 *
 * Para volumen alto conviene mover esto a SQL (ver supabase/analytics_queries.sql);
 * a escala de lanzamiento, leer y agregar en memoria es más que suficiente.
 */

export interface AdminMetrics {
  usuarios: { total: number; free: number; plus: number; gold: number; altas7: number; altas30: number };
  actividad: { visitas7: number; visitas30: number; activos7: number; activos30: number };
  adopcion: { feature: string; usos: number; usuarios: number }[];
  adherencia: { tipo: string; vieron: number; siguieron: number; pct: number | null }[];
  salud: {
    presupuestosMesActual: number;
    tasaAhorroPromPct: number | null;
    objetivosCreados: number;
    objetivosCumplidos: number;
    habitoFuerte: number; // usuarios con >=12 días activos en 30d (~3/semana)
  };
  generadoEl: string;
}

const DAY = 24 * 60 * 60 * 1000;

export async function loadAdminMetrics(): Promise<AdminMetrics | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const now = Date.now();
  const iso7 = new Date(now - 7 * DAY).toISOString();
  const iso30 = new Date(now - 30 * DAY).toISOString();
  const mesActual = firstOfMonthISO(new Date(now));

  // Lecturas en paralelo. Límites generosos para no cortar a escala chica.
  const [profilesRes, eventsRes, budgetsRes, catsRes, goalsRes, expensesRes] =
    await Promise.all([
      supabase.from("profiles").select("id, plan, created_at").limit(50000),
      supabase
        .from("events")
        .select("name, session_id, user_id, props, created_at")
        .gte("created_at", iso30)
        .limit(100000),
      supabase.from("budgets").select("id, month, income").limit(50000),
      supabase.from("budget_categories").select("budget_id, category, limit_amount").limit(200000),
      supabase.from("goals").select("target_amount, saved_amount").limit(50000),
      supabase.from("expenses").select("user_id, date").gte("date", iso30).limit(200000),
    ]);

  const profiles = profilesRes.data ?? [];
  const events = eventsRes.data ?? [];
  const budgets = budgetsRes.data ?? [];
  const cats = catsRes.data ?? [];
  const goals = goalsRes.data ?? [];
  const expenses = expensesRes.data ?? [];

  // ── Usuarios ──────────────────────────────────────────────────────
  const usuarios = {
    total: profiles.length,
    free: profiles.filter((p) => (p.plan ?? "free") === "free").length,
    plus: profiles.filter((p) => p.plan === "plus").length,
    gold: profiles.filter((p) => p.plan === "gold").length,
    altas7: profiles.filter((p) => p.created_at && p.created_at >= iso7).length,
    altas30: profiles.filter((p) => p.created_at && p.created_at >= iso30).length,
  };

  // ── Actividad (session_started) ───────────────────────────────────
  const sesiones = events.filter((e) => e.name === "session_started");
  const sesiones7 = sesiones.filter((e) => e.created_at >= iso7);
  const actividad = {
    visitas30: uniq(sesiones.map((e) => e.session_id)).length,
    visitas7: uniq(sesiones7.map((e) => e.session_id)).length,
    activos30: uniq(sesiones.map((e) => e.user_id).filter(Boolean)).length,
    activos7: uniq(sesiones7.map((e) => e.user_id).filter(Boolean)).length,
  };

  // ── Adopción de herramientas (feature_used) ───────────────────────
  const feats = events.filter((e) => e.name === "feature_used");
  const featMap = new Map<string, { usos: number; usuarios: Set<string> }>();
  for (const e of feats) {
    const f = propStr(e.props, "feature");
    if (!f) continue;
    const cur = featMap.get(f) ?? { usos: 0, usuarios: new Set<string>() };
    cur.usos += 1;
    cur.usuarios.add(e.user_id ?? e.session_id ?? "?");
    featMap.set(f, cur);
  }
  const adopcion = [...featMap.entries()]
    .map(([feature, v]) => ({ feature, usos: v.usos, usuarios: v.usuarios.size }))
    .sort((a, b) => b.usos - a.usos);

  // ── Adherencia a sugerencias (vista vs seguida) ───────────────────
  const vistas = countBySesionYTipo(events, "sugerencia_vista");
  const seguidas = countBySesionYTipo(events, "sugerencia_seguida");
  const tipos = uniq([...vistas.keys(), ...seguidas.keys()]);
  const adherencia = tipos
    .map((tipo) => {
      const vieron = vistas.get(tipo) ?? 0;
      const siguieron = seguidas.get(tipo) ?? 0;
      return { tipo, vieron, siguieron, pct: vieron > 0 ? round1((100 * siguieron) / vieron) : null };
    })
    .sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));

  // ── Salud financiera ──────────────────────────────────────────────
  // Suma de límites (sin 'Ahorro') por presupuesto → ahorro planeado.
  const limitesPorBudget = new Map<string, number>();
  for (const c of cats) {
    if (c.category === "Ahorro") continue;
    limitesPorBudget.set(
      c.budget_id,
      (limitesPorBudget.get(c.budget_id) ?? 0) + Number(c.limit_amount ?? 0),
    );
  }
  const tasas: number[] = [];
  for (const b of budgets) {
    const income = Number(b.income ?? 0);
    if (income <= 0) continue;
    const ahorro = income - (limitesPorBudget.get(b.id) ?? 0);
    tasas.push((100 * ahorro) / income);
  }
  const tasaAhorroPromPct = tasas.length ? round1(avg(tasas)) : null;

  // Hábito de carga: días distintos con gasto por usuario en 30d.
  const diasPorUsuario = new Map<string, Set<string>>();
  for (const e of expenses) {
    if (!e.user_id || !e.date) continue;
    const dia = String(e.date).slice(0, 10);
    const set = diasPorUsuario.get(e.user_id) ?? new Set<string>();
    set.add(dia);
    diasPorUsuario.set(e.user_id, set);
  }
  const habitoFuerte = [...diasPorUsuario.values()].filter((s) => s.size >= 12).length;

  const salud = {
    presupuestosMesActual: budgets.filter((b) => String(b.month).slice(0, 10) === mesActual).length,
    tasaAhorroPromPct,
    objetivosCreados: goals.length,
    objetivosCumplidos: goals.filter((g) => Number(g.saved_amount) >= Number(g.target_amount)).length,
    habitoFuerte,
  };

  return {
    usuarios,
    actividad,
    adopcion,
    adherencia,
    salud,
    generadoEl: new Date(now).toISOString(),
  };
}

// ── helpers ─────────────────────────────────────────────────────────

function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}
function avg(arr: number[]): number {
  return arr.reduce((s, n) => s + n, 0) / arr.length;
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function propStr(props: unknown, key: string): string | null {
  if (props && typeof props === "object" && key in props) {
    const v = (props as Record<string, unknown>)[key];
    return typeof v === "string" ? v : null;
  }
  return null;
}
/** Cuenta sesiones distintas por `props.tipo` para un nombre de evento. */
function countBySesionYTipo(
  events: { name: string; session_id: string | null; props: unknown }[],
  name: string,
): Map<string, number> {
  const porTipo = new Map<string, Set<string>>();
  for (const e of events) {
    if (e.name !== name) continue;
    const tipo = propStr(e.props, "tipo");
    if (!tipo) continue;
    const set = porTipo.get(tipo) ?? new Set<string>();
    set.add(e.session_id ?? "?");
    porTipo.set(tipo, set);
  }
  const out = new Map<string, number>();
  for (const [tipo, set] of porTipo) out.set(tipo, set.size);
  return out;
}

function firstOfMonthISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
