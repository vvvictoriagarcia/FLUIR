"use client";

import { BottomNav } from "@/components/bottom-nav";

/** Esqueleto de carga del dashboard (con shimmer). Se siente más rápido que un spinner. */
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen pb-28">
      <div className="mx-auto max-w-xl px-5 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="skeleton h-6 w-16 rounded-md" />
          <div className="skeleton h-10 w-10 rounded-full" />
        </div>

        {/* Saludo + anillo */}
        <div className="flex flex-col items-center gap-3">
          <div className="skeleton h-4 w-40 rounded-md" />
          <div className="skeleton mt-2 h-52 w-52 rounded-full" />
        </div>

        {/* KPIs */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-16 rounded-card" />
          ))}
        </div>

        {/* Distribución */}
        <div className="skeleton mt-8 h-40 rounded-card" />

        {/* Categorías */}
        <div className="mt-8 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
