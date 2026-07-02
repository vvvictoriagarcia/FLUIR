"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { AuthShell, Field } from "../login/page";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError("Falta conectar Supabase.");
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/actualizar-clave`,
    });
    setLoading(false);
    if (error) {
      setError("No pudimos enviar el link. Probá de nuevo en un rato.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell
        title="Revisá tu correo ✉️"
        subtitle={`Te mandamos un link a ${email}`}
      >
        <div className="rounded-card border border-border bg-card p-5 text-center text-sm text-muted-foreground">
          Tocá el link del mail para elegir una contraseña nueva. Si no lo ves,
          fijate en spam.
        </div>
        <Link
          href="/login"
          className="mt-5 block w-full rounded-full border border-border py-3.5 text-center text-sm font-medium transition-colors hover:bg-muted"
        >
          Volver a ingresar
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="¿Olvidaste tu contraseña?"
      subtitle="Te mandamos un link para crear una nueva"
    >
      <form onSubmit={handleReset} className="space-y-3">
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="vos@email.com"
        />
        {error && <p className="text-sm text-negative">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-full bg-brand py-3.5 font-medium text-brand-foreground transition-opacity disabled:opacity-50"
        >
          {loading ? "Enviando…" : "Enviarme el link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-brand">
          Volver a ingresar
        </Link>
      </p>
    </AuthShell>
  );
}
