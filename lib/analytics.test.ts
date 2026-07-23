import { describe, it, expect } from "vitest";
import { sanitize } from "./analytics";

describe("sanitize", () => {
  it("deja pasar lo que sirve para medir", () => {
    expect(sanitize({ plan: "gold", categorias: 7, primera_vez: true })).toEqual({
      plan: "gold",
      categorias: 7,
      primera_vez: true,
    });
  });

  it("no deja viajar datos personales", () => {
    const out = sanitize({
      email: "vic@gmail.com",
      nombre: "Victoria",
      telefono: "1178266423",
      plan: "free",
    });
    expect(out).toEqual({ plan: "free" });
  });

  it("tampoco montos exactos", () => {
    const out = sanitize({ monto: 350000, income: 2000000, tramo: "alto" });
    expect(out).toEqual({ tramo: "alto" });
  });

  it("atrapa la clave aunque venga camuflada", () => {
    expect(sanitize({ user_email: "x@y.com", montoTotal: 1 })).toEqual({});
  });

  it("recorta textos largos para no guardar párrafos", () => {
    const largo = "a".repeat(200);
    expect(String(sanitize({ error: largo }).error)).toHaveLength(80);
  });

  it("no rompe con props vacías", () => {
    expect(sanitize({})).toEqual({});
  });
});
