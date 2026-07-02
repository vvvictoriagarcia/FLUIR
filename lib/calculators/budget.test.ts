import { describe, it, expect } from "vitest";
import {
  calculateBudget,
  recalcFromLimits,
  type BudgetCategory,
  type OnboardingAnswers,
} from "./budget";

const find = (r: ReturnType<typeof calculateBudget>, name: string) =>
  r.categories.find((c) => c.category === name);

describe("calculateBudget", () => {
  it("perfil con alquiler + auto + deuda incluye los fijos correctos", () => {
    const r = calculateBudget({
      income: 500_000,
      pays_rent: true,
      has_car: true,
      goes_out_often: "seguido",
      spends_on_clothes: "moderado",
      has_debt: true,
    });

    expect(find(r, "Vivienda")?.limit).toBe(175_000); // 35%
    expect(find(r, "Transporte")?.limit).toBe(45_000); // 9% (con auto)
    expect(find(r, "Deuda")?.limit).toBe(50_000); // 10%
    expect(find(r, "Vivienda")?.is_fixed).toBe(true);
    expect(find(r, "Deuda")?.is_fixed).toBe(true);
  });

  it("el perfil más pesado deja el menor margen de ahorro (pero positivo)", () => {
    // calculateBudget usa factores proporcionales al ingreso, así que el ahorro
    // sugerido nunca es negativo; el caso ajustado real se cubre con montos reales
    // (ver recalcFromLimits). Igual verificamos que el perfil pesado ahorre menos.
    const liviano = calculateBudget({
      income: 500_000,
      pays_rent: false,
      has_car: false,
      goes_out_often: "poco",
      spends_on_clothes: "poco",
      has_debt: false,
    });
    const pesado = calculateBudget({
      income: 500_000,
      pays_rent: true,
      has_car: true,
      goes_out_often: "mucho",
      spends_on_clothes: "mucho",
      has_debt: true,
    });
    expect(pesado.savings_rate).toBeLessThan(liviano.savings_rate);
    expect(pesado.total_savings).toBeGreaterThanOrEqual(0);
  });

  it("margen ajustado real (montos altos) → is_tight y mensaje", () => {
    // 500k de ingreso, 480k comprometidos → 4% de ahorro (< 5%) → is_tight
    const cats: BudgetCategory[] = [
      { category: "Vivienda", allocated: 0, limit: 480_000, percent: 0, is_fixed: true },
    ];
    const r = recalcFromLimits(500_000, cats);
    expect(r.is_tight).toBe(true);
    expect(r.tight_message).not.toBeNull();
  });

  it("salir mucho + ropa mucho da salidas y ropa proporcionalmente mayores", () => {
    const base = {
      income: 500_000,
      pays_rent: true,
      has_car: false,
      has_debt: false,
    } as const;

    const poco = calculateBudget({
      ...base,
      goes_out_often: "poco",
      spends_on_clothes: "poco",
    } as OnboardingAnswers);
    const mucho = calculateBudget({
      ...base,
      goes_out_often: "mucho",
      spends_on_clothes: "mucho",
    } as OnboardingAnswers);

    expect(find(mucho, "Salidas")!.limit).toBeGreaterThan(
      find(poco, "Salidas")!.limit
    );
    expect(find(mucho, "Ropa")!.limit).toBeGreaterThan(
      find(poco, "Ropa")!.limit
    );
  });
});

describe("recalcFromLimits", () => {
  it("suma de montos mayor al ingreso → ahorro 0, is_tight y mensaje de exceso", () => {
    const cats: BudgetCategory[] = [
      { category: "Vivienda", allocated: 0, limit: 400_000, percent: 0, is_fixed: true },
      { category: "Comida", allocated: 0, limit: 200_000, percent: 0, is_fixed: false },
    ];
    const r = recalcFromLimits(500_000, cats); // suma 600k > 500k

    expect(r.total_savings).toBe(0);
    expect(r.is_tight).toBe(true);
    expect(r.tight_message).toContain("pasando");
  });

  it("preserva los montos editados y calcula el ahorro como residual", () => {
    const cats: BudgetCategory[] = [
      { category: "Vivienda", allocated: 0, limit: 200_000, percent: 0, is_fixed: true },
      { category: "Comida", allocated: 0, limit: 100_000, percent: 0, is_fixed: false },
    ];
    const r = recalcFromLimits(500_000, cats);

    expect(find(r, "Vivienda")!.limit).toBe(200_000);
    expect(find(r, "Ahorro")!.limit).toBe(200_000); // 500k - 200k - 100k
  });
});
