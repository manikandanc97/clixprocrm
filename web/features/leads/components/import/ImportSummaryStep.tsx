"use client";

import React from "react";
import { motion } from "framer-motion";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Button } from "@/shared/ui/button";
import { downloadFailedRows } from "@/lib/bulk-import-utils";
import { ImportSummaryData, slideVariants } from "./import-types";

interface ImportSummaryStepProps {
  summary: ImportSummaryData;
  onClose: () => void;
}

export function ImportSummaryStep({
  summary,
  onClose,
}: ImportSummaryStepProps) {
  return (
    <motion.div
      key="step5"
      variants={slideVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col w-full items-center justify-center py-2"
    >
      <div className="w-full max-w-xl bg-card rounded-xl border border-border/80 shadow-md p-6 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-emerald-500/10 to-transparent"></div>

        <div className="relative flex flex-col items-center z-10 text-center mb-5">
          <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 mb-3 border-2 border-white dark:border-background relative">
            <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping"></div>
            <AppIcon name="circleCheck" size={28} className="text-white relative z-10" />
          </div>
          <h3 className="text-xl font-black text-foreground tracking-tight mb-1">
            Import Complete!
          </h3>
          <p className="text-muted-foreground font-medium text-xs">
            Your data has been successfully processed into the CRM.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5 relative z-10">
          <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 text-center shadow-2xs">
            <h4 className="text-2xl font-black text-emerald-600 mb-1">
              {summary.imported}
            </h4>
            <p className="text-[10px] font-bold text-emerald-700/80 uppercase tracking-wider">
              Imported
            </p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 text-center shadow-2xs">
            <h4 className="text-2xl font-black text-amber-600 mb-1">
              {summary.skipped}
            </h4>
            <p className="text-[10px] font-bold text-amber-700/80 uppercase tracking-wider">
              Skipped
            </p>
          </div>
          <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-center shadow-2xs">
            <h4 className="text-2xl font-black text-destructive mb-1">
              {summary.failed}
            </h4>
            <p className="text-[10px] font-bold text-destructive/80 uppercase tracking-wider">
              Failed
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
          {summary.failedRows.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadFailedRows(summary.failedRows, "csv")}
              className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 font-bold px-4 h-9 cursor-pointer gap-1.5 text-xs w-full sm:w-auto"
            >
              <AppIcon name="download" size={14} />
              <span>Download Failed Rows</span>
            </Button>
          )}
          <Button
            onClick={onClose}
            size="sm"
            className="rounded-xl font-bold px-8 h-9 shadow-sm hover:shadow shadow-primary/20 w-full sm:w-auto cursor-pointer gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <span>Go to Dashboard</span>
            <AppIcon name="dashboard" size={14} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
