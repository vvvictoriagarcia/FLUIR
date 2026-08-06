import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadAdminMetrics } from "@/lib/admin/metrics";

// Panel interno de métricas. NO indexable, gateado por email.
// Acceso: la sesión tiene que estar en ADMIN_EMAILS (env, separado por comas).
// Sin ADMIN_EMAILS nadie entra (cerrado por defecto).
export const dynamic = "force-dynamic";

function esAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  const lista = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return lista.includes(email.toLowerCase());
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Puerta: si no sos admin, la página no existe (no filtramos que existe).
  if (!esAdmin(user?.email)) notFound();

  const m = await loadAdminMetrics();

  if (!m) {
    return (
      <Shell>
        <div className="rounded-card border border-warning/40 bg-warning/10 p-5">
          <p className="font-medium">Falta configurar el acceso a los datos</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cargá <code>SUPABASE_SERVICE_ROLE_KEY</code> en las variables de
            entorno para que el panel pueda leer las métricas.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell generadoEl={m.generadoEl}>
      {/* Usuarios */}
      <Section title="Usuarios">
        <Cards>
          <Stat label="Total" value={m.usuarios.total} />
          <Stat label="Altas (7 días)" value={m.usuarios.altas7} />
          <Stat label="Altas (30 días)" value={m.usuarios.altas30} />
          <Stat label="Gold / Pro" value={`${m.usuarios.gold} / ${m.usuarios.plus}`} />
        </Cards>
      </Section>

      {/* Actividad */}
      <Section title="Actividad">
        <Cards>
          <Stat label="Visitas (7 días)" value={m.actividad.visitas7} />
          <Stat label="Visitas (30 días)" value={m.actividad.visitas30} />
          <Stat label="Usuarios activos (7 días)" value={m.actividad.activos7} />
          <Stat label="Usuarios activos (30 días)" value={m.actividad.activos30} />
        </Cards>
      </Section>

      {/* Salud financiera */}
      <Section title="Salud financiera">
        <Cards>
          <Stat
            label="Tasa de ahorro promedio"
            value={m.salud.tasaAhorroPromPct === null ? "—" : `${m.salud.tasaAhorroPromPct}%`}
          />
          <Stat label="Presupuestos este mes" value={m.salud.presupuestosMesActual} />
          <Stat
            label="Objetivos cumplidos"
            value={`${m.salud.objetivosCumplidos} / ${m.salud.objetivosCreados}`}
          />
          <Stat label="Hábito fuerte (≥3 días/sem)" value={m.salud.habitoFuerte} />
        </Cards>
      </Section>

      {/* Adopción de herramientas */}
      <Section title="Adopción de herramientas (30 días)">
        {m.adopcion.length === 0 ? (
          <Vacio />
        ) : (
          <Tabla
            cols={["Herramienta", "Usos", "Usuarios"]}
            rows={m.adopcion.map((a) => [a.feature, String(a.usos), String(a.usuarios)])}
          />
        )}
      </Section>

      {/* Adherencia a sugerencias */}
      <Section title="Adherencia a sugerencias (30 días)">
        {m.adherencia.length === 0 ? (
          <Vacio />
        ) : (
          <Tabla
            cols={["Sugerencia", "Vieron", "Siguieron", "Adherencia"]}
            rows={m.adherencia.map((a) => [
              a.tipo,
              String(a.vieron),
              String(a.siguieron),
              a.pct === null ? "—" : `${a.pct}%`,
            ])}
          />
        )}
      </Section>
    </Shell>
  );
}

// ── UI ──────────────────────────────────────────────────────────────

function Shell({ children, generadoEl }: { children: React.ReactNode; generadoEl?: string }) {
  return (
    <div className="min-h-screen px-5 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-semibold">Panel Fluir</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Métricas de uso y salud financiera.
          {generadoEl && ` Actualizado ${new Date(generadoEl).toLocaleString("es-AR")}.`}
        </p>
        <div className="mt-6 space-y-8">{children}</div>
        <p className="mt-10 text-xs text-muted-foreground">
          Para cortes más finos (retención por cohorte, tendencias mes a mes),
          usá las consultas de <code>supabase/analytics_queries.sql</code> en el
          SQL Editor.
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Cards({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{children}</div>;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-card border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Tabla({ cols, rows }: { cols: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-card border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            {cols.map((c) => (
              <th key={c} className="px-4 py-2.5 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border last:border-b-0">
              {r.map((cell, j) => (
                <td key={j} className={`px-4 py-2.5 ${j === 0 ? "font-medium" : "tabular-nums"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Vacio() {
  return (
    <p className="rounded-card border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
      Todavía no hay datos.
    </p>
  );
}
