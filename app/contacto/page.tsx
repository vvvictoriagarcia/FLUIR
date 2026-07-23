import type { Metadata } from "next";
import Link from "next/link";
import { Mail, AtSign, ShieldCheck, Clock, MessageCircle } from "lucide-react";
import { LegalShell, LegalSection } from "@/components/legal-shell";
import {
  RESPONSE_TIME,
  INSTAGRAM_URL,
  INSTAGRAM_HANDLE,
  WHATSAPP_DISPLAY,
  mailto,
  whatsapp,
} from "@/lib/contact";

export const metadata: Metadata = {
  title: "Ayuda y contacto",
  description:
    "Escribinos por dudas, reclamos o bajas. Respondemos dentro de las 72 horas hábiles.",
};

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "¿Fluir se conecta a mi banco?",
    a: (
      <>
        No. Nunca te vamos a pedir el usuario, la clave ni el token de tu
        homebanking, y no tenemos forma de mover tu plata. Vos cargás los gastos
        a mano, o subís una captura o un CSV en{" "}
        <Link href="/importar" className="font-medium text-brand">
          Importar movimientos
        </Link>
        .
      </>
    ),
  },
  {
    q: "¿Es gratis?",
    a: (
      <>
        El plan Free es gratis y sirve completo: presupuesto, gastos, objetivos
        y tus categorías. Los planes pagos (Plus y Gold) suman historial,
        insights e inversiones. Podés ver todo en{" "}
        <Link href="/planes" className="font-medium text-brand">
          Planes
        </Link>
        .
      </>
    ),
  },
  {
    q: "¿Fluir me dice en qué invertir?",
    a: (
      <>
        No. Fluir <strong>no es asesor financiero ni agente registrado ante la
        CNV</strong>. El módulo de inversiones es material educativo: te explica
        cómo funcionan los instrumentos y los brokers, sin recomendarte ninguno
        en particular. Las decisiones sobre tu plata son tuyas.
      </>
    ),
  },
  {
    q: "¿Puedo usar Fluir sin crear cuenta?",
    a: (
      <>
        Sí. Sin cuenta, tus datos quedan solo en tu dispositivo. Si después
        creás una cuenta, se migran automáticamente para que no pierdas nada.
      </>
    ),
  },
  {
    q: "¿Qué pasa con mis datos?",
    a: (
      <>
        Son tuyos. No los vendemos ni los compartimos con anunciantes. Podés
        descargarlos o borrar tu cuenta cuando quieras desde{" "}
        <Link href="/perfil/cuenta" className="font-medium text-brand">
          Perfil → Tus datos
        </Link>
        . El detalle está en la{" "}
        <Link href="/privacidad" className="font-medium text-brand">
          Política de Privacidad
        </Link>
        .
      </>
    ),
  },
  {
    q: "Mi presupuesto me quedó raro, ¿lo puedo cambiar?",
    a: (
      <>
        Sí, y conviene. En{" "}
        <Link href="/perfil/presupuesto" className="font-medium text-brand">
          Mi presupuesto
        </Link>{" "}
        ponés el monto real de cada categoría (tu alquiler concreto, por
        ejemplo) y el ahorro se recalcula solo.
      </>
    ),
  },
  {
    q: "Encontré un error o algo no me anda",
    a: (
      <>
        Escribinos a{" "}
        <a href={mailto("Reporte de un problema")} className="font-medium text-brand">
          escribinos
        </a>{" "}
        contándonos qué pasó y desde qué dispositivo. Si podés, mandá una
        captura: nos ahorra medio día de adivinanzas.
      </>
    ),
  },
];

