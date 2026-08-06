"use client";

// Alerta de desvío de presupuesto en el dashboard. Aparece SOLO cuando hay algo
// que avisar (si vas bien, no molesta). Voz Fluir: avisa, no reta.
// La lógica (qué categorías y por qué) vive en budgetAlerts(); acá solo el copy.

import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import type { BudgetAlert } from "@/lib/calculators/budget";
import { formatARS } from "@/lib/utils";

// Cuántas alertas mostramos antes de resumir el resto en "y N más".
const MAX_SHOWN = 2;

function title(a: BudgetAlert): string {
  return a.level === "over" ? `Te pasaste en ${a.category}` : `Vas rápido con ${a.category}`;
}

function detail(a: BudgetAlert): string {
  if (a.level === "over") {
    return `Llevás ${formatARS(a.used)} de ${formatARS(a.limit)} — ${formatARS(a.overBy)} de más.`;
  }
  return `A este ritmo terminás el mes en ~${formatARS(a.projected)} y tu límite es ${formatARS(a.limit)}.`;
}

export function BudgetAlerts({ alerts }: { alerts: BudgetAlert[] }) {
  if (alerts.length === 0) return null;

  const shown = alerts.slice(0, MAX_SHOWN);
  const rest = alerts.length - shown.length;
  // Si algo ya se pasó, el tono es rojo; si es solo cuestión de ritmo, ámbar.
  const severe = alerts.some((a) => a.level === "over");

  const tone = severe
    ? "border-negative/30 bg-negative/[0.06]"
    : "border-warning/30 bg-warning/[0.07]";
  const iconColor = severe ? "text-negative" : "text-warning";

  return (
    <div
      role="status"
      className={`mb-5 rounded-card border p-4 ${tone}`}
    >
      <div className="flex gap-3">
        <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} />
        <div className="min-w-0 flex-1">
          <ul className="space-y-2">
            {shown.map((a) => (
              <li key={a.category}>
                <p className="text-sm font-medium">{title(a)}</p>
                <p className="text-xs text-muted-foreground">{detail(a)}</p>
              </li>
            ))}
          </ul>

          {rest > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              y {rest} categoría{rest > 1 ? "s" : ""} más para vigilar.
            </p>
          )}

          <Link
            href="/perfil/presupuesto"
            className="mt-2.5 inline-flex items-center gap-0.5 text-xs font-medium text-brand transition-opacity hover:opacity-80"
          >
            Ajustar mis límites
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
