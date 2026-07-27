"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  LineChart,
  Camera,
  Eye,
  Heart,
  Sprout,
  GraduationCap,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useUser } from "@/hooks/useUser";
import { WHATSAPP_DISPLAY, whatsapp } from "@/lib/contact";

const CHECKS = [
  "Gratis, sin tarjeta",
  "Sin conectar el banco",
  // Ítem 20: "sin conectar el banco" es honesto pero significa carga manual.
  // Se compensa mostrando acá mismo que no hace falta tipear.
  "Cargás un gasto con una foto",
  "En 3 minutos",
];

const FEATURES = [
  {
    icon: Zap,
    title: "Tu presupuesto en 3 min",
    desc: "Sin saber de finanzas. Contestás 6 preguntas y listo.",
  },
  {
    icon: Target,
    title: "Adaptada a cómo vivís acá",
    desc: "Entiende si alquilás, si tenés auto, si pagás en cuotas y cómo salís.",
  },
  // Ítem 19: el diferencial argentino es la inflación y el dólar, no la
  // bandera. Ya está construido; faltaba decirlo.
  {
    icon: LineChart,
    title: "Cuenta con la inflación",
    desc: "Tus objetivos se proyectan con la inflación del INDEC: sabés cuánto va a costar de verdad, no cuánto cuesta hoy.",
  },
  {
    icon: Camera,
    title: "Sin tipear cada gasto",
    desc: "Sacale una foto al resumen de la tarjeta y Fluir carga los movimientos solo.",
  },
];

const PLANES = [
  {
    name: "Free",
    price: "$0",
    detail: "Para siempre",
    features: [
      "Presupuesto armado en 3 minutos",
      "Gastos, objetivos y pagos fijos",
      "Cargá tus gastos con una foto",
    ],
  },
  {
    name: "Pro",
    price: "$4.000",
    detail: "por mes",
    destacado: true,
    features: ["Todo lo de Free", "Historial mes a mes", "Comparativa entre meses"],
  },
  {
    name: "Gold",
    price: "$9.000",
    detail: "por mes",
    features: ["Todo lo de Pro", "Guía para empezar a invertir", "Seguimiento de tu cartera"],
  },
];

const PILARES = [
  {
    icon: Eye,
    title: "Claridad, no planillas",
    desc: "Ver tu plata de un vistazo, en criollo. Nada de Excel ni términos que no entendés.",
  },
  {
    icon: Heart,
    title: "Sin culpa",
    desc: "No te retamos por gastar. Te mostramos cómo venís para que decidas vos, tranqui.",
  },
  {
    icon: Sprout,
    title: "Pequeños hábitos",
    desc: "Un cambio chico por vez. Así se llega a estar de verdad tranquilo con la plata.",
  },
];

const HABITOS = [
  {
    n: "01",
    title: "Anotá un gasto por día",
    desc: "El hábito más chico que lo cambia todo. Con una foto del ticket alcanza.",
  },
  {
    n: "02",
    title: "Guardá primero, gastá después",
    desc: "Apartá tu ahorro apenas cobrás, no con lo que sobra a fin de mes.",
  },
  {
    n: "03",
    title: "Mirá a dónde se te va",
    desc: "Dos minutos por semana. Enterarte es el 80% del cambio.",
  },
];

