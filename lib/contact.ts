/**
 * Datos de contacto de Fluir — fuente única de verdad.
 *
 * Si cambia el mail, el WhatsApp o el Instagram, se cambia SOLO acá: lo usan
 * las páginas legales, /contacto, el footer de la landing y los toasts de error.
 *
 * Criterio: la dirección de mail NO se muestra escrita en pantalla (queda más
 * prolijo y evita que se lea "gmail"); se linkea con un texto tipo
 * "Escribinos por mail" y el `mailto:` hace el resto.
 */

/** Mail de soporte, reclamos y ejercicio de derechos (Ley 25.326). */
export const SUPPORT_EMAIL = "infofluirargentina@gmail.com";

/** Link `mailto:` con asunto prellenado. */
export function mailto(subject: string) {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

/** WhatsApp de soporte, como lo escribe la gente. */
export const WHATSAPP_DISPLAY = "11 7826-6423";

/** El mismo número en formato internacional para wa.me. */
const WHATSAPP_E164 = "5491178266423";

/** Link de WhatsApp con mensaje prellenado. */
export function whatsapp(message = "¡Hola! Te escribo por Fluir.") {
  return `https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(message)}`;
}

/** Plazo de respuesta que prometemos públicamente. */
export const RESPONSE_TIME = "72 horas hábiles";

/** Instagram. `null` mientras no exista la cuenta (no se muestra el link). */
export const INSTAGRAM_HANDLE: string | null = null;

export const INSTAGRAM_URL = INSTAGRAM_HANDLE
  ? `https://instagram.com/${INSTAGRAM_HANDLE}`
  : null;
