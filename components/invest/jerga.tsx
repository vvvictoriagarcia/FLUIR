"use client";

import { useState } from "react";
import { GLOSARIO } from "@/lib/invest/content";

/**
 * Término técnico tappeable: se muestra subrayado punteado; al tocarlo,
 * despliega su explicación en una línea (del glosario). Para el novato.
 */
export function Jerga({
  term,
  children,
}: {
  term: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const def = GLOSARIO[term];
  if (!def) return <>{children}</>;

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="cursor-help border-b border-dotted border-gold text-inherit"
      >
        {children}
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-1 block w-56 rounded-lg border border-border bg-card p-3 text-left text-xs font-normal leading-relaxed text-foreground shadow-md"
        >
          {def}
        </span>
      )}
    </span>
  );
}
