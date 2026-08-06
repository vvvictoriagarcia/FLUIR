"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Receipt,
  Wallet,
  TrendingUp,
  User,
  Lock,
  HelpCircle,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/toast";

type Item = {
  label: string;
  icon: typeof Home;
  href?: string;
  soon?: string; // mensaje "próximamente" si está bloqueado
  gold?: boolean;
};

const ITEMS: Item[] = [
  { label: "Inicio", icon: Home, href: "/inicio" },
  { label: "Gastos", icon: Receipt, href: "/gastos" },
  { label: "Mi plata", icon: Wallet, href: "/patrimonio" },
  { label: "Invertir", icon: TrendingUp, href: "/invertir", gold: true },
  { label: "Aprendé", icon: GraduationCap, href: "/educacion" },
  { label: "Perfil", icon: User, href: "/perfil" },
];

/**
 * Navegación de la app. UN solo componente con dos formas:
 *
 * - En celular (< md): barra fija abajo, como siempre.
 * - En pantalla grande (≥ md): barra lateral fija a la izquierda.
 *
 * Antes la app era un celular estirado: barra inferior y una columna angosta
 * al medio con dos márgenes vacíos enormes. Las páginas se corren con
 * `md:pl-60` para dejarle lugar a la lateral.
 */
export function BottomNav() {
  const pathname = usePathname();
  const toast = useToast();

  function estado(item: Item) {
    const active = !!item.href && pathname === item.href;
    const color = active
      ? item.gold
        ? "text-gold"
        : "text-brand"
      : "text-muted-foreground hover:text-foreground";
    return { active, color };
  }

  return (
    <>
      {/* ── Celular: barra inferior ─────────────────────────────── */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-xl items-stretch justify-around">
          {ITEMS.map((item) => {
            const { active, color } = estado(item);
            const className = cn(
              "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
              color,
            );
            return item.href ? (
              <Link
                key={item.label}
                href={item.href}
                prefetch={false}
                className={className}
              >
                <NavIcon item={item} active={active} />
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                onClick={() => toast(item.soon ?? "Próximamente")}
                className={className}
              >
                <NavIcon item={item} active={active} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Escritorio: barra lateral ───────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-border bg-background/90 px-4 py-6 backdrop-blur md:flex">
        <Link
          href="/inicio"
          className="mb-8 px-3 font-display text-2xl font-semibold tracking-tight text-brand"
        >
          fluir
        </Link>

        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Menú
        </p>
        <nav className="flex flex-col gap-1">
          {ITEMS.map((item) => {
            const { active, color } = estado(item);
            const className = cn(
              "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
              active ? "bg-muted" : "hover:bg-muted/60",
              color,
            );
            return item.href ? (
              <Link
                key={item.label}
                href={item.href}
                prefetch={false}
                className={className}
              >
                <NavIcon item={item} active={active} />
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                onClick={() => toast(item.soon ?? "Próximamente")}
                className={cn(className, "text-left")}
              >
                <NavIcon item={item} active={active} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bloque anclado abajo: llena el alto de la barra y da accesos útiles */}
        <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
          <Link
            href="/guia"
            className="flex items-center gap-3 rounded-xl bg-brand/5 px-3 py-3 transition-colors hover:bg-brand/10"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <HelpCircle size={17} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">
                ¿Cómo funciona?
              </span>
              <span className="block text-xs text-muted-foreground">
                Guía rápida de Fluir
              </span>
            </span>
          </Link>
          <p className="px-3 text-[11px] leading-relaxed text-muted-foreground">
            Fluir · Tu plata, en orden
          </p>
        </div>
      </aside>
    </>
  );
}

function NavIcon({ item, active }: { item: Item; active: boolean }) {
  const Icon = item.icon;
  return (
    <span className="relative">
      <Icon size={22} className={item.gold && !active ? "text-gold/70" : undefined} />
      {item.soon && (
        <Lock
          size={10}
          className="absolute -right-1.5 -top-1 rounded-full bg-background"
        />
      )}
    </span>
  );
}
