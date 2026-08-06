import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Home,
  Receipt,
  CalendarClock,
  Target,
  Wallet,
  TrendingUp,
  Pencil,
  LifeBuoy,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Cómo usar Fluir",
  description:
    "Guía rápida: qué podés hacer en Fluir, cómo, y para qué te sirve cada cosa.",
};

// Cada bloque: qué es, cómo se hace y para qué sirve — en criollo, sin vueltas.
const SECCIONES = [
  {
    icon: Home,
    title: "Tu presupuesto",
    href: "/inicio",
    hrefLabel: "Ir al inicio",
    como: "Contestás 6 preguntas una vez y Fluir arma tu presupuesto solo.",
    para: "Saber de un vistazo cuánto podés gastar de verdad este mes, sin cuentas.",
  },
  {
    icon: Receipt,
    title: "Cargar gastos",
    href: "/gastos",
    hrefLabel: "Ver mis gastos",
    como: "Tocá “Cargar gasto”, poné el monto y la categoría. Podés sacarle una foto al resumen o crear una categoría nueva con “+ Otro”.",
    para: "Ver en qué se te va la plata sin tener que anotar todo a mano.",
  },
  {
    icon: CalendarClock,
    title: "Pagos fijos",
    href: "/pagos",
    hrefLabel: "Cargar pagos fijos",
    como: "Cargá el alquiler, la tarjeta o el seguro con el día que vence.",
    para: "Que te avisemos antes de cada vencimiento y no te agarre desprevenido.",
  },
  {
    icon: Target,
    title: "Objetivos",
    href: "/objetivos",
    hrefLabel: "Ponerme un objetivo",
    como: "Ponele nombre, monto y fecha a lo que querés lograr.",
    para: "Saber cuánto guardar por mes — ajustado por la inflación — para llegar.",
  },
  {
    icon: Wallet,
    title: "Mi plata",
    href: "/patrimonio",
    hrefLabel: "Ver mi plata",
    como: "Cargá lo que ya tenías ahorrado. Ahí ves todo junto: ahorros, gastos e inversiones.",
    para: "Tener en un solo lugar cómo venís con tu plata, mes a mes.",
  },
  {
    icon: TrendingUp,
    title: "Invertir",
    href: "/invertir",
    hrefLabel: "Empezar a invertir",
    como: "Una guía paso a paso para empezar, y después cargás tus inversiones (o les sacás una foto). Cuando vendés, marcás “Vendí”.",
    para: "Hacer rendir lo que te sobra y seguir cuánto vale tu plata, sin ser experto.",
    gold: true,
  },
  {
    icon: Pencil,
    title: "Todo se puede corregir",
    href: "/perfil/presupuesto",
    hrefLabel: "Ajustar mi presupuesto",
    como: "El ingreso, los montos de cada categoría, tus inversiones y tus ahorros se editan cuando quieras.",
    para: "Que un error no te quede clavado. Te equivocaste, lo cambiás, listo.",
  },
];

export default function GuiaPage() {
  return (
    <div className="min-h-screen pb-24 md:pl-60">
      <div className="mx-auto max-w-2xl px-5 py-6 lg:max-w-3xl lg:px-8">
        <div className="mb-6">
          <Link
            href="/perfil"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Perfil
          </Link>
        </div>

        <h1 className="font-display text-3xl font-semibold">Cómo usar Fluir</h1>
        <p className="mt-2 text-muted-foreground">
          Fluir junta todo lo de tu plata en un solo lugar, en criollo y sin
          culpa. Acá tenés, en dos minutos, qué podés hacer y para qué sirve
          cada cosa.
        </p>

        <div className="mt-6 space-y-3">
          {SECCIONES.map((s) => (
            <div key={s.title} className="rounded-card border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    s.gold ? "bg-gold/10 text-gold" : "bg-brand/10 text-brand"
                  }`}
                >
                  <s.icon className="h-5 w-5" />
                </span>
                <h2 className="font-display text-lg font-semibold">{s.title}</h2>
              </div>

              <div className="mt-3 space-y-2 text-sm">
                <p className="text-foreground/90">
                  <span className="font-medium">Cómo: </span>
                  {s.como}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground/90">Para qué: </span>
                  {s.para}
                </p>
              </div>

              <Link
                href={s.href}
                className={`mt-3 inline-block text-sm font-medium ${
                  s.gold ? "text-gold" : "text-brand"
                }`}
              >
                {s.hrefLabel} →
              </Link>
            </div>
          ))}
        </div>

        {/* Cierre */}
        <div className="mt-6 flex items-start gap-3 rounded-card border border-border bg-muted/40 p-5">
          <LifeBuoy size={20} className="mt-0.5 shrink-0 text-brand" />
          <div>
            <p className="font-medium">¿Te quedó una duda?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Escribinos por WhatsApp o mail desde{" "}
              <Link href="/contacto" className="font-medium text-brand">
                Ayuda y contacto
              </Link>
              . Somos un equipo chico y contestamos todo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
