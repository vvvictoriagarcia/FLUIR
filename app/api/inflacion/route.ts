import { NextResponse } from "next/server";

// Inflación mensual de Argentina (INDEC, vía ArgentinaDatos).
// El INDEC publica inflación MENSUAL (no existe una diaria oficial). Tomamos el
// promedio de los últimos meses como tasa mensual proyectada y refrescamos a
// diario, así las proyecciones de los objetivos usan siempre el dato más nuevo.
// Se llama desde el server (convención del proyecto: nada de APIs externas
// desde el cliente).

const SOURCE = "https://api.argentinadatos.com/v1/finanzas/indices/inflacion";
const FALLBACK_RATE = 0.025; // 2,5% mensual si la API falla
const MESES = 3; // cuántos meses promediamos para proyectar

type Punto = { fecha: string; valor: number };

export async function GET() {
  try {
    const res = await fetch(SOURCE, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = (await res.json()) as Punto[];

    const ultimos = data.slice(-MESES);
    const promedio =
      ultimos.reduce((s, p) => s + p.valor, 0) / (ultimos.length || 1);
    const last = data[data.length - 1];

    return NextResponse.json({
      // OJO: no es el último dato del INDEC, es el PROMEDIO de los últimos
      // meses. Puede diferir del último mes publicado y está bien que difiera:
      // proyectar a 12 meses con un solo mes sería más frágil. La UI lo aclara.
      monthlyRate: promedio / 100,
      lastMonth: last?.fecha ?? null,
      lastValue: last?.valor ?? null,
      source: "INDEC",
      method: "promedio",
      monthsUsed: ultimos.length,
    });
  } catch (e) {
    // Si esto aparece en los logs, la proyección de los objetivos está usando
    // un número inventado: hay que mirar la fuente.
    console.warn(
      "[inflacion] fuente caída, usando fallback",
      FALLBACK_RATE,
      e instanceof Error ? e.message : e,
    );
    return NextResponse.json({
      monthlyRate: FALLBACK_RATE,
      lastMonth: null,
      lastValue: FALLBACK_RATE * 100,
      source: "estimado",
      method: "fallback",
      monthsUsed: 0,
    });
  }
}
