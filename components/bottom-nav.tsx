"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, History, TrendingUp, User, Lock } from "lucide-react";
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
  { label: "Inicio", icon: Home, href: "/dashboard" },
  { label: "Gastos", icon: Receipt, href: "/gastos" },
  { label: "Historial", icon: History, href: "/historial" },
  { label: "Gold", icon: TrendingUp, href: "/invertir", gold: true },
  { label: "Perfil", icon: User, href: "/perfil" },
];

/** Navegación inferior, mobile-first. Historial y Gold están bloqueados (Plus/Gold). */
export function BottomNav() {
  const pathname = usePathname();
  const toast = useToast();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-xl items-stretch justify-around">
        {ITEMS.map((item) => {
          const active = !!item.href && pathname === item.href;
          const Icon = item.icon;
          const className = cn(
            "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
            active
              ? item.gold
                ? "text-gold"
                : "text-brand"
              : "text-muted-foreground hover:text-foreground"
          );
          const inner = (
            <>
              <span className="relative">
                <Icon
                  size={22}
                  className={item.gold && !active ? "text-gold/70" : undefined}
                />
                {item.soon && (
                  <Lock
                    size={10}
                    className="absolute -right-1.5 -top-1 rounded-full bg-background"
                  />
                )}
              </span>
              {item.label}
            </>
          );

          return item.href ? (
            <Link
              key={item.label}
              href={item.href}
              prefetch={false}
              className={className}
            >
              {inner}
            </Link>
          ) : (
            <button
              key={item.label}
              type="button"
              onClick={() => toast(item.soon ?? "Próximamente")}
              className={className}
            >
              {inner}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
