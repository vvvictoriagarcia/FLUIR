/**
 * Datos de contacto de Fluir — fuente única de verdad.
 *
 * Si cambia el mail de soporte o el usuario de Instagram, se cambia SOLO acá:
 * lo usan las páginas legales, /contacto, el footer de la landing y los toasts
 * de error.
 */

/** Mail de soporte, reclamos y ejercicio de derechos (Ley 25.326). */
export const SUPPORT_EMAIL = "infofluirargentina@gmail.com";

/** Link `mailto:` con asunto prellenado. */
export function mailto(subject: string) {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

/** Plazo de respuesta que prometemos públicamente. */
export const RESPONSE_TIME = "72 horas hábiles";

/** Instagram. `null` mientras no exista la cuenta (no se muestra el link). */
export const INSTAGRAM_HANDLE: string | null = null;

export const INSTAGRAM_URL = INSTAGRAM_HANDLE
  ? `https://instagram.com/${INSTAGRAM_HANDLE}`
  : null;
