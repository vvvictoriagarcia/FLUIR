"use client";

import Link from "next/link";
import { ArrowLeft, GraduationCap, Sprout, PiggyBank, LineChart } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { ThemeToggle } from "@/components/theme-toggle";

// Sección de educación financiera. Todavía no desarrollamos el contenido, así
// que por ahora es una pantalla honesta de "Próximamente": la función ya vive
// en el menú para que la gente sepa que viene, sin prometer lo que no está.
const ADELANTOS = [
  {
    icon: Sprout,
    title: "Hábitos que cambian tu plata",
    desc: "Pequeños cambios, uno por vez. Cómo ser más consciente sin volverte loco con planillas.",
  },
  {
    icon: PiggyBank,
    title: "Ahorrar en un país con inflación",
    desc: "Por qué la plata quieta pierde y qué podés hacer, explicado en criollo.",
  },
  {
    icon: LineChart,
    title: "Primeros pasos para invertir",
    desc: "Del miedo a la práctica: cómo empezar tranquilo, sin jerga y sin apuro.",
  },
];

export default function EducacionPage() {
  return (
    <div className="min-h-screen pb-24 md:pl-60">
      <div className="mx-auto max-w-xl px-5 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/inicio"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Inicio
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-brand" />
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-brand">
            Educación financiera
          </span>
        </div>

        <h1 className="mt-3 font-display text-3xl font-semibold leading-tight">
          Aprender a manejar tu plata,{" "}
          <span className="italic text-brand">de a poco</span>
        </h1>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1.5 text-sm font-medium text-brand">
          <span className="h-2 w-2 rounded-full bg-brand" />
          Próximamente
        </div>

        <p className="mt-4 text-muted-foreground">
          Estamos armando un espacio para aprender lo básico de finanzas
          personales con la herramienta en la mano: nada de teoría aburrida, sí
          pequeños hábitos que se notan en tu plata. Muy pronto lo vas a tener
          acá.
        </p>

        <h2 className="mt-8 text-sm font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Algo de lo que se viene
        </h2>
        <div className="mt-3 space-y-3">
          {ADELANTOS.map((a) => (
            <div
              key={a.title}
              className="flex gap-3 rounded-card border border-border bg-card p-4"
            >
              <a.icon className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <div>
                <p className="font-medium">{a.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Mientras tanto, la mejor forma de aprender es usando Fluir:{" "}
          <Link href="/inicio" className="font-medium text-brand hover:underline">
            armá tu presupuesto
          </Link>{" "}
          y mirá a dónde se va tu plata.
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
