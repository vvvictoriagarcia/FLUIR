// ─────────────────────────────────────────────────────────────────
// FLUIR — Ingesta con Claude (SOLO servidor; usa ANTHROPIC_API_KEY).
// Visión: foto/screenshot de resumen → movimientos crudos.
// Categorización: resuelve los comercios ambiguos contra las categorías
// del usuario. Ambas con structured outputs (JSON validado).
// ─────────────────────────────────────────────────────────────────

import Anthropic from "@anthropic-ai/sdk";
import type { RawMovement } from "./types";

const MODEL = "claude-opus-4-8";

export function anthropicConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

export function normalizeMediaType(mt: string): MediaType {
  const m = mt.toLowerCase();
  if (m.includes("png")) return "image/png";
  if (m.includes("gif")) return "image/gif";
  if (m.includes("webp")) return "image/webp";
  return "image/jpeg";
}

const EXTRACT_SCHEMA = {
  type: "object",
  properties: {
    movimientos: {
      type: "array",
      items: {
        type: "object",
        properties: {
          fecha: { type: "string", description: "Fecha del movimiento, tal como aparece" },
          comercio: { type: "string", description: "Nombre del comercio o descripción del consumo" },
          monto: { type: "string", description: "Importe del gasto, tal cual aparece (con separadores)" },
          moneda: { type: "string", description: "ARS o USD" },
        },
        required: ["fecha", "comercio", "monto", "moneda"],
        additionalProperties: false,
      },
    },
  },
  required: ["movimientos"],
  additionalProperties: false,
} as const;

/** Extrae movimientos de una imagen (base64) de un resumen/comprobante. */
export async function extractFromImage(
  base64: string,
  mediaType: string
): Promise<RawMovement[]> {
  const client = new Anthropic();
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    output_config: { format: { type: "json_schema", schema: EXTRACT_SCHEMA } },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: normalizeMediaType(mediaType),
              data: base64,
            },
          },
          {
            type: "text",
            text: "Extraé TODOS los consumos/gastos de este resumen de tarjeta o comprobante bancario argentino. Devolvé solo gastos (excluí pagos, acreditaciones y saldos si podés distinguirlos). Para cada movimiento: fecha, comercio, monto y moneda (ARS por defecto).",
          },
        ],
      },
    ],
  });
  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") return [];
  try {
    const parsed = JSON.parse(block.text) as { movimientos?: RawMovement[] };
    return parsed.movimientos ?? [];
  } catch {
    return [];
  }
}

/**
 * Categoriza comercios ambiguos contra las categorías del usuario.
 * Devuelve un mapa comercioNorm → categoría (solo las válidas).
 */
export async function categorizeWithClaude(
  merchants: string[],
  categories: string[]
): Promise<Record<string, string>> {
  if (merchants.length === 0 || categories.length === 0) return {};

  const schema = {
    type: "object",
    properties: {
      asignaciones: {
        type: "array",
        items: {
          type: "object",
          properties: {
            comercio: { type: "string" },
            categoria: { type: "string", enum: categories },
          },
          required: ["comercio", "categoria"],
          additionalProperties: false,
        },
      },
    },
    required: ["asignaciones"],
    additionalProperties: false,
  } as const;

  const client = new Anthropic();
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    output_config: { format: { type: "json_schema", schema } },
    messages: [
      {
        role: "user",
        content: `Sos un asistente de finanzas argentino. Asigná a cada comercio UNA categoría de esta lista: ${categories.join(
          ", "
        )}. Comercios (uno por línea):\n${merchants.join("\n")}`,
      },
    ],
  });

  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") return {};
  try {
    const parsed = JSON.parse(block.text) as {
      asignaciones?: { comercio: string; categoria: string }[];
    };
    const map: Record<string, string> = {};
    for (const a of parsed.asignaciones ?? []) {
      if (categories.includes(a.categoria)) map[a.comercio] = a.categoria;
    }
    return map;
  } catch {
    return {};
  }
}

// ── Cartera (Fluir Invertí): foto de la pantalla del broker ────────

const HOLDINGS_SCHEMA = {
  type: "object",
  properties: {
    tenencias: {
      type: "array",
      items: {
        type: "object",
        properties: {
          ticker: { type: "string", description: "Símbolo/ticker tal como aparece (AAPL, GGAL, AL30)" },
          nombre: { type: "string", description: "Nombre del activo si figura; si no, string vacío" },
          cantidad: { type: "string", description: "Cantidad de nominales/unidades, tal cual aparece" },
          precio_promedio: {
            type: "string",
            description:
              "Precio promedio de compra (PPC) si figura; si no, el precio actual; si tampoco, string vacío",
          },
          tipo: {
            type: "string",
            enum: ["cedear", "accion", "bono", "fci", "plazo_fijo", "cripto", "otro"],
            description: "Qué tipo de activo es, según lo que se ve en la pantalla",
          },
        },
        required: ["ticker", "nombre", "cantidad", "precio_promedio", "tipo"],
        additionalProperties: false,
      },
    },
  },
  required: ["tenencias"],
  additionalProperties: false,
} as const;

export interface RawHolding {
  ticker: string;
  nombre: string;
  cantidad: string;
  precio_promedio: string;
  tipo: string;
}

/** Lee las tenencias de una captura de pantalla del broker. */
export async function extractHoldingsFromImage(
  base64: string,
  mediaType: string
): Promise<RawHolding[]> {
  const client = new Anthropic();
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    output_config: { format: { type: "json_schema", schema: HOLDINGS_SCHEMA } },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: normalizeMediaType(mediaType),
              data: base64,
            },
          },
          {
            type: "text",
            text: "Es la pantalla de tenencias de un broker argentino (Cocos, IOL, Balanz, PPI o similar). Extraé TODOS los activos que tiene la persona: ticker, nombre, cantidad y precio promedio de compra (PPC) si aparece. No inventes datos: si un valor no está en la imagen, devolvé string vacío. Los montos van tal cual aparecen, con sus separadores.",
          },
        ],
      },
    ],
  });
  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") return [];
  try {
    const parsed = JSON.parse(block.text) as { tenencias?: RawHolding[] };
    return parsed.tenencias ?? [];
  } catch {
    return [];
  }
}
