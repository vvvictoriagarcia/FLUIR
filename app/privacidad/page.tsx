import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, LegalSection } from "@/components/legal-shell";
import { SUPPORT_EMAIL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Política de Privacidad · Fluir",
};

export default function PrivacidadPage() {
  return (
    <LegalShell title="Política de Privacidad" updated="2 de julio de 2026">
      <p>
        En Fluir cuidamos tu plata y también tus datos. Esta política explica,
        en criollo, qué información guardamos, para qué, y qué derechos tenés
        sobre ella según la <strong>Ley 25.326 de Protección de los Datos
        Personales</strong> de la República Argentina.
      </p>

      <LegalSection n={1} title="Quién es responsable de tus datos">
        <p>
          El responsable del tratamiento es Fluir. Podés contactarnos por
          cualquier tema de privacidad en{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-brand">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection n={2} title="Qué datos guardamos">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>De tu cuenta:</strong> tu nombre y tu email (o los datos
            básicos que nos comparte Google si entrás con esa opción).
          </li>
          <li>
            <strong>De tu plata:</strong> las respuestas del onboarding
            (ingreso, si alquilás, etc.), tu presupuesto, tus categorías y los
            gastos que registrás.
          </li>
          <li>
            <strong>Técnicos mínimos:</strong> datos necesarios para que la
            app funcione (por ejemplo, tu sesión).
          </li>
        </ul>
        <p>
          <strong>Nunca guardamos</strong> datos de tus tarjetas ni claves
          bancarias. Fluir no se conecta a tus cuentas del banco: los montos los
          cargás vos.
        </p>
        <p>
          Si usás Fluir <strong>sin cuenta</strong>, tus datos quedan solo en tu
          dispositivo (localStorage) y no llegan a nuestros servidores.
        </p>
      </LegalSection>

      <LegalSection n={3} title="Para qué los usamos">
        <ul className="list-disc space-y-1 pl-5">
          <li>armar y mostrarte tu presupuesto y tu seguimiento de gastos;</li>
          <li>guardar tus datos para que los veas desde cualquier dispositivo;</li>
          <li>mejorar la app y darte soporte si nos escribís.</li>
        </ul>
        <p>
          <strong>No vendemos tus datos</strong> ni los usamos para publicidad de
          terceros. Punto.
        </p>
      </LegalSection>

      <LegalSection n={4} title="Con quién los compartimos">
        <p>
          Solo con los proveedores necesarios para que Fluir funcione, y siempre
          bajo obligación de confidencialidad:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Supabase</strong> — base de datos y autenticación (guarda tu
            cuenta y tus datos de forma segura).
          </li>
          <li>
            <strong>Mercado Pago</strong> — solo si contratás un plan pago,
            para procesar el cobro.
          </li>
          <li>
            <strong>Vercel</strong> — hosting de la aplicación.
          </li>
        </ul>
        <p>
          Algunos de estos proveedores pueden almacenar datos fuera de
          Argentina. En esos casos exigimos niveles de protección adecuados,
          conforme a la normativa vigente.
        </p>
      </LegalSection>

      <LegalSection n={5} title="Tus derechos (Ley 25.326)">
        <p>Sobre tus datos personales, tenés derecho a:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Acceso:</strong> saber qué datos tenemos tuyos. Podés
            descargarlos vos mismo desde{" "}
            <span className="font-medium">Perfil → Tus datos → Exportar</span>.
          </li>
          <li>
            <strong>Rectificación y actualización:</strong> corregirlos o
            ponerlos al día (editás tu perfil y tu presupuesto cuando quieras).
          </li>
          <li>
            <strong>Supresión:</strong> borrar tu cuenta y todos tus datos desde{" "}
            <span className="font-medium">Perfil → Tus datos → Borrar mi cuenta</span>.
            El borrado es definitivo.
          </li>
        </ul>
        <p>
          El titular de los datos tiene la facultad de ejercer el derecho de
          acceso en forma gratuita a intervalos no inferiores a seis meses,
          salvo que se acredite un interés legítimo (art. 14, inc. 3, Ley
          25.326).
        </p>
        <p>
          La <strong>Agencia de Acceso a la Información Pública (AAIP)</strong>,
          en su carácter de Órgano de Control de la Ley 25.326, tiene la
          atribución de atender las denuncias y reclamos que se interpongan con
          relación al incumplimiento de las normas sobre protección de datos
          personales.
        </p>
      </LegalSection>

      <LegalSection n={6} title="Cuánto tiempo los guardamos">
        <p>
          Guardamos tus datos mientras tengas la cuenta activa. Si la borrás, se
          eliminan de forma permanente, salvo lo que la ley nos obligue a
          conservar (por ejemplo, registros de pagos).
        </p>
      </LegalSection>

      <LegalSection n={7} title="Seguridad">
        <p>
          Usamos cifrado en tránsito, acceso restringido y aislamiento por
          usuario (cada persona solo accede a lo suyo). Ningún sistema es 100 %
          infalible, pero tratamos tus datos con el mismo cuidado con el que
          querríamos que traten los nuestros.
        </p>
      </LegalSection>

      <LegalSection n={8} title="Cambios">
        <p>
          Si actualizamos esta política, te avisamos dentro de la app. La fecha
          de arriba siempre indica la última versión.
        </p>
      </LegalSection>

      <p className="text-sm text-muted-foreground">
        Al usar Fluir aceptás también nuestros{" "}
        <Link href="/terminos" className="font-medium text-brand">
          Términos y Condiciones
        </Link>
        .
      </p>
    </LegalShell>
  );
}
