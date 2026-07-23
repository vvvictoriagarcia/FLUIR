"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Target, TrendingUp, Zap } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useUser } from "@/hooks/useUser";
import { WHATSAPP_DISPLAY, whatsapp } from "@/lib/contact";

const CHECKS = [
  "Sin tarjeta",
  "Sin conectar el banco",
  "100% argentino",
  "En 3 minutos",
];

const FEATURES = [
  {
    icon: Zap,
    title: "Onboarding en 3 min",
    desc: "Sin saber de finanzas. Contestás 6 preguntas y listo.",
  },
  {
    icon: Target,
    title: "Adaptado a vos",
    desc: "No es un Excel genérico. Entiende si alquilás, si tenés auto, cómo salís.",
  },
  {
    icon: TrendingUp,
    title: "Tu plata, sin culpa",
    desc: "Te dice cuánto podés gastar de verdad — y cuánto te queda.",
  },
];

export default function Landing() {
  const { user, loading } = useUser();
  const loggedIn = !loading && !!user;
  const ctaHref = loggedIn ? "/dashboard" : "/onboarding";
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
            href={loggedIn ? "/dashboard" : "/login"}
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
            Finanzas para jóvenes argentinos
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
            Tasa de ahorro: 18% 🎉
          </p>
        </motion.div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-3">
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
