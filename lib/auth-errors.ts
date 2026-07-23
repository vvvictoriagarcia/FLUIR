import type { AuthError } from "@supabase/supabase-js";

/**
 * Traduce un error de Supabase Auth a un mensaje honesto para la usuaria.
 *
 * Clave: NO decir "email o contraseña incorrectos" cuando en realidad no
 * pudimos ni llegar al servidor (sin internet, proyecto caído, claves mal
 * cargadas). Si no, la persona reintenta su clave para siempre pensando que se
 * equivocó ella.
 */
export function authErrorMessage(
  error: AuthError | Error | null,
  fallback = "No pudimos completar la operación. Probá de nuevo.",
): string {
  if (!error) return fallback;

  const msg = error.message ?? "";
  const status = (error as AuthError).status;
  const code = (error as AuthError).code;

  // No llegamos al servidor: fetch fallido, DNS, CORS, proyecto apagado.
  const isNetwork =
    error.name === "AuthRetryableFetchError" ||
    status === 0 ||
    status === undefined ||
    /failed to fetch|load failed|networkerror|fetch failed/i.test(msg);
  if (isNetwork) {
    return "No pudimos conectarnos con el servidor. Revisá tu internet; si sigue así, es un problema nuestro: escribinos.";
  }

  if (status === 429 || code === "over_request_rate_limit") {
    return "Demasiados intentos. Esperá un ratito y probá de nuevo.";
  }

  if (code === "email_not_confirmed") {
    return "Te falta confirmar tu email. Buscá el mail que te mandamos.";
  }

  if (code === "user_already_exists" || /already registered/i.test(msg)) {
    return "Ese email ya tiene cuenta. Probá entrar o recuperar la contraseña.";
  }

  if (code === "weak_password" || /password should be at least/i.test(msg)) {
    return "La contraseña tiene que tener al menos 6 caracteres.";
  }

  if (/invalid email|unable to validate email/i.test(msg)) {
    return "Ese email no parece válido. Revisalo.";
  }

  if (code === "invalid_credentials" || status === 400) {
    return "Email o contraseña incorrectos.";
  }

  if (status && status >= 500) {
    return "El servidor no está respondiendo. Probá en unos minutos.";
  }

  return msg || fallback;
}
