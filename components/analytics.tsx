"use client";

import { useEffect } from "react";
import { startSession } from "@/lib/analytics";

/**
 * Dispara `session_started` una vez por visita. Va montado en el layout raíz,
 * así cubre TODA la app (landing incluida) sin repetir código por página.
 * No pinta nada.
 */
export function Analytics() {
  useEffect(() => {
    startSession();
  }, []);
  return null;
}