export default function ContactoPage() {
  return (
    <LegalShell
      title="Ayuda y contacto"
      subtitle="Somos un equipo chico y contestamos todos los mensajes."
      showContactLink={false}
    >
      {/* Contacto principal */}
      <div className="rounded-card border border-border bg-card p-5">
        <p className="font-medium">¿Necesitás una mano?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Escribinos por donde te quede más cómodo. Contestamos todos los
          mensajes.
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <a
            href={whatsapp()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand py-3 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
          >
            <MessageCircle size={16} />
            WhatsApp {WHATSAPP_DISPLAY}
          </a>
          <a
            href={mailto("Consulta desde Fluir")}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border py-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Mail size={16} />
            Escribinos por mail
          </a>
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock size={14} />
          Respondemos dentro de las {RESPONSE_TIME}.
        </p>

        {INSTAGRAM_URL && (
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <AtSign size={16} />
            {INSTAGRAM_HANDLE} en Instagram
          </a>
        )}
      </div>

      <LegalSection n={1} title="Reclamos">
        <p>
          Si algo salió mal —un cobro que no reconocés, un dato que no podés
          corregir, un problema con el servicio—{" "}
          <a href={mailto("Reclamo")} className="font-medium text-brand">
            escribinos por mail
          </a>{" "}
          con el asunto <strong>&ldquo;Reclamo&rdquo;</strong>, o mandanos un{" "}
          <a
            href={whatsapp("Hola, quiero hacer un reclamo por Fluir.")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand"
          >
            WhatsApp
          </a>. Te confirmamos
          la recepción y te damos una respuesta concreta dentro de las{" "}
          {RESPONSE_TIME}.
        </p>
        <p>
          Contanos: tu email de la cuenta, qué pasó, cuándo, y qué esperás que
          hagamos. Cuanto más concreto, más rápido lo resolvemos.
        </p>
      </LegalSection>

      <LegalSection
        n={2}
        id="arrepentimiento"
        title="Baja del servicio y arrepentimiento"
      >
        <p>
          <strong>Dar de baja tu cuenta:</strong> desde{" "}
          <Link href="/perfil/cuenta" className="font-medium text-brand">
            Perfil → Tus datos
          </Link>{" "}
          borrás todo vos, sin pedirle permiso a nadie y sin llamados de
          retención. También podés descargar tus datos antes.
        </p>
        <p>
          <strong>Cancelar un plan pago:</strong> escribinos con el asunto{" "}
          <strong>&ldquo;Baja&rdquo;</strong> a{" "}
          <a href={mailto("Baja")} className="font-medium text-brand">
            escribinos
          </a>{" "}
          y lo damos de baja. No hay permanencia mínima: el acceso pago sigue
          hasta el fin del período ya abonado y no se renueva.
        </p>
        <p>
          <strong>Botón de arrepentimiento:</strong> si contrataste un plan pago
          hace <strong>10 días corridos o menos</strong>, podés arrepentirte y
          te devolvemos lo pagado, según el art. 34 de la Ley 24.240 de Defensa
          del Consumidor. Mandá un mail con el asunto{" "}
          <strong>&ldquo;Arrepentimiento&rdquo;</strong> a{" "}
          <a href={mailto("Arrepentimiento")} className="font-medium text-brand">
            escribinos
          </a>{" "}
          desde el mail de tu cuenta.
        </p>
      </LegalSection>

      <LegalSection n={3} title="Privacidad y datos personales">
        <p>
          Para ejercer tus derechos de acceso, rectificación o supresión (Ley
          25.326), escribinos al mismo mail con el asunto{" "}
          <strong>&ldquo;Datos personales&rdquo;</strong>. Los detalles están en
          la{" "}
          <Link href="/privacidad" className="font-medium text-brand">
            Política de Privacidad
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection n={4} title="Preguntas frecuentes">
        <div className="divide-y divide-border rounded-card border border-border bg-card">
          {FAQ.map((item) => (
            <details key={item.q} className="group px-4 py-3.5">
              <summary className="cursor-pointer list-none font-medium text-foreground marker:content-none">
                <span className="flex items-start justify-between gap-3">
                  {item.q}
                  <span
                    aria-hidden
                    className="mt-0.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </span>
              </summary>
              <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </LegalSection>

      <div className="flex items-start gap-2.5 rounded-card border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand" />
        <p>
          Fluir nunca te va a pedir tu clave del homebanking, tu token, ni el
          código de seguridad de tu tarjeta. Si recibís un mensaje pidiéndote
          eso en nombre de Fluir, no es nuestro: avisanos.
        </p>
      </div>
    </LegalShell>
  );
}
