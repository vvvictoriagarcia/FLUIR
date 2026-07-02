// ─────────────────────────────────────────────────────────────────
// FLUIR — Algoritmo de distribución del presupuesto
// Archivo: lib/calculators/budget.ts
// ─────────────────────────────────────────────────────────────────
//
// Convierte las respuestas del onboarding en una distribución
// mensual por categoría. Basado en la regla 50/30/20 adaptada
// al contexto argentino.
//
// Principio de honestidad: siempre muestra la realidad,
// nunca ajusta silenciosamente. Si el margen es bajo, informa.
// ─────────────────────────────────────────────────────────────────

export type FrequencyLevel = 'poco' | 'seguido' | 'mucho'

export interface OnboardingAnswers {
  income:             number        // ingreso mensual en ARS
  pays_rent:          boolean       // paga alquiler o expensas
  has_car:            boolean       // tiene auto o moto
  goes_out_often:     FrequencyLevel
  spends_on_clothes:  FrequencyLevel
  has_debt:           boolean       // tiene deudas fijas recurrentes
}

export interface BudgetCategory {
  category:   string
  allocated:  number   // monto sugerido por Fluir
  limit:      number   // monto ajustable por el usuario (igual a allocated al inicio)
  percent:    number   // porcentaje del ingreso total
  is_fixed:   boolean  // true = gasto fijo (vivienda, deuda), false = variable
}

export interface BudgetResult {
  categories:       BudgetCategory[]
  total_fixed:      number     // suma de gastos fijos
  total_variable:   number     // suma de gastos variables
  total_savings:    number     // ahorro proyectado
  savings_rate:     number     // % del ingreso destinado a ahorro
  is_tight:         boolean    // true si el ahorro < 5% del ingreso
  tight_message:    string | null  // mensaje contextual si is_tight = true
}

// ─────────────────────────────────────────────────────────────────
// Factores por perfil de estilo de vida
// ─────────────────────────────────────────────────────────────────

const SALIDAS_FACTOR: Record<FrequencyLevel, number> = {
  poco:    0.10,
  seguido: 0.20,
  mucho:   0.28,
}

const ROPA_FACTOR: Record<FrequencyLevel, number> = {
  poco:     0.05,
  moderado: 0.12,
  mucho:    0.18,
}

// Porcentaje del ingreso para gastos fijos según perfil
const VIVIENDA_FACTOR = {
  con_alquiler: 0.35,   // alquiler + expensas suele ser 30-40% en AMBA
  sin_alquiler: 0.04,   // solo expensas o servicios básicos
}

const AUTO_FACTOR = {
  con_auto: 0.09,       // nafta + seguro + patente estimado
  sin_auto: 0.05,       // transporte público
}

const DEUDA_FACTOR = {
  con_deuda: 0.10,
  sin_deuda: 0,
}

// Gastos fijos de base (comida y suscripciones son siempre los mismos)
const COMIDA_FACTOR       = 0.15
const SUSCRIPCIONES_FACTOR = 0.04
const MINIMO_AHORRO_RATE  = 0.05  // si el ahorro cae debajo del 5%, is_tight = true

// ─────────────────────────────────────────────────────────────────
// Función principal
// ─────────────────────────────────────────────────────────────────

