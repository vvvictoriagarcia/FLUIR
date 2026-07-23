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
