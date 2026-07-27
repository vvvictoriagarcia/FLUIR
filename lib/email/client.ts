// ─────────────────────────────────────────────────────────────────
// FLUIR — Envío de mails (SOLO servidor; usa RESEND_API_KEY).
//
// Usamos la API REST de Resend con fetch, sin el SDK, para no sumar una
// dependencia. Queda "apagado" con gracia: si falta la key, emailConfigured()
// devuelve false y sendEmail() no hace nada (no rompe el registro ni el resto).
//
// El remitente por defecto es onboarding@resend.dev, que Resend deja usar sin
// verificar dominio. Cuando se verifique fluirargentina.com en Resend, cambiar
// EMAIL_FROM por algo como "Fluir <hola@fluirargentina.com>".
// ─────────────────────────────────────────────────────────────────

const API = "https://api.resend.com/emails";

const EMAIL_FROM = process.env.EMAIL_FROM ?? "Fluir <onboarding@resend.dev>";

export function emailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export interface SendResult {
  ok: boolean;
  skipped?: boolean; // true si no está configurado (apagado a propósito)
  error?: string;
}

/**
 * Manda un mail. Best-effort: nunca tira, devuelve `{ok:false}` si falla.
 * Quien llama decide si le importa el resultado (normalmente no: el registro
 * no debe fallar porque el mail no salió).
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  /** Para el link de baja en el pie (mails no transaccionales). */
  replyTo?: string;
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, skipped: true };

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });

    if (!res.ok) {
      return { ok: false, error: `Resend ${res.status}: ${await res.text()}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "fetch falló" };
  }
}