export function calculateBudget(answers: OnboardingAnswers): BudgetResult {
  const { income, pays_rent, has_car, goes_out_often, spends_on_clothes, has_debt } = answers

  // ── Paso 1: Calcular gastos fijos ──────────────────────────────
  const vivienda     = Math.round(income * (pays_rent ? VIVIENDA_FACTOR.con_alquiler : VIVIENDA_FACTOR.sin_alquiler))
  const transporte   = Math.round(income * (has_car   ? AUTO_FACTOR.con_auto         : AUTO_FACTOR.sin_auto))
  const deuda        = Math.round(income * (has_debt  ? DEUDA_FACTOR.con_deuda       : DEUDA_FACTOR.sin_deuda))
  const comida       = Math.round(income * COMIDA_FACTOR)
  const suscripciones = Math.round(income * SUSCRIPCIONES_FACTOR)

  const total_fixed = vivienda + transporte + deuda

  // ── Paso 2: Calcular disponible para gastos variables ──────────
  const disponible = income - total_fixed - comida - suscripciones

  // ── Paso 3: Distribuir el disponible según perfil ──────────────
  const salidas_raw = Math.round(disponible * SALIDAS_FACTOR[goes_out_often])
  const ropa_raw    = Math.round(disponible * ROPA_FACTOR[spends_on_clothes])

  // ── Paso 4: Calcular ahorro residual ──────────────────────────
  // El ahorro es lo que sobra — nunca negativo en la UI
  const ahorro_calculado = income - total_fixed - comida - suscripciones - salidas_raw - ropa_raw
  const ahorro           = Math.max(ahorro_calculado, 0)

  // ── Paso 5: Si el ahorro calculado es negativo, ajustar variables
  // No silenciosamente: salidas y ropa se recortan en proporción
  let salidas = salidas_raw
  let ropa    = ropa_raw

  if (ahorro_calculado < 0) {
    // Distribuir el déficit entre salidas y ropa en proporción 60/40
    const deficit   = Math.abs(ahorro_calculado)
    salidas = Math.max(salidas_raw - Math.round(deficit * 0.60), 0)
    ropa    = Math.max(ropa_raw    - Math.round(deficit * 0.40), 0)
  }

  // ── Paso 6: Calcular ahorro final y detectar situación ajustada
  const total_variable  = salidas + ropa + comida + suscripciones
  const total_savings   = income - total_fixed - total_variable
  const savings_rate    = total_savings / income

  const is_tight = savings_rate < MINIMO_AHORRO_RATE

  // ── Paso 7: Mensaje contextual honesto (nunca culpabilizador) ──
  let tight_message: string | null = null

  if (is_tight && ahorro_calculado < 0) {
    tight_message = `Con tu perfil actual, los gastos fijos se llevan una parte importante de tu ingreso. Ajustamos un poco los límites de salidas y ropa para que tengas algo de margen. Podés modificarlos desde el dashboard cuando quieras.`
  } else if (is_tight) {
    tight_message = `Tu margen de ahorro este mes es ajustado. Está bien — Fluir te ayuda a ver adónde va tu plata igual. Si querés más margen, podés bajar algún límite desde el dashboard.`
  }

  // ── Paso 8: Armar resultado ────────────────────────────────────
  const categories: BudgetCategory[] = [
    {
      category:  'Vivienda',
      allocated: vivienda,
      limit:     vivienda,
      percent:   round2(vivienda / income * 100),
      is_fixed:  true,
    },
    {
      category:  'Comida',
      allocated: comida,
      limit:     comida,
      percent:   round2(comida / income * 100),
      is_fixed:  false,
    },
    {
      category:  'Salidas',
      allocated: salidas,
      limit:     salidas,
      percent:   round2(salidas / income * 100),
      is_fixed:  false,
    },
    {
      category:  'Transporte',
      allocated: transporte,
      limit:     transporte,
      percent:   round2(transporte / income * 100),
      is_fixed:  true,
    },
    {
      category:  'Ropa',
      allocated: ropa,
      limit:     ropa,
      percent:   round2(ropa / income * 100),
      is_fixed:  false,
    },
    {
      category:  'Suscripciones',
      allocated: suscripciones,
      limit:     suscripciones,
      percent:   round2(suscripciones / income * 100),
      is_fixed:  false,
    },
    ...(has_debt ? [{
      category:  'Deuda',
      allocated: deuda,
      limit:     deuda,
      percent:   round2(deuda / income * 100),
      is_fixed:  true,
    }] : []),
    {
      category:  'Ahorro',
      allocated: Math.max(total_savings, 0),
      limit:     Math.max(total_savings, 0),
      percent:   round2(Math.max(savings_rate, 0) * 100),
      is_fixed:  false,
    },
  ]

  return {
    categories,
    total_fixed,
    total_variable,
    total_savings:  Math.max(total_savings, 0),
    savings_rate:   Math.max(savings_rate, 0),
    is_tight,
    tight_message,
  }
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// ─────────────────────────────────────────────────────────────────
// Tests de casos edge — correr con: npx ts-node budget.ts
// ─────────────────────────────────────────────────────────────────

if (require.main === module) {
  const casos = [
    {
      label: 'Caso base — ingreso medio, sale seguido',
      answers: { income: 400_000, pays_rent: true, has_car: false, goes_out_often: 'seguido' as FrequencyLevel, spends_on_clothes: 'moderado' as FrequencyLevel, has_debt: false },
    },
    {
      label: 'Caso ajustado — ingreso bajo, todo al máximo',
      answers: { income: 300_000, pays_rent: true, has_car: true, goes_out_often: 'mucho' as FrequencyLevel, spends_on_clothes: 'mucho' as FrequencyLevel, has_debt: true },
    },
    {
      label: 'Caso holgado — buen ingreso, gastos bajos',
      answers: { income: 800_000, pays_rent: false, has_car: false, goes_out_often: 'poco' as FrequencyLevel, spends_on_clothes: 'poco' as FrequencyLevel, has_debt: false },
    },
    {
      label: 'Caso joven profesional — primer sueldo',
      answers: { income: 500_000, pays_rent: true, has_car: false, goes_out_often: 'seguido' as FrequencyLevel, spends_on_clothes: 'moderado' as FrequencyLevel, has_debt: false },
    },
  ]

  for (const caso of casos) {
    const result = calculateBudget(caso.answers)
    console.log(`\n── ${caso.label} ──`)
    console.log(`Ingreso: $${caso.answers.income.toLocaleString('es-AR')}`)
    for (const cat of result.categories) {
      console.log(`  ${cat.category.padEnd(14)} $${cat.allocated.toLocaleString('es-AR').padStart(10)}  (${cat.percent}%)`)
    }
    console.log(`  ${'Ahorro rate'.padEnd(14)} ${(result.savings_rate * 100).toFixed(1)}%`)
    if (result.is_tight) console.log(`  ⚠️  ${result.tight_message}`)
  }
}
