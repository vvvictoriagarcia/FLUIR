// ─────────────────────────────────────────────────────────────────
// FLUIR INVERTÍ — Cartera: tenencias y cuánto valen hoy.
// Supabase si hay sesión, localStorage si no (igual que el resto).
// Requiere `supabase/add_cartera.sql` para la parte con cuenta.
// ─────────────────────────────────────────────────────────────────

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { PricesSnapshot } from "@/lib/prices";

export type HoldingKind =
  | "cedear"
  | "accion"
  | "bono"
  | "fci"
  | "plazo_fijo"
  | "cripto"
  | "otro";

export interface Holding {
  id: string;
  ticker: string;
  name: string;
  kind: HoldingKind;
  quantity: number;
  /** Precio promedio de compra, en pesos. */
  avgPrice: number;
}

/** La foto de precios tal como la devuelve /api/precios (ver lib/prices.ts). */
export type Prices = PricesSnapshot;

export interface ValuedHolding extends Holding {
  /** Precio actual en pesos (o el de compra si no lo encontramos). */
  price: number;
  /** Si no hay precio de mercado y estamos usando el de compra. */
  sinPrecio: boolean;
  pctChangeDia: number;
  costo: number;
  valor: number;
  ganancia: number;
  gananciaPct: number;
}

export interface PortfolioTotals {
  costo: number;
  valor: number;
  ganancia: number;
  gananciaPct: number;
  /** Cuántas tenencias no pudimos valuar con precio de mercado. */
  sinPrecio: number;
}

/**
 * Cuántos nominales representa el precio publicado.
 *
 * En el mercado argentino los bonos cotizan "por lámina de 100 VN": si AL30
 * figura a $86.200 y tenés 500 nominales, tu posición son $431.000, no
 * $43.100.000. Sin esta división un solo bono se comía el 96% de la cartera.
 */
export const LAMINA: Record<HoldingKind, number> = {
  cedear: 1,
  accion: 1,
  bono: 100,
  fci: 1,
  plazo_fijo: 1,
  cripto: 1,
  otro: 1,
};

export const KIND_LABELS: Record<HoldingKind, string> = {
  cedear: "CEDEAR",
  accion: "Acción",
  bono: "Bono",
  fci: "Fondo común",
  plazo_fijo: "Plazo fijo",
  cripto: "Cripto",
  otro: "Otro",
};

const LOCAL_KEY = "fluir_holdings";
const COLS = "id, ticker, name, kind, quantity, avg_price";

/**
 * Id del usuario logueado, o null en modo demo.
 *
 * Usa `getSession()` (lee el storage local) y no `getUser()`, que pega a la red
 * en cada llamada: con cinco módulos preguntando por la sesión, eran 8 requests
 * a /auth/v1/user por carga. La seguridad no depende de esto — los datos los
 * protege RLS del lado del servidor.
 */
async function getUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await createClient().auth.getSession();
  return data.session?.user.id ?? null;
}

function readLocal(): Holding[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLocal(items: Holding[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
  } catch {}
}

// ── Datos ──────────────────────────────────────────────────────────

export async function loadHoldings(): Promise<Holding[]> {
  const uid = await getUserId();
  if (!uid) return readLocal();

  const { data, error } = await createClient()
    .from("holdings")
    .select(COLS)
    .eq("user_id", uid)
    .order("created_at");
  if (error || !data) return [];

  return data.map((h) => ({
    id: h.id,
    ticker: h.ticker,
    name: h.name ?? "",
    kind: (h.kind ?? "otro") as HoldingKind,
    quantity: Number(h.quantity),
    avgPrice: Number(h.avg_price),
  }));
}

export async function createHolding(input: Omit<Holding, "id">): Promise<Holding> {
  const item: Holding = { ...input, id: crypto.randomUUID(), ticker: input.ticker.toUpperCase() };

  const uid = await getUserId();
  if (!uid) {
    writeLocal([...readLocal(), item]);
    return item;
  }

  const { data, error } = await createClient()
    .from("holdings")
    .insert({
      user_id: uid,
      ticker: item.ticker,
      name: item.name || null,
      kind: item.kind,
      quantity: item.quantity,
      avg_price: item.avgPrice,
    })
    .select(COLS)
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo guardar la tenencia");
  }
  return { ...item, id: data.id };
}

export async function deleteHolding(id: string): Promise<void> {
  const uid = await getUserId();
  if (!uid) {
    writeLocal(readLocal().filter((h) => h.id !== id));
    return;
  }
  const { error } = await createClient().from("holdings").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// Una sola foto de precios por vista: si el dashboard y la cartera piden a la
// vez (o se navega entre ellas), comparten el mismo pedido en lugar de mostrar
// dos valuaciones distintas del mismo patrimonio.
let enVuelo: Promise<Prices | null> | null = null;
let ultima: { snap: Prices | null; tomadaEn: number } | null = null;
const VIGENCIA_MS = 60_000;

/**
 * Trae precios por nuestra API (nunca desde el cliente a la fuente).
 * @param tickers  solo estos símbolos, para no bajar el mercado entero.
 * @param force    ignora lo que haya en memoria (botón "actualizar precios").
 */
export async function fetchPrices(
  tickers?: string[],
  force = false,
): Promise<Prices | null> {
  if (!force && ultima && Date.now() - ultima.tomadaEn < VIGENCIA_MS) {
    return ultima.snap;
  }
  if (!force && enVuelo) return enVuelo;

  const qs = tickers?.length
    ? `?tickers=${encodeURIComponent(tickers.join(","))}`
    : "";

  enVuelo = (async () => {
    try {
      const res = await fetch(`/api/precios${qs}`);
      if (!res.ok) return null;
      return (await res.json()) as Prices;
    } catch {
      return null;
    }
  })();

  const snap = await enVuelo;
  enVuelo = null;
  ultima = { snap, tomadaEn: Date.now() };
  return snap;
}

// ── Cálculo ────────────────────────────────────────────────────────

/** Valúa cada tenencia con el precio de mercado (o el de compra si falta). */
export function valuate(holdings: Holding[], prices: Prices | null): ValuedHolding[] {
  return holdings.map((h) => {
    const quote = prices?.precios[h.ticker.toUpperCase()];
    const sinPrecio = !quote?.price;
    const price = quote?.price ?? h.avgPrice;
    // Los bonos cotizan por cada 100 nominales (ver LAMINA).
    const lamina = LAMINA[h.kind] ?? 1;
    const costo = (h.quantity * h.avgPrice) / lamina;
    const valor = (h.quantity * price) / lamina;
    const ganancia = valor - costo;
    return {
      ...h,
      price,
      sinPrecio,
      pctChangeDia: quote?.pctChange ?? 0,
      costo,
      valor,
      ganancia,
      gananciaPct: costo > 0 ? (ganancia / costo) * 100 : 0,
    };
  });
}

export function totals(valued: ValuedHolding[]): PortfolioTotals {
  const costo = valued.reduce((s, v) => s + v.costo, 0);
  const valor = valued.reduce((s, v) => s + v.valor, 0);
  const ganancia = valor - costo;
  return {
    costo,
    valor,
    ganancia,
    gananciaPct: costo > 0 ? (ganancia / costo) * 100 : 0,
    sinPrecio: valued.filter((v) => v.sinPrecio).length,
  };
}

/** Pasa un monto en pesos a dólares MEP (0 si no tenemos cotización). */
export function aDolares(montoARS: number, prices: Prices | null): number {
  const mep = prices?.dolar.mep || prices?.dolar.blue || 0;
  return mep > 0 ? montoARS / mep : 0;
}
