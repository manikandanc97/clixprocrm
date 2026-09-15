"use client";

import React from "react";
import { Layers, Edit3, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/shared/ui/table";
import { PlanAiConfigItem } from "@/shared/lib/api/super-admin.api";

interface PlanAiTableProps {
  loading: boolean;
  canonicalPlans: PlanAiConfigItem[];
  globalAiEnabled: boolean;
  handleOpenEditPlan: (plan: PlanAiConfigItem) => void;
}

export function PlanAiTable({
  loading,
  canonicalPlans,
  globalAiEnabled,
  handleOpenEditPlan,
}: PlanAiTableProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            AI Access by Plan
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure AI availability, model tiers, and token limits per subscription plan.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-muted-foreground rounded-2xl bg-card border border-border flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span>Loading plan entitlements...</span>
        </div>
      ) : canonicalPlans.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted-foreground rounded-2xl bg-card border border-border">
          No subscription plans found.
        </div>
      ) : (
        <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="h-10 hover:bg-transparent">
                  <TableHead className="w-[22%]">Plan</TableHead>
                  <TableHead className="w-[18%]">AI Access</TableHead>
                  <TableHead className="w-[24%]">Default Model</TableHead>
                  <TableHead className="w-[14%]">Models Allowed</TableHead>
                  <TableHead className="w-[14%]">Usage Limit</TableHead>
                  <TableHead className="w-[8%] text-right pr-5">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {canonicalPlans.map((plan) => {
                  const isAiActive = plan.aiEnabled && globalAiEnabled;

                  return (
                    <TableRow key={plan.id} className="h-14 hover:bg-muted/30">
                      {/* Plan Name & Price */}
                      <TableCell className="h-14">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground text-xs">
                            {plan.name}
                          </span>
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            ({plan.price})
                          </span>
                        </div>
                      </TableCell>

                      {/* AI Access Tier */}
                      <TableCell className="h-14">
                        <span
                          className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                            plan.aiEnabled
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {plan.aiEnabled ? plan.aiLevel || "Basic AI" : "Disabled"}
                        </span>
                      </TableCell>

                      {/* Default Model */}
                      <TableCell className="h-14">
                        {isAiActive && plan.defaultModel ? (
                          <span className="font-mono text-xs font-semibold text-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/60">
                            {plan.defaultModel.displayName}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            {plan.aiEnabled ? "None Selected" : "AI Inactive"}
                          </span>
                        )}
                      </TableCell>

                      {/* Models Allowed */}
                      <TableCell className="h-14">
                        <span className="text-xs font-medium text-foreground">
                          {plan.aiEnabled
                            ? `${plan.allowedModels.length} ${
                                plan.allowedModels.length === 1 ? "model" : "models"
                              }`
                            : "0 models"}
                        </span>
                      </TableCell>

                      {/* Usage Limit */}
                      <TableCell className="h-14">
                        <span className="text-xs font-medium text-muted-foreground">
                          {plan.dailyTokenLimit
                            ? `${plan.dailyTokenLimit.toLocaleString()} tokens/day`
                            : "Standard"}
                        </span>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="h-14 text-right pr-5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEditPlan(plan)}
                          className="h-7 text-xs font-bold px-3 rounded-lg border-primary/30 text-primary hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
