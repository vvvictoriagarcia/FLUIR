"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { migrateLocalToSupabase } from "@/lib/data";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mensaje que puede venir del callback de email (?error=...). Se lee tras el
  // montaje para no romper la hidratación en la navegación dura del callback.
  useEffect(() => {
    const msg = new URLSearchParams(window.location.search).get("error");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura única de la URL al montar
    if (msg) setError(msg);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError("Falta conectar Supabase. Cargá las claves en .env.local.");
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setError("Email o contraseña incorrectos.");
      return;
    }
    // Si armó un presupuesto como invitado, lo subimos a su cuenta.
    await migrateLocalToSupabase().catch(() => false);
    router.push("/dashboard");
  }

  async function handleGoogle() {
    if (!isSupabaseConfigured) {
      setError("Falta conectar Supabase.");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      setError("El login con Google todavía no está activado. Usá email por ahora.");
    }
  }

  return (
    <AuthShell title="Bienvenido de vuelta" subtitle="Entrá para ver tu plata en orden">
      <form onSubmit={handleLogin} className="space-y-3">
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="vos@email.com"
        />
        <Field
          label="Contraseña"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
        />
        <div className="text-right">
          <Link
            href="/recuperar"
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-brand"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        {error && <p className="text-sm text-negative">{error}</p>}
        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={loading}
          className="w-full rounded-full bg-brand py-3.5 font-medium text-brand-foreground transition-opacity disabled:opacity-50"
        >
          {loading ? "Entrando…" : "Ingresar"}
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
        ¿No tenés cuenta?{" "}
        <Link href="/register" className="font-medium text-brand">
          Registrate
        </Link>
      </p>
    </AuthShell>
  );
}

// ── Componentes compartidos de auth ────────────────────────────────

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <Link
          href="/"
          className="mb-8 block text-center font-display text-3xl font-semibold tracking-tight text-brand"
        >
          fluir
        </Link>
        <h1 className="text-center font-display text-2xl font-semibold">{title}</h1>
        <p className="mt-1 mb-6 text-center text-sm text-muted-foreground">
          {subtitle}
        </p>
        {children}
      </motion.div>
    </div>
  );
}

export function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-2xl border-2 border-border bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-brand placeholder:text-muted-foreground/50"
      />
    </label>
  );
}

export function Separator() {
  return (
    <div className="my-5 flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs text-muted-foreground">o</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