export default function Landing() {
  const { user, loading } = useUser();
  const loggedIn = !loading && !!user;
  const ctaHref = loggedIn ? "/inicio" : "/onboarding";
  const ctaLabel = loggedIn ? "Ir a mi Fluir" : "Crear mi presupuesto gratis";

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <span className="font-display text-2xl font-semibold tracking-tight text-brand">
          fluir
        </span>
        <div className="flex items-center gap-3">
          <Link
            href={loggedIn ? "/inicio" : "/login"}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {loggedIn ? "Ir a mi Fluir" : "Ingresar"}
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pt-12 pb-16 text-center sm:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            Para que la inflación no te coma el sueldo
          </span>

          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Que tu plata{" "}
            <span className="bg-gradient-to-r from-brand to-gold bg-clip-text text-transparent">
              fluya
            </span>{" "}
            como debería
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Contanos cómo vivís y en 3 minutos tenés un presupuesto que te deja
            vivir, ahorrar y cumplir tus metas. Sin Excel, sin fórmulas, sin
            culpa.
          </p>

          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="mt-9 inline-block"
          >
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-8 py-4 text-lg font-medium text-brand-foreground shadow-lg shadow-brand/25 transition-shadow hover:shadow-xl"
            >
              {ctaLabel}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>

          <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2">
            {CHECKS.map((c) => (
              <span
                key={c}
                className="flex items-center gap-1.5 text-sm text-muted-foreground"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-positive" />
                {c}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Preview del producto — "mostrar la magia" antes de pedir datos */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mx-auto mt-12 max-w-sm rounded-card border border-border bg-card p-5 text-left shadow-xl shadow-black/5"
        >
          <p className="text-xs text-muted-foreground">Tu presupuesto, así de claro</p>
          <p className="mt-1 font-display text-xl font-semibold">
            Podés gastar <span className="text-brand">$41.000</span> en salidas
          </p>
          <div className="mt-4 space-y-2.5">
            {[
              { name: "Vivienda", pct: 100, color: "bg-brand" },
              { name: "Salidas", pct: 55, color: "bg-brand" },
              { name: "Ropa", pct: 35, color: "bg-brand" },
              { name: "Ahorro", pct: 80, color: "bg-positive" },
            ].map((row) => (
              <div key={row.name}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium">{row.name}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${row.color}`}
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-positive">
            De cada $100 que entran, guardás $18 🎉
          </p>
        </motion.div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.1 }}
              className="rounded-card border border-border bg-card p-6"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Quiénes somos / misión */}
      <section className="border-y border-border bg-card/40 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand">
              Nuestra misión
            </span>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Que tu plata deje de ser un dolor de cabeza
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              En Argentina, cuidar la plata cansa. Fluir nació para que
              cualquiera —sepa o no de finanzas— entienda en qué está parado y
              tome mejores decisiones, sin estrés y sin culpa. No queremos que
              ahorres por ahorrar: queremos que vivas más tranquilo con lo que
              tenés.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {PILARES.map((p) => (
              <div key={p.title} className="rounded-card border border-border bg-card p-6">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Educación financiera — de a poco, en hábitos */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand">
            Aprendé de a poco
          </span>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Pequeños hábitos, gran cambio
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            No hace falta volverse experto. Con tres hábitos simples ya empezás
            a estar más tranquilo con tu plata. Fluir te acompaña en cada uno.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {HABITOS.map((h) => (
            <div key={h.n} className="rounded-card border border-border bg-card p-6">
              <span className="font-display text-2xl font-semibold text-brand/40">
                {h.n}
              </span>
              <h3 className="mt-2 font-semibold">{h.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{h.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-3 rounded-card border border-dashed border-brand/40 bg-brand/5 px-5 py-4 text-center">
          <GraduationCap className="h-5 w-5 shrink-0 text-brand" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Próximamente:</span>{" "}
            cursos cortos y guías para entender tu plata sin vueltas.
          </p>
        </div>
      </section>

      {/* Precios — cobrar en pesos es la ventaja contra la competencia
          internacional (4 a 15 dólares por mes) y no la estábamos diciendo. */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <h2 className="text-center font-display text-3xl font-semibold tracking-tight">
          Precios en pesos, sin sorpresas
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-muted-foreground">
          Empezá gratis y quedate en Free todo lo que quieras. Si algún día
          querés más, cuesta menos que un delivery.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {PLANES.map((p) => (
            <div
              key={p.name}
              className={`rounded-card border bg-card p-6 ${
                p.destacado ? "border-brand" : "border-border"
              }`}
            >
              <div className="flex items-baseline justify-between">
                <h3 className="font-semibold">{p.name}</h3>
                {p.destacado && (
                  <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-medium text-brand">
                    Más elegido
                  </span>
                )}
              </div>
              <p className="mt-3">
                <span className="font-display text-3xl font-semibold tabular-nums">
                  {p.price}
                </span>{" "}
                <span className="text-sm text-muted-foreground">{p.detail}</span>
              </p>
              <ul className="mt-4 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-positive" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Cancelás cuando querés, desde la app.{" "}
          <Link href="/planes" className="font-medium text-brand">
            Ver qué incluye cada plan
          </Link>
        </p>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link href="/contacto" className="transition-colors hover:text-foreground">
            Ayuda y contacto
          </Link>
          <span aria-hidden>·</span>
          <Link href="/terminos" className="transition-colors hover:text-foreground">
            Términos
          </Link>
          <span aria-hidden>·</span>
          <Link href="/privacidad" className="transition-colors hover:text-foreground">
            Privacidad
          </Link>
          <span aria-hidden>·</span>
          <Link
            href="/contacto#arrepentimiento"
            className="transition-colors hover:text-foreground"
          >
            Botón de arrepentimiento
          </Link>
        </div>
        <a
          href={whatsapp()}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block transition-colors hover:text-foreground"
        >
          WhatsApp {WHATSAPP_DISPLAY}
        </a>
        <p className="mt-2">Fluir · Hecho en Argentina 🇦🇷</p>
      </footer>
    </div>
  );
}
