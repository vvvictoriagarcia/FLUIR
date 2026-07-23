"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Camera,
  Trash2,
  RotateCw,
  TrendingUp,
  HelpCircle,
} from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PlanGate } from "@/components/gates/plan-gate";
import { useToast } from "@/components/toast";
import {
  loadHoldings,
  createHolding,
  deleteHolding,
  fetchPrices,
  valuate,
  totals,
  aDolares,
  KIND_LABELS,
  type Holding,
  type HoldingKind,
  type Prices,
  type ValuedHolding,
} from "@/lib/portfolio";
import { DISCLAIMER } from "@/lib/invest/content";
import { ageLabel } from "@/lib/prices";
import { formatARS, cn } from "@/lib/utils";

export default function CarteraPage() {
  return (
    <PlanGate
      need="gold"
      feature="Seguimiento de cartera"
      benefits={[
        "Cuánto vale hoy lo que tenés invertido",
        "Cuánto ganaste o perdiste, en pesos y en dólares",
        "Cargá tus tenencias con una foto de tu broker",
      ]}
    >
      <Cartera />
    </PlanGate>
  );
}

function Cartera() {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [prices, setPrices] = useState<Prices | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enDolares, setEnDolares] = useState(false);
  const [openNew, setOpenNew] = useState(false);
  const [leyendo, setLeyendo] = useState(false);
  const [toDelete, setToDelete] = useState<ValuedHolding | null>(null);
  const [preview, setPreview] = useState<Omit<Holding, "id">[] | null>(null);

  const refresh = useCallback(async (force = false) => {
    const list = await loadHoldings();
    setHoldings(list);
    // Pedimos SOLO los tickers que tiene, no el mercado entero.
    setPrices(await fetchPrices(list.map((h) => h.ticker), force));
  }, []);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const list = await loadHoldings();
        const p = await fetchPrices(list.map((h) => h.ticker));
        if (!activo) return;
        setHoldings(list);
        setPrices(p);
      } catch {
        if (activo) toast("No pudimos cargar tu cartera.", "error");
      } finally {
        if (activo) setLoading(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, [toast]);

  async function actualizarPrecios() {
    setRefreshing(true);
    try {
      await refresh(true);
    } finally {
      setRefreshing(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setLeyendo(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/import/cartera", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: base64, mediaType: file.type }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error ?? "No pudimos leer la imagen.", "error");
        return;
      }

      const leidas: Omit<Holding, "id">[] = json.tenencias ?? [];
      if (!leidas.length) {
        toast("No encontramos tenencias en esa imagen.", "error");
        return;
      }

      // No guardamos nada todavía: primero se revisa y se confirma.
      setPreview(leidas);
      for (const w of json.warnings ?? []) toast(w);
    } catch {
      toast("Algo falló leyendo la imagen.", "error");
    } finally {
      setLeyendo(false);
    }
  }

  /** Guarda lo confirmado del preview, contando qué entró y qué no. */
  async function confirmarPreview(elegidas: Omit<Holding, "id">[]) {
    let ok = 0;
    let ultimoError = "";
    for (const t of elegidas) {
      try {
        await createHolding(t);
        ok++;
      } catch (err) {
        ultimoError = err instanceof Error ? err.message : "";
      }
    }
    setPreview(null);
    await refresh();

    if (ok === elegidas.length) {
      toast(`Listo, sumamos ${ok} ${ok === 1 ? "activo" : "activos"} a tu cartera.`);
    } else if (ok > 0) {
      toast(`Guardamos ${ok} de ${elegidas.length}. ${ultimoError}`.trim(), "error");
    } else {
      toast(
        ultimoError
          ? `No pudimos guardar: ${ultimoError}`
          : "No pudimos guardar las tenencias.",
        "error",
      );
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    try {
      await deleteHolding(toDelete.id);
      await refresh();
      toast("Listo, lo sacamos.");
    } catch {
      toast("No pudimos borrarlo.", "error");
    } finally {
      setToDelete(null);
    }
  }

  const valued = valuate(holdings, prices);
  const t = totals(valued);
  const edad = ageLabel(prices?.asOf ?? null);
  const fmt = (ars: number) =>
    enDolares
      ? `US$ ${aDolares(ars, prices).toLocaleString("es-AR", { maximumFractionDigits: 0 })}`
      : formatARS(ars);

  return (
    <div className="min-h-screen pb-28">
      <div className="mx-auto max-w-xl px-5 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Inicio
          </Link>
          <div className="flex items-center gap-2">
          <Link
            href="/invertir?guia=1"
            title="Volver a ver la guía para invertir"
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
          >
            <HelpCircle size={14} />
            Guía
          </Link>
          <button
            onClick={() => setEnDolares((v) => !v)}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
          >
            Ver en {enDolares ? "pesos" : "dólares"}
          </button>
          </div>
        </div>

        <h1 className="font-display text-3xl font-semibold">Tu cartera</h1>

        {loading ? (
          <div className="mt-5 h-32 animate-pulse rounded-card bg-muted" />
        ) : holdings.length === 0 ? (
          <EmptyState onAdd={() => setOpenNew(true)} onFoto={() => fileRef.current?.click()} leyendo={leyendo} />
        ) : (
          <>
            {/* El número grande */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 rounded-card border border-border bg-card p-5"
            >
              <p className="text-sm text-muted-foreground">Tenés invertido</p>
              <p className="mt-1 font-display text-4xl font-semibold tabular-nums">
                {fmt(t.valor)}
              </p>
              <p
                className={cn(
                  "mt-2 text-sm font-medium tabular-nums",
                  t.ganancia >= 0 ? "text-positive" : "text-negative",
                )}
              >
                {t.ganancia >= 0 ? "▲" : "▼"} {fmt(Math.abs(t.ganancia))} (
                {t.gananciaPct >= 0 ? "+" : ""}
                {t.gananciaPct.toFixed(1)}%) desde que compraste
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Pusiste {fmt(t.costo)}
                {prices?.dolar.mep
                  ? ` · dólar MEP $${prices.dolar.mep.toLocaleString("es-AR")}`
                  : ""}
                {edad ? ` · precios ${edad}` : ""}
              </p>

              <button
                onClick={actualizarPrecios}
                disabled={refreshing}
                className="mt-3 flex items-center gap-1.5 text-xs font-medium text-brand disabled:opacity-60"
              >
                <RotateCw size={13} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Actualizando…" : "Actualizar precios"}
              </button>
            </motion.div>

            {(t.sinPrecio > 0 || prices?.parcial) && (
              <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
                {prices?.parcial
                  ? "No pudimos traer todas las cotizaciones, así que este total puede estar incompleto. Probá actualizar en un rato."
                  : `${t.sinPrecio} ${t.sinPrecio === 1 ? "activo no cotiza" : "activos no cotizan"} en el mercado local (plazo fijo, fondos, cripto): los mostramos al precio que pagaste.`}
              </p>
            )}

            <div className="mt-5 space-y-3">
              {valued.map((h, i) => (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-card border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {h.ticker}
                        {h.name ? (
                          <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                            {h.name}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {h.quantity.toLocaleString("es-AR")} × {formatARS(h.price)} ·{" "}
                        {KIND_LABELS[h.kind]}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-medium tabular-nums">{fmt(h.valor)}</p>
                      <p
                        className={cn(
                          "text-sm tabular-nums",
                          h.sinPrecio
                            ? "text-muted-foreground"
                            : h.ganancia >= 0
                              ? "text-positive"
                              : "text-negative",
                        )}
                      >
                        {h.sinPrecio
                          ? "sin cotización"
                          : `${h.gananciaPct >= 0 ? "+" : ""}${h.gananciaPct.toFixed(1)}%`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setToDelete(h)}
                    aria-label={`Borrar ${h.ticker}`}
                    className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-negative"
                  >
                    <Trash2 size={13} />
                    Sacar de la cartera
                  </button>
                </motion.div>
              ))}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={leyendo}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border py-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
              >
                <Camera size={15} />
                {leyendo ? "Leyendo…" : "Cargar con una foto"}
              </button>
            </div>
          </>
        )}

        <p className="mt-8 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
          {DISCLAIMER} Los precios son de referencia del mercado local y pueden
          demorarse; no son el valor exacto de tu cuenta en el broker.
        </p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onFile}
        className="hidden"
      />

      <button
        onClick={() => setOpenNew(true)}
        aria-label="Agregar tenencia"
        className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-gold-foreground shadow-lg transition-transform active:scale-95"
      >
        <Plus />
      </button>

      {openNew && (
        <NuevaTenenciaModal
          onClose={() => setOpenNew(false)}
          onCreated={async () => {
            setOpenNew(false);
            await refresh();
            toast("Tenencia agregada.");
          }}
        />
      )}

      {preview && (
        <PreviewImportModal
          items={preview}
          onCancel={() => setPreview(null)}
          onConfirm={confirmarPreview}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title={`¿Sacar ${toDelete.ticker} de tu cartera?`}
          message="Solo lo borramos del seguimiento. No toca nada en tu broker."
          confirmLabel="Sacar"
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}

      <BottomNav />
    </div>
  );
}

function EmptyState({
  onAdd,
  onFoto,
  leyendo,
}: {
  onAdd: () => void;
  onFoto: () => void;
  leyendo: boolean;
}) {
  return (
    <div className="mt-5 rounded-card border border-dashed border-border p-8 text-center">
      <TrendingUp className="mx-auto h-8 w-8 text-gold" />
      <p className="mt-3 font-medium">Todavía no cargaste nada</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Cargá lo que tenés invertido y te mostramos cuánto vale hoy. No
        conectamos con tu broker: los datos los ponés vos.
      </p>
      <div className="mt-5 space-y-2">
        <button
          onClick={onFoto}
          disabled={leyendo}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gold py-3 text-sm font-medium text-gold-foreground disabled:opacity-60"
        >
          <Camera size={16} />
          {leyendo ? "Leyendo la imagen…" : "Sacarle una foto a mi broker"}
        </button>
        <button
          onClick={onAdd}
          className="w-full rounded-full border border-border py-3 text-sm font-medium transition-colors hover:bg-muted"
        >
          Cargar a mano
        </button>
      </div>
    </div>
  );
}

const KINDS: HoldingKind[] = [
  "cedear",
  "accion",
  "bono",
  "fci",
  "plazo_fijo",
  "cripto",
  "otro",
];

function NuevaTenenciaModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const toast = useToast();
  const [ticker, setTicker] = useState("");
  const [name, setName] = useState("");
  const [kind, setKind] = useState<HoldingKind>("cedear");
  const [quantity, setQuantity] = useState("");
  const [avgPrice, setAvgPrice] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    const cant = Number(quantity.replace(",", "."));
    const precio = Number(avgPrice.replace(",", "."));
    if (!ticker.trim() || !cant || cant <= 0 || !precio || precio <= 0) {
      toast("Completá ticker, cantidad y precio de compra.", "error");
      return;
    }
    setSaving(true);
    try {
      await createHolding({
        ticker: ticker.trim().toUpperCase(),
        name: name.trim(),
        kind,
        quantity: cant,
        avgPrice: precio,
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
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-card p-5 sm:rounded-3xl"
      >
        <h2 className="font-display text-xl font-semibold">Agregar a tu cartera</h2>

        <label className="mt-4 block">
          <span className="text-sm text-muted-foreground">Ticker</span>
          <input
            autoFocus
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="AAPL, GGAL, AL30…"
            className="mt-1 w-full rounded-2xl border-2 border-border bg-background px-4 py-3 text-sm uppercase outline-none transition-colors focus:border-gold"
          />
        </label>

        <label className="mt-3 block">
          <span className="text-sm text-muted-foreground">Nombre (opcional)</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Apple"
            className="mt-1 w-full rounded-2xl border-2 border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-gold"
          />
        </label>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm text-muted-foreground">Cantidad</span>
            <input
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value.replace(/[^\d.,]/g, ""))}
              placeholder="10"
              className="mt-1 w-full rounded-2xl border-2 border-border bg-background px-4 py-3 text-sm tabular-nums outline-none transition-colors focus:border-gold"
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted-foreground">Precio de compra</span>
            <input
              inputMode="decimal"
              value={avgPrice}
              onChange={(e) => setAvgPrice(e.target.value.replace(/[^\d.,]/g, ""))}
              placeholder="10000"
              className="mt-1 w-full rounded-2xl border-2 border-border bg-background px-4 py-3 text-sm tabular-nums outline-none transition-colors focus:border-gold"
            />
          </label>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          El precio promedio que pagaste por unidad, en pesos.
        </p>

        <div className="mt-3">
          <span className="text-sm text-muted-foreground">Qué es</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  kind === k
                    ? "border-gold bg-gold text-gold-foreground"
                    : "border-border hover:bg-muted",
                )}
              >
                {KIND_LABELS[k]}
              </button>
            ))}
          </div>
        </div>

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
            className="flex-1 rounded-full bg-gold py-3 text-sm font-medium text-gold-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Agregar"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Revisión de lo que leyó la foto antes de guardar. Se puede sacar lo que no
 * corresponda y corregir cantidades o precios, que es donde más se equivoca la
 * lectura automática.
 */
function PreviewImportModal({
  items,
  onCancel,
  onConfirm,
}: {
  items: Omit<Holding, "id">[];
  onCancel: () => void;
  onConfirm: (elegidas: Omit<Holding, "id">[]) => Promise<void>;
}) {
  const [filas, setFilas] = useState(
    items.map((t) => ({ ...t, incluir: true })),
  );
  const [guardando, setGuardando] = useState(false);

  const elegidas = filas.filter((f) => f.incluir);

  function editar(i: number, campo: "quantity" | "avgPrice", valor: string) {
    const n = Number(valor.replace(/[^\d.,]/g, "").replace(",", "."));
    setFilas((prev) =>
      prev.map((f, idx) => (idx === i ? { ...f, [campo]: n || 0 } : f)),
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-card p-5 sm:rounded-3xl"
      >
        <h2 className="font-display text-xl font-semibold">
          Encontramos {items.length} {items.length === 1 ? "activo" : "activos"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Revisá que esté bien antes de guardar. Destildá lo que no quieras.
        </p>

        <div className="mt-4 space-y-3">
          {filas.map((f, i) => (
            <div
              key={`${f.ticker}-${i}`}
              className={cn(
                "rounded-xl border p-3 transition-opacity",
                f.incluir ? "border-border" : "border-border opacity-50",
              )}
            >
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={f.incluir}
                  onChange={() =>
                    setFilas((prev) =>
                      prev.map((x, idx) =>
                        idx === i ? { ...x, incluir: !x.incluir } : x,
                      ),
                    )
                  }
                  className="accent-[var(--gold)]"
                />
                <span className="font-medium">{f.ticker}</span>
                <span className="truncate text-sm text-muted-foreground">
                  {f.name}
                </span>
                <span className="ml-auto shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {KIND_LABELS[f.kind]}
                </span>
              </label>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-xs text-muted-foreground">Cantidad</span>
                  <input
                    inputMode="decimal"
                    defaultValue={f.quantity}
                    onChange={(e) => editar(i, "quantity", e.target.value)}
                    className="mt-0.5 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm tabular-nums outline-none focus:border-gold"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">
                    Precio de compra
                  </span>
                  <input
                    inputMode="decimal"
                    defaultValue={f.avgPrice}
                    onChange={(e) => editar(i, "avgPrice", e.target.value)}
                    className="mt-0.5 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm tabular-nums outline-none focus:border-gold"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-full border border-border py-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            onClick={async () => {
              setGuardando(true);
              await onConfirm(
                elegidas.map((f) => ({
                  ticker: f.ticker,
                  name: f.name,
                  kind: f.kind,
                  quantity: f.quantity,
                  avgPrice: f.avgPrice,
                })),
              );
              setGuardando(false);
            }}
            disabled={guardando || elegidas.length === 0}
            className="flex-1 rounded-full bg-gold py-3 text-sm font-medium text-gold-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {guardando ? "Guardando…" : `Agregar ${elegidas.length}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
