import { NextResponse } from "next/server";

// Inflación mensual de Argentina (INDEC, vía ArgentinaDatos).
// El INDEC publica inflación MENSUAL (no existe una diaria oficial). Tomamos el
// promedio de los últimos meses como tasa mensual proyectada y refrescamos a
// diario, así las proyecciones de los objetivos usan siempre el dato más nuevo.
// Se llama desde el server (convención del proyecto: nada de APIs externas
// desde el cliente).

const SOURCE = "https://api.argentinadatos.com/v1/finanzas/indices/inflacion";
const FALLBACK_RATE = 0.025; // 2,5% mensual si la API falla

type Punto = { fecha: string; valor: number };

export async function GET() {
  try {
    const res = await fetch(SOURCE, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = (await res.json()) as Punto[];

    const ultimos = data.slice(-3);
    const promedio =
      ultimos.reduce((s, p) => s + p.valor, 0) / (ultimos.length || 1);
    const last = data[data.length - 1];

    return NextResponse.json({
      monthlyRate: promedio / 100, // ej. 0.028
      lastMonth: last?.fecha ?? null,
      lastValue: last?.valor ?? null,
      source: "INDEC",
    });
  } catch {
    return NextResponse.json({
      monthlyRate: FALLBACK_RATE,
      lastMonth: null,
      lastValue: FALLBACK_RATE * 100,
      source: "estimado",
    });
  }
}
