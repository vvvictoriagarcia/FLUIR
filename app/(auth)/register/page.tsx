"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/auth-errors";
import { readNext } from "@/lib/next-url";
import { saveEmailPrefs } from "@/lib/profile";
import { migrateLocalToSupabase } from "@/lib/data";
import { AuthShell, Field, Separator } from "../login/page";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [news, setNews] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!accepted) {
      setError("Aceptá los términos para crear tu cuenta.");
      return;
    }
    if (!isSupabaseConfigured) {
      setError("Falta conectar Supabase. Cargá las claves en .env.local.");
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(readNext("/onboarding"))}`,
      },
    });
    setLoading(false);
    if (error) {
      setError(authErrorMessage(error, "No pudimos crear tu cuenta."));
      return;
    }
    // Consentimiento de marketing, tal cual lo eligió al registrarse.
    await saveEmailPrefs({ marketing: news, product: true }).catch(() => false);

    // Si hay sesión, entró directo. Si no, hay que confirmar el email.
    if (data.session) {
      // Migrar el presupuesto que armó como invitado (si lo hizo).
      const migrated = await migrateLocalToSupabase().catch(() => false);
      router.push(readNext(migrated ? "/dashboard" : "/onboarding"));
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <AuthShell
        title="Revisá tu correo ✉️"
        subtitle={`Te mandamos un link a ${email}`}
      >
        <div className="rounded-card border border-border bg-card p-5 text-center text-sm text-muted-foreground">
          Tocá el link del mail para confirmar tu cuenta y ya podés entrar a
          Fluir. Si no lo ves, fijate en spam.
        </div>
        <Link
          href="/login"
          className="mt-5 block w-full rounded-full bg-brand py-3.5 text-center font-medium text-brand-foreground"
        >
          Ya confirmé — ir a ingresar
        </Link>
      </AuthShell>
    );
  }

  async function handleGoogle() {
    if (!isSupabaseConfigured) {
      setError("Falta conectar Supabase.");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${readNext("/onboarding")}` },
    });
    if (error) {
      setError(
        authErrorMessage(
          error,
          "El login con Google todavía no está activado. Usá email por ahora.",
        ),
      );
    }
  }

  return (
    <AuthShell title="Creá tu cuenta" subtitle="Empezá a ordenar tu plata en 3 minutos">
      <form onSubmit={handleRegister} className="space-y-3">
        <Field label="Nombre" type="text" value={name} onChange={setName} placeholder="¿Cómo te llamás?" />
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="vos@email.com" />
        <Field label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="Mínimo 6 caracteres" />

        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 accent-[var(--brand)]"
          />
          <span>
            Acepto los{" "}
            <Link href="/terminos" target="_blank" className="font-medium text-brand underline-offset-2 hover:underline">
              términos
            </Link>{" "}
            y la{" "}
            <Link href="/privacidad" target="_blank" className="font-medium text-brand underline-offset-2 hover:underline">
              política de privacidad
            </Link>
          </span>
        </label>

        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={news}
            onChange={(e) => setNews(e.target.checked)}
            className="mt-0.5 accent-[var(--brand)]"
          />
          <span>
            Mandame tips para ahorrar y novedades de Fluir (podés cortarlo cuando
            quieras)
          </span>
        </label>

        {error && <p className="text-sm text-negative">{error}</p>}

        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={loading}
          className="w-full rounded-full bg-brand py-3.5 font-medium text-brand-foreground transition-opacity disabled:opacity-50"
        >
          {loading ? "Creando tu cuenta…" : "Crear cuenta"}
        </motion.button>
      </form>

      <Separator />

      <button
        onClick={handleGoogle}
        className="w-full rounded-full border border-border py-3.5 text-sm font-medium transition-colors hover:bg-muted"
      >
        Continuar con Google
      </button>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-medium text-brand">
          Ingresá
        </Link>
      </p>
    </AuthShell>
  );
}
