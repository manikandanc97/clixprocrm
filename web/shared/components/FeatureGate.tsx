"use client";

import React, { ReactNode } from "react";
import { useSubscription } from "@/shared/hooks/use-subscription";
import { Lock, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useRouter } from "next/navigation";
import { PlanBadge } from "@/shared/components/PlanBadge";

export interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  showBanner?: boolean;
  featureName?: string;
  targetPlan?: string;
}

export function FeatureGate({
  feature,
  children,
  fallback,
  showBanner = true,
  featureName,
  targetPlan = "growth",
}: FeatureGateProps) {
  const router = useRouter();
  const { hasFeature, plan, openUpgradeModal } = useSubscription();
  const isAllowed = hasFeature(feature);

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showBanner) {
    return null;
  }

  const name = featureName || feature.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/80 bg-gradient-to-r from-card to-muted/40 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-foreground text-base">{name} is Locked</h4>
              <PlanBadge plan={targetPlan} size="sm" />
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
              This capability requires the {targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1)} plan or above. Upgrade your workspace subscription to unlock this feature and higher limits.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => openUpgradeModal(name, targetPlan)}
            className="bg-primary text-primary-foreground hover:brightness-110 shadow-xs gap-1.5 text-xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upgrade Plan</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
