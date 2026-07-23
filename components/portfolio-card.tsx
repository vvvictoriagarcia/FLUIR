"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { ChevronRight, TrendingUp } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";
import {
  loadHoldings,
  fetchPrices,
  valuate,
  totals,
  aDolares,
  type ValuedHolding,
  type Prices,
} from "@/lib/portfolio";
import { formatARS, cn } from "@/lib/utils";

// Paleta ámbar/oro: es el color del tier Gold, y así la cartera se distingue
// de un vistazo del resto del dashboard (que es violeta).
const COLORES = ["#F0B429", "#F4A261", "#E9C46A", "#D97706", "#FBBF24", "#B45309"];

/**
 * Tarjeta de inversiones en el inicio, solo para Gold: cuánto vale la cartera,
 * cuánto ganaste y en qué está repartida.
 */
export function PortfolioCard() {
  const { isGold, loading: cargandoPlan } = usePlan();
  const [valued, setValued] = useState<ValuedHolding[] | null>(null);
  const [prices, setPrices] = useState<Prices | null>(null);

  useEffect(() => {
    if (!isGold) return;
    let activo = true;
    (async () => {
      try {
        const [holdings, p] = await Promise.all([loadHoldings(), fetchPrices()]);
        if (!activo) return;
        setPrices(p);
        setValued(valuate(holdings, p));
      } catch {
        if (activo) setValued([]);
      }
    })();
    return () => {
      activo = false;
    };
  }, [isGold]);

  if (cargandoPlan || !isGold || valued === null) return null;

  // Sin tenencias: invitamos a cargarlas, sin ocupar medio dashboard.
  if (valued.length === 0) {
    return (
      <Link
        href="/invertir/cartera"
        className="mt-4 flex items-center gap-3 rounded-card border border-gold/40 bg-gold/10 p-4 transition-colors hover:bg-gold/15"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold">
          <TrendingUp size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium">Cargá tus inversiones</p>
          <p className="text-xs text-muted-foreground">
            Mirá cuánto vale hoy tu cartera y cuánto ganaste
          </p>
        </div>
        <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-muted-foreground" />
      </Link>
    );
  }

  const t = totals(valued);
  const gana = t.ganancia >= 0;

  const data = [...valued]
    .sort((a, b) => b.valor - a.valor)
    .map((h) => ({ name: h.ticker, value: h.valor }));

  const top = data.slice(0, 4);
  const resto = data.slice(4);
  const grafico = resto.length
    ? [...top, { name: "Otros", value: resto.reduce((s, d) => s + d.value, 0) }]
    : top;

  return (
    <Link
      href="/invertir/cartera"
      className="mt-4 block rounded-card border border-gold/40 bg-gold/5 p-4 transition-colors hover:bg-gold/10"
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <TrendingUp size={15} className="text-gold" />
          Tus inversiones
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="mt-3 flex items-center gap-4">
        <div className="h-24 w-24 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={grafico}
                dataKey="value"
                nameKey="name"
                innerRadius={28}
                outerRadius={46}
                paddingAngle={2}
                stroke="none"
              >
                {grafico.map((d, i) => (
                  <Cell key={d.name} fill={COLORES[i % COLORES.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-display text-2xl font-semibold tabular-nums">
            {formatARS(t.valor)}
          </p>
          <p
            className={cn(
              "text-sm font-medium tabular-nums",
              gana ? "text-positive" : "text-negative",
            )}
          >
            {gana ? "▲" : "▼"} {formatARS(Math.abs(t.ganancia))} (
            {gana ? "+" : ""}
            {t.gananciaPct.toFixed(1)}%)
          </p>
          {prices?.dolar.mep ? (
            <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
              US$ {aDolares(t.valor, prices).toLocaleString("es-AR", {
                maximumFractionDigits: 0,
              })}{" "}
              al MEP
            </p>
          ) : null}
        </div>
      </div>

      {/* Composición: qué pesa más en la cartera */}
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
        {grafico.map((d, i) => (
          <span
            key={d.name}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: COLORES[i % COLORES.length] }}
            />
            {d.name} {Math.round((d.value / t.valor) * 100)}%
          </span>
        ))}
      </div>
    </Link>
  );
}
