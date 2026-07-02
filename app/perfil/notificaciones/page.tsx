"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const PREFS = [
  { id: "push", label: "Notificaciones push", hint: "Avisos en tu celular" },
  { id: "email", label: "Emails", hint: "Resúmenes y novedades" },
  { id: "reminder", label: "Recordatorio de fin de mes", hint: "Para cerrar tu mes" },
];

function readPrefs(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem("fluir_notif_prefs") || "{}");
  } catch {
    return {};
  }
}

export default function NotificacionesPage() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() =>
    typeof window !== "undefined" ? readPrefs() : {}
  );

  function toggle(id: string) {
    const next = { ...prefs, [id]: !prefs[id] };
    setPrefs(next);
    try {
      localStorage.setItem("fluir_notif_prefs", JSON.stringify(next));
    } catch {}
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
        <p className="mt-1 mb-3 text-muted-foreground">
          Elegí qué avisos querés recibir.
        </p>
        <p className="mb-6 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
          Próximamente — por ahora solo guardamos tus preferencias.
        </p>

        <div className="overflow-hidden rounded-card border border-border bg-card">
          {PREFS.map((p) => {
            const on = !!prefs[p.id];
            return (
              <div
                key={p.id}
                className="flex items-center justify-between border-b border-border px-4 py-3.5 last:border-b-0"
              >
                <div>
                  <p className="font-medium">{p.label}</p>
                  <p className="text-sm text-muted-foreground">{p.hint}</p>
                </div>
                <button
                  onClick={() => toggle(p.id)}
                  role="switch"
                  aria-checked={on}
                  aria-label={p.label}
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors",
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
      </div>
    </div>
  );
}
