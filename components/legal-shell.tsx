import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Contenedor común para las páginas legales (términos, privacidad). */
export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-2xl px-5 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-tight text-brand"
          >
            fluir
          </Link>
          <Link
            href="/perfil"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Volver
          </Link>
        </div>

        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Última actualización: {updated}
        </p>

        <div className="mt-8 space-y-7 text-[15px] leading-relaxed text-foreground/90">
          {children}
        </div>

        <p className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
          ¿Dudas? Escribinos a{" "}
          <a href="mailto:hola@fluir.app" className="font-medium text-brand">
            hola@fluir.app
          </a>
          .
        </p>
      </div>
    </div>
  );
}

/** Sección con título dentro de una página legal. */
export function LegalSection({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold">
        {n}. {title}
      </h2>
      <div className="mt-2 space-y-3 text-muted-foreground">{children}</div>
    </section>
  );
}
