/**
 * Lee el `?next=` de la URL para volver a donde la persona estaba antes de
 * mandarla a crear cuenta (p. ej. iba a suscribirse y la interrumpimos).
 *
 * Solo acepta rutas internas: nada de `http://…` ni `//otro-sitio` — si no,
 * un link armado por un tercero podría usar Fluir para redirigir a cualquier
 * lado después del login.
 */
export function readNext(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const raw = new URLSearchParams(window.location.search).get("next");
  return safeNext(raw, fallback);
}

export function safeNext(raw: string | null | undefined, fallback: string): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}

/**
 * Devuelve el `next` actual de la URL (validado) o null si no hay. Sirve para
 * reenlazarlo al pasar de /login a /register (y viceversa), así no se pierde el
 * destino cuando alguien venía interrumpido de /planes, notificaciones, etc.
 */
export function currentNextParam(): string | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("next");
  const safe = safeNext(raw, "");
  return safe || null;
}

/** Une un path de auth con el `next` actual, si lo hay. Ej: "/login?next=%2Fplanes". */
export function withNext(path: string): string {
  const next = currentNextParam();
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}
