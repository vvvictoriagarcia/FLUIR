"use client";

// Demo animada del escáner para la landing: muestra "la magia" antes de pedir
// datos — un resumen de tarjeta se escanea y salen los gastos ya categorizados.
// Autocontenida (sin GIF ni assets). Loop por remount con key (evita
// AnimatePresence, que en este stack cuelga los desmontajes).

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Check, Sparkles } from "lucide-react";

// Líneas del "resumen" origen (monospace, como un PDF/foto de tarjeta).
const SOURCE_LINES = [
  "05/07  COTO CABILDO        45.230,00",
  "07/07  YPF FULL PALERMO    28.900,50",
  "10/07  NETFLIX.COM          7.999,00",
  "12/07  MERCADOPAGO*KIOSCO   3.150,00",
  "15/07  FARMACITY           12.480,00",
];

// Lo que Fluir devuelve, ya normalizado y categorizado.
const RESULT = [
  { merchant: "Coto Cabildo", cat: "Comida", amount: "$45.230" },
  { merchant: "YPF", cat: "Transporte", amount: "$28.900" },
  { merchant: "Netflix", cat: "Suscripciones", amount: "$7.999" },
  { merchant: "Kiosco", cat: "Comida", amount: "$3.150" },
];

const SCAN_MS = 1700; // lo que tarda la línea en barrer el resumen
const CYCLE_MS = 5200; // cada cuánto se reinicia la demo

export function ScanDemo() {
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCycle((c) => c + 1), CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative rounded-card border border-border bg-card p-5 shadow-xl shadow-black/5 sm:p-6">
      <div
        key={cycle}
        className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr] sm:gap-5"
      >
        {/* ── Origen: el resumen que se escanea ─────────────────────── */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <Camera className="h-3.5 w-3.5" />
            Foto o PDF del resumen
          </p>
          <div className="relative h-[168px] overflow-hidden rounded-lg border border-border bg-muted/40 p-3">
            <div className="space-y-2 font-mono text-[10.5px] leading-tight text-muted-foreground sm:text-[11px]">
              {SOURCE_LINES.map((l) => (
                <div key={l} className="truncate">
                  {l}
                </div>
              ))}
            </div>

            {/* barrido de escaneo */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-10"
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: [-40, 168], opacity: [0, 1, 1, 0] }}
              transition={{
                duration: SCAN_MS / 1000,
                ease: "easeInOut",
                times: [0, 0.1, 0.9, 1],
              }}
            >
              <div className="h-full w-full bg-gradient-to-b from-transparent via-brand/15 to-brand/25" />
              <div className="h-[2px] w-full bg-brand shadow-[0_0_12px_2px_var(--brand)]" />
            </motion.div>
          </div>
        </div>

        {/* ── Flecha / "lo lee" ─────────────────────────────────────── */}
        <motion.div
          className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: SCAN_MS / 1000, duration: 0.35 }}
        >
          <Sparkles className="h-4 w-4" />
        </motion.div>

        {/* ── Resultado: gastos cargados y categorizados ────────────── */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-positive">
            <Check className="h-3.5 w-3.5" />
            Cargado en Fluir
          </p>
          <div className="h-[168px] space-y-1.5">
            {RESULT.map((r, i) => (
              <motion.div
                key={r.merchant}
                className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-2.5 py-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: SCAN_MS / 1000 + 0.25 + i * 0.28,
                  duration: 0.32,
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium">{r.merchant}</div>
                  <span className="mt-0.5 inline-block rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                    {r.cat}
                  </span>
                </div>
                <span className="tabular-nums shrink-0 text-xs font-semibold text-negative">
                  −{r.amount}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
