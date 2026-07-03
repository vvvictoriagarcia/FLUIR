import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Compone clases de Tailwind resolviendo conflictos (p. ej. px-2 + px-4 → px-4). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatea un monto en pesos argentinos: 400000 → "$400.000". */
export function formatARS(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}
