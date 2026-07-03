import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Compone clases de Tailwind resolviendo conflictos (p. ej. px-2 + px-4 → px-4). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un monto en pesos argentinos con separador AR ($1.234.567,89).
 * - decimals "auto" (default): muestra centavos solo si el monto los tiene.
 * - compact: números grandes como "$1,2 M" para que no rompan el layout.
 */
export function formatARS(
  amount: number,
  opts: { decimals?: boolean | "auto"; compact?: boolean } = {}
): string {
  const { compact = false } = opts;
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);

  if (compact && abs >= 1_000_000) {
    const millones = new Intl.NumberFormat("es-AR", {
      maximumFractionDigits: 1,
    }).format(abs / 1_000_000);
    return `${sign}$${millones} M`;
  }

  const withCents =
    opts.decimals === "auto" || opts.decimals === undefined
      ? Math.round(abs * 100) % 100 !== 0
      : opts.decimals;

  const body = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: withCents ? 2 : 0,
    maximumFractionDigits: withCents ? 2 : 0,
  }).format(abs);

  return `${sign}$${body}`;
}
