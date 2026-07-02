"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

/** Hoja inferior para cargar o editar un gasto. Pasá `initial` para editar. */
export function ExpenseModal({
  categories,
  initial,
  title = "Registrar gasto",
  saveLabel = "Guardar",
  onClose,
  onSave,
}: {
  categories: string[];
  initial?: { amount: number; category: string; description: string };
  title?: string;
  saveLabel?: string;
  onClose: () => void;
  onSave: (category: string, amount: number, description: string) => void;
}) {
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [category, setCategory] = useState(
    initial?.category ?? categories[0] ?? "Otros"
  );
  const [description, setDescription] = useState(initial?.description ?? "");

  const amountNumber = Number(amount.replace(/\D/g, ""));
  const valid = amountNumber > 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/50"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-xl rounded-t-3xl border border-border bg-background p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="text-sm text-muted-foreground">¿Cuánto gastaste?</label>
        <div className="mt-1.5 mb-4 flex items-center gap-2 rounded-2xl border-2 border-border bg-card p-4">
          <span className="font-display text-2xl text-muted-foreground">$</span>
          <input
            autoFocus
            inputMode="numeric"
            value={amount ? amountNumber.toLocaleString("es-AR") : ""}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full bg-transparent font-display text-2xl font-semibold tabular-nums outline-none placeholder:text-muted-foreground/40"
          />
        </div>

        <label className="text-sm text-muted-foreground">¿En qué?</label>
        <div className="mt-1.5 mb-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                category === c
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <label className="text-sm text-muted-foreground">
          ¿Qué fue? (opcional)
        </label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej: cena, taxi, ropa…"
          className="mt-1.5 mb-5 w-full rounded-2xl border-2 border-border bg-card p-3.5 text-sm outline-none placeholder:text-muted-foreground/50"
        />

        <button
          disabled={!valid}
          onClick={() => onSave(category, amountNumber, description.trim())}
          className="w-full rounded-full bg-brand py-4 font-medium text-brand-foreground transition-opacity disabled:opacity-40"
        >
          {saveLabel}
        </button>
      </motion.div>
    </>
  );
}
