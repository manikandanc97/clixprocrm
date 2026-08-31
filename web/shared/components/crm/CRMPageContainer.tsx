"use client";

import { cn } from "@/shared/lib/utils";
import { motion } from "framer-motion";

interface CRMPageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
}

export const CRMPageContainer = ({
  children,
  className,
  maxWidth = "max-w-none",
}: CRMPageContainerProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "mx-auto flex flex-1 w-full flex-col gap-5 sm:gap-6 px-4 sm:px-6 pt-1 pb-3.5 relative",
        maxWidth,
        className
      )}
    >
      {children}
    </motion.div>
  );
};











