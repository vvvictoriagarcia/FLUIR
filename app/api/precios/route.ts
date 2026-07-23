import { NextResponse } from "next/server";

// Precios del mercado argentino y cotizaciones del dólar, del lado del
// servidor (convención de Fluir: nunca llamar APIs externas desde el cliente).
// Fuentes públicas y gratuitas: data912 (BYMA) y dolarapi.
// Se cachea 5 minutos: son precios de referencia, no un ticker en tiempo real.

export const revalidate = 300;

const DATA912 = "https://data912.com/live";
const LISTAS = ["arg_cedears", "arg_stocks", "arg_bonds", "arg_corp"];

interface Quote {
  symbol: string;
  c: number; // último precio
  pct_change: number;
}

export interface PreciosResponse {
  dolar: { oficial: number; blue: number; mep: number; ccl: number };
  precios: Record<string, { price: number; pctChange: number }>;
  updatedAt: string;
  /** true si alguna fuente falló y los datos están incompletos. */
  parcial: boolean;
}

async function traer<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function GET() {
  const [dolares, ...listas] = await Promise.all([
    traer<{ casa: string; venta: number }[]>("https://dolarapi.com/v1/dolares"),
    ...LISTAS.map((l) => traer<Quote[]>(`${DATA912}/${l}`)),
  ]);

  const casa = (nombre: string) =>
    dolares?.find((d) => d.casa === nombre)?.venta ?? 0;

  const precios: PreciosResponse["precios"] = {};
  for (const lista of listas) {
    for (const q of lista ?? []) {
      if (!q.symbol || !q.c) continue;
      precios[q.symbol.toUpperCase()] = {
        price: q.c,
        pctChange: q.pct_change ?? 0,
      };
    }
  }

  const parcial = !dolares || listas.some((l) => l === null);

  return NextResponse.json({
    dolar: {
      oficial: casa("oficial"),
      blue: casa("blue"),
      mep: casa("bolsa"),
      ccl: casa("contadoconliqui"),
    },
    precios,
    updatedAt: new Date().toISOString(),
    parcial,
  } satisfies PreciosResponse);
}
