"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Camera, ShieldCheck, Check } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { useToast } from "@/components/toast";
import { useUser } from "@/hooks/useUser";
import { loadDashboard } from "@/lib/data";
import { addExpense } from "@/lib/budget-store";
import type { Movement } from "@/lib/import/types";
import { formatARS } from "@/lib/utils";

type Row = Movement & { include: boolean };

export default function ImportarPage() {
  const toast = useToast();
  const { user } = useUser();
  const [categories, setCategories] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [phase, setPhase] = useState<"idle" | "parsing" | "review" | "saving" | "done">("idle");
  const [imported, setImported] = useState(0);
  const csvInput = useRef<HTMLInputElement>(null);
  const imgInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDashboard().then(({ budget }) => {
      if (budget) {
        setCategories(
          budget.result.categories
            .filter((c) => c.category !== "Ahorro")
            .map((c) => c.category)
        );
      }
    });
  }, []);

  async function parse(kind: "csv" | "image", data: string, mediaType?: string) {
    setPhase("parsing");
    try {
      const res = await fetch("/api/import/parse", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, data, mediaType, categories }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error ?? "No pudimos leer el archivo.", "error");
        setPhase("idle");
        return;
      }
      const movements: Movement[] = json.movements ?? [];
      if (movements.length === 0) {
        toast("No encontramos movimientos.", "error");
        setPhase("idle");
        return;
      }
      setRows(movements.map((m) => ({ ...m, include: true })));
      setWarnings(json.warnings ?? []);
      setPhase("review");
    } catch {
      toast("Algo falló al procesar. Probá de nuevo.", "error");
      setPhase("idle");
    }
  }

  function onCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => parse("csv", String(reader.result ?? ""));
    reader.readAsText(file);
  }

  function onImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      const base64 = dataUrl.split(",")[1] ?? "";
      parse("image", base64, file.type);
    };
    reader.readAsDataURL(file);
  }

  async function confirm() {
    if (!rows) return;
    const chosen = rows.filter((r) => r.include);
    if (chosen.length === 0) {
      toast("Elegí al menos un movimiento.", "error");
      return;
    }
    setPhase("saving");
    try {
      if (user) {
        const res = await fetch("/api/import/commit", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ movements: chosen }),
        });
        const json = await res.json();
        if (!res.ok) {
          toast(json.error ?? "No se pudo guardar.", "error");
          setPhase("review");
          return;
        }
        setImported(json.imported ?? chosen.length);
      } else {
        // Demo sin login: guardamos en el navegador.
        for (const m of chosen) {
          addExpense({
            category: m.category ?? "Sin categoría",
            amount: m.amount,
            description: m.merchant,
          });
        }
        setImported(chosen.length);
      }
      setPhase("done");
    } catch {
      toast("No se pudo guardar. Probá de nuevo.", "error");
      setPhase("review");
    }
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="mx-auto max-w-xl px-5 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/gastos"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Gastos
          </Link>
        </div>

        <h1 className="font-display text-3xl font-semibold">Importar movimientos</h1>
        <p className="mt-2 text-muted-foreground">
          Subí el resumen de tu tarjeta o el export del homebanking y cargamos
          los gastos por vos.
        </p>

        {phase === "idle" && (
          <>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={() => imgInput.current?.click()}
                className="flex flex-col items-start gap-2 rounded-card border border-border bg-card p-5 text-left transition-colors hover:bg-muted"
              >
                <Camera className="h-6 w-6 text-brand" />
                <span className="font-medium">Foto o captura</span>
                <span className="text-sm text-muted-foreground">
                  Del resumen de tu tarjeta. La leemos automáticamente.
                </span>
              </button>
              <button
                onClick={() => csvInput.current?.click()}
                className="flex flex-col items-start gap-2 rounded-card border border-border bg-card p-5 text-left transition-colors hover:bg-muted"
              >
                <FileText className="h-6 w-6 text-brand" />
                <span className="font-medium">Archivo CSV</span>
                <span className="text-sm text-muted-foreground">
                  El export de movimientos de tu banco.
                </span>
              </button>
            </div>
            <input ref={imgInput} type="file" accept="image/*" hidden onChange={onImage} />
            <input ref={csvInput} type="file" accept=".csv,text/csv" hidden onChange={onCsv} />

            <p className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-positive" />
              Procesamos el archivo al vuelo y no lo guardamos. Solo quedan los
              movimientos que confirmes.
            </p>
          </>
        )}

        {phase === "parsing" && (
          <div className="mt-10 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-brand" />
            <p className="mt-4 text-sm text-muted-foreground">
              Leyendo tus movimientos…
            </p>
          </div>
        )}

        {phase === "review" && rows && (
          <div className="mt-6">
            {warnings.length > 0 && (
              <div className="mb-4 rounded-card border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                {warnings.map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
              </div>
            )}
            <p className="mb-3 text-sm text-muted-foreground">
              Encontramos {rows.length} movimientos. Revisá la categoría y
              destildá lo que no quieras cargar.
            </p>
            <div className="divide-y divide-border">
              {rows.map((r, i) => (
                <ReviewRow
                  key={r.dedupKey + i}
                  row={r}
                  categories={categories}
                  onToggle={() =>
                    setRows((prev) =>
                      prev!.map((x, j) => (j === i ? { ...x, include: !x.include } : x))
                    )
                  }
                  onCategory={(cat) =>
                    setRows((prev) =>
                      prev!.map((x, j) => (j === i ? { ...x, category: cat } : x))
                    )
                  }
                />
              ))}
            </div>
            <button
              onClick={confirm}
              className="mt-6 w-full rounded-full bg-brand py-3.5 font-medium text-brand-foreground transition-opacity hover:opacity-90"
            >
              Importar {rows.filter((r) => r.include).length} movimientos
            </button>
          </div>
        )}

        {phase === "saving" && (
          <div className="mt-10 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-brand" />
            <p className="mt-4 text-sm text-muted-foreground">Guardando…</p>
          </div>
        )}

        {phase === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 text-center"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-positive/15 text-positive">
              <Check size={28} />
            </div>
            <p className="mt-4 font-display text-xl font-semibold">
              Listo, importamos {imported}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ya están sumados a tu mes.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-block rounded-full bg-brand px-6 py-3 text-sm font-medium text-brand-foreground"
            >
              Ver mi tablero
            </Link>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function ReviewRow({
  row,
  categories,
  onToggle,
  onCategory,
}: {
  row: Row;
  categories: string[];
  onToggle: () => void;
  onCategory: (cat: string) => void;
}) {
  return (
    <div className={`flex items-center gap-3 py-3 ${row.include ? "" : "opacity-40"}`}>
      <input
        type="checkbox"
        checked={row.include}
        onChange={onToggle}
        className="h-4 w-4 shrink-0 accent-[var(--brand)]"
        aria-label="Incluir movimiento"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{row.merchant}</div>
        <div className="text-xs text-muted-foreground">{row.date}</div>
      </div>
      <select
        value={row.category ?? ""}
        onChange={(e) => onCategory(e.target.value)}
        className="max-w-[8rem] shrink-0 rounded-lg border border-border bg-card px-2 py-1.5 text-xs"
      >
        <option value="">Sin categoría</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <span className="tabular-nums w-20 shrink-0 text-right text-sm font-medium text-negative">
        −{formatARS(row.amount)}
      </span>
    </div>
  );
}
