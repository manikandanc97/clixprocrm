"use client";

import React from "react";
import { AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/shared/hooks/use-subscription";

export interface LimitReachedBannerProps {
  resourceName: string;
  current: number;
  max: number;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function LimitReachedBanner({
  resourceName,
  current,
  max,
  actionText,
  onAction,
  className = "",
}: LimitReachedBannerProps) {
  const router = useRouter();
  const { plan, openUpgradeModal } = useSubscription();

  const isFull = max !== -1 && current >= max;
  const isNearLimit = max !== -1 && !isFull && (current / max) >= 0.8;

  if (!isFull && !isNearLimit) {
    return null;
  }

  const percentage = max === -1 ? 0 : Math.min(100, Math.round((current / max) * 100));

  const handleUpgrade = () => {
    if (onAction) {
      onAction();
    } else {
      router.push("/settings?section=subscription");
    }
  };

  return (
    <div
      className={`rounded-xl border p-4 shadow-sm transition-all ${
        isFull
          ? "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-200"
          : "border-primary/25 bg-primary/5 text-foreground"
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              isFull
                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                : "bg-primary/15 text-primary"
            }`}
          >
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                {isFull ? `${resourceName} Limit Reached` : `Approaching ${resourceName} Limit`}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-background/80 border border-border">
                {current.toLocaleString()} / {max.toLocaleString()}
              </span>
            </div>
            <p className="text-xs opacity-90 mt-0.5">
              {isFull
                ? `Your ${plan.name} plan limit of ${max.toLocaleString()} ${resourceName.toLowerCase()} has been reached. Upgrade to add more.`
                : `You have used ${percentage}% of your included ${resourceName.toLowerCase()} capacity.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={handleUpgrade}
            className={`gap-1.5 text-xs font-semibold shadow-xs ${
              isFull
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-primary hover:brightness-110 text-primary-foreground"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{actionText || "Upgrade Plan"}</span>
          </Button>
        </div>
      </div>

      {/* Mini progress meter */}
      <div className="mt-3 w-full bg-background/60 rounded-full h-1.5 overflow-hidden border border-border/40">
        <div
          className={`h-full rounded-full transition-all ${
            isFull ? "bg-amber-500" : "bg-primary"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
