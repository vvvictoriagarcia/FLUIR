"use client";

import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getPlanPreview, planMeets, type Plan } from "@/lib/plan";

/**
 * Devuelve el plan actual del usuario y helpers de nivel.
 * Precedencia: override de previsualización (localStorage) → `profiles.plan`
 * de Supabase si hay sesión → `free` por defecto.
 */
export function usePlan() {
  const [plan, setPlan] = useState<Plan>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function resolve() {
      const preview = getPlanPreview();
      if (preview) {
        if (active) {
          setPlan(preview);
          setLoading(false);
        }
        return;
      }

      if (!isSupabaseConfigured) {
        if (active) setLoading(false);
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (active) setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle();

      if (active) {
        setPlan((data?.plan as Plan) ?? "free");
        setLoading(false);
      }
    }

    resolve();
    return () => {
      active = false;
    };
  }, []);

  return {
    plan,
    loading,
    isPlus: planMeets(plan, "plus"),
    isGold: planMeets(plan, "gold"),
  };
}
