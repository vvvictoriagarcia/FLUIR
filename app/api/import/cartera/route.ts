import { NextResponse, type NextRequest } from "next/server";
import {
  anthropicConfigured,
  extractHoldingsFromImage,
} from "@/lib/import/vision";
import { parseAmount } from "@/lib/import/normalize";

// Foto de la pantalla del broker → tenencias, para cargarlas sin tipear.
// Solo parsea y devuelve el preview: NO guarda nada ni conserva la imagen.

const TIPOS = [
  "cedear",
  "accion",
  "bono",
  "fci",
  "plazo_fijo",
  "cripto",
  "otro",
] as const;

export async function POST(request: NextRequest) {
  if (!anthropicConfigured()) {
    return NextResponse.json(
      { error: "La lectura de imágenes todavía no está habilitada." },
      { status: 503 },
    );
  }

  let body: { data?: string; mediaType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }
  if (!body.data) {
    return NextResponse.json({ error: "Falta la imagen." }, { status: 400 });
  }

  try {
    const crudas = await extractHoldingsFromImage(
      body.data,
      body.mediaType ?? "image/jpeg",
    );

    const tenencias = crudas
      .map((t) => ({
        ticker: (t.ticker ?? "").trim().toUpperCase(),
        name: (t.nombre ?? "").trim(),
        kind: (TIPOS as readonly string[]).includes(t.tipo) ? t.tipo : "otro",
        quantity: parseAmount(t.cantidad),
        avgPrice: parseAmount(t.precio_promedio),
      }))
      .filter((t) => t.ticker && t.quantity > 0);

    const warnings: string[] = [];
    if (crudas.length && !tenencias.length) {
      warnings.push("Leímos la imagen pero no pudimos interpretar las cantidades.");
    }
    const sinPrecio = tenencias.filter((t) => !t.avgPrice).length;
    if (sinPrecio) {
      warnings.push(
        `${sinPrecio} ${sinPrecio === 1 ? "activo no tenía" : "activos no tenían"} precio de compra: completalo a mano.`,
      );
    }

    return NextResponse.json({ tenencias, warnings });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No pudimos leer la imagen." },
      { status: 500 },
    );
  }
}
