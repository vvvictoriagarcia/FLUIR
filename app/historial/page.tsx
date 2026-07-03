"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, PiggyBank } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { PlanGate } from "@/components/gates/plan-gate";
import { ThemeToggle } from "@/components/theme-toggle";
import { loadHistory, type MonthSummary } from "@/lib/data";
import { formatARS, cn } from "@/lib/utils";

export default function HistorialPage() {
  return (
    <div className="min-h-screen pb-24">
      <div className="mx-auto max-w-xl px-5 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Inicio
          </Link>
          <ThemeToggle />
        </div>

        <PlanGate
          need="plus"
          feature="Tu historial mes a mes"
          benefits={[
            "Mirá cómo evolucionó tu plata cada mes",
            "Compará meses y detectá tendencias",
            "Descubrí en qué se te va la plata a lo largo del tiempo",
          ]}
        >
          <HistorialContent />
        </PlanGate>
      </div>

      <BottomNav />
    </div>
  );
}

function HistorialContent() {
  const [months, setMonths] = useState<MonthSummary[] | null>(null);

  useEffect(() => {
    loadHistory().then(setMonths);
  }, []);

  if (months === null) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-card border border-border bg-card"
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display text-3xl font-semibold">Tu historial</h1>
      <p className="mt-1 mb-6 text-muted-foreground">
        Mes a mes, cómo venís con tu plata.
      </p>

      {months.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {months.map((m, i) => (
            <MonthCard
              key={m.month}
              month={m}
              prev={months[i + 1] ?? null}
              index={i}
            />
          ))}
        </div>
      )}
    </>
  );
}

function MonthCard({
  month,
  prev,
  index,
}: {
  month: MonthSummary;
  prev: MonthSummary | null;
  index: number;
}) {
  const saved = month.saved;
  const positive = saved >= 0;

  // Comparativa de gasto vs el mes anterior (más viejo).
  const delta =
    prev && prev.spent > 0 ? (month.spent - prev.spent) / prev.spent : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-card border border-border bg-card p-5"
    >
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold capitalize">
          {month.label}
        </h2>
        {delta !== null && <DeltaBadge delta={delta} />}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <Stat label="Ingreso" value={formatARS(month.income)} />
        <Stat label="Gastado" value={formatARS(month.spent)} />
        <Stat
          label={positive ? "Ahorrado" : "Te pasaste"}
          value={formatARS(Math.abs(saved))}
          tone={positive ? "positive" : "negative"}
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <PiggyBank size={15} />
          {month.income > 0
            ? `${Math.round(month.savedPct * 100)}% de tu ingreso`
            : "—"}
        </span>
        {month.topCategory && (
          <span className="text-muted-foreground">
            Top:{" "}
            <span className="font-medium text-foreground">
              {month.topCategory.category}
            </span>
          </span>
        )}
      </div>
    </motion.div>
  );
}

function DeltaBadge({ delta }: { delta: number }) {
  const pct = Math.round(Math.abs(delta) * 100);
  const flat = pct < 1;
  const up = delta > 0;
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
  // Gastar MENOS que el mes anterior es bueno (verde).
  const tone = flat
    ? "text-muted-foreground"
    : up
      ? "text-negative"
      : "text-positive";

  return (
    <span className={cn("flex items-center gap-1 text-xs font-medium", tone)}>
      <Icon size={14} />
      {flat ? "igual" : `${pct}% ${up ? "más" : "menos"}`}
    </span>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}) {
  return (
    <div>
      <p
        className={cn(
          "font-display text-base font-semibold tabular-nums",
          tone === "positive" && "text-positive",
          tone === "negative" && "text-negative"
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-card border border-dashed border-border bg-card/50 p-8 text-center">
      <p className="font-medium">Todavía no hay meses cerrados</p>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Tu historial se va a ir llenando a medida que cierres cada mes. Volvé el
        mes que viene y vas a ver cómo evoluciona tu plata.
      </p>
    </div>
  );
}
