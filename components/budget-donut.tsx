"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { BudgetCategory } from "@/lib/calculators/budget";

// Paleta categórica sobria, anclada en el azul institucional (sin violetas).
const COLORS: Record<string, string> = {
  Vivienda: "#2450e0", // azul de marca — suele ser la categoría más grande
  Comida: "#0e9f6e",
  Salidas: "#b8862b",
  Transporte: "#d64545",
  Ropa: "#6e93ff",
  Suscripciones: "#0ea5b7",
  Deuda: "#cf7a1c",
  Ahorro: "#34d399",
  Otros: "#94a3b8",
};

const colorFor = (name: string) => COLORS[name] ?? "#94a3b8";

export function BudgetDonut({ categories }: { categories: BudgetCategory[] }) {
  const data = categories
    .filter((c) => c.limit > 0)
    .map((c) => ({ name: c.category, value: c.limit, percent: c.percent }));

  return (
    <div className="flex items-center gap-5">
      <div className="h-36 w-36 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={44}
              outerRadius={68}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.name} fill={colorFor(d.name)} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="flex-1 space-y-1.5 text-sm">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: colorFor(d.name) }}
            />
            <span className="flex-1 truncate">{d.name}</span>
            <span className="tabular-nums text-muted-foreground">{d.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
