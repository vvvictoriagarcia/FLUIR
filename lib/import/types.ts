// ─────────────────────────────────────────────────────────────────
// FLUIR — Motor de ingesta: esquema único de movimiento
// Todo input (CSV de banco, foto de resumen) termina en `Movement`.
// El mismo esquema sirve después para tenencias del broker (fase 4).
// ─────────────────────────────────────────────────────────────────

export type Currency = "ARS" | "USD";

export type CategoryMethod = "override" | "rule" | "ai" | "none";

export type ImportSource = "csv" | "image";

/** Lo que sale crudo del parser/visión, antes de normalizar. */
export interface RawMovement {
  fecha: string;
  comercio: string;
  monto: string | number;
  moneda?: string | null;
}

/** Movimiento normalizado y categorizado, listo para revisar/guardar. */
export interface Movement {
  date: string; // ISO "yyyy-mm-dd"
  merchant: string; // texto para mostrar
  merchantNorm: string; // normalizado (para reglas, overrides y dedup)
  amount: number; // siempre positivo (monto del gasto)
  currency: Currency;
  category: string | null; // categoría del usuario, o null si ambigua
  categoryMethod: CategoryMethod;
  dedupKey: string;
}

export interface ParseResult {
  movements: Movement[];
  warnings: string[];
}
