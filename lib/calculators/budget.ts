// ─────────────────────────────────────────────────────────────────
// FLUIR — Algoritmo de distribución del presupuesto
// Convierte las respuestas del onboarding en una distribución mensual
// por categoría. Regla 50/30/20 adaptada al contexto argentino.
//
// Principio de honestidad: siempre muestra la realidad, nunca ajusta
// silenciosamente. Si el margen es bajo, informa.
// ─────────────────────────────────────────────────────────────────

/** Frecuencia de salidas. */
export type GoesOutLevel = "poco" | "seguido" | "mucho";
/** Nivel de gasto en ropa. */
export type ClothesLevel = "poco" | "moderado" | "mucho";

export interface OnboardingAnswers {
  income: number; // ingreso mensual en ARS
  pays_rent: boolean; // paga alquiler o expensas
  has_car: boolean; // tiene auto o moto
  goes_out_often: GoesOutLevel;
  spends_on_clothes: ClothesLevel;
  has_debt: boolean; // tiene deudas fijas recurrentes
}

export interface BudgetCategory {
  category: string;
  allocated: number; // monto sugerido por Fluir
  limit: number; // monto ajustable por el usuario (igual a allocated al inicio)
  percent: number; // porcentaje del ingreso total
  is_fixed: boolean; // true = gasto fijo (vivienda, deuda), false = variable
}

export interface BudgetResult {
  categories: BudgetCategory[];
  total_fixed: number;
  total_variable: number;
  total_savings: number;
  savings_rate: number; // % del ingreso destinado a ahorro
  is_tight: boolean; // true si el ahorro < 5% del ingreso
  tight_message: string | null;
}

// ── Factores por perfil de estilo de vida ──────────────────────────

const SALIDAS_FACTOR: Record<GoesOutLevel, number> = {
  poco: 0.1,
  seguido: 0.2,
  mucho: 0.28,
};

const ROPA_FACTOR: Record<ClothesLevel, number> = {
  poco: 0.05,
  moderado: 0.12,
  mucho: 0.18,
};

// Porcentaje del ingreso para gastos fijos según perfil
const VIVIENDA_FACTOR = {
  con_alquiler: 0.35, // alquiler + expensas suele ser 30–40% en AMBA
  sin_alquiler: 0.04, // solo expensas o servicios básicos
};

const AUTO_FACTOR = {
  con_auto: 0.09, // nafta + seguro + patente estimado
  sin_auto: 0.05, // transporte público
};

const DEUDA_FACTOR = {
  con_deuda: 0.1,
  sin_deuda: 0,
};

const COMIDA_FACTOR = 0.15;
const SUSCRIPCIONES_FACTOR = 0.04;
const MINIMO_AHORRO_RATE = 0.05; // si el ahorro cae debajo del 5%, is_tight = true

// ── Función principal ──────────────────────────────────────────────

