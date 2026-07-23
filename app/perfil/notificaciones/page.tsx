"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/components/toast";
import { useUser } from "@/hooks/useUser";
import {
  loadEmailPrefs,
  saveEmailPrefs,
  DEFAULT_PREFS,
  type EmailPrefs,
} from "@/lib/profile";
import { cn } from "@/lib/utils";

const ROWS: { id: keyof EmailPrefs; label: string; hint: string }[] = [
  {
    id: "product",
    label: "Avisos de tu plata",
    hint: "Resumen del mes, recordatorio para cerrarlo y alertas si te pasás",
  },
  {
    id: "marketing",
    label: "Tips y novedades",
    hint: "Ideas para ahorrar y features nuevas. Nada de spam.",
  },
];

export default function NotificacionesPage() {
  const toast = useToast();
  const { user, loading: loadingUser } = useUser();
  const [prefs, setPrefs] = useState<EmailPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmailPrefs()
      .then(setPrefs)
      .finally(() => setLoading(false));
  }, [user]);

  async function toggle(id: keyof EmailPrefs) {
    const next = { ...prefs, [id]: !prefs[id] };
    setPrefs(next);
    const ok = await saveEmailPrefs(next);
    if (!ok) {
      toast("No pudimos guardar la preferencia. Probá de nuevo.", "error");
      setPrefs(prefs);
    }
  }

  return (
    <div className="min-h-screen px-5 py-6">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/perfil"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Volver
          </Link>
          <ThemeToggle />
        </div>

        <h1 className="font-display text-3xl font-semibold">Notificaciones</h1>
        <p className="mt-1 mb-6 text-muted-foreground">
          Elegí qué querés que te mandemos por mail.
        </p>

        <div className="overflow-hidden rounded-card border border-border bg-card">
          {ROWS.map((r) => {
            const on = prefs[r.id];
            return (
              <div
                key={r.id}
                className="flex items-center justify-between gap-4 border-b border-border px-4 py-3.5 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="font-medium">{r.label}</p>
                  <p className="text-sm text-muted-foreground">{r.hint}</p>
                </div>
                <button
                  onClick={() => toggle(r.id)}
                  disabled={loading}
                  role="switch"
                  aria-checked={on}
                  aria-label={r.label}
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
                    on ? "bg-brand" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                      on ? "translate-x-[1.4rem]" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {!loadingUser && !user && (
          <p className="mt-4 flex items-start gap-2 rounded-card border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            <Mail size={16} className="mt-0.5 shrink-0" />
            Estás sin cuenta, así que guardamos esto solo en este dispositivo.{" "}
            <Link href="/register?next=/perfil/notificaciones" className="font-medium text-brand">
              Creá tu cuenta
            </Link>{" "}
            para que te lleguen de verdad.
          </p>
        )}

        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          Siempre vas a poder darte de baja desde el pie de cualquier mail. Los
          mails de seguridad y de tu cuenta (cambio de contraseña, pagos) se
          mandan igual porque hacen falta para el servicio.
        </p>
      </div>
    </div>
  );
}
