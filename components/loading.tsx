"use client";

import { motion } from "framer-motion";

/** Loader de pantalla completa con la marca Fluir. */
export function FullScreenLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <motion.span
        animate={{ opacity: [0.45, 1, 0.45] }}
        transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
        className="font-display text-4xl font-semibold tracking-tight text-brand"
      >
        fluir
      </motion.span>
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );
}
