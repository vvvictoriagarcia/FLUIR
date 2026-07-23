"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, Download, Trash2, ShieldCheck } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast";
import { useUser } from "@/hooks/useUser";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { SUPPORT_EMAIL } from "@/lib/contact";

export default function CuentaPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, loading } = useUser();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function download(data: unknown, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleExport() {
    setExporting(true);
    try {
      if (user && isSupabaseConfigured) {
        const supabase = createClient();
        const [profile, answers, budgets, categories, expenses] =
          await Promise.all([
            supabase.from("profiles").select("*").eq("id", user.id),
            supabase.from("onboarding_answers").select("*").eq("user_id", user.id),
            supabase.from("budgets").select("*").eq("user_id", user.id),
            supabase.from("budget_categories").select("*"),
            supabase.from("expenses").select("*").eq("user_id", user.id),
          ]);
        download(
          {
            exported_at: new Date().toISOString(),
            account: { id: user.id, email: user.email },
            profile: profile.data,
            onboarding_answers: answers.data,
            budgets: budgets.data,
            budget_categories: categories.data,
            expenses: expenses.data,
          },
          "mis-datos-fluir.json"
        );
      } else {
        // Modo demo: los datos viven en el navegador.
        download(
          {
            exported_at: new Date().toISOString(),
            source: "localStorage",
            budget: JSON.parse(localStorage.getItem("fluir_budget") || "null"),
            expenses: JSON.parse(localStorage.getItem("fluir_expenses") || "[]"),
            savings_goal: Number(localStorage.getItem("fluir_savings_goal")) || 0,
          },
          "mis-datos-fluir.json"
        );
      }
      toast("Descargamos tus datos 📄");
    } catch {
      toast("No pudimos exportar tus datos. Probá de nuevo.", "error");
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    setConfirmOpen(false);
    setDeleting(true);
    try {
      if (user && isSupabaseConfigured) {
        const res = await fetch("/api/account/delete", { method: "POST" });
        if (!res.ok) throw new Error();
        await createClient().auth.signOut();
      } else {
        // Modo demo: limpiar el navegador.
        localStorage.removeItem("fluir_budget");
        localStorage.removeItem("fluir_expenses");
        localStorage.removeItem("fluir_savings_goal");
      }
      toast("Listo. Borramos todo. Cuidate 🌱");
      router.push("/");
    } catch {
      setDeleting(false);
      toast(`No pudimos borrar tu cuenta. Escribinos a ${SUPPORT_EMAIL}`, "error");
    }
  }

  const hasAccount = !loading && !!user;

  return (
    <div className="min-h-screen pb-24">
      <div className="mx-auto max-w-xl px-5 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/perfil"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Perfil
          </Link>
        </div>

        <h1 className="font-display text-3xl font-semibold">Tus datos</h1>
        <p className="mt-2 text-muted-foreground">
          Tu plata es tuya, y tus datos también. Acá los podés llevar o borrar
          cuando quieras.
        </p>

        {!hasAccount && !loading && (
          <div className="mt-5 flex items-start gap-3 rounded-card border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand" />
            <p>
              Estás usando Fluir sin cuenta: tus datos viven solo en este
              dispositivo, no en nuestros servidores.
            </p>
          </div>
        )}

        {/* Exportar */}
        <div className="mt-5 rounded-card border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Download size={18} className="text-brand" />
            <h2 className="font-medium">Exportar mis datos</h2>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Descargá todo lo que tenemos tuyo en un archivo (.json): tu perfil,
            tu presupuesto y tus gastos.
          </p>
          <button
            onClick={handleExport}
            disabled={exporting || loading}
            className="mt-4 w-full rounded-full border border-border py-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            {exporting ? "Preparando…" : "Descargar mis datos"}
          </button>
        </div>

        {/* Borrar */}
        <div className="mt-4 rounded-card border border-negative/30 bg-negative/5 p-5">
          <div className="flex items-center gap-2">
            <Trash2 size={18} className="text-negative" />
            <h2 className="font-medium">Borrar mi cuenta</h2>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Se elimina tu cuenta y todos tus datos de forma permanente. Esto no
            se puede deshacer. Si querés, exportalos antes.
          </p>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={deleting || loading}
            className="mt-4 w-full rounded-full border border-negative/40 py-3 text-sm font-medium text-negative transition-colors hover:bg-negative/10 disabled:opacity-50"
          >
            {deleting ? "Borrando…" : "Borrar mi cuenta"}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ejercés tus derechos de acceso y supresión (Ley 25.326). Más info en
          nuestra{" "}
          <Link href="/privacidad" className="font-medium text-brand">
            Política de Privacidad
          </Link>
          .
        </p>
      </div>

      <AnimatePresence>
        {confirmOpen && (
          <ConfirmDialog
            title="¿Borrar tu cuenta?"
            message="Se elimina todo tu presupuesto y tus gastos para siempre. No hay vuelta atrás."
            confirmLabel="Sí, borrar todo"
            cancelLabel="Mejor no"
            onConfirm={handleDelete}
            onCancel={() => setConfirmOpen(false)}
          />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
