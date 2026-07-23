import { NextResponse, type NextRequest } from "next/server";
import { getPrices, pickTickers } from "@/lib/prices";

// Precios del mercado argentino y dólar, del lado del servidor (convención de
// Fluir: nunca llamar APIs externas desde el cliente). Toda la app lee la misma
// foto vía `lib/prices.ts`.
//
// `?tickers=AAPL,GGAL` recorta la respuesta a lo que la persona tiene. Sin eso
// devolvíamos el mercado entero (cientos de especies) para valuar 5 tenencias.

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("tickers");
  const tickers = raw
    ? raw.split(",").map((t) => t.trim()).filter(Boolean)
    : undefined;

  const snap = await getPrices();
  return NextResponse.json(pickTickers(snap, tickers));
}
