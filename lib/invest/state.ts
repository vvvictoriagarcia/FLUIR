"use client";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Estado de la guía de Fluir Invertí.
 *
 * La guía educativa (te sobran $X → ¿estás listo? → brokers → apertura → tipos
 * de inversión) es para leerla UNA vez EN LA VIDA del usuario. Después, entrar a
 * "Gold" tiene que llevarte directo a tu cartera. Queda el botón "Ver la guía"
 * para cuando no se acuerdan algo.
 *
 * Persistencia en dos capas:
 * - localStorage: cache inmediato (y única fuente en modo demo sin cuenta).
 * - Supabase (profiles.invertir_guia_vista): fuente de verdad para el usuario
 *   logueado, así no se repite al entrar desde otro dispositivo. Requiere haber
 *   corrido `supabase/add_invertir_guia.sql`; si no está, cae a localStorage.
 */

const KEY = "fluir_invertir_guia_vista";

function setLocal(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, "1");
  } catch {}
}

/** Lectura sincrónica del cache local (rápida, sin red). */
export function guiaVistaLocal(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

async function getUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await createClient().auth.getSession();
  return data.session?.user.id ?? null;
}

/**
 * ¿Ya vio la guía? Cache local o, si hay sesión, el flag en Supabase.
 * Si el server dice que sí, lo cachea en local para las próximas.
 */
export async function loadGuiaVista(): Promise<boolean> {
  if (guiaVistaLocal()) return true;
  const uid = await getUserId();
  if (!uid) return false;
  try {
    const { data } = await createClient()
      .from("profiles")
      .select("invertir_guia_vista")
      .eq("id", uid)
      .maybeSingle();
    const vista = !!data?.invertir_guia_vista;
    if (vista) setLocal();
    return vista;
  } catch {
    return false;
  }
}

/** Marca la guía como vista: local ya, y en la nube si hay sesión (best-effort). */
export function marcarGuiaVista(): void {
  setLocal();
  void (async () => {
    const uid = await getUserId();
    if (!uid) return;
    try {
      await createClient()
        .from("profiles")
        .update({ invertir_guia_vista: true })
        .eq("id", uid);
    } catch {
      // Si falla, quedó el cache local: no la volvemos a mostrar en este equipo.
    }
  })();
}

/** Para el botón "volver a ver la guía". Limpia local; el server no hace falta. */
export function reiniciarGuia(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
