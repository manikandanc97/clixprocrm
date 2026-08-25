"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Sparkles, Check, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { CANONICAL_PLANS, getPlanDefinition } from "@/shared/lib/plans/plan-definitions";
import { PlanBadge } from "@/shared/components/PlanBadge";

export interface UpgradePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  targetPlan?: string;
  currentPlan?: string;
  description?: string;
}

export function UpgradePromptModal({
  isOpen,
  onClose,
  featureName,
  targetPlan = "growth",
  currentPlan = "free",
  description,
}: UpgradePromptModalProps) {
  const router = useRouter();
  const plan = getPlanDefinition(targetPlan);
  const currentPlanDef = getPlanDefinition(currentPlan);

  const handleNavigateToPricing = () => {
    onClose();
    router.push(`/pricing?plan=${plan.id}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-border/80 shadow-2xl">
        {/* Header gradient banner */}
        <div className="relative bg-gradient-to-r from-primary/15 via-indigo-500/10 to-primary/5 p-6 border-b border-border/60">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-primary/20 text-primary ring-1 ring-primary/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Premium Feature
              </span>
              <PlanBadge plan={plan.id} size="sm" />
            </div>
          </div>

          <DialogTitle className="text-xl font-bold text-foreground">
            {featureName ? `Unlock ${featureName}` : `Upgrade to ${plan.name}`}
          </DialogTitle>

          <DialogDescription className="text-sm text-muted-foreground mt-1.5">
            {description ||
              `${featureName || "This capability"} is available on the ${plan.name} plan. Upgrade your workspace to unlock advanced workflows, higher quotas, and enterprise capabilities.`}
          </DialogDescription>
        </div>

        {/* Plan Highlights */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground text-base">{plan.name} Plan</span>
                {plan.recommended && (
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25">
                    Most Popular
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{plan.target}</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold text-foreground">{plan.price}</span>
              <span className="text-xs text-muted-foreground block">
                {plan.pricingMode === "CUSTOM" ? "" : `/${plan.billingInterval}`}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              What you will unlock:
            </span>
            <ul className="space-y-2 text-sm text-foreground/90">
              {plan.featureDescriptions.slice(0, 4).map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <div className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 bg-muted/30 border-t border-border/60 flex sm:justify-between items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs font-semibold">
            Maybe Later
          </Button>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleNavigateToPricing}
              size="sm"
              className="bg-gradient-to-r from-primary to-indigo-600 hover:brightness-110 text-primary-foreground shadow-md gap-1.5 font-semibold text-xs"
            >
              <span>View Plans & Upgrade</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
