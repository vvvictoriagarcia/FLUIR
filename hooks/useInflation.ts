"use client";

import { useEffect, useState } from "react";

export interface Inflation {
  monthlyRate: number; // ej. 0.028 = 2,8% mensual
  lastMonth: string | null;
  lastValue: number | null; // el % del último mes (ej. 2.1)
  source: string; // "INDEC" | "estimado"
}

const DEFAULT: Inflation = {
  monthlyRate: 0.025,
  lastMonth: null,
  lastValue: 2.5,
  source: "estimado",
};

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
