// ─────────────────────────────────────────────────────────────────
// FLUIR — Motor de ingesta: ensamblado
// RawMovement[] (de CSV o visión) → Movement[] normalizados, categorizados
// y sin duplicados dentro del lote. Agnóstico al origen.
// ─────────────────────────────────────────────────────────────────

import type { Movement, ParseResult, RawMovement } from "./types";
import {
  parseAmount,
  parseCurrency,
  parseDateISO,
  normalizeMerchant,
  dedupKey,
  looksLikeCredit,
} from "./normalize";
import { categorize } from "./categorize";

export interface BuildOptions {
  userCategories: string[];
  overrides?: Record<string, string>;
  today?: Date;
}

/** Convierte movimientos crudos en movimientos listos para revisar. */
export function buildMovements(
  raws: RawMovement[],
  opts: BuildOptions
): ParseResult {
  const { userCategories, overrides = {}, today } = opts;
  const warnings: string[] = [];
  const seen = new Set<string>();
  const movements: Movement[] = [];
  let credits = 0;

  for (const raw of raws) {
    const date = parseDateISO(String(raw.fecha), today);
    if (!date) continue; // sin fecha válida, no es un movimiento

    // Ignoramos créditos/ingresos: el motor de gastos trackea débitos.
    if (looksLikeCredit(raw.monto)) {
      credits++;
      continue;
    }

    const amount = parseAmount(raw.monto);
    if (amount <= 0) continue;

    const merchant = String(raw.comercio).trim() || "Sin descripción";
    const merchantNorm = normalizeMerchant(merchant);
    const key = dedupKey(date, amount, merchantNorm);
    if (seen.has(key)) continue; // duplicado dentro del mismo archivo
    seen.add(key);

    const { category, method } = categorize(merchantNorm, userCategories, overrides);

    movements.push({
      date,
      merchant,
      merchantNorm,
      amount,
      currency: parseCurrency(raw.moneda),
      category,
      categoryMethod: method,
      dedupKey: key,
    });
  }

  if (credits > 0) {
    warnings.push(
      `Salteamos ${credits} movimiento${credits > 1 ? "s" : ""} que parecen ingresos o créditos.`
    );
  }

  // Más nuevos primero.
  movements.sort((a, b) => b.date.localeCompare(a.date));
  return { movements, warnings };
}
