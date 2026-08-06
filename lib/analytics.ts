"use client";

import { useEffect } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * FLUIR — Eventos de producto.
 *
 * Sirve para responder "¿esto funcionó?" sin adivinar: cuántos llegan al
 * dashboard, cuántos cargan su primer gasto, cuántos ven el paywall y cuántos
 * tocan pagar.
 *
 * Reglas:
 * - Nunca bloquea ni rompe la UI: si falla, se pierde el evento y listo.
 * - Nunca manda datos personales ni montos exactos (ver `sanitize`).
 * - El `session_id` identifica la visita, no a la persona: vive en
 *   sessionStorage y se pierde al cerrar la pestaña.
 */

export type EventName =
  | "dashboard_viewed"
  | "first_expense_created"
  | "paywall_viewed"
  | "paywall_converted"
  | "onboarding_completed"
  | "session_started" // una vez por visita (pestaña) → frecuencia/retención
  | "feature_used" // entró a una herramienta → adopción y uso
  | "sugerencia_vista" // se le mostró una sugerencia → denominador de adherencia
  | "sugerencia_seguida"; // tocó el CTA de la sugerencia → numerador de adherencia

/** Sugerencias de producto que medimos (prop `tipo`). */
export type SuggestionType =
  | "objetivo" // dashboard: "ponete un objetivo"
  | "pagos_fijos" // dashboard: "cargá tus pagos fijos"
  | "invertir_sobrante"; // invertí: "te sobran $X por mes"

/** Herramientas que medimos para adopción (prop `feature` de `feature_used`). */
export type FeatureName =
  | "gastos"
  | "objetivos"
  | "pagos"
  | "importar"
  | "cartera"
  | "historial"
  | "patrimonio";

export type EventProps = Record<string, string | number | boolean | null>;

const SESSION_KEY = "fluir_session_id";

/** Claves que no queremos ver nunca en `props`. */
const PROHIBIDAS = [
  "email",
  "mail",
  "name",
  "nombre",
  "phone",
  "telefono",
  "dni",
  "cuil",
  "password",
  "token",
  "amount",
  "monto",
  "income",
  "ingreso",
];

/**
 * Saca lo que no debería viajar: datos personales, montos exactos y textos
 * largos. Es una red de seguridad, no una excusa para mandar cualquier cosa.
 */
export function sanitize(props: EventProps): EventProps {
  const out: EventProps = {};
  for (const [k, v] of Object.entries(props)) {
    const clave = k.toLowerCase();
    if (PROHIBIDAS.some((p) => clave.includes(p))) continue;
    if (typeof v === "string") {
      out[k] = v.slice(0, 80);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function sessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

/** Registra un evento. Fire-and-forget: nunca esperes por esto. */
export function track(name: EventName, props: EventProps = {}): void {
  if (typeof window === "undefined" || !isSupabaseConfigured) return;

  void (async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      await supabase.from("events").insert({
        user_id: data.session?.user.id ?? null,
        session_id: sessionId(),
        name,
        path: window.location.pathname,
        props: sanitize(props),
      });
    } catch {
      // Un evento perdido no puede romperle la app a nadie.
    }
  })();
}

/** Marca que un evento ya se registró en esta visita (para los "once"). */
export function trackOnce(name: EventName, props: EventProps = {}): void {
  if (typeof window === "undefined") return;
  const key = `fluir_ev_${name}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // Sin sessionStorage mandamos igual: mejor un duplicado que un ciego.
  }
  track(name, props);
}

// ── Fase 1: frecuencia de uso + adopción de herramientas ────────────

/**
 * Inicio de visita. Una sola vez por pestaña (trackOnce usa sessionStorage).
 * Con esto + `created_at` + `user_id` se calculan DAU/WAU y retención por
 * cohorte en el SQL Editor (ver `supabase/analytics_queries.sql`).
 */
export function startSession(): void {
  trackOnce("session_started");
}

/** Registra que entró a una herramienta. Se dispara en cada visita a la página. */
export function trackFeature(feature: FeatureName): void {
  track("feature_used", { feature });
}

/** Hook para las páginas de herramientas: `useTrackFeature("gastos")`. */
export function useTrackFeature(feature: FeatureName): void {
  useEffect(() => {
    trackFeature(feature);
  }, [feature]);
}

// ── Fase 2: adherencia a sugerencias ────────────────────────────────
//
// Medimos "¿le hacen caso a las sugerencias?" con un par vista→seguida.
// La ADHERENCIA de un tipo = sugerencia_seguida / sugerencia_vista.

/** Impresión de una sugerencia. Una sola vez por tipo por visita (pestaña). */
export function trackSuggestionShown(tipo: SuggestionType): void {
  if (typeof window === "undefined") return;
  const key = `fluir_sug_${tipo}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // Sin sessionStorage mandamos igual: mejor un duplicado que un ciego.
  }
  track("sugerencia_vista", { tipo });
}

/** La persona siguió la sugerencia (tocó su CTA). */
export function trackSuggestionFollowed(tipo: SuggestionType): void {
  track("sugerencia_seguida", { tipo });
}

/**
 * Hook para registrar la impresión al montar, SOLO si la sugerencia se está
 * mostrando (`when`). Ej: `useSuggestionShown("objetivo", !tieneObjetivo)`.
 */
export function useSuggestionShown(tipo: SuggestionType, when: boolean): void {
  useEffect(() => {
    if (when) trackSuggestionShown(tipo);
  }, [tipo, when]);
}
