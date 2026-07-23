"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, ChevronRight } from "lucide-react";
import {
  loadRecurring,
  loadPaidThisMonth,
  buildUpcoming,
  statusLabel,
  type UpcomingPayment,
} from "@/lib/recurring";
import { formatARS, cn } from "@/lib/utils";

/**
 * "Lo que se viene": los próximos pagos fijos, arriba de todo en el dashboard.
 * Si no hay ninguno cargado, invita a cargarlos (una sola vez).
 */
export function UpcomingPayments() {
  const [items, setItems] = useState<UpcomingPayment[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [list, paid] = await Promise.all([
          loadRecurring(),
          loadPaidThisMonth(),
        ]);
        if (alive) setItems(buildUpcoming(list, paid));
      } catch {
        if (alive) setItems([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (items === null) return null;

  const pendientes = items.filter((i) => i.status !== "pagado");

  if (items.length === 0) {
    return (
      <Link
        href="/pagos"
        className="mt-4 flex items-center gap-3 rounded-card border border-border bg-card p-4 transition-colors hover:bg-muted"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
          <CalendarClock size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium">Cargá tus pagos fijos</p>
          <p className="text-xs text-muted-foreground">
            Alquiler, tarjeta, seguro: te avisamos antes de que venzan
          </p>
        </div>
        <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-muted-foreground" />
      </Link>
    );
  }

  if (pendientes.length === 0) {
    return (
      <Link
        href="/pagos"
        className="mt-4 flex items-center gap-3 rounded-card border border-positive/30 bg-positive/5 p-4"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-positive/15 text-positive">
          <CalendarClock size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium">Pagos fijos al día 🎉</p>
          <p className="text-xs text-muted-foreground">
            No te queda nada por pagar este mes
          </p>
        </div>
        <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-muted-foreground" />
      </Link>
    );
  }

  const total = pendientes.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="mt-4 overflow-hidden rounded-card border border-border bg-card">
      <div className="flex items-center justify-between px-4 pt-4">
        <span className="text-sm font-medium">Lo que se viene</span>
        <Link href="/pagos" className="text-xs font-medium text-brand">
          Ver todos
        </Link>
      </div>
      <p className="px-4 pt-0.5 text-xs text-muted-foreground">
        {formatARS(total)} pendientes este mes
      </p>

      <div className="mt-3">
        {pendientes.slice(0, 3).map((p) => (
          <Link
            key={p.id}
            href="/pagos"
            className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 transition-colors hover:bg-muted"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{p.name}</p>
              <p
                className={cn(
                  "text-xs",
                  p.status === "vencido"
                    ? "text-negative"
                    : p.status === "hoy"
                      ? "text-brand"
                      : "text-muted-foreground",
                )}
              >
                {statusLabel(p)}
              </p>
            </div>
            <span className="shrink-0 text-sm font-medium tabular-nums">
              {formatARS(p.amount)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
