"use client";

import { useEffect, useState } from "react";

export interface Inflation {
  /** Tasa mensual usada para proyectar. NO es el último dato: ver `method`. */
  monthlyRate: number; // ej. 0.028 = 2,8% mensual
  lastMonth: string | null;
  lastValue: number | null; // el % del último mes publicado (ej. 1.9)
  source: string; // "INDEC" | "estimado"
  /** "promedio" = promedio de los últimos meses · "fallback" = fuente caída. */
  method?: "promedio" | "fallback";
  monthsUsed?: number;
}

const DEFAULT: Inflation = {
  monthlyRate: 0.025,
  lastMonth: null,
  lastValue: 2.5,
  source: "estimado",
  method: "fallback",
  monthsUsed: 0,
};

/**
 * Texto para mostrar de dónde sale la tasa. Sin esto, el usuario ve una
 * proyección y no sabe si es un dato oficial o una estimación nuestra.
 */
export function inflationNote(inf: Inflation): string {
  const pct = (inf.monthlyRate * 100).toLocaleString("es-AR", {
    maximumFractionDigits: 1,
  });
  if (inf.method === "fallback" || inf.source !== "INDEC") {
    return `Proyectado con una inflación estimada de ${pct}% mensual (no pudimos traer el dato del INDEC).`;
  }
  return `Proyectado con ${pct}% mensual: el promedio de los últimos ${inf.monthsUsed ?? 3} meses del INDEC.`;
}

/** Trae la inflación mensual desde /api/inflacion (server-side, cacheada a diario). */
export function useInflation() {
  const [inflation, setInflation] = useState<Inflation>(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/inflacion")
      .then((r) => r.json())
      .then((d: Inflation) => {
        if (active) {
          setInflation(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { inflation, loading };
}
