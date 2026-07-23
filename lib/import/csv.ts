// ─────────────────────────────────────────────────────────────────
// FLUIR — Motor de ingesta: parser CSV genérico
// Detecta el separador y las columnas (por header o por contenido).
// Cubre muchos exports de homebanking sin hardcodear cada banco;
// los adaptadores por banco se suman después sobre esta base.
// ─────────────────────────────────────────────────────────────────

import type { RawMovement } from "./types";
import { parseDateISO } from "./normalize";

const HEADERS = {
  fecha: /^(fecha|date|d[ií]a|f\.?\s*oper)/i,
  comercio: /^(descrip|detalle|comercio|concepto|referencia|movimiento|rubro|leyenda)/i,
  monto: /^(importe|monto|d[ée]bito|cargo|valor|amount|gasto|pesos)/i,
  moneda: /^(moneda|currency|divisa)/i,
};

function detectDelimiter(sample: string): string {
  const cands = [";", "\t", ","];
  let best = ",";
  let max = -1;
  for (const d of cands) {
    const count = (sample.match(new RegExp(`\\${d}`, "g")) ?? []).length;
    if (count > max) {
      max = count;
      best = d;
    }
  }
  return best;
}

/** Divide una línea CSV respetando comillas. */
function splitLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delim && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

const AMOUNT_RE = /^-?\(?\$?\s*[\d.]+(?:,\d{1,2})?\)?-?$|^-?\$?\s*\d[\d,]*(?:\.\d{1,2})?$/;

function looksLikeAmount(s: string): boolean {
  const t = s.trim();
  return t !== "" && AMOUNT_RE.test(t) && /\d/.test(t);
}

function looksLikeDate(s: string): boolean {
  return parseDateISO(s) !== "";
}

/** Puntúa cada columna por contenido y elige fecha / comercio / monto. */
function detectColumnsByContent(rows: string[][]): {
  fecha: number;
  comercio: number;
  monto: number;
} {
  const cols = Math.max(...rows.map((r) => r.length));
  const dateScore = new Array(cols).fill(0);
  const amountScore = new Array(cols).fill(0);
  const textLen = new Array(cols).fill(0);

  for (const r of rows) {
    for (let c = 0; c < cols; c++) {
      const cell = r[c] ?? "";
      if (looksLikeDate(cell)) dateScore[c]++;
      else if (looksLikeAmount(cell)) amountScore[c]++;
      else if (/[a-záéíóúñ]/i.test(cell)) textLen[c] += cell.length;
    }
  }

  const argmax = (a: number[]) => a.indexOf(Math.max(...a));
  return {
    fecha: argmax(dateScore),
    monto: argmax(amountScore),
    comercio: argmax(textLen),
  };
}

/**
 * Parsea un CSV de homebanking a movimientos crudos.
 * Devuelve los movimientos y avisos si algo se salteó.
 */
export function parseCSV(text: string): { raws: RawMovement[]; warnings: string[] } {
  const warnings: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return { raws: [], warnings: ["El archivo está vacío."] };

  const delim = detectDelimiter(lines.slice(0, 5).join("\n"));
  const table = lines.map((l) => splitLine(l, delim));

  // ¿La primera fila es encabezado?
  const first = table[0].map((c) => c.toLowerCase());
  const hasHeader = first.some(
    (c) => HEADERS.fecha.test(c) || HEADERS.monto.test(c) || HEADERS.comercio.test(c)
  );

  let idx: { fecha: number; comercio: number; monto: number; moneda: number };
  let dataRows: string[][];

  if (hasHeader) {
    const find = (re: RegExp) => first.findIndex((c) => re.test(c));
    idx = {
      fecha: find(HEADERS.fecha),
      comercio: find(HEADERS.comercio),
      monto: find(HEADERS.monto),
      moneda: find(HEADERS.moneda),
    };
    dataRows = table.slice(1);
    // Si faltó alguna clave, completar con detección por contenido.
    if (idx.fecha < 0 || idx.comercio < 0 || idx.monto < 0) {
      const byContent = detectColumnsByContent(dataRows);
      if (idx.fecha < 0) idx.fecha = byContent.fecha;
      if (idx.comercio < 0) idx.comercio = byContent.comercio;
      if (idx.monto < 0) idx.monto = byContent.monto;
    }
  } else {
    const byContent = detectColumnsByContent(table);
    idx = { ...byContent, moneda: -1 };
    dataRows = table;
  }

  const raws: RawMovement[] = [];
  for (const r of dataRows) {
    const fecha = r[idx.fecha] ?? "";
    const comercio = r[idx.comercio] ?? "";
    const monto = r[idx.monto] ?? "";
    if (!fecha || !monto || !looksLikeDate(fecha)) continue; // fila de saldo/total/basura
    raws.push({
      fecha,
      comercio: comercio || "Sin descripción",
      monto,
      moneda: idx.moneda >= 0 ? r[idx.moneda] : null,
    });
  }

  if (raws.length === 0) {
    warnings.push("No se reconocieron movimientos. ¿Es un export de homebanking?");
  }
  return { raws, warnings };
}
