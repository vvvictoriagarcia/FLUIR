"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
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

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* resplandor cálido, apoyado en el fondo arena (no un lavado violeta) */}
        <div aria-hidden className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[440px]" />

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pt-10 pb-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pt-16 lg:pb-24">
          {/* Columna izquierda: mensaje */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <span className="h-px w-8 bg-brand/60" />
              Para que la inflación no te coma el sueldo
            </span>

            <h1 className="mt-5 font-display text-[2.75rem] font-semibold leading-[1.03] tracking-tight sm:text-6xl">
              Que tu plata{" "}
              <span className="relative inline-block italic text-brand">
                fluya
                {/* subrayado recto y firme en el azul de acento: confiado, no jugueton */}
                <svg
                  aria-hidden
                  className="absolute -bottom-1 left-0 h-[6px] w-full text-brand"
                  viewBox="0 0 140 6"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M1 3 H 139"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{" "}
              como debería
            </h1>

            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
              Contanos cómo vivís y en 3 minutos tenés un presupuesto que te deja
              vivir, ahorrar y cumplir tus metas. Sin Excel, sin fórmulas, sin
              culpa.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href={ctaHref}
                  className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-base font-medium text-brand-foreground shadow-lg shadow-brand/25 transition-shadow hover:shadow-xl"
                >
                  {ctaLabel}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </motion.div>
              {!loggedIn && (
                <Link
                  href="/login"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Ya tengo cuenta →
                </Link>
              )}
            </div>

            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
              {CHECKS.map((c) => (
                <li
                  key={c}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-positive" />
                  {c}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Columna derecha: mini-producto (mostrar la magia antes de pedir datos) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="relative mx-auto w-full max-w-sm lg:mx-0 lg:ml-auto"
          >
            {/* tarjeta fantasma detrás: sensación de "hay más" */}
            <div
              aria-hidden
              className="absolute -right-3 -top-3 hidden h-full w-full rounded-card border border-border bg-card/50 sm:block"
            />
            <div className="relative rounded-card border border-border bg-card p-5 text-left shadow-xl shadow-black/5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Marzo · tu mes</p>
                <span className="rounded-full bg-positive/12 px-2 py-0.5 text-[11px] font-medium text-positive">
                  Vas bien
                </span>
              </div>
              <p className="mt-1.5 font-display text-xl font-semibold leading-snug">
                Podés gastar <span className="text-brand tabular-nums">$41.000</span>{" "}
                en salidas
              </p>
              <div className="mt-4 space-y-3">
                {[
                  { name: "Vivienda", pct: 100, color: "bg-brand" },
                  { name: "Salidas", pct: 55, color: "bg-brand" },
                  { name: "Ropa", pct: 35, color: "bg-brand" },
                  { name: "Ahorro", pct: 80, color: "bg-positive" },
                ].map((row) => (
                  <div key={row.name}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium">{row.name}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {row.pct}%
                      </span>
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
              <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                De cada <span className="tabular-nums text-foreground">$100</span> que
                entran, guardás{" "}
                <span className="font-semibold tabular-nums text-positive">$18</span>.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: (i % 2) * 0.08 }}
              className="bg-card p-6 sm:p-7"
            >
              <div className="flex items-center gap-3">
                <f.icon className="h-5 w-5 shrink-0 text-brand" />
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Quiénes somos / misión — layout asimétrico, no "3 tarjetas" ── */}
      <section className="border-y border-border bg-card/40 px-6 py-20">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <span className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
              <span className="h-px w-8 bg-brand/60" />
              Nuestra misión
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Que tu plata deje de ser un dolor de cabeza
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              En Argentina, cuidar la plata cansa. Fluir nació para que
              cualquiera —sepa o no de finanzas— entienda en qué está parado y
              tome mejores decisiones, sin estrés y sin culpa. No queremos que
              ahorres por ahorrar: queremos que vivas más tranquilo con lo que
              tenés.
            </p>
          </div>

          {/* Pilares como lista con hairlines: distinto de las tarjetas de arriba */}
          <ul className="flex flex-col divide-y divide-border">
            {PILARES.map((p) => (
              <li key={p.title} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <p.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {p.desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Educación — hábitos como "línea de flujo" numerada ────────── */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="max-w-2xl">
          <span className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
            <span className="h-px w-8 bg-brand/60" />
            Aprendé de a poco
          </span>
          <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Pequeños hábitos, gran cambio
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            No hace falta volverse experto. Con tres hábitos simples ya empezás a
            estar más tranquilo con tu plata. Fluir te acompaña en cada uno.
          </p>
        </div>

        <div className="relative mt-12 grid gap-10 sm:grid-cols-3">
          {/* la "corriente" que une los tres pasos: el motivo del río */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-4 hidden h-px bg-gradient-to-r from-brand/50 via-brand/25 to-transparent sm:block"
          />
          {HABITOS.map((h) => (
            <div key={h.n} className="relative">
              <div className="flex items-center gap-3">
                <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-brand/30 bg-background font-display text-sm font-semibold tabular-nums text-brand">
                  {h.n}
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{h.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {h.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex items-start gap-3 rounded-card bg-brand/[0.06] px-5 py-4">
          <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">Pronto:</span> cursos
            cortos y guías para entender tu plata sin vueltas.
          </p>
        </div>
      </section>

      {/* ── Precios ──────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-card/40 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <span className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
              <span className="h-px w-8 bg-brand/60" />
              Precios en pesos
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Sin sorpresas, sin dólares
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Empezá gratis y quedate en Free todo lo que quieras. Si algún día
              querés más, cuesta menos que un delivery.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PLANES.map((p) => (
              <div
                key={p.name}
                className={`rounded-card border bg-card p-6 transition-shadow ${
                  p.destacado
                    ? "border-brand/50 shadow-lg shadow-brand/10 md:-translate-y-2"
                    : "border-border"
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                  {p.destacado && (
                    <span className="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-medium text-brand-foreground">
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
                <ul className="mt-5 space-y-2.5">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-positive" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Cancelás cuando querés, desde la app.{" "}
            <Link href="/planes" className="font-medium text-brand hover:underline">
              Ver qué incluye cada plan
            </Link>
          </p>
        </div>
      </section>

      {/* ── Cierre ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Tu plata, en orden. Hoy.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">
          Tres minutos ahora y arrancás el mes que viene sabiendo exactamente
          dónde estás parado.
        </p>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="mt-8 inline-block"
        >
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-8 py-4 text-lg font-medium text-brand-foreground shadow-lg shadow-brand/25 transition-shadow hover:shadow-xl"
          >
            {ctaLabel}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
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
