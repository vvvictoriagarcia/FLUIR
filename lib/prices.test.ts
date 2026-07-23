import { describe, it, expect } from "vitest";
import { pickTickers, ageMinutes, ageLabel, type PricesSnapshot } from "./prices";

const snap: PricesSnapshot = {
  dolar: { oficial: 1505, blue: 1555, mep: 1513.7, ccl: 1573.5 },
  precios: {
    AAPL: { price: 25300, pctChange: -1.3 },
    SPY: { price: 19530, pctChange: -0.45 },
    GGAL: { price: 8175, pctChange: -1.2 },
  },
  asOf: "2026-07-23T12:00:00.000Z",
  parcial: false,
};

describe("pickTickers", () => {
  it("devuelve solo los tickers pedidos", () => {
    const out = pickTickers(snap, ["AAPL", "SPY"]);
    expect(Object.keys(out.precios).sort()).toEqual(["AAPL", "SPY"]);
    expect(out.precios.AAPL.price).toBe(25300);
  });

  it("ignora mayúsculas y espacios", () => {
    const out = pickTickers(snap, [" aapl ", "ggal"]);
    expect(Object.keys(out.precios).sort()).toEqual(["AAPL", "GGAL"]);
  });

  it("sin lista devuelve todo (para no romper otros usos)", () => {
    expect(Object.keys(pickTickers(snap, undefined).precios)).toHaveLength(3);
  });

  it("una lista vacía no devuelve precios", () => {
    expect(Object.keys(pickTickers(snap, []).precios)).toHaveLength(0);
  });

  it("un ticker que no existe no rompe ni inventa", () => {
    const out = pickTickers(snap, ["NOEXISTE"]);
    expect(out.precios).toEqual({});
  });

  it("conserva dólar, asOf y el flag parcial", () => {
    const out = pickTickers({ ...snap, parcial: true }, ["AAPL"]);
    expect(out.dolar.mep).toBe(1513.7);
    expect(out.asOf).toBe(snap.asOf);
    expect(out.parcial).toBe(true);
  });
});

describe("ageMinutes", () => {
  const ahora = new Date("2026-07-23T12:07:30.000Z");

  it("mide la antigüedad del dato, no del pedido", () => {
    expect(ageMinutes(snap.asOf, ahora)).toBe(7);
  });

  it("no devuelve negativos si el reloj del cliente está adelantado", () => {
    expect(ageMinutes("2026-07-23T12:09:00.000Z", ahora)).toBe(0);
  });

  it("null si no hay fecha", () => {
    expect(ageMinutes(null, ahora)).toBeNull();
    expect(ageMinutes("no-es-una-fecha", ahora)).toBeNull();
  });
});

describe("ageLabel", () => {
  const ahora = new Date("2026-07-23T12:07:30.000Z");

  it("habla en criollo", () => {
    expect(ageLabel("2026-07-23T12:07:20.000Z", ahora)).toBe("recién");
    expect(ageLabel("2026-07-23T12:06:00.000Z", ahora)).toBe("hace 1 min");
    expect(ageLabel(snap.asOf, ahora)).toBe("hace 7 min");
    expect(ageLabel("2026-07-23T09:00:00.000Z", ahora)).toBe("hace 3 h");
  });

  it("sin fecha no inventa", () => {
    expect(ageLabel(null, ahora)).toBe("");
  });
});
