import { describe, it, expect } from "vitest";
import {
  buildUpcoming,
  dueDateFor,
  daysUntil,
  statusLabel,
  type RecurringPayment,
} from "./recurring";

const base: RecurringPayment = {
  id: "1",
  name: "Alquiler",
  category: "Vivienda",
  amount: 350000,
  dueDay: 5,
  remindDays: 3,
  isActive: true,
};

describe("dueDateFor", () => {
  it("usa el día del mes pedido", () => {
    const d = dueDateFor(5, new Date(2026, 6, 20)); // julio 2026
    expect(d.getDate()).toBe(5);
    expect(d.getMonth()).toBe(6);
  });

  it("no se pasa del último día del mes (31 en febrero)", () => {
    const d = dueDateFor(31, new Date(2026, 1, 10)); // febrero 2026
    expect(d.getDate()).toBe(28);
  });
});

describe("daysUntil", () => {
  it("cuenta días enteros ignorando la hora", () => {
    const today = new Date(2026, 6, 20, 23, 0);
    expect(daysUntil(new Date(2026, 6, 22, 1, 0), today)).toBe(2);
    expect(daysUntil(new Date(2026, 6, 20, 1, 0), today)).toBe(0);
    expect(daysUntil(new Date(2026, 6, 18, 1, 0), today)).toBe(-2);
  });
});

describe("buildUpcoming", () => {
  const today = new Date(2026, 6, 10); // 10 de julio

  it("marca vencido, hoy y próximo según el día", () => {
    const items: RecurringPayment[] = [
      { ...base, id: "vencido", dueDay: 5 },
      { ...base, id: "hoy", dueDay: 10 },
      { ...base, id: "proximo", dueDay: 20 },
    ];
    const out = buildUpcoming(items, new Set(), today);
    expect(out.map((o) => o.status)).toEqual(["vencido", "hoy", "proximo"]);
    expect(out[0].daysLeft).toBe(-5);
    expect(out[2].daysLeft).toBe(10);
  });

  it("los pagados quedan últimos y no aparecen como vencidos", () => {
    const items: RecurringPayment[] = [
      { ...base, id: "pago", dueDay: 5 },
      { ...base, id: "pendiente", dueDay: 20 },
    ];
    const out = buildUpcoming(items, new Set(["pago"]), today);
    expect(out[0].id).toBe("pendiente");
    expect(out[1].status).toBe("pagado");
  });

  it("ignora los desactivados", () => {
    const out = buildUpcoming([{ ...base, isActive: false }], new Set(), today);
    expect(out).toHaveLength(0);
  });
});

describe("statusLabel", () => {
  const today = new Date(2026, 6, 10);
  it("habla en criollo", () => {
    const [p] = buildUpcoming([{ ...base, dueDay: 11 }], new Set(), today);
    expect(statusLabel(p)).toBe("Vence mañana");

    const [v] = buildUpcoming([{ ...base, dueDay: 9 }], new Set(), today);
    expect(statusLabel(v)).toBe("Venció ayer");
  });
});
