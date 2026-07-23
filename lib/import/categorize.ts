// ─────────────────────────────────────────────────────────────────
// FLUIR — Motor de ingesta: categorización híbrida
// 1) override del usuario  2) reglas por comercio  3) (afuera) Claude para lo ambiguo
// Siempre devuelve una categoría que EXISTE en las del usuario, o null.
// ─────────────────────────────────────────────────────────────────

import type { CategoryMethod } from "./types";

// Categorías canónicas de Fluir (las que arma el algoritmo de presupuesto).
type Bucket =
  | "Comida"
  | "Transporte"
  | "Salidas"
  | "Ropa"
  | "Suscripciones"
  | "Vivienda"
  | "Deuda";

// Reglas comercio → bucket. El comercio llega normalizado (lowercase, sin ruido).
const RULES: { match: RegExp; bucket: Bucket }[] = [
  // Comida: súper, delivery, cafés
  { match: /coto|carrefour|jumbo|dia|vea|disco|la anonima|walmart|chango|makro|rappi|pedidosya|mcdonald|burger|starbucks|havanna|almacen|verduler|carnicer|panader/, bucket: "Comida" },
  // Transporte: nafta, apps, SUBE
  { match: /ypf|shell|axion|puma|gnc|sube|uber|cabify|didi|subte|peaje|estacionamiento|cochera/, bucket: "Transporte" },
  // Salidas: bares, boliches, cine, salir
  { match: /bar|boliche|cervec|resto|pizzer|cine|cinemark|hoyts|teatro|club|pub|after|disco ba/, bucket: "Salidas" },
  // Ropa
  { match: /zara|h&m|hym|adidas|nike|topper|indument|dexter|falabella|renner|vestir|calzado/, bucket: "Ropa" },
  // Suscripciones / streaming / software
  { match: /netflix|spotify|disney|hbo|max|youtube|prime|apple\.com|itunes|google (one|storage)|openai|anthropic|claude|canva|adobe|gym|sportclub/, bucket: "Suscripciones" },
  // Vivienda / servicios del hogar
  { match: /alquiler|expensas|edenor|edesur|metrogas|camuzzi|aysa|aguas|telecom|fibertel|movistar|personal|claro|internet|luz|gas natural/, bucket: "Vivienda" },
  // Deuda / tarjeta
  { match: /pago tarjeta|resumen tarjeta|prestamo|cuota prestamo|tarjeta credito/, bucket: "Deuda" },
];

// Sinónimos para machear un bucket contra el nombre real de la categoría del usuario.
const SYNONYMS: Record<Bucket, string[]> = {
  Comida: ["comida", "supermercado", "super", "delivery", "alimentos", "comidas"],
  Transporte: ["transporte", "auto", "nafta", "movilidad", "combustible"],
  Salidas: ["salidas", "salir", "ocio", "entretenimiento", "diversion"],
  Ropa: ["ropa", "indumentaria", "vestimenta"],
  Suscripciones: ["suscripciones", "suscripcion", "streaming", "servicios digitales"],
  Vivienda: ["vivienda", "hogar", "servicios", "casa", "alquiler"],
  Deuda: ["deuda", "deudas", "tarjeta", "prestamo", "creditos"],
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

/** Busca en las categorías del usuario una que corresponda al bucket. */
function matchBucket(bucket: Bucket, userCategories: string[]): string | null {
  const wanted = new Set([norm(bucket), ...SYNONYMS[bucket].map(norm)]);
  for (const c of userCategories) {
    if (wanted.has(norm(c))) return c; // devuelve el nombre REAL del usuario
  }
  return null;
}

export interface Categorization {
  category: string | null;
  method: CategoryMethod;
}

/**
 * Categoriza un movimiento. `overrides`: comercioNorm → categoría (del usuario).
 * Devuelve null si es ambiguo (para que Claude o el usuario decidan).
 */
export function categorize(
  merchantNorm: string,
  userCategories: string[],
  overrides: Record<string, string> = {}
): Categorization {
  // 1) Override aprendido (si la categoría todavía existe).
  const ov = overrides[merchantNorm];
  if (ov && userCategories.includes(ov)) {
    return { category: ov, method: "override" };
  }

  // 2) Reglas por comercio → bucket → categoría real del usuario.
  for (const rule of RULES) {
    if (rule.match.test(merchantNorm)) {
      const cat = matchBucket(rule.bucket, userCategories);
      if (cat) return { category: cat, method: "rule" };
    }
  }

  // 3) Ambiguo: lo resuelve Claude (server) o el usuario en la revisión.
  return { category: null, method: "none" };
}
