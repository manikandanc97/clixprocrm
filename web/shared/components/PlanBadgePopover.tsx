"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover";
import { PlanBadge } from "@/shared/components/PlanBadge";
import { useSubscription } from "@/shared/hooks/use-subscription";
import { formatPlanDisplayPrice } from "@/shared/lib/plans/plan-definitions";
import {
  Calendar,
  Users,
  CreditCard,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/shared/ui/button";

export interface PlanBadgePopoverProps {
  showTriggerLabel?: boolean;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function PlanBadgePopover({
  size = "xs",
  className = "",
}: PlanBadgePopoverProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { subscription, plan, usage, canManageBilling, isLoading } = useSubscription();

  if (isLoading || !subscription) {
    return (
      <span className={`inline-flex items-center justify-center ${className}`}>
        <span className="h-4.5 w-14 rounded-full bg-muted/60 animate-pulse inline-block" />
      </span>
    );
  }

  const planId = (subscription?.planId || "free").toLowerCase();
  const pricing = formatPlanDisplayPrice(plan, subscription?.billingCycle || "monthly");
  const isFree = planId === "free";
  const isEnterprise = planId === "enterprise";

  const renewalDateFormatted = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Active (Perpetual)";

  const handleManageClick = () => {
    setOpen(false);
    if (isEnterprise) {
      router.push("/settings?section=subscription");
    } else if (isFree) {
      router.push("/upgrade");
    } else {
      router.push("/settings?section=subscription");
    }
  };

  const handleViewPricing = () => {
    setOpen(false);
    router.push("/upgrade");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="View Subscription & Plan Details"
          className="cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-md inline-flex items-center transition-transform active:scale-95"
        >
          <PlanBadge plan={planId} size={size} className={className} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-72 rounded-2xl p-4 shadow-xl border-border/80 bg-popover/95 backdrop-blur-xl z-50 text-popover-foreground"
      >
        {/* Header: Plan & Status */}
        <div className="flex items-start justify-between gap-2 pb-3 border-b border-border/60">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-foreground">
                {plan.name} Plan
              </span>
              <PlanBadge plan={planId} size="xs" showIcon={false} />
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              {isEnterprise
                ? "Custom tailored plan"
                : `${pricing.priceText} / user / month`}
            </p>
          </div>

          <span
            className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${
              subscription?.status === "PAST_DUE"
                ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                : subscription?.status === "SUSPENDED"
                ? "bg-red-500/10 text-red-600 border-red-500/30"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
            }`}
          >
            {subscription?.status || "Active"}
          </span>
        </div>

        {/* Quick Snapshot Details */}
        <div className="py-3 space-y-2.5 text-xs">
          {/* Renewal Date */}
          {!isFree && (
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Renewal
              </span>
              <span className="font-semibold text-foreground">
                {renewalDateFormatted}
              </span>
            </div>
          )}

          {/* Seats Usage */}
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              Seats
            </span>
            <span className="font-semibold text-foreground">
              {usage?.users?.current ?? 1} /{" "}
              {plan.limits.maxUsers === -1 ? "Unlimited" : `${plan.limits.maxUsers} max`}
            </span>
          </div>

          {/* Quick Quota summary */}
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium">
              <Zap className="w-3.5 h-3.5 text-muted-foreground" />
              Contacts Limit
            </span>
            <span className="font-semibold text-foreground">
              {plan.limits.maxContacts === -1
                ? "Unlimited"
                : plan.limits.maxContacts.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-border/60 flex flex-col gap-1.5">
          {isFree ? (
            <Button
              size="sm"
              onClick={handleViewPricing}
              className="w-full text-xs font-bold bg-primary text-primary-foreground hover:brightness-110 shadow-xs gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>View Plans & Upgrade</span>
            </Button>
          ) : isEnterprise ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleManageClick}
              className="w-full text-xs font-bold border-border hover:bg-muted gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>Contact Account Manager</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleManageClick}
              className="w-full text-xs font-bold bg-primary text-primary-foreground hover:brightness-110 shadow-xs gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{canManageBilling ? "Manage Plan & Billing" : "View Subscription"}</span>
            </Button>
          )}

          {canManageBilling && !isFree && (
            <button
              onClick={handleViewPricing}
              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground text-center py-1 flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <span>Explore all pricing tiers</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
