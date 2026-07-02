import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, LegalSection } from "@/components/legal-shell";

export const metadata: Metadata = {
  title: "Términos y Condiciones · Fluir",
};

export default function TerminosPage() {
  return (
    <LegalShell title="Términos y Condiciones" updated="2 de julio de 2026">
      <p>
        Estos términos regulan el uso de <strong>Fluir</strong>, una aplicación
        para ordenar tu plata: armar un presupuesto, registrar gastos y seguir
        cómo venís en el mes. Al usar Fluir, aceptás lo que sigue. Si no estás de
        acuerdo, no la uses.
      </p>

      <LegalSection n={1} title="Qué es Fluir (y qué no)">
        <p>
          Fluir es una herramienta de organización financiera personal.
          Te muestra estimaciones y sugerencias basadas en los datos que vos
          cargás.
        </p>
        <p>
          <strong>Fluir no es asesoramiento financiero, contable ni de
          inversión.</strong> Las sugerencias de presupuesto son orientativas.
          Las decisiones sobre tu plata son tuyas. Ante dudas importantes,
          consultá con un profesional matriculado.
        </p>
      </LegalSection>

      <LegalSection n={2} title="Tu cuenta">
        <p>
          Podés usar Fluir sin cuenta (tus datos quedan solo en tu dispositivo)
          o crear una cuenta para guardarlos y acceder desde otro lado.
        </p>
        <p>
          Si creás una cuenta, sos responsable de mantener tu contraseña segura
          y de la actividad que pase en ella. Tenés que tener al menos 18 años
          para usar Fluir.
        </p>
      </LegalSection>

      <LegalSection n={3} title="Uso correcto">
        <p>Al usar Fluir, te comprometés a no:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>usarla para algo ilegal o para dañar a terceros;</li>
          <li>intentar romper, sobrecargar o vulnerar la seguridad del servicio;</li>
          <li>copiar, revender o hacer ingeniería inversa de la app.</li>
        </ul>
      </LegalSection>

      <LegalSection n={4} title="Planes y pagos">
        <p>
          Fluir tiene un plan <strong>Free</strong> gratuito. Los planes pagos
          (Plus y Gold) se cobran a través de Mercado Pago; sus condiciones y
          precios se muestran antes de contratar. Vas a poder cancelar cuando
          quieras; el acceso pago sigue hasta el fin del período ya abonado.
        </p>
        <p>
          Mientras estos planes no estén disponibles, todo lo que figure como
          &ldquo;Próximamente&rdquo; no está contratable.
        </p>
      </LegalSection>

      <LegalSection n={5} title="Tus datos">
        <p>
          El tratamiento de tus datos personales se rige por nuestra{" "}
          <Link href="/privacidad" className="font-medium text-brand">
            Política de Privacidad
          </Link>
          , parte integrante de estos términos.
        </p>
      </LegalSection>

      <LegalSection n={6} title="Disponibilidad y responsabilidad">
        <p>
          Fluir se ofrece &ldquo;tal cual está&rdquo;. Ponemos lo mejor para que
          funcione y para cuidar tus datos, pero no garantizamos que esté libre
          de errores ni disponible sin interrupciones.
        </p>
        <p>
          En la medida que permita la ley, Fluir no se responsabiliza por
          decisiones que tomes en base a la app ni por pérdidas derivadas de su
          uso. Hacé copias de lo que te importe (podés exportar tus datos desde
          tu perfil).
        </p>
      </LegalSection>

      <LegalSection n={7} title="Cambios en los términos">
        <p>
          Podemos actualizar estos términos. Si el cambio es importante, te
          avisamos dentro de la app. Seguir usándola después de un cambio
          implica que lo aceptás.
        </p>
      </LegalSection>

      <LegalSection n={8} title="Ley aplicable">
        <p>
          Estos términos se rigen por las leyes de la República Argentina. Ante
          cualquier conflicto, se someten a los tribunales ordinarios de la
          Ciudad Autónoma de Buenos Aires.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
