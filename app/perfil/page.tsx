"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  LogOut,
  SlidersHorizontal,
  Tags,
  Bell,
  Sparkles,
  ShieldCheck,
  FileText,
  Target,
  Upload,
  LifeBuoy,
  CalendarClock,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { BottomNav } from "@/components/bottom-nav";
import { PlanPreviewToggle } from "@/components/gates/plan-preview-toggle";
import { useUser } from "@/hooks/useUser";
import { usePlan } from "@/hooks/usePlan";
import { PLAN_LABELS } from "@/lib/plan";
import { cn } from "@/lib/utils";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function PerfilPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const { plan, loading: planLoading } = usePlan();

  async function handleLogout() {
    if (isSupabaseConfigured) {
      await createClient().auth.signOut();
    }
    router.push("/");
  }

  const name =
    (user?.user_metadata?.full_name as string) ||
    user?.email?.split("@")[0] ||
    "Invitado/a";

  return (
    <div className="min-h-screen pb-24">
      <div className="mx-auto max-w-xl px-5 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="font-display text-xl font-semibold tracking-tight text-brand"
          >
            fluir
          </Link>
          <ThemeToggle />
        </div>

        <h1 className="font-display text-3xl font-semibold">Perfil</h1>

        {/* Tarjeta de usuario */}
        <div className="mt-5 flex items-center gap-3 rounded-card border border-border bg-card p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-lg font-semibold text-brand-foreground">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {loading
                ? "…"
                : user?.email ?? "Estás usando Fluir sin cuenta"}
            </p>
          </div>
          <span
            className={cn(
              "ml-auto rounded-full px-2.5 py-1 text-xs font-medium",
              plan === "gold"
                ? "bg-gold/15 text-gold"
                : plan === "plus"
                  ? "bg-brand/10 text-brand"
                  : "bg-muted",
            )}
          >
            {planLoading ? "…" : PLAN_LABELS[plan]}
          </span>
        </div>

        {/* Banner mejorar plan (solo si hay a dónde subir) */}
        {plan !== "gold" && (
        <Link
          href="/planes"
          className="mt-4 flex items-center gap-3 rounded-card border border-gold/40 bg-gold/10 p-4 transition-colors hover:bg-gold/15"
        >
          <Sparkles className="h-5 w-5 shrink-0 text-gold" />
          <div className="min-w-0">
            <p className="font-medium">Mejorá tu plan</p>
            <p className="text-sm text-muted-foreground">
              Historial, insights e inversiones
            </p>
          </div>
          <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
        </Link>
        )}

        {/* Menú */}
        <div className="mt-4 overflow-hidden rounded-card border border-border bg-card">
          <Row href="/pagos" icon={CalendarClock} label="Pagos fijos" hint="Alquiler, tarjeta, seguro: te avisamos antes de que venzan" />
          <Row href="/objetivos" icon={Target} label="Objetivos" hint="Metas de ahorro con plazo y monto" />
          <Row href="/importar" icon={Upload} label="Importar movimientos" hint="Resumen o CSV → gastos, sin cargar a mano" />
          <Row href="/perfil/presupuesto" icon={Tags} label="Mi presupuesto" hint="Ajustá los montos reales de cada categoría" />
          <Row href="/perfil/financiero" icon={SlidersHorizontal} label="Perfil financiero" hint="Ingreso, vivienda, estilo de vida" />
          <Row href="/perfil/notificaciones" icon={Bell} label="Notificaciones" hint="Avisos y recordatorios" />
          <Row href="/perfil/cuenta" icon={ShieldCheck} label="Tus datos" hint="Exportar o borrar tu cuenta" />
          <Row href="/contacto" icon={LifeBuoy} label="Ayuda y contacto" hint="Dudas, reclamos y bajas" />
        </div>

        <PlanPreviewToggle />

        {/* Apariencia */}
        <div className="mt-4 flex items-center justify-between rounded-card border border-border bg-card p-4">
          <div>
            <p className="font-medium">Apariencia</p>
            <p className="text-sm text-muted-foreground">Modo claro / oscuro</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Sesión */}
        {!loading && user ? (
          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-card border border-border py-3.5 text-sm font-medium text-negative transition-colors hover:bg-muted"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        ) : (
          !loading && (
            <Link
              href="/register"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-card bg-brand py-3.5 text-sm font-medium text-brand-foreground"
            >
              Crear cuenta para guardar tus datos
            </Link>
          )
        )}

        {/* Legales */}
        <div className="mt-8 flex items-center justify-center gap-5 text-xs text-muted-foreground">
          <Link href="/terminos" className="flex items-center gap-1.5 transition-colors hover:text-foreground">
            <FileText size={13} />
            Términos
          </Link>
          <Link href="/privacidad" className="flex items-center gap-1.5 transition-colors hover:text-foreground">
            <ShieldCheck size={13} />
            Privacidad
          </Link>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function Row({
  href,
  icon: Icon,
  label,
  hint,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border-b border-border px-4 py-3.5 transition-colors last:border-b-0 hover:bg-muted"
    >
      <Icon size={20} className="shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="font-medium">{label}</p>
        <p className="truncate text-sm text-muted-foreground">{hint}</p>
      </div>
      <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}
