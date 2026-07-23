"use client";

/**
 * Estado de la guía de Fluir Invertí.
 *
 * La guía educativa (te sobran $X → ¿estás listo? → brokers → apertura → tipos
 * de inversión) es para leerla UNA vez. Después, entrar a "Gold" tiene que
 * llevarte directo a tu cartera: nadie quiere pasar por cinco pantallas cada
 * vez que entra a ver cómo viene su plata. Queda el botón "Ver la guía" para
 * cuando no se acuerdan algo.
 */

const KEY = "fluir_invertir_guia_vista";

export function guiaVista(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function marcarGuiaVista(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, "1");
  } catch {}
}

/** Para el botón "volver a ver la guía". */
export function reiniciarGuia(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
