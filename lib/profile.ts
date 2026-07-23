// ─────────────────────────────────────────────────────────────────
// FLUIR — Perfil: preferencias de mail y señal de actividad.
// Requiere haber corrido `supabase/add_emails.sql`. Si no está corrido, todo
// falla en silencio y la app sigue andando igual (nada de esto es crítico).
// ─────────────────────────────────────────────────────────────────

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export interface EmailPrefs {
  /** Tips, novedades, cosas de marketing. Requiere consentimiento explícito. */
  marketing: boolean;
  /** Avisos del producto: resumen del mes, recordatorio de cierre. */
  product: boolean;
}

const LOCAL_KEY = "fluir_notif_prefs";

export const DEFAULT_PREFS: EmailPrefs = { marketing: false, product: true };

function readLocal(): EmailPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}");
    return {
      marketing: !!raw.marketing,
      product: raw.product !== false,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function writeLocal(prefs: EmailPrefs) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(prefs));
  } catch {}
}

/**
 * Id del usuario logueado, o null en modo demo.
 *
 * Usa `getSession()` (lee el storage local) y no `getUser()`, que pega a la red
 * en cada llamada: con cinco módulos preguntando por la sesión, eran 8 requests
 * a /auth/v1/user por carga. La seguridad no depende de esto — los datos los
 * protege RLS del lado del servidor.
 */
async function getUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await createClient().auth.getSession();
  return data.session?.user.id ?? null;
}

/** Preferencias de mail: de Supabase si hay sesión, si no del navegador. */
export async function loadEmailPrefs(): Promise<EmailPrefs> {
  const uid = await getUserId();
  if (!uid) return readLocal();

  const { data, error } = await createClient()
    .from("profiles")
    .select("marketing_opt_in, product_emails")
    .eq("id", uid)
    .maybeSingle();

  if (error || !data) return readLocal();
  return {
    marketing: !!data.marketing_opt_in,
    product: data.product_emails !== false,
  };
}

/** Guarda las preferencias. Devuelve false si no se pudo guardar en la nube. */
export async function saveEmailPrefs(prefs: EmailPrefs): Promise<boolean> {
  writeLocal(prefs);
  const uid = await getUserId();
  if (!uid) return true;

  const { error } = await createClient()
    .from("profiles")
    .update({ marketing_opt_in: prefs.marketing, product_emails: prefs.product })
    .eq("id", uid);
  return !error;
}

const LAST_SEEN_KEY = "fluir_last_seen_ping";
/** Cada cuánto tiene sentido volver a escribir la última visita. */
const LAST_SEEN_MS = 12 * 60 * 60 * 1000;

/**
 * Deja registrado que la persona entró. Es lo que después permite mandar
 * "hace 12 días que no cargás nada" sin molestar a quien sí está usando la app.
 *
 * Con throttle de 12 h: para segmentar por inactividad alcanza y sobra saber el
 * día, y escribir en la base en cada carga de pantalla es costo y riesgo de
 * carrera sin ningún beneficio.
 * Best-effort: si falla, no pasa nada.
 */
export async function touchLastSeen(): Promise<void> {
  if (typeof window !== "undefined") {
    try {
      const ultimo = Number(localStorage.getItem(LAST_SEEN_KEY) ?? 0);
      if (Date.now() - ultimo < LAST_SEEN_MS) return;
    } catch {
      // Sin localStorage escribimos igual: es mejor que perder el dato.
    }
  }

  const uid = await getUserId();
  if (!uid) return;

  const { error } = await createClient()
    .from("profiles")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", uid);

  if (!error && typeof window !== "undefined") {
    try {
      localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
    } catch {}
  }
}
