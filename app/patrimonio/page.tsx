"use client";

import { useEffect, useState } from "react";
import { useTrackFeature } from "@/lib/analytics";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Receipt,
  Target,
  PiggyBank,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { BottomNav } from "@/components/bottom-nav";
import { useToast } from "@/components/toast";
import {
  loadDashboard,
  loadHistory,
  type MonthSummary,
} from "@/lib/data";
import { loadSavingsBalance, saveSavingsBalance } from "@/lib/profile";
import {
  loadHoldings,
  loadClosedHoldings,
  fetchPrices,
  valuate,
  totals,
  realizedTotal,
  aDolares,
  type Prices,
} from "@/lib/portfolio";
import { spentByCategory } from "@/lib/budget-store";
import { formatARS, cn } from "@/lib/utils";

interface Resumen {
  ahorroMes: number;
  gastadoMes: number;
  invValor: number;
  noRealizada: number;
  realizada: number;
  prices: Prices | null;
  meses: MonthSummary[];
  tieneInversiones: boolean;
}

export default function PatrimonioPage() {
  useTrackFeature("patrimonio");
  const toast = useToast();
  const [r, setR] = useState<Resumen | null>(null);
  const [ahorros, setAhorros] = useState<number | null>(null);
  const [editando, setEditando] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const [dash, holdings, closed, history, saldo] = await Promise.all([
          loadDashboard(),
          loadHoldings(),
          loadClosedHoldings(),
          loadHistory(),
          loadSavingsBalance(),
        ]);
        if (activo) setAhorros(saldo);
        const prices = holdings.length
          ? await fetchPrices(holdings.map((h) => h.ticker))
          : null;
        if (!activo) return;

        const valued = valuate(holdings, prices);
        const tot = totals(valued);
        const spent = spentByCategory(dash.expenses);
        const gastadoMes = Object.values(spent).reduce((s, v) => s + v, 0);

        setR({
          ahorroMes: dash.budget?.result.total_savings ?? 0,
          gastadoMes,
          invValor: tot.valor,
          noRealizada: tot.ganancia,
          realizada: realizedTotal(closed),
          prices,
          meses: history,
          tieneInversiones: holdings.length > 0 || closed.length > 0,
        });
      } catch {
        if (activo) toast("No pudimos cargar tu patrimonio.", "error");
      }
    })();
    return () => {
      activo = false;
    };
  }, [toast]);

  async function guardarAhorros() {
    const monto = Number(input.replace(/\D/g, ""));
    setAhorros(monto);
    setEditando(false);
    const ok = await saveSavingsBalance(monto);
    if (!ok) toast("No pudimos guardar. Probá de nuevo.", "error");
  }

  return (
    <div className="min-h-screen pb-24 md:pl-60">
      <div className="mx-auto max-w-xl px-5 py-6 lg:max-w-6xl lg:px-8 xl:max-w-[1400px]">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/inicio"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground md:hidden"
          >
            <ArrowLeft size={16} />
            Inicio
          </Link>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <h1 className="font-display text-3xl font-semibold lg:text-4xl">
          Cómo va tu plata
        </h1>
        <p className="mt-1 text-muted-foreground">
          Todo junto: lo que ahorrás, lo que gastás y lo que invertís.
        </p>

        {/* Mis ahorros — saldo editable, arranca de lo que ya tenías */}
        <div className="mt-6 rounded-card border border-border bg-card p-5">
          {editando ? (
            <div>
              <label className="text-sm text-muted-foreground">
                ¿Cuánto tenés ahorrado en total?
              </label>
              <div className="mt-1.5 flex items-center gap-2 rounded-2xl border-2 border-brand bg-background p-3">
                <span className="font-display text-xl text-muted-foreground">$</span>
                <input
                  autoFocus
                  inputMode="numeric"
                  value={
                    input ? Number(input.replace(/\D/g, "")).toLocaleString("es-AR") : ""
                  }
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent font-display text-xl font-semibold tabular-nums outline-none placeholder:text-muted-foreground/40"
                />
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setEditando(false)}
                  className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarAhorros}
                  className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
                >
                  Guardar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <PiggyBank size={14} />
                  Mis ahorros
                </p>
                <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
                  {ahorros === null ? "—" : formatARS(ahorros)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Poné acá lo que ya tenías guardado. Ajustalo cuando quieras.
                </p>
              </div>
              <button
                onClick={() => {
                  setInput(ahorros ? String(ahorros) : "");
                  setEditando(true);
                }}
                className="shrink-0 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                {ahorros ? "Ajustar" : "Cargar"}
              </button>
            </div>
          )}
          {/* Patrimonio total: ahorros + inversiones, para unir las dos patas */}
          {!editando && ahorros !== null && r !== null && r.invValor > 0 && (
            <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
              Con tus inversiones, tu patrimonio es{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {formatARS(ahorros + r.invValor)}
              </span>
            </p>
          )}
        </div>

        {r === null ? (
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-card border border-border bg-card"
              />
            ))}
          </div>
        ) : (
          <>
            {/* Este mes — flujos del mes (entra/sale), separados del saldo */}
            <h2 className="mt-8 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Este mes
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:gap-4">
              <Metric
                icon={PiggyBank}
                label="Ahorrás este mes"
                value={formatARS(r.ahorroMes)}
                accent="positive"
              />
              <Metric
                icon={Receipt}
                label="Gastado este mes"
                value={formatARS(r.gastadoMes)}
              />
            </div>

            {/* Tus inversiones */}
            <h2 className="mt-8 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tus inversiones
            </h2>
            {r.tieneInversiones ? (
              <div className="grid grid-cols-2 gap-3 lg:gap-4">
                <Metric
                  icon={TrendingUp}
                  label="Invertido"
                  value={formatARS(r.invValor)}
                  sub={
                    r.prices?.dolar.mep
                      ? `US$ ${aDolares(r.invValor, r.prices).toLocaleString("es-AR", { maximumFractionDigits: 0 })}`
                      : undefined
                  }
                />
                <Metric
                  icon={TrendingUp}
                  label="Lo que generó tu plata"
                  value={`${r.noRealizada + r.realizada >= 0 ? "+" : "−"}${formatARS(Math.abs(r.noRealizada + r.realizada))}`}
                  accent={r.noRealizada + r.realizada >= 0 ? "positive" : "negative"}
                  sub={
                    r.realizada !== 0
                      ? `${formatARS(r.realizada)} ya cobrado`
                      : "en inversiones"
                  }
                />
              </div>
            ) : (
              <Link
                href="/invertir"
                className="flex items-center gap-3 rounded-card border border-gold/40 bg-gold/10 p-4 transition-colors hover:bg-gold/15"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold">
                  <TrendingUp size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">Hacé rendir lo que te sobra</p>
                  <p className="text-xs text-muted-foreground">
                    Empezá a invertir y seguilo desde acá
                  </p>
                </div>
                <ArrowRight className="ml-auto h-5 w-5 shrink-0 text-muted-foreground" />
              </Link>
            )}

            {/* Ahorro mes a mes */}
            {r.meses.length > 0 && (
              <>
                <AhorroMensual meses={r.meses} />
                <Link
                  href="/historial"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand"
                >
                  Ver el detalle mes a mes
                  <ArrowRight size={13} />
                </Link>
              </>
            )}

            {/* Accesos a cada parte */}
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Acceso
                href="/gastos"
                icon={Receipt}
                title="Tus gastos"
                desc="En qué se te va la plata"
              />
              <Acceso
                href="/invertir/cartera"
                icon={TrendingUp}
                title="Tu cartera"
                desc="Cuánto valen tus inversiones"
              />
              <Acceso
                href="/objetivos"
                icon={Target}
                title="Tus objetivos"
                desc="Cuánto te falta para tus metas"
              />
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  sub?: string;
  accent?: "positive" | "negative";
}) {
  const color =
    accent === "positive"
      ? "text-positive"
      : accent === "negative"
        ? "text-negative"
        : "";
  return (
    <div className="rounded-card border border-border bg-card p-4">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon size={13} />
        {label}
      </p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${color}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground tabular-nums">{sub}</p>}
    </div>
  );
}

