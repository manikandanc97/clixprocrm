"use client";

import React from "react";
import { motion } from "framer-motion";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Button } from "@/shared/ui/button";
import { slideVariants } from "./import-types";

interface ImportProgressStepProps {
  progress: number;
  totalProcessed: number;
  validRowCount: number;
  currentImported: number;
  currentSkipped: number;
  currentFailed: number;
  isCancelling: boolean;
  onCancel: () => void;
}

export function ImportProgressStep({
  progress,
  totalProcessed,
  validRowCount,
  currentImported,
  currentSkipped,
  currentFailed,
  isCancelling,
  onCancel,
}: ImportProgressStepProps) {
  return (
    <motion.div
      key="step4"
      variants={slideVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col w-full items-center justify-center py-6"
    >
      <div className="relative w-28 h-28 mb-5">
        <div className="absolute inset-0 rounded-full border-[6px] border-muted opacity-30"></div>
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="56"
            cy="56"
            r="48"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            className="text-primary transition-all duration-500 ease-out drop-shadow-[0_0_10px_rgba(var(--primary),0.3)]"
            strokeDasharray={`${2 * Math.PI * 48}`}
            strokeDashoffset={`${2 * Math.PI * 48 * (1 - progress / 100)}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-2xl font-black text-foreground">
            {progress}%
          </span>
        </div>
      </div>
      <h3 className="text-lg font-bold mb-1 text-foreground animate-pulse">
        Importing Data...
      </h3>
      <p className="text-muted-foreground font-medium text-xs text-center max-w-xs mb-4">
        {totalProcessed} / {validRowCount} records processed
      </p>
      <div className="flex gap-6 text-sm font-semibold mb-5 bg-card p-3 rounded-xl border border-border/70 shadow-2xs">
        <div className="flex flex-col items-center px-2">
          <span className="text-emerald-600 dark:text-emerald-400 text-lg font-black">
            {currentImported}
          </span>
          <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">
            Imported
          </span>
        </div>
        <div className="w-[1px] bg-border/60"></div>
        <div className="flex flex-col items-center px-2">
          <span className="text-amber-600 dark:text-amber-400 text-lg font-black">
            {currentSkipped}
          </span>
          <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">
            Skipped
          </span>
        </div>
        <div className="w-[1px] bg-border/60"></div>
        <div className="flex flex-col items-center px-2">
          <span className="text-destructive text-lg font-black">
            {currentFailed}
          </span>
          <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">
            Failed
          </span>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={isCancelling}
        onClick={onCancel}
        className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 font-bold px-6 h-9 cursor-pointer gap-1.5 text-xs"
      >
        <AppIcon name="close" size={13} />
        <span>{isCancelling ? "Finishing current batch..." : "Cancel Import"}</span>
      </Button>
    </motion.div>
  );
}
