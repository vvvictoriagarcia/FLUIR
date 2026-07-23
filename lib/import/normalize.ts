// ─────────────────────────────────────────────────────────────────
// FLUIR — Motor de ingesta: normalización
// Fechas a ISO, montos AR a número, comercio limpio, clave de dedup.
// ─────────────────────────────────────────────────────────────────

import type { Currency } from "./types";

/**
 * Parsea un monto en formatos argentinos y varios:
 *  "1.234,56"  "$ 1.234,56"  "-1.234,56"  "1.234,56-"  "(1.234,56)"  "1234.56"
 * Devuelve SIEMPRE el valor absoluto (el signo se maneja aparte).
 */
export function parseAmount(raw: string | number): number {
  if (typeof raw === "number") return Math.abs(raw);

  let s = raw.trim();
  if (!s) return 0;

  // ¿Negativo? (signo o paréntesis contable)
  const negative = /^-|-$|^\(.*\)$/.test(s);

  // Sacar todo lo que no sea dígito, coma o punto.
  s = s.replace(/[^0-9.,]/g, "");
  if (!s) return 0;

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");

  if (lastComma !== -1 && lastDot !== -1) {
    // El separador que aparece último es el decimal.
    if (lastComma > lastDot) {
      // formato AR: 1.234,56 → miles '.', decimal ','
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      // formato US: 1,234.56 → miles ',', decimal '.'
      s = s.replace(/,/g, "");
    }
  } else if (lastComma !== -1) {
    // Solo coma: decimal si quedan 1-2 dígitos después, si no es separador de miles.
    const decimals = s.length - lastComma - 1;
    s = decimals <= 2 ? s.replace(",", ".") : s.replace(/,/g, "");
  } else if (lastDot !== -1) {
    // Solo punto: mismo criterio.
    const decimals = s.length - lastDot - 1;
    s = decimals <= 2 ? s : s.replace(/\./g, "");
  }

  const n = Number(s);
  if (!Number.isFinite(n)) return 0;
  return negative ? Math.abs(n) : n;
}

/** True si el texto del monto parece un crédito/ingreso (para avisar, no gasto). */
export function looksLikeCredit(raw: string | number): boolean {
  if (typeof raw === "number") return raw < 0;
  return /^-|-$|^\(.*\)$|cr[ée]dito|haber|acreditaci/i.test(raw.trim());
}

const MONTHS: Record<string, number> = {
  ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6,
  jul: 7, ago: 8, sep: 9, oct: 10, nov: 11, dic: 12,
};

/**
 * Devuelve la fecha en ISO "yyyy-mm-dd" desde varios formatos:
 *  dd/mm/yyyy · dd-mm-yy · yyyy-mm-dd · dd/mm · "12 ago 2026" · "12 ago"
 * Si no puede, devuelve "" (el que llama decide qué hacer).
 */
export function parseDateISO(raw: string, today = new Date()): string {
  const s = String(raw).trim().toLowerCase();
  if (!s) return "";

  // yyyy-mm-dd (ya ISO, o con /)
  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) return iso(+m[1], +m[2], +m[3]);

  // dd/mm/yyyy o dd-mm-yyyy o dd/mm/yy o dd/mm
  m = s.match(/^(\d{1,2})[-/](\d{1,2})(?:[-/](\d{2,4}))?/);
  if (m) {
    const yr = m[3] ? normYear(+m[3]) : today.getFullYear();
    return iso(yr, +m[2], +m[1]);
  }

  // "12 ago 2026" | "12 ago" | "12 de ago"
  m = s.match(/^(\d{1,2})\s*(?:de\s+)?([a-záéíóú]{3})[a-záéíóú]*\.?(?:\s+(\d{4}))?/);
  if (m) {
    const mon = MONTHS[m[2].slice(0, 3)];
    if (mon) return iso(m[3] ? +m[3] : today.getFullYear(), mon, +m[1]);
  }

  return "";
}

function normYear(y: number): number {
  return y < 100 ? 2000 + y : y;
}

function iso(y: number, mo: number, d: number): string {
  if (!y || !mo || !d || mo > 12 || d > 31) return "";
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Detecta ARS/USD desde el texto de la moneda o del monto. Default ARS. */
export function parseCurrency(raw?: string | null): Currency {
  if (!raw) return "ARS";
  return /usd|u\$s|d[óo]lar|\bus\b/i.test(raw) ? "USD" : "ARS";
}

/**
 * Normaliza el nombre del comercio para reglas, overrides y dedup:
 * minúsculas, sin acentos, sin máscaras de tarjeta ni ruido, espacios colapsados.
 */
export function normalizeMerchant(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // saca acentos (marcas combinantes)
    .replace(/\b(compra|pago|debito|d[eé]bito|con tarjeta|tarjeta|cuota\s*\d+\/\d+)\b/g, " ")
    .replace(/\*+\d+/g, " ") // *1234 máscaras
    .replace(/\b\d{4,}\b/g, " ") // números largos sueltos
    .replace(/[^a-z0-9\s]/g, " ") // símbolos
    .replace(/\s+/g, " ")
    .trim();
}

/** Clave idempotente para no re-cargar el mismo movimiento. */
export function dedupKey(
  dateISO: string,
  amount: number,
  merchantNorm: string
): string {
  return `${dateISO}|${Math.round(amount * 100)}|${merchantNorm}`;
}
