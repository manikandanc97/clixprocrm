"use client";

import React from "react";
import { motion } from "framer-motion";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Button } from "@/shared/ui/button";
import { DuplicateStrategy, slideVariants } from "./import-types";

interface ImportValidationStepProps {
  validationResults: {
    valid: Record<string, unknown>[];
    invalid: (Record<string, unknown> & { _errors?: string })[];
  };
  duplicateStrategy: DuplicateStrategy;
  setDuplicateStrategy: (strategy: DuplicateStrategy) => void;
  onBack: () => void;
  onStartImport: () => void;
}

export function ImportValidationStep({
  validationResults,
  duplicateStrategy,
  setDuplicateStrategy,
  onBack,
  onStartImport,
}: ImportValidationStepProps) {
  const hasInvalid = validationResults.invalid.length > 0;

  return (
    <motion.div
      key="step3"
      variants={slideVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col w-full"
    >
      {/* Top Header info */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <AppIcon name="circleCheck" size={16} />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground leading-tight">
              Validation Summary
            </h3>
            <p className="text-xs text-muted-foreground">
              Review records and configure duplicate policy before importing
            </p>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 gap-3 mb-3.5">
        {/* Valid Rows Card */}
        <div
          data-animate-target="true"
          className="relative overflow-hidden rounded-xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.06] via-card to-card p-3.5 shadow-2xs hover:shadow-xs transition-all duration-200"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
          <div className="flex items-center justify-between pl-1">
            <div>
              <p className="text-[11px] font-bold tracking-wider uppercase text-emerald-700 dark:text-emerald-400 mb-0.5">
                Valid Rows
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {validationResults.valid.length}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  ready to import
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <AppIcon name="circleCheck" size={20} />
            </div>
          </div>
        </div>

        {/* Invalid Rows Card */}
        <div
          data-animate-target="true"
          className={`relative overflow-hidden rounded-xl border p-3.5 shadow-2xs transition-all duration-200 ${
            hasInvalid
              ? "border-destructive/30 bg-gradient-to-br from-destructive/[0.06] via-card to-card hover:shadow-xs"
              : "border-border/60 bg-card"
          }`}
        >
          <div
            className={`absolute left-0 top-0 bottom-0 w-1 ${
              hasInvalid ? "bg-destructive" : "bg-muted-foreground/30"
            }`}
          ></div>
          <div className="flex items-center justify-between pl-1">
            <div>
              <p
                className={`text-[11px] font-bold tracking-wider uppercase mb-0.5 ${
                  hasInvalid
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                Invalid Rows
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {validationResults.invalid.length}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {hasInvalid ? "errors found" : "no issues found"}
                </span>
              </div>
            </div>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                hasInvalid
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <AppIcon name="alert" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Invalid Rows Table if present - bounded scroll */}
      {hasInvalid && (
        <div className="mb-3.5 rounded-xl border border-destructive/25 bg-card overflow-hidden shadow-2xs">
          <div className="px-3.5 py-2 bg-destructive/5 border-b border-destructive/15 flex items-center justify-between">
            <span className="text-xs font-semibold text-destructive flex items-center gap-1.5">
              <AppIcon name="alert" size={13} />
              Review Issues (Showing up to 50 items)
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              {validationResults.invalid.length} issue(s)
            </span>
          </div>
          <div className="max-h-36 overflow-y-auto custom-scrollbar">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 sticky top-0 z-10 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3.5 py-2 font-bold w-1/3">Error Reason</th>
                  <th className="px-3.5 py-2 font-bold">Row Data Snippet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {validationResults.invalid.slice(0, 50).map((row, i) => (
                  <tr key={i} className="hover:bg-destructive/5 transition-colors">
                    <td className="px-3.5 py-2 text-destructive font-medium align-top">
                      {row._errors}
                    </td>
                    <td className="px-3.5 py-2 text-muted-foreground font-mono text-[11px] truncate max-w-[320px]">
                      {JSON.stringify(row).substring(0, 80)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Duplicate Strategy Section */}
      <div className="rounded-xl border border-border/70 bg-card p-3.5 shadow-2xs mb-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <AppIcon name="modules" size={14} className="text-primary" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Duplicate Handling Strategy
            </h4>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Matched by Lead Email
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[
            {
              id: "skip",
              label: "Skip Duplicates",
              desc: "Ignore records that already exist",
            },
            {
              id: "update",
              label: "Update Existing",
              desc: "Overwrite matching records with new data",
            },
            {
              id: "create",
              label: "Create Duplicate",
              desc: "Import anyway as separate leads",
            },
          ].map((strat) => {
            const isSelected = duplicateStrategy === strat.id;
            return (
              <div
                key={strat.id}
                onClick={() => setDuplicateStrategy(strat.id as DuplicateStrategy)}
                className={`group/strat relative p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                  isSelected
                    ? "border-primary bg-primary/[0.04] shadow-2xs ring-1 ring-primary/20"
                    : "border-border/70 hover:border-primary/40 bg-background hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40 bg-background group-hover/strat:border-primary/50"
                    }`}
                  >
                    {isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-bold truncate transition-colors ${
                      isSelected ? "text-primary" : "text-foreground group-hover/strat:text-primary"
                    }`}
                  >
                    {strat.label}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground pl-6 leading-snug">
                  {strat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-between items-center pt-3 border-t border-border/60">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="rounded-xl font-semibold text-xs h-9 px-4 cursor-pointer gap-1.5 hover:bg-muted/70"
        >
          <AppIcon name="arrowLeft" size={14} />
          <span>{hasInvalid ? "Back to Mapping" : "Back"}</span>
        </Button>
        <Button
          type="button"
          onClick={onStartImport}
          disabled={validationResults.valid.length === 0}
          className="rounded-xl font-bold text-xs h-9 px-6 shadow-sm hover:shadow cursor-pointer gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <span>
            {hasInvalid
              ? `Skip Invalid & Import (${validationResults.valid.length})`
              : `Start Import (${validationResults.valid.length} Leads)`}
          </span>
          <AppIcon name="arrowRight" size={14} />
        </Button>
      </div>
    </motion.div>
  );
}
