// ─────────────────────────────────────────────────────────────────
// FLUIR — Plantillas de mail (HTML inline).
//
// Los clientes de mail (Gmail, Outlook) ignoran <style> externo y muchas
// clases CSS, así que todo va con estilos inline y tablas. Es feo de escribir
// pero es lo único que se ve igual en todos lados.
//
// Voz: la misma de la app — cercana, voseo, sin culpa, frases cortas.
// ─────────────────────────────────────────────────────────────────

const BRAND = "#6C63FF";
const INK = "#1a1a1a";
const MUTED = "#6b7280";
const BG = "#f8f5ef";

const SITE = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://fluirargentina.com";

/** Envuelve el contenido en el marco de marca (header + pie con baja). */
function shell(opts: { titulo: string; cuerpo: string; footNote?: string }): string {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eee;">
        <tr><td style="padding:28px 32px 8px;">
          <span style="font-size:22px;font-weight:700;color:${BRAND};letter-spacing:-0.5px;">fluir</span>
        </td></tr>
        <tr><td style="padding:8px 32px 28px;color:${INK};font-size:15px;line-height:1.6;">
          ${opts.cuerpo}
        </td></tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td style="padding:16px 32px;color:${MUTED};font-size:12px;line-height:1.6;text-align:center;">
          ${opts.footNote ? opts.footNote + "<br><br>" : ""}
          Fluir · Tu plata, en orden · Hecho en Argentina<br>
          <a href="${SITE}" style="color:${MUTED};">fluirargentina.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function boton(texto: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:999px;">${texto}</a>`;
}

/** Mail de bienvenida, al crear la cuenta. */
export function welcomeEmail(nombre?: string): { subject: string; html: string } {
  const hola = nombre ? `¡Hola, ${nombre}!` : "¡Hola!";
  const cuerpo = `
    <h1 style="font-size:20px;margin:12px 0 8px;color:${INK};">${hola} 👋</h1>
    <p style="margin:0 0 16px;">
      Bienvenida/o a Fluir. Ya tenés todo para ordenar tu plata sin vueltas:
      armás tu presupuesto en 3 minutos y sabés cuánto podés gastar de verdad.
    </p>
    <p style="margin:0 0 20px;">Un par de cosas que te van a servir desde el día uno:</p>
    <ul style="margin:0 0 24px;padding-left:20px;color:${INK};">
      <li style="margin-bottom:8px;">Cargá un gasto con una foto del resumen, sin tipear.</li>
      <li style="margin-bottom:8px;">Anotá tus pagos fijos y te avisamos antes de que venzan.</li>
      <li style="margin-bottom:8px;">Ponete objetivos que se ajustan con la inflación.</li>
    </ul>
    <p style="margin:0 0 24px;">${boton("Entrar a Fluir", `${SITE}/inicio`)}</p>
    <p style="margin:0;color:${MUTED};font-size:13px;">
      ¿Alguna duda? Respondé este mail y te contestamos.
    </p>`;
  return {
    subject: "Bienvenida/o a Fluir 🌱",
    html: shell({ titulo: "Bienvenida/o a Fluir", cuerpo }),
  };
}
