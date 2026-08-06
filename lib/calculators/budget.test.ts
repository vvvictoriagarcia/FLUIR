import { describe, it, expect } from "vitest";
import {
  calculateBudget,
  monthBreakdown,
  savingsTrend,
  recalcFromLimits,
  budgetAlerts,
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

describe("monthBreakdown", () => {
  it("cierra cuando todavía no gastaste nada", () => {
    const b = monthBreakdown({
      income: 2000000,
      comprometido: 800000,
      ahorro: 549400,
      gastado: 0,
      quedan: 650600,
    });
    expect(b.cierra).toBe(true);
  });

  it("cierra descontando lo ya gastado", () => {
    const b = monthBreakdown({
      income: 2000000,
      comprometido: 800000,
      ahorro: 549400,
      gastado: 45000,
      quedan: 605600,
    });
    expect(b.cierra).toBe(true);
  });

  it("marca que NO cierra si los números no dan", () => {
    const b = monthBreakdown({
      income: 2000000,
      comprometido: 800000,
      ahorro: 549400,
      gastado: 45000,
      quedan: 650600, // se olvidó de restar lo gastado
    });
    expect(b.cierra).toBe(false);
  });

  it("tolera un peso de redondeo", () => {
    const b = monthBreakdown({
      income: 1000000,
      comprometido: 300000,
      ahorro: 200000,
      gastado: 100000,
      quedan: 399999,
    });
    expect(b.cierra).toBe(true);
  });

  it("cierra igual si te pasaste (queda negativo)", () => {
    const b = monthBreakdown({
      income: 1000000,
      comprometido: 300000,
      ahorro: 200000,
      gastado: 600000,
      quedan: -100000,
    });
    expect(b.cierra).toBe(true);
  });
});

describe("savingsTrend", () => {
  it("marca mejora en puntos", () => {
    const t = savingsTrend(0.31, 0.28);
    expect(t).toEqual({ deltaPts: 3, mejor: true });
  });

  it("marca caída", () => {
    const t = savingsTrend(0.2, 0.28);
    expect(t).toEqual({ deltaPts: -8, mejor: false });
  });

  it("no muestra nada si no hay mes pasado", () => {
    expect(savingsTrend(0.31, null)).toBeNull();
  });

  it("no muestra nada si la diferencia redondea a 0", () => {
    expect(savingsTrend(0.312, 0.309)).toBeNull();
  });
});

describe("budgetAlerts", () => {
  const cats: BudgetCategory[] = [
    { category: "Vivienda", allocated: 0, limit: 200_000, percent: 0, is_fixed: true },
    { category: "Comida", allocated: 0, limit: 100_000, percent: 0, is_fixed: false },
    { category: "Salidas", allocated: 0, limit: 50_000, percent: 0, is_fixed: false },
    { category: "Ahorro", allocated: 0, limit: 150_000, percent: 0, is_fixed: false },
  ];

  it("marca 'over' cuando ya te pasaste del límite, sin importar el día", () => {
    const a = budgetAlerts(cats, { Salidas: 60_000 }, 3, 30);
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({ category: "Salidas", level: "over", overBy: 10_000 });
  });

  it("marca 'pace' si al ritmo te vas a pasar aunque todavía no llegaste", () => {
    // Día 10 de 30 (1/3 del mes) y ya gastaste 25k de 50k → proyecta 75k > 55k.
    const a = budgetAlerts(cats, { Salidas: 25_000 }, 10, 30);
    expect(a).toHaveLength(1);
    expect(a[0].category).toBe("Salidas");
    expect(a[0].level).toBe("pace");
    expect(a[0].projected).toBe(75_000);
  });

  it("NO alerta por ritmo antes del día 5 (proyección ruidosa)", () => {
    // Día 2: 20k de 50k proyectaría 300k, pero es demasiado temprano para avisar.
    expect(budgetAlerts(cats, { Salidas: 20_000 }, 2, 30)).toHaveLength(0);
  });

  it("ignora fijos, Ahorro y categorías sin gasto", () => {
    const a = budgetAlerts(
      cats,
      { Vivienda: 500_000, Ahorro: 500_000, Comida: 0 },
      15,
      30,
    );
    expect(a).toHaveLength(0);
  });

  it("ordena primero lo ya excedido y luego por cuánto se pasa", () => {
    const a = budgetAlerts(
      cats,
      { Salidas: 60_000, Comida: 60_000 }, // Salidas over; Comida a ritmo se pasa
      12,
      30,
    );
    expect(a.map((x) => x.level)).toEqual(["over", "pace"]);
    expect(a[0].category).toBe("Salidas");
  });

  it("no alerta si vas dentro del ritmo esperado", () => {
    // Día 15 de 30 (mitad) y gastaste la mitad justa → proyecta el límite, sin margen de sobra.
    expect(budgetAlerts(cats, { Salidas: 25_000 }, 15, 30)).toHaveLength(0);
  });
});
