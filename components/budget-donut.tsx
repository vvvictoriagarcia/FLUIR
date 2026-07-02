"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { BudgetCategory } from "@/lib/calculators/budget";

const COLORS: Record<string, string> = {
  Vivienda: "#6C63FF",
  Comida: "#3EBD8F",
  Salidas: "#F0B429",
  Transporte: "#E05C5C",
  Ropa: "#885CF6",
  Suscripciones: "#38BDF8",
  Deuda: "#F97316",
  Ahorro: "#34D399",
  Otros: "#94A3B8",
};

const colorFor = (name: string) => COLORS[name] ?? "#94A3B8";

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
