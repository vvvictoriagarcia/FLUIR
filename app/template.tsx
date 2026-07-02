"use client";

import { motion } from "framer-motion";

// Transición suave al cambiar de pantalla. Solo opacidad para no romper el
// posicionamiento `fixed` de la nav inferior, el FAB y los modales.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