export function calculateBudget(answers: OnboardingAnswers): BudgetResult {
  const { income, pays_rent, has_car, goes_out_often, spends_on_clothes, has_debt } =
    answers;

  // Paso 1: gastos fijos
  const vivienda = Math.round(
    income * (pays_rent ? VIVIENDA_FACTOR.con_alquiler : VIVIENDA_FACTOR.sin_alquiler)
  );
  const transporte = Math.round(
    income * (has_car ? AUTO_FACTOR.con_auto : AUTO_FACTOR.sin_auto)
  );
  const deuda = Math.round(
    income * (has_debt ? DEUDA_FACTOR.con_deuda : DEUDA_FACTOR.sin_deuda)
  );
  const comida = Math.round(income * COMIDA_FACTOR);
  const suscripciones = Math.round(income * SUSCRIPCIONES_FACTOR);

  const total_fixed = vivienda + transporte + deuda;

  // Paso 2: disponible para gastos variables
  const disponible = income - total_fixed - comida - suscripciones;

  // Paso 3: distribuir el disponible según perfil
  const salidas_raw = Math.round(disponible * SALIDAS_FACTOR[goes_out_often]);
  const ropa_raw = Math.round(disponible * ROPA_FACTOR[spends_on_clothes]);

  // Paso 4: ahorro residual (lo que sobra)
  const ahorro_calculado =
    income - total_fixed - comida - suscripciones - salidas_raw - ropa_raw;

  // Paso 5: si el ahorro es negativo, recortar variables en proporción 60/40
  let salidas = salidas_raw;
  let ropa = ropa_raw;
  if (ahorro_calculado < 0) {
    const deficit = Math.abs(ahorro_calculado);
    salidas = Math.max(salidas_raw - Math.round(deficit * 0.6), 0);
    ropa = Math.max(ropa_raw - Math.round(deficit * 0.4), 0);
  }

  // Paso 6: ahorro final y detección de situación ajustada
  const total_variable = salidas + ropa + comida + suscripciones;
  const total_savings = income - total_fixed - total_variable;
  const savings_rate = total_savings / income;
  const is_tight = savings_rate < MINIMO_AHORRO_RATE;

  // Paso 7: mensaje contextual honesto (nunca culpabilizador)
  let tight_message: string | null = null;
  if (is_tight && ahorro_calculado < 0) {
    tight_message =
      "Con tu perfil actual, los gastos fijos se llevan una parte importante de tu ingreso. Ajustamos un poco los límites de salidas y ropa para que tengas algo de margen. Podés modificarlos desde el dashboard cuando quieras.";
  } else if (is_tight) {
    tight_message =
      "Tu margen de ahorro este mes es ajustado. Está bien — Fluir te ayuda a ver adónde va tu plata igual. Si querés más margen, podés bajar algún límite desde el dashboard.";
  }

  // Paso 8: armar resultado
  const mk = (
    category: string,
    amount: number,
    is_fixed: boolean
  ): BudgetCategory => ({
    category,
    allocated: amount,
    limit: amount,
    percent: round2((amount / income) * 100),
    is_fixed,
  });

  const categories: BudgetCategory[] = [
    mk("Vivienda", vivienda, true),
    mk("Comida", comida, false),
    mk("Salidas", salidas, false),
    mk("Transporte", transporte, true),
    mk("Ropa", ropa, false),
    mk("Suscripciones", suscripciones, false),
    ...(has_debt ? [mk("Deuda", deuda, true)] : []),
    mk("Ahorro", Math.max(total_savings, 0), false),
  ];

  return {
    categories,
    total_fixed,
    total_variable,
    total_savings: Math.max(total_savings, 0),
    savings_rate: Math.max(savings_rate, 0),
    is_tight,
    tight_message,
  };
}

// ─────────────────────────────────────────────────────────────────
// Recalcular el presupuesto desde montos REALES editados por el usuario.
// El ahorro siempre es el residual honesto: ingreso − suma de lo demás.
// Si la suma supera el ingreso, total_savings es negativo (se avisa).
// ─────────────────────────────────────────────────────────────────

export function recalcFromLimits(
  income: number,
  categories: BudgetCategory[]
): BudgetResult {
  const others = categories.filter((c) => c.category !== "Ahorro");

  const total_fixed = others
    .filter((c) => c.is_fixed)
    .reduce((s, c) => s + c.limit, 0);
  const total_variable = others
    .filter((c) => !c.is_fixed)
    .reduce((s, c) => s + c.limit, 0);
  const total_savings = income - total_fixed - total_variable;
  const savings_rate = income > 0 ? total_savings / income : 0;
  const is_tight = savings_rate < MINIMO_AHORRO_RATE;

  const rebuilt: BudgetCategory[] = others.map((c) => ({
    ...c,
    allocated: c.limit,
    percent: income > 0 ? round2((c.limit / income) * 100) : 0,
  }));
  rebuilt.push({
    category: "Ahorro",
    allocated: Math.max(total_savings, 0),
    limit: Math.max(total_savings, 0),
    percent: income > 0 ? round2((Math.max(total_savings, 0) / income) * 100) : 0,
    is_fixed: false,
  });

  let tight_message: string | null = null;
  if (total_savings < 0) {
    tight_message =
      "Con estos montos te estás pasando de tu ingreso. Bajá algún límite para que el mes cierre.";
  } else if (is_tight) {
    tight_message =
      "Tu margen de ahorro es ajustado. Está bien — Fluir te ayuda a ver adónde va tu plata igual.";
  }

  return {
    categories: rebuilt,
    total_fixed,
    total_variable,
    total_savings: Math.max(total_savings, 0),
    savings_rate: Math.max(savings_rate, 0),
    is_tight,
    tight_message,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
