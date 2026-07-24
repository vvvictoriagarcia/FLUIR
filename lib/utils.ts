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

/**
 * URL pública del sitio. Si la variable de entorno falta o quedó con un valor
 * de ejemplo (pasó en Netlify: "https://TU-SITIO.netlify.app"), usamos el
 * dominio real: si no, el sitemap y la tarjeta para compartir apuntan a la nada.
 */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw || /tu-sitio|localhost|127\.0\.0\.1|example\.com/i.test(raw)) {
    return "https://fluirargentina.com";
  }
  return raw.replace(/\/$/, "");
}

/**
 * Primera letra en mayúscula, respetando el resto.
 * Se aplica al MOSTRAR: el nombre se guarda tal como lo escribió la persona.
 * "victoria" → "Victoria" · "MARÍA josé" → "MARÍA josé" (no toca lo demás).
 */
export function capitalize(texto: string): string {
  if (!texto) return "";
  return texto.charAt(0).toLocaleUpperCase("es-AR") + texto.slice(1);
}
