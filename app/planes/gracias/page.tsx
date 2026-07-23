"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, RotateCw, Mail } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";
import { PLAN_LABELS } from "@/lib/plan";
import { whatsapp } from "@/lib/contact";

/**
 * Pantalla a la que vuelve la persona después de pagar en Mercado Pago.
 * (En el panel de MP hay que poner esta URL como "volver al sitio".)
 * El plan lo activa el webhook; acá solo lo mostramos y damos una salida
 * humana si tarda.
 */
export default function GraciasPage() {
  const { plan, loading } = usePlan();
  const [checking, setChecking] = useState(false);
  const activo = plan !== "free";

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md text-center"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-positive/10 text-positive">
          <CheckCircle2 className="h-7 w-7" />
        </div>

        <h1 className="mt-5 font-display text-3xl font-semibold">
          {activo ? "¡Listo, ya está activo!" : "Gracias por suscribirte"}
        </h1>

        <p className="mt-3 text-muted-foreground">
          {loading
            ? "Estamos viendo cómo quedó tu cuenta…"
            : activo
              ? `Tu plan ${PLAN_LABELS[plan]} ya está andando. Entrá y aprovechalo.`
              : "Ya recibimos tu pago. La activación puede tardar un rato: probá actualizar en unos minutos y, si seguís viendo Free, escribinos y lo destrabamos a mano el mismo día."}
        </p>

        <div className="mt-7 space-y-3">
          <Link
            href="/dashboard"
            className="block w-full rounded-full bg-brand py-3.5 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
          >
            Ir a mi plata
          </Link>

          {!activo && !loading && (
            <button
              onClick={() => {
                setChecking(true);
                window.location.reload();
              }}
              disabled={checking}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-border py-3.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
            >
              <RotateCw size={16} className={checking ? "animate-spin" : ""} />
              {checking ? "Actualizando…" : "Actualizar estado"}
            </button>
          )}
        </div>

        {!activo && (
          <p className="mt-8 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <Mail size={14} />
            ¿Pasaron unos minutos y sigue igual?{" "}
            <a
              href={whatsapp("Hola, pagué mi plan de Fluir y todavía no se activó.")}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand"
            >
              escribinos por WhatsApp
            </a>
          </p>
        )}
      </motion.div>
    </div>
  );
}
