"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  Sprout,
  Camera,
} from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { PlanGate } from "@/components/gates/plan-gate";
import { ThemeToggle } from "@/components/theme-toggle";
import { Jerga } from "@/components/invest/jerga";
import { loadDashboard } from "@/lib/data";
import { BROKERS, TIPOS, DISCLAIMER, type Riesgo } from "@/lib/invest/content";
import { formatARS } from "@/lib/utils";

export default function InvertirPage() {
  return (
    <div className="min-h-screen pb-24">
      <div className="mx-auto max-w-xl px-5 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Inicio
          </Link>
          <ThemeToggle />
        </div>

        <PlanGate
          need="gold"
          feature="Fluir Invertí"
          benefits={[
            "Un paso a paso para invertir por primera vez, sin vueltas",
            "Entendé en qué te conviene empezar, en criollo",
            "Seguí tu plata invertida sacándole una foto",
          ]}
        >
          <Journey />
        </PlanGate>
      </div>
      <BottomNav />
    </div>
  );
}

function Journey() {
  const [step, setStep] = useState(0);
  const [sobra, setSobra] = useState<number | null>(null);
  const [colchon, setColchon] = useState<boolean | null>(null);
  const [deudas, setDeudas] = useState<boolean | null>(null);

  useEffect(() => {
    loadDashboard().then(({ budget }) => {
      if (budget) setSobra(Math.max(0, budget.result.total_savings));
    });
  }, []);

  const ready = colchon === true && deudas === false;
  const TOTAL = 5;

  return (
    <div>
      <div className="mb-5 flex items-center gap-2">
        <Sprout size={18} className="text-gold" />
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-gold">
          Fluir Invertí
        </span>
      </div>

      {/* Progreso */}
      <div className="mb-6 flex gap-1.5">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i <= step ? "bg-gold" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {step === 0 && <Disparador sobra={sobra} />}
        {step === 1 && (
          <Chequeo
            colchon={colchon}
            deudas={deudas}
            setColchon={setColchon}
            setDeudas={setDeudas}
            ready={ready}
          />
        )}
        {step === 2 && <Brokers />}
        {step === 3 && <Apertura />}
        {step === 4 && <PrimeraInversion />}
      </motion.div>

      {/* Navegación */}
      <div className="mt-8 flex items-center justify-between">
        {step > 0 ? (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Atrás
          </button>
        ) : (
          <span />
        )}

        {step < TOTAL - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 1 && (colchon === null || deudas === null)}
            className="flex items-center gap-1.5 rounded-full bg-gold px-6 py-3 text-sm font-medium text-gold-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {step === 0 ? "Empezar" : "Siguiente"}
            <ArrowRight size={16} />
          </button>
        ) : (
          <Link
            href="/dashboard"
            className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-gold-foreground"
          >
            Terminar
          </Link>
        )}
      </div>

      <p className="mt-8 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
        {DISCLAIMER}
      </p>
    </div>
  );
}

function Disparador({ sobra }: { sobra: number | null }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        Según tu presupuesto, te sobran por mes
      </p>
      <p className="tabular mt-1 font-display text-4xl font-semibold">
        {sobra === null ? "—" : `~${formatARS(sobra)}`}
      </p>
      <p className="mt-4 text-muted-foreground">
        Esa plata quieta en la caja de ahorro pierde contra la{" "}
        <Jerga term="inflacion">inflación</Jerga> todos los meses. Invertirla es
        hacerla trabajar para vos.
      </p>
      <p className="mt-3 text-muted-foreground">
        Te vamos a mostrar cómo empezar, paso a paso. No comprás nada acá: solo
        aprendés a dar el primer paso con confianza.
      </p>
    </div>
  );
}

function Chequeo({
  colchon,
  deudas,
  setColchon,
  setDeudas,
  ready,
}: {
  colchon: boolean | null;
  deudas: boolean | null;
  setColchon: (v: boolean) => void;
  setDeudas: (v: boolean) => void;
  ready: boolean;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">
        Antes de arrancar, ¿estás listo?
      </h2>
      <p className="mt-2 text-muted-foreground">
        Invertir tiene sentido cuando tenés la base cubierta. Dos preguntas
        rápidas y honestas.
      </p>

      <YesNo
        label="¿Tenés un colchón de emergencia?"
        hint={<Jerga term="colchon-emergencia">¿qué es esto?</Jerga>}
        value={colchon}
        onChange={setColchon}
      />
      <YesNo
        label="¿Tenés deudas de tarjeta o préstamos caros?"
        hint="Las tasas de esas deudas suelen ser más altas que cualquier inversión."
        value={deudas}
        onChange={setDeudas}
      />

      {colchon !== null && deudas !== null && !ready && (
        <div className="mt-5 rounded-card border border-gold/40 bg-gold/10 p-4">
          <p className="font-medium">Todavía no es el momento — y está perfecto.</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {colchon === false
              ? "Primero armá tu colchón de emergencia: es tu red de seguridad y rinde más tranquilidad que cualquier inversión. "
              : ""}
            {deudas === true
              ? "Saldar deudas caras te ahorra más de lo que ganarías invirtiendo. Empezá por ahí. "
              : ""}
            Volvé cuando tengas esa base — te vamos a estar esperando.
          </p>
        </div>
      )}

      {ready && (
        <div className="mt-5 flex items-start gap-2 rounded-card border border-positive/40 bg-positive/10 p-4">
          <Check size={18} className="mt-0.5 shrink-0 text-positive" />
          <p className="text-sm">
            Tenés la base cubierta. Estás en buen momento para dar el primer
            paso. Seguí para ver cómo.
          </p>
        </div>
      )}
    </div>
  );
}

