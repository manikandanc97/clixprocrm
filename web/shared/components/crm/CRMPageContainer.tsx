"use client";

import { cn } from "@/shared/lib/utils";
import { motion } from "framer-motion";

interface CRMPageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
  /**
   * When true, the container does NOT apply `flex-1` and uses a plain div
   * (no Framer Motion transform) so child sticky elements work correctly.
   * Use for pages that need a two-stage scroll:
   *   Stage 1 → outer page scrolls (KPI cards move away)
   *   Stage 2 → inner table body scrolls
   * Default false keeps the old behaviour (container fills viewport height).
   */
  twoStageScroll?: boolean;
}

export const CRMPageContainer = ({
  children,
  className,
  maxWidth = "max-w-none",
  twoStageScroll = false,
}: CRMPageContainerProps) => {
  const baseClass = cn(
    "mx-auto w-full flex-1 min-h-0 flex flex-col gap-4 sm:gap-5 px-4 sm:px-6 pt-1 pb-3.5 relative",
    maxWidth,
    className
  );

  if (twoStageScroll) {
    // Plain div — no CSS transform — so child position:sticky works correctly.
    // Uses a lightweight CSS fade-in instead of Framer Motion.
    return (
      <div className={cn(baseClass, "animate-in fade-in duration-300")}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={baseClass}
    >
      {children}
    </motion.div>
  );
};








