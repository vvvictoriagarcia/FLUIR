import { describe, it, expect } from "vitest";
import { valuate, totals, aDolares, type Holding, type Prices } from "./portfolio";

const prices: Prices = {
  dolar: { oficial: 1505, blue: 1555, mep: 1500, ccl: 1573 },
  precios: {
    AAPL: { price: 12000, pctChange: 1.5 },
    GGAL: { price: 8000, pctChange: -2 },
  },
  updatedAt: "2026-07-23T00:00:00.000Z",
  parcial: false,
};

const aapl: Holding = {
  id: "1",
  ticker: "AAPL",
  name: "Apple",
  kind: "cedear",
  quantity: 10,
  avgPrice: 10000,
};

describe("valuate", () => {
  it("calcula costo, valor y ganancia con el precio de mercado", () => {
    const [v] = valuate([aapl], prices);
    expect(v.costo).toBe(100000);
    expect(v.valor).toBe(120000);
    expect(v.ganancia).toBe(20000);
    expect(v.gananciaPct).toBeCloseTo(20);
    expect(v.sinPrecio).toBe(false);
  });

  it("si no hay precio de mercado usa el de compra y lo marca", () => {
    const [v] = valuate([{ ...aapl, ticker: "NOEXISTE" }], prices);
    expect(v.sinPrecio).toBe(true);
    expect(v.valor).toBe(v.costo);
    expect(v.ganancia).toBe(0);
  });

  it("no rompe sin precios (fuente caída)", () => {
    const [v] = valuate([aapl], null);
    expect(v.sinPrecio).toBe(true);
    expect(v.valor).toBe(100000);
  });

  it("busca el ticker sin importar mayúsculas", () => {
    const [v] = valuate([{ ...aapl, ticker: "aapl" }], prices);
    expect(v.sinPrecio).toBe(false);
    expect(v.price).toBe(12000);
  });

  it("refleja pérdidas", () => {
    const [v] = valuate(
      [{ ...aapl, ticker: "GGAL", quantity: 5, avgPrice: 10000 }],
      prices,
    );
    expect(v.ganancia).toBe(-10000);
    expect(v.gananciaPct).toBeCloseTo(-20);
  });
});

describe("totals", () => {
  it("suma la cartera entera", () => {
    const valued = valuate(
      [aapl, { ...aapl, id: "2", ticker: "GGAL", quantity: 5, avgPrice: 10000 }],
      prices,
    );
    const t = totals(valued);
    expect(t.costo).toBe(150000);
    expect(t.valor).toBe(160000);
    expect(t.ganancia).toBe(10000);
    expect(t.gananciaPct).toBeCloseTo(6.667, 2);
    expect(t.sinPrecio).toBe(0);
  });

  it("cartera vacía no divide por cero", () => {
    const t = totals([]);
    expect(t.valor).toBe(0);
    expect(t.gananciaPct).toBe(0);
  });
});

describe("aDolares", () => {
  it("convierte al MEP", () => {
    expect(aDolares(150000, prices)).toBe(100);
  });

  it("devuelve 0 si no hay cotización", () => {
    expect(aDolares(150000, null)).toBe(0);
  });
});

describe("bonos: precio por lámina de 100 nominales", () => {
  const bono: Holding = {
    id: "b",
    ticker: "AL30",
    name: "Bonar 2030",
    kind: "bono",
    quantity: 500,
    avgPrice: 78500,
  };
  const conBono: Prices = {
    ...prices,
    precios: { ...prices.precios, AL30: { price: 86200, pctChange: 0.4 } },
  };

  it("no infla la posición 100 veces", () => {
    const [v] = valuate([bono], conBono);
    expect(v.costo).toBe(392500); // 500 × 78.500 / 100
    expect(v.valor).toBe(431000); // 500 × 86.200 / 100
    expect(v.gananciaPct).toBeCloseTo(9.8, 1);
  });

  it("una acción sigue multiplicándose directo", () => {
    const [v] = valuate([{ ...bono, kind: "accion", ticker: "GGAL", quantity: 150, avgPrice: 7120 }], prices);
    expect(v.costo).toBe(1068000);
  });
});