/** Monto corto para las etiquetas del gráfico: $489k, $1,2M, $0. */
function compactARS(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1).replace(".", ",").replace(",0", "")}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}k`;
  return `${sign}$${Math.round(abs)}`;
}

function AhorroMensual({ meses }: { meses: MonthSummary[] }) {
  // Del más viejo al más nuevo, últimos 6 meses.
  const datos = [...meses].reverse().slice(-6);
  const max = Math.max(...datos.map((m) => Math.max(m.saved, 0)), 1);
  // Mes con más ahorro (para destacarlo) y total del período (para motivar).
  const mejorIdx = datos.reduce(
    (best, m, i) => (m.saved > datos[best].saved ? i : best),
    0,
  );
  const total = datos.reduce((s, m) => s + Math.max(m.saved, 0), 0);
  const positivos = datos.filter((m) => m.saved > 0).length;
  // Altura del riel en px. Usamos px (no %) porque framer-motion no interpola
  // bien hacia "100%" y la barra quedaba en 0 (ese era el gráfico vacío).
  const TRACK_H = 124;

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Tu ahorro, mes a mes
        </h2>
        {total > 0 && (
          <span className="text-xs text-muted-foreground">
            Juntaste{" "}
            <span className="font-semibold text-positive tabular-nums">
              {formatARS(total)}
            </span>{" "}
            💪
          </span>
        )}
      </div>

      <div className="rounded-card border border-border bg-card p-5">
        <div className="flex items-end justify-between gap-2 sm:gap-4">
          {datos.map((m, i) => {
            const positivo = m.saved >= 0;
            const hPx = Math.max((Math.max(m.saved, 0) / max) * TRACK_H, positivo ? 6 : 0);
            const esMejor = i === mejorIdx && m.saved > 0;
            return (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                {/* Valor arriba de la barra */}
                <span
                  className={cn(
                    "text-[10px] font-semibold tabular-nums sm:text-xs",
                    esMejor ? "text-positive" : "text-muted-foreground",
                  )}
                >
                  {esMejor && "⭐ "}
                  {compactARS(m.saved)}
                </span>

                {/* Riel de altura fija: la barra usa altura en px (no %, ni
                    animación de height por framer) para que SIEMPRE se vea, aun
                    si la pestaña no está pintando frames. La vida la pone la
                    animación CSS `grow-bar` (crece desde abajo; si no corre,
                    igual queda a su altura final). */}
                <div className="flex w-full items-end justify-center" style={{ height: TRACK_H }}>
                  <div
                    style={{ height: hPx }}
                    className={cn(
                      "grow-bar w-full max-w-[46px] origin-bottom rounded-t-lg transition-transform hover:scale-y-105",
                      !positivo
                        ? "bg-negative/80"
                        : esMejor
                          ? "bg-gradient-to-t from-positive to-positive/50 ring-2 ring-positive/30"
                          : "bg-gradient-to-t from-positive/80 to-positive/40",
                    )}
                    title={formatARS(m.saved)}
                  />
                </div>

                {/* Mes */}
                <span
                  className={cn(
                    "text-[10px] capitalize sm:text-xs",
                    esMejor ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {m.label.split(" ")[0].slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>

        {positivos >= 2 && (
          <p className="mt-4 border-t border-border pt-3 text-center text-xs text-muted-foreground">
            {datos[datos.length - 1].saved >= datos[mejorIdx].saved
              ? "¡Vas en tu mejor momento! Seguí así 🚀"
              : `Tu récord fue en ${datos[mejorIdx].label.split(" ")[0]}. ¿Lo superás este mes?`}
          </p>
        )}
      </div>
    </div>
  );
}

function Acceso({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-card border border-border bg-card p-4 transition-colors hover:bg-muted"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{desc}</p>
      </div>
      <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
