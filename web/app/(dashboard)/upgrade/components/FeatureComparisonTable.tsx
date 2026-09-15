"use client";

import React from "react";
import { Bot, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  PlanDefinition,
  formatPlanDisplayPrice,
} from "@/shared/lib/plans/plan-definitions";
import { motion, AnimatePresence } from "framer-motion";
import { renderMatrixCell } from "./upgrade-types";

interface FeatureMatrixCategory {
  category: string;
  features: Array<{
    key: string;
    name: string;
    description?: string;
    values?: Record<string, unknown>;
    [key: string]: unknown;
  }>;
}

interface SubscriptionShape {
  comparisonMatrix?: FeatureMatrixCategory[];
}

interface FeatureComparisonTableProps {
  showComparison: boolean;
  setShowComparison: (show: boolean) => void;
  displayPlans: PlanDefinition[];
  popularPlanId: string | null;
  billingCycle: "monthly" | "annual";
  subscription?: SubscriptionShape | null;
}

export function FeatureComparisonTable({
  showComparison,
  setShowComparison,
  displayPlans,
  popularPlanId,
  billingCycle,
  subscription,
}: FeatureComparisonTableProps) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs w-full mt-2">
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setShowComparison(!showComparison)}
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
            <Bot className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground tracking-tight">
              Full Plan Capability &amp; Feature Comparison Matrix
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Compare in-depth limits across CRM capacities, automation workflows, RBAC roles, security, and storage.
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground rounded-lg">
          <span>{showComparison ? "Hide Matrix" : "View Matrix"}</span>
          {showComparison ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      <AnimatePresence>
        {showComparison && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 overflow-x-auto border-t border-border/60 pt-4"
          >
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="p-3.5 font-bold text-foreground rounded-tl-xl">Feature Category</th>
                  {displayPlans.map((p, idx) => {
                    const isLast = idx === displayPlans.length - 1;
                    const isPop = p.id === popularPlanId;
                    const priceInfo = formatPlanDisplayPrice(p, billingCycle);
                    return (
                      <th
                        key={p.id}
                        className={`p-3.5 font-bold text-center ${
                          isPop
                            ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border-x border-emerald-500/20"
                            : "text-foreground"
                        } ${isLast ? "rounded-tr-xl" : ""}`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>{p.name}</span>
                          <span className="text-[11px] font-normal opacity-80">({priceInfo.priceText})</span>
                          {isPop && <span>⭐</span>}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {(subscription?.comparisonMatrix && subscription.comparisonMatrix.length > 0
                  ? subscription.comparisonMatrix
                  : []
                ).map((category) => (
                  <React.Fragment key={category.category}>
                    <tr className="bg-muted/70">
                      <td
                        colSpan={displayPlans.length + 1}
                        className="py-2.5 px-3.5 font-extrabold text-[11px] text-foreground uppercase tracking-wider"
                      >
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature) => (
                      <tr key={feature.key} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3.5">
                          <div className="font-semibold text-foreground">{feature.name}</div>
                          <div className="text-[11px] text-muted-foreground">{feature.description}</div>
                        </td>
                        {displayPlans.map((p) => {
                          const isPop = p.id === popularPlanId;
                          const cellValue = feature.values?.[p.id] ?? feature[p.id] ?? (p.features?.some((f) => f.toLowerCase().includes(feature.name.toLowerCase())) ?? false);
                          return (
                            <td
                              key={p.id}
                              className={`p-3.5 text-center ${
                                isPop
                                  ? "bg-emerald-500/5 font-semibold text-emerald-700 dark:text-emerald-300 border-x border-emerald-500/20"
                                  : ""
                              }`}
                            >
                              {renderMatrixCell(cellValue)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
