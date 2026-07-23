import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseCSV } from "@/lib/import/csv";
import { buildMovements } from "@/lib/import/engine";
import {
  anthropicConfigured,
  extractFromImage,
  categorizeWithClaude,
} from "@/lib/import/vision";
import type { RawMovement } from "@/lib/import/types";

// Parsea un CSV de homebanking o una foto/screenshot de resumen y devuelve los
// movimientos normalizados + categorizados, LISTOS PARA REVISAR (no los guarda).
// Privacidad: el archivo se procesa en memoria y no se persiste.
export async function POST(request: NextRequest) {
  let body: {
    kind?: "csv" | "image";
    data?: string;
    mediaType?: string;
    categories?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const { kind, data, mediaType, categories = [] } = body;
  if (!kind || !data) {
    return NextResponse.json({ error: "Faltan datos." }, { status: 400 });
  }

  // Overrides aprendidos (solo si hay sesión).
  let overrides: Record<string, string> = {};
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: rows } = await supabase
      .from("merchant_overrides")
      .select("merchant, category")
      .eq("user_id", user.id);
    overrides = Object.fromEntries(
      (rows ?? []).map((r) => [r.merchant as string, r.category as string])
    );
  }

  // 1) Extraer movimientos crudos según el origen.
  let raws: RawMovement[] = [];
  const warnings: string[] = [];

  if (kind === "csv") {
    const parsed = parseCSV(data);
    raws = parsed.raws;
    warnings.push(...parsed.warnings);
  } else {
    if (!anthropicConfigured()) {
      return NextResponse.json(
        { error: "Falta ANTHROPIC_API_KEY para leer imágenes." },
        { status: 503 }
      );
    }
    try {
      raws = await extractFromImage(data, mediaType ?? "image/jpeg");
    } catch {
      return NextResponse.json(
        { error: "No pudimos leer la imagen. Probá con más luz o recortada." },
        { status: 502 }
      );
    }
  }

  // 2) Normalizar + categorizar (reglas + overrides).
  const result = buildMovements(raws, { userCategories: categories, overrides });
  warnings.push(...result.warnings);

  // 3) Los ambiguos que queden, resolverlos con Claude (si está configurado).
  const ambiguous = result.movements.filter((m) => m.category === null);
  if (ambiguous.length > 0 && categories.length > 0 && anthropicConfigured()) {
    try {
      const uniqueMerchants = [...new Set(ambiguous.map((m) => m.merchant))];
      const ai = await categorizeWithClaude(uniqueMerchants, categories);
      for (const m of result.movements) {
        if (m.category === null && ai[m.merchant]) {
          m.category = ai[m.merchant];
          m.categoryMethod = "ai";
        }
      }
    } catch {
      // Si falla, quedan sin categoría para que el usuario las asigne.
    }
  }

  return NextResponse.json({ movements: result.movements, warnings });
}
