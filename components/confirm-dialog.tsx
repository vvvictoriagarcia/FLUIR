"use client";

import { motion } from "framer-motion";

/** Diálogo de confirmación centrado para acciones destructivas. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}: {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="fixed inset-0 z-40 bg-black/50"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        className="fixed inset-x-0 top-1/2 z-50 mx-auto w-[calc(100%-2.5rem)] max-w-sm -translate-y-1/2 rounded-card border border-border bg-card p-6"
      >
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        {message && (
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        )}
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-full border border-border py-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-full bg-negative py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </>
  );
}
