// ─────────────────────────────────────────────────────────────────
// FLUIR — Servicio único de precios (SOLO servidor).
//
// Antes cada pantalla pedía cotizaciones por su cuenta y podían mostrar dos
// valuaciones distintas del mismo patrimonio. Ahora hay una sola función; el
// cache de datos de `fetch` la comparte entre requests, así dashboard y cartera
// leen exactamente la misma foto del mercado.
//
// `asOf` sale del header `Date` de la fuente (queda cacheado junto con la
// respuesta), así que refleja la antigüedad REAL del dato y no el momento en
// que alguien abrió la pantalla.
// ─────────────────────────────────────────────────────────────────

const DATA912 = "https://data912.com/live";
const LISTAS = ["arg_cedears", "arg_stocks", "arg_bonds", "arg_corp"];
const DOLAR = "https://dolarapi.com/v1/dolares";

/** Segundos que dura la foto del mercado. Son precios de referencia. */
export const REVALIDATE = 300;

export interface Quote {
  price: number;
  pctChange: number;
}

export interface PricesSnapshot {
  dolar: { oficial: number; blue: number; mep: number; ccl: number };
  precios: Record<string, Quote>;
  /** Cuándo se tomó la foto del mercado (ISO). null si la fuente no lo dijo. */
  asOf: string | null;
  /** true si alguna fuente falló: los totales pueden estar incompletos. */
  parcial: boolean;
}

interface Cruda {
  symbol: string;
  c: number;
  pct_change: number;
}

async function traer<T>(url: string): Promise<{ data: T | null; date: string | null }> {
  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE } });
    if (!res.ok) return { data: null, date: null };
    return { data: (await res.json()) as T, date: res.headers.get("date") };
  } catch {
    return { data: null, date: null };
  }
}

/** La foto del mercado, completa. Cacheada y compartida por toda la app. */
export async function getPrices(): Promise<PricesSnapshot> {
  const [dolares, ...listas] = await Promise.all([
    traer<{ casa: string; venta: number }[]>(DOLAR),
    ...LISTAS.map((l) => traer<Cruda[]>(`${DATA912}/${l}`)),
  ]);

  const casa = (nombre: string) =>
    dolares.data?.find((d) => d.casa === nombre)?.venta ?? 0;

  const precios: Record<string, Quote> = {};
  for (const lista of listas) {
    for (const q of lista.data ?? []) {
      if (!q.symbol || !q.c) continue;
      precios[q.symbol.toUpperCase()] = {
        price: q.c,
        pctChange: q.pct_change ?? 0,
      };
    }
  }

  // La foto es tan vieja como la más vieja de sus fuentes.
  const fechas = [dolares, ...listas]
    .map((r) => (r.date ? Date.parse(r.date) : NaN))
    .filter((t) => !Number.isNaN(t));
  const asOf = fechas.length ? new Date(Math.min(...fechas)).toISOString() : null;

  return {
    dolar: {
      oficial: casa("oficial"),
      blue: casa("blue"),
      mep: casa("bolsa"),
      ccl: casa("contadoconliqui"),
    },
    precios,
    asOf,
    parcial: !dolares.data || listas.some((l) => l.data === null),
  };
}

/**
 * Recorta la foto a los tickers que la persona realmente tiene.
 * Sin esto le mandábamos el mercado entero (cientos de especies) para valuar
 * cinco tenencias.
 */
export function pickTickers(
  snap: PricesSnapshot,
  tickers: string[] | undefined,
): PricesSnapshot {
  if (!tickers) return snap;

  const buscados = new Set(tickers.map((t) => t.trim().toUpperCase()).filter(Boolean));
  const precios: Record<string, Quote> = {};
  for (const t of buscados) {
    const q = snap.precios[t];
    if (q) precios[t] = q;
  }
  return { ...snap, precios };
}

/** Antigüedad del dato en minutos enteros. null si no hay fecha válida. */
export function ageMinutes(asOf: string | null, now: Date = new Date()): number | null {
  if (!asOf) return null;
  const t = Date.parse(asOf);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((now.getTime() - t) / 60_000));
}

/** "recién", "hace 7 min", "hace 3 h". Vacío si no sabemos. */
export function ageLabel(asOf: string | null, now: Date = new Date()): string {
  const min = ageMinutes(asOf, now);
  if (min === null) return "";
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  return `hace ${Math.floor(min / 60)} h`;
}
