"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { AuthShell, Field } from "../login/page";
import { FullScreenLoader } from "@/components/loading";

export default function ActualizarClavePage() {
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false); // hay sesión de recuperación válida
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChecking(false);
      return;
    }
    const supabase = createClient();
    const code = new URLSearchParams(window.location.search).get("code");

    (async () => {
      // Flujo PKCE: el link trae ?code que hay que intercambiar por sesión.
      if (code) await supabase.auth.exchangeCodeForSession(code).catch(() => {});
      const { data } = await supabase.auth.getSession();
      setReady(!!data.session);
      setChecking(false);
    })();

    // Flujo implícito: el cliente detecta el token del hash y dispara el evento.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setReady(true);
        setChecking(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Mínimo 6 caracteres.");
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError("No pudimos actualizar la contraseña. Pedí un link nuevo.");
      return;
    }
    setDone(true);
  }

  if (checking) return <FullScreenLoader />;

  if (done) {
    return (
      <AuthShell title="¡Listo! 🎉" subtitle="Tu contraseña quedó actualizada">
        <Link
          href="/dashboard"
          className="mt-2 block w-full rounded-full bg-brand py-3.5 text-center font-medium text-brand-foreground"
        >
          Ir a Fluir
        </Link>
      </AuthShell>
    );
  }

  if (!ready) {
    return (
      <AuthShell
        title="Link inválido o vencido"
        subtitle="Pedí uno nuevo para cambiar tu contraseña"
      >
        <Link
          href="/recuperar"
          className="mt-2 block w-full rounded-full bg-brand py-3.5 text-center font-medium text-brand-foreground"
        >
          Pedir un link nuevo
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Nueva contraseña"
      subtitle="Elegí una contraseña nueva para tu cuenta"
    >
      <form onSubmit={handleUpdate} className="space-y-3">
        <Field
          label="Nueva contraseña"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Mínimo 6 caracteres"
        />
        {error && <p className="text-sm text-negative">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-full bg-brand py-3.5 font-medium text-brand-foreground transition-opacity disabled:opacity-50"
        >
          {loading ? "Guardando…" : "Guardar contraseña"}
        </button>
      </form>
    </AuthShell>
  );
}
