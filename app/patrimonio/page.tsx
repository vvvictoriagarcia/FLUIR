"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
  const toast = useToast();
  const [r, setR] = useState<Resumen | null>(null);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const [dash, holdings, closed, history] = await Promise.all([
          loadDashboard(),
          loadHoldings(),
          loadClosedHoldings(),
          loadHistory(),
        ]);
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

  return (
    <div className="min-h-screen pb-24 md:pl-60">
      <div className="mx-auto max-w-xl px-5 py-6 lg:max-w-5xl">
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
            {/* Fila de métricas */}
            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
              <Metric
                icon={PiggyBank}
                label="Ahorro este mes"
                value={formatARS(r.ahorroMes)}
                accent="positive"
              />
              <Metric
                icon={Receipt}
                label="Gastado este mes"
                value={formatARS(r.gastadoMes)}
              />
              {r.tieneInversiones ? (
                <>
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
                </>
              ) : (
                <Link
                  href="/invertir"
                  className="col-span-2 flex items-center gap-3 rounded-card border border-gold/40 bg-gold/10 p-4 transition-colors hover:bg-gold/15"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold">
                    <TrendingUp size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      Hacé rendir lo que te sobra
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Empezá a invertir y seguilo desde acá
                    </p>
                  </div>
                  <ArrowRight className="ml-auto h-5 w-5 shrink-0 text-muted-foreground" />
                </Link>
              )}
            </div>

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

function AhorroMensual({ meses }: { meses: MonthSummary[] }) {
  // Del más viejo al más nuevo, últimos 6 meses.
  const datos = [...meses].reverse().slice(-6);
  const max = Math.max(...datos.map((m) => Math.max(m.saved, 0)), 1);

  return (
    <div className="mt-8">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Tu ahorro, mes a mes
      </h2>
      <div className="rounded-card border border-border bg-card p-5">
        <div className="flex items-end justify-between gap-2" style={{ height: 140 }}>
          {datos.map((m, i) => {
            const h = Math.max((Math.max(m.saved, 0) / max) * 100, 2);
            return (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  className={cn(
                    "w-full max-w-[40px] rounded-t-md",
                    m.saved >= 0 ? "bg-positive" : "bg-negative",
                  )}
                  title={formatARS(m.saved)}
                />
                <span className="text-[10px] text-muted-foreground">
                  {m.label.split(" ")[0].slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
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
