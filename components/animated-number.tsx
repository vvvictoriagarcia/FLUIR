"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";
import { formatARS } from "@/lib/utils";

/** Muestra un número que cuenta desde 0 (o el valor anterior) hasta `value`. */
export function AnimatedNumber({
  value,
  className,
  format = formatARS,
  duration = 0.8,
}: {
  value: number;
  className?: string;
  format?: (n: number) => string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, duration]);

  return <span className={className}>{format(Math.round(display))}</span>;
}
