// ─────────────────────────────────────────────────────────────────
// FLUIR INVERTÍ (Gold) — contenido educativo del journey.
// REGLA DE ORO: todo es EDUCATIVO, nunca prescriptivo. Fluir no es asesor
// financiero registrado ante CNV. Nada de "comprá esto"; sí "así funciona".
// Escrito en criollo, para alguien que nunca invirtió.
// ─────────────────────────────────────────────────────────────────

export type Riesgo = "bajo" | "medio" | "alto";

export interface Broker {
  nombre: string;
  blurb: string;
  bueno_para: string;
  url: string;
}

// Orden neutral (alfabético). Fluir NO recomienda ninguno en particular.
export const BROKERS: Broker[] = [
  {
    nombre: "Balanz",
    blurb: "Grande y completo, con muchas opciones de inversión.",
    bueno_para: "Querés variedad y crecer con el tiempo",
    url: "https://balanz.com",
  },
  {
    nombre: "Cocos Capital",
    blurb: "App simple y en criollo, pensada para arrancar de cero.",
    bueno_para: "Es tu primera vez y querés algo fácil",
    url: "https://cocos.capital",
  },
  {
    nombre: "IOL (invertironline)",
    blurb: "De los más usados, con mucho material para aprender.",
    bueno_para: "Querés aprender mientras invertís",
    url: "https://www.invertironline.com",
  },
  {
    nombre: "PPI (Portfolio Personal)",
    blurb: "Orientado a quienes buscan más herramientas y análisis.",
    bueno_para: "Ya sabés algo y querés más control",
    url: "https://portfoliopersonal.com",
  },
];

export interface TipoInversion {
  nombre: string;
  criollo: string; // cómo funciona, en una línea
  riesgo: Riesgo;
  plazo: string;
  jerga?: string; // término del glosario para tappear
}

// De menor a mayor "susto" (riesgo), como en el journey.
export const TIPOS: TipoInversion[] = [
  {
    nombre: "Fondo money market",
    criollo: "Tu plata rinde todos los días y la sacás cuando querés. El escalón más suave para empezar.",
    riesgo: "bajo",
    plazo: "Disponible siempre",
    jerga: "money-market",
  },
  {
    nombre: "Plazo fijo",
    criollo: "Dejás la plata un tiempo fijo a cambio de una tasa que ya conocés de antemano.",
    riesgo: "bajo",
    plazo: "Desde 30 días",
    jerga: "plazo-fijo",
  },
  {
    nombre: "CEDEARs",
    criollo: "Comprás pedacitos de empresas de afuera (tipo Apple o Mercado Libre) pagando en pesos.",
    riesgo: "medio",
    plazo: "El que vos quieras",
    jerga: "cedear",
  },
  {
    nombre: "Bonos",
    criollo: "Le prestás plata al Estado o a una empresa y te la devuelven con intereses.",
    riesgo: "medio",
    plazo: "Variable",
    jerga: "bono",
  },
];

// Glosario para la jerga tappeable: término → explicación en una línea.
export const GLOSARIO: Record<string, string> = {
  broker:
    "Una especie de billetera para invertir: la cuenta desde donde comprás y vendés inversiones.",
  fci: "Fondo Común de Inversión: juntan la plata de muchas personas y la invierten por vos.",
  "money-market":
    "Un fondo de bajo riesgo donde tu plata rinde día a día y la podés retirar cuando quieras.",
  cedear:
    "Un certificado que representa una acción de una empresa extranjera, pero que comprás en pesos y en Argentina.",
  bono: "Un préstamo que le hacés al Estado o a una empresa; te devuelven el capital más intereses.",
  "plazo-fijo":
    "Inmovilizás tu plata por un plazo (ej. 30 días) y al final te devuelven el capital más una tasa fija.",
  tir: "Tasa Interna de Retorno: cuánto rinde de verdad una inversión por año, ya contando todo.",
  rendimiento: "Cuánto ganó (o perdió) tu plata, normalmente expresado en porcentaje.",
  "colchon-emergencia":
    "Plata guardada y disponible que cubre 3 a 6 meses de tus gastos, para imprevistos.",
  inflacion:
    "La suba general de precios: hace que la misma plata compre menos con el tiempo.",
  "dolar-mep":
    "Una forma legal de comprar dólares a través del mercado, usando tu cuenta de broker.",
};

export const DISCLAIMER =
  "Fluir es una herramienta educativa, no un asesor financiero registrado. Nada de esto es una recomendación de inversión. Informate y, ante dudas, consultá con un profesional matriculado.";
