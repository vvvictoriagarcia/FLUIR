import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con SERVICE_ROLE_KEY — SOLO servidor.
 * Nunca importar desde código que corra en el cliente: la service role key
 * saltea RLS y no debe llegar al navegador.
 *
 * Devuelve null si la clave no está cargada, para poder degradar con gracia.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
