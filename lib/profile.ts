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

async function getUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await createClient().auth.getUser();
  return data.user?.id ?? null;
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

/**
 * Deja registrado que la persona entró hoy. Es lo que después permite mandar
 * "hace 12 días que no cargás nada" sin molestar a quien sí está usando la app.
 * Best-effort: si falla, no pasa nada.
 */
export async function touchLastSeen(): Promise<void> {
  const uid = await getUserId();
  if (!uid) return;
  await createClient()
    .from("profiles")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", uid);
}
