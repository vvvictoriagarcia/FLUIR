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