function YesNo({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: React.ReactNode;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="mt-5">
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      <div className="mt-2 flex gap-2">
        {[
          { v: true, t: "Sí" },
          { v: false, t: "No" },
        ].map((o) => (
          <button
            key={o.t}
            onClick={() => onChange(o.v)}
            className={`flex-1 rounded-full border py-2.5 text-sm font-medium transition-colors ${
              value === o.v
                ? "border-gold bg-gold text-gold-foreground"
                : "border-border hover:bg-muted"
            }`}
          >
            {o.t}
          </button>
        ))}
      </div>
    </div>
  );
}

function Brokers() {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">Elegí dónde invertir</h2>
      <p className="mt-2 text-muted-foreground">
        Para invertir necesitás una cuenta en un{" "}
        <Jerga term="broker">broker</Jerga>. Acá tenés algunos populares en
        Argentina. <strong>Fluir no recomienda ninguno</strong>: elegí el que más
        te convenza.
      </p>
      <div className="mt-4 space-y-3">
        {BROKERS.map((b) => (
          <a
            key={b.nombre}
            href={b.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-card border border-border bg-card p-4 transition-colors hover:bg-muted"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{b.nombre}</span>
              <ExternalLink size={15} className="text-muted-foreground" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{b.blurb}</p>
            <p className="mt-1.5 text-xs text-gold">Bueno para: {b.bueno_para}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

function Apertura() {
  const pasos = [
    "Entrá a la web o app del broker que elegiste y tocá 'Abrir cuenta'.",
    "Vas a necesitar tu DNI y tu CUIL a mano.",
    "Completás tus datos y sacás una foto del DNI. Es gratis y online.",
    "Cuando aprueben la cuenta (suele ser rápido), transferís plata desde tu banco a tu cuenta del broker.",
    "Listo: ya tenés plata disponible para invertir.",
  ];
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">Abrí tu cuenta</h2>
      <p className="mt-2 text-muted-foreground">
        Abrir la cuenta es gratis y 100% online. En general el paso a paso es
        así (cada broker tiene su versión exacta en su web):
      </p>
      <ol className="mt-4 space-y-3">
        {pasos.map((p, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-semibold text-gold">
              {i + 1}
            </span>
            <span className="text-sm">{p}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function PrimeraInversion() {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">Tu primera inversión</h2>
      <p className="mt-2 text-muted-foreground">
        Cuando ya tengas plata en el broker, estas son las opciones más comunes,
        ordenadas de menor a mayor riesgo. Empezar por lo más suave es lo más
        habitual.
      </p>
      <div className="mt-4 space-y-3">
        {TIPOS.map((t) => (
          <div key={t.nombre} className="rounded-card border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">
                {t.jerga ? <Jerga term={t.jerga}>{t.nombre}</Jerga> : t.nombre}
              </span>
              <RiesgoBadge riesgo={t.riesgo} />
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">{t.criollo}</p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Disponibilidad: {t.plazo}
            </p>
          </div>
        ))}
      </div>

      <Link
        href="/invertir/cartera"
        className="mt-5 flex items-start gap-2 rounded-card border border-gold/40 bg-gold/10 p-4 transition-colors hover:bg-gold/15"
      >
        <Camera size={18} className="mt-0.5 shrink-0 text-gold" />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Seguí tu cartera.</span>{" "}
          Cargá lo que tenés (o sacale una foto a la pantalla de tu broker) y
          mirá cuánto vale hoy y cuánto ganaste.
        </p>
      </Link>
    </div>
  );
}

function RiesgoBadge({ riesgo }: { riesgo: Riesgo }) {
  const map: Record<Riesgo, { t: string; c: string }> = {
    bajo: { t: "Riesgo bajo", c: "bg-positive/15 text-positive" },
    medio: { t: "Riesgo medio", c: "bg-gold/15 text-gold" },
    alto: { t: "Riesgo alto", c: "bg-negative/15 text-negative" },
  };
  const r = map[riesgo];
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${r.c}`}>
      {r.t}
    </span>
  );
}
