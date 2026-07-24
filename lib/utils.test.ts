import { describe, it, expect } from "vitest";
import { capitalize } from "./utils";

describe("capitalize", () => {
  it("arregla el nombre en minúscula", () => {
    expect(capitalize("victoria")).toBe("Victoria");
  });

  it("no toca el resto del texto", () => {
    expect(capitalize("MARÍA")).toBe("MARÍA");
    expect(capitalize("de la Cruz")).toBe("De la Cruz");
  });

  it("no rompe con vacío ni con acentos", () => {
    expect(capitalize("")).toBe("");
    expect(capitalize("ángel")).toBe("Ángel");
  });
});
