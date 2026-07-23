import { describe, it, expect } from "vitest";
import {
  parseAmount,
  parseDateISO,
  normalizeMerchant,
  dedupKey,
} from "./normalize";
import { categorize } from "./categorize";
import { parseCSV } from "./csv";
import { buildMovements } from "./engine";

describe("parseAmount", () => {
  it("formato AR (miles . / decimal ,)", () => {
    expect(parseAmount("1.234,56")).toBe(1234.56);
    expect(parseAmount("$ 12.500,00")).toBe(12500);
    expect(parseAmount("1.234.567,89")).toBe(1234567.89);
  });
  it("formato US (miles , / decimal .)", () => {
    expect(parseAmount("1,234.56")).toBe(1234.56);
  });
  it("enteros y signos", () => {
    expect(parseAmount("400000")).toBe(400000);
    expect(parseAmount("-1.234,56")).toBe(1234.56); // valor absoluto
    expect(parseAmount("(1.234,56)")).toBe(1234.56);
    expect(parseAmount("1.234,56-")).toBe(1234.56);
  });
});

describe("parseDateISO", () => {
  it("varios formatos", () => {
    expect(parseDateISO("05/07/2026")).toBe("2026-07-05");
    expect(parseDateISO("2026-07-05")).toBe("2026-07-05");
    expect(parseDateISO("5/7/26")).toBe("2026-07-05");
    expect(parseDateISO("12 ago 2026")).toBe("2026-08-12");
  });
  it("dd/mm sin año usa el año de referencia", () => {
    expect(parseDateISO("05/07", new Date(2026, 0, 1))).toBe("2026-07-05");
  });
  it("basura devuelve vacío", () => {
    expect(parseDateISO("Saldo final")).toBe("");
  });
});

describe("normalizeMerchant", () => {
  it("saca acentos, ruido y máscaras", () => {
    expect(normalizeMerchant("COMPRA COTO *1234")).toBe("coto");
    expect(normalizeMerchant("Pago YPF Estación")).toContain("ypf");
    expect(normalizeMerchant("RAPPI*Rappi Argentina")).toContain("rappi");
  });
});

describe("categorize", () => {
  const cats = ["Comida", "Transporte", "Salidas", "Ropa", "Suscripciones", "Vivienda"];
  it("reglas de comercio", () => {
    expect(categorize("coto", cats).category).toBe("Comida");
    expect(categorize("ypf", cats).category).toBe("Transporte");
    expect(categorize("netflix", cats).category).toBe("Suscripciones");
  });
  it("override gana sobre reglas", () => {
    const r = categorize("coto", cats, { coto: "Salidas" });
    expect(r.category).toBe("Salidas");
    expect(r.method).toBe("override");
  });
  it("ambiguo devuelve null", () => {
    expect(categorize("kiosco don pepe", cats).category).toBeNull();
  });
  it("matchea la categoría real del usuario aunque se llame distinto", () => {
    expect(categorize("coto", ["Supermercado"]).category).toBe("Supermercado");
  });
});

describe("dedupKey", () => {
  it("mismo movimiento = misma clave", () => {
    expect(dedupKey("2026-07-05", 1234.56, "coto")).toBe(
      dedupKey("2026-07-05", 1234.56, "coto")
    );
  });
});

describe("parseCSV", () => {
  it("con encabezado", () => {
    const csv = [
      "Fecha;Descripción;Importe",
      "05/07/2026;COMPRA COTO;12.500,00",
      "06/07/2026;RAPPI;3.200,50",
      "Saldo;;100.000,00",
    ].join("\n");
    const { raws } = parseCSV(csv);
    expect(raws.length).toBe(2);
    expect(raws[0].comercio).toContain("COTO");
  });
  it("sin encabezado (detección por contenido)", () => {
    const csv = ["05/07/2026,YPF,8.000,00", "06/07/2026,NETFLIX,4.990,00"].join("\n");
    const { raws } = parseCSV(csv);
    expect(raws.length).toBe(2);
  });
});

describe("buildMovements (end to end)", () => {
  const cats = ["Comida", "Transporte", "Suscripciones"];
  it("normaliza, categoriza, saltea créditos y dedupe", () => {
    const csv = [
      "Fecha;Descripción;Importe",
      "05/07/2026;COMPRA COTO;12.500,00",
      "05/07/2026;COMPRA COTO;12.500,00", // duplicado
      "06/07/2026;YPF;8.000,00",
      "07/07/2026;Acreditación sueldo;-500.000,00", // crédito
    ].join("\n");
    const { raws } = parseCSV(csv);
    const { movements, warnings } = buildMovements(raws, { userCategories: cats });
    expect(movements.length).toBe(2); // dedup + sin el crédito
    const coto = movements.find((m) => m.merchantNorm === "coto");
    expect(coto?.category).toBe("Comida");
    expect(coto?.amount).toBe(12500);
    expect(warnings.join(" ")).toMatch(/ingreso|cr[ée]dito/i);
  });
});
