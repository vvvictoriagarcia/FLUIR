"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, CalendarClock, Check, Trash2 } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast";
import { loadDashboard } from "@/lib/data";
import {
  loadRecurring,
  loadPaidThisMonth,
  createRecurring,
  deleteRecurring,
  markPaid,
  buildUpcoming,
  statusLabel,
  type UpcomingPayment,
} from "@/lib/recurring";
import { formatARS, cn } from "@/lib/utils";

const DIA_CHIPS = [1, 5, 10, 15, 20, 30];

export default function PagosPage() {
  const toast = useToast();
  const [items, setItems] = useState<UpcomingPayment[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);
  const [toDelete, setToDelete] = useState<UpcomingPayment | null>(null);

  const refresh = useCallback(async () => {
    const [list, paid] = await Promise.all([loadRecurring(), loadPaidThisMonth()]);
    setItems(buildUpcoming(list, paid));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [dash] = await Promise.all([loadDashboard(), refresh()]);
        setCategories(
          dash?.budget?.result.categories.map((c) => c.category) ?? [],
        );
      } catch {
        toast("No pudimos cargar tus pagos fijos.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh, toast]);

  async function handlePaid(p: UpcomingPayment) {
    try {
      await markPaid(p);
      await refresh();
      toast(`${p.name} pagado. Lo sumamos a tus gastos.`);
    } catch {
      toast("No pudimos marcarlo como pagado.", "error");
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    try {
      await deleteRecurring(toDelete.id);
      await refresh();
      toast("Listo, lo sacamos.");
    } catch {
      toast("No pudimos borrarlo.", "error");
    } finally {
      setToDelete(null);
    }
  }

  const pendientes = items.filter((i) => i.status !== "pagado");
  const totalPendiente = pendientes.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="min-h-screen pb-28">
      <div className="mx-auto max-w-xl px-5 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Volver
          </Link>
        </div>

        <h1 className="font-display text-3xl font-semibold">Pagos fijos</h1>
        <p className="mt-1 text-muted-foreground">
          Cargalos una vez y te avisamos antes de cada vencimiento.
        </p>

        {!loading && pendientes.length > 0 && (
          <div className="mt-5 rounded-card border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Te falta pagar este mes</p>
            <p className="mt-0.5 font-display text-2xl font-semibold tabular-nums">
              {formatARS(totalPendiente)}
            </p>
          </div>
        )}

        <div className="mt-5 space-y-3">
          {loading ? (
            <div className="h-24 animate-pulse rounded-card bg-muted" />
          ) : items.length === 0 ? (
            <div className="rounded-card border border-dashed border-border p-8 text-center">
              <CalendarClock className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-medium">Todavía no cargaste ninguno</p>
              <p className="mt-1 text-sm text-muted-foreground">
                El alquiler, la tarjeta, el seguro, el gimnasio. Los que caen
                siempre el mismo día.
              </p>
            </div>
          ) : (
            items.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  "rounded-card border bg-card p-4",
                  p.status === "vencido"
                    ? "border-negative/40"
                    : p.status === "hoy"
                      ? "border-brand/50"
                      : "border-border",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.name}</p>
                    <p
                      className={cn(
                        "mt-0.5 text-sm",
                        p.status === "vencido"
                          ? "text-negative"
                          : p.status === "pagado"
                            ? "text-positive"
                            : "text-muted-foreground",
                      )}
                    >
                      {statusLabel(p)} · día {p.dueDay} · {p.category}
                    </p>
                  </div>
                  <p className="shrink-0 font-medium tabular-nums">
                    {formatARS(p.amount)}
                  </p>
                </div>

                <div className="mt-3 flex gap-2">
                  {p.status !== "pagado" && (
                    <button
                      onClick={() => handlePaid(p)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand py-2 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
                    >
                      <Check size={15} />
                      Ya lo pagué
                    </button>
                  )}
                  <button
                    onClick={() => setToDelete(p)}
                    aria-label={`Borrar ${p.name}`}
                    className="rounded-full border border-border px-3 py-2 text-muted-foreground transition-colors hover:bg-muted"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <button
        onClick={() => setOpenNew(true)}
        aria-label="Nuevo pago fijo"
        className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg transition-transform active:scale-95"
      >
        <Plus />
      </button>

      {openNew && (
        <NuevoPagoModal
          categories={categories}
          onClose={() => setOpenNew(false)}
          onCreated={async () => {
            setOpenNew(false);
            await refresh();
            toast("Pago fijo guardado.");
          }}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title={`¿Borrar ${toDelete.name}?`}
          message="Los gastos que ya cargaste quedan como están."
          confirmLabel="Borrar"
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}

      <BottomNav />
    </div>
  );
}

function NuevoPagoModal({
  categories,
  onClose,
  onCreated,
}: {
  categories: string[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "Vivienda");
  const [dueDay, setDueDay] = useState(10);
  const [saving, setSaving] = useState(false);

  async function save() {
    const monto = Number(amount);
    if (!name.trim() || !monto || monto <= 0) {
      toast("Poné un nombre y un monto.", "error");
      return;
    }
    setSaving(true);
    try {
      await createRecurring({
        name: name.trim(),
        category,
        amount: monto,
        dueDay,
      });
      onCreated();
    } catch {
      toast("No pudimos guardarlo.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md rounded-t-3xl border border-border bg-card p-5 sm:rounded-3xl"
      >
        <h2 className="font-display text-xl font-semibold">Nuevo pago fijo</h2>

        <label className="mt-4 block">
          <span className="text-sm text-muted-foreground">¿Qué es?</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alquiler, Visa, seguro del auto…"
            className="mt-1 w-full rounded-2xl border-2 border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
          />
        </label>

        <label className="mt-3 block">
          <span className="text-sm text-muted-foreground">¿Cuánto?</span>
          <input
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            placeholder="0"
            className="mt-1 w-full rounded-2xl border-2 border-border bg-background px-4 py-3 text-sm tabular-nums outline-none transition-colors focus:border-brand"
          />
        </label>

        <div className="mt-3">
          <span className="text-sm text-muted-foreground">¿Qué día vence?</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {DIA_CHIPS.map((d) => (
              <button
                key={d}
                onClick={() => setDueDay(d)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                  dueDay === d
                    ? "border-brand bg-brand text-brand-foreground"
                    : "border-border hover:bg-muted",
                )}
              >
                {d}
              </button>
            ))}
            <input
              inputMode="numeric"
              value={dueDay}
              onChange={(e) => {
                const v = Math.min(31, Math.max(1, Number(e.target.value) || 1));
                setDueDay(v);
              }}
              aria-label="Día de vencimiento"
              className="w-16 rounded-full border border-border bg-background px-3 py-1.5 text-center text-sm tabular-nums outline-none focus:border-brand"
            />
          </div>
        </div>

        {categories.length > 0 && (
          <label className="mt-3 block">
            <span className="text-sm text-muted-foreground">¿En qué categoría?</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-2xl border-2 border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-border py-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 rounded-full bg-brand py-3 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
