"use client";

import React from "react";
import {
  Check,
  Sparkles,
  Users,
  CheckCircle2,
  ArrowRight,
  Zap,
  HardDrive,
  Target,
  PhoneCall,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  PlanDefinition,
  formatPlanDisplayPrice,
} from "@/shared/lib/plans/plan-definitions";
import { PlanBadge } from "@/shared/components/PlanBadge";
import { filterPureFeatures, getTierTheme } from "./upgrade-types";

interface UpgradePricingCardsProps {
  displayPlans: PlanDefinition[];
  activePlanId: string;
  popularPlanId: string | null;
  currentPlan: PlanDefinition;
  billingCycle: "monthly" | "annual";
  handleOpenUpgradeModal: (planItem: PlanDefinition) => void;
  setEnterpriseModalOpen: (open: boolean) => void;
  gridLayoutClass: string;
}

export function UpgradePricingCards({
  displayPlans,
  activePlanId,
  popularPlanId,
  currentPlan,
  billingCycle,
  handleOpenUpgradeModal,
  setEnterpriseModalOpen,
  gridLayoutClass,
}: UpgradePricingCardsProps) {
  return (
    <div className={`grid ${gridLayoutClass} gap-6 items-stretch w-full pt-2`}>
      {displayPlans.map((planItem) => {
        const isCurrent = planItem.id === activePlanId;
        const isPopular = planItem.id === popularPlanId;
        const pricingInfo = formatPlanDisplayPrice(planItem, billingCycle);
        const tierTheme = getTierTheme(planItem.id, isPopular);
        const TierIcon = tierTheme.icon;
        const WatermarkIcon = tierTheme.watermark;

        const isUpgrade = planItem.displayOrder > currentPlan.displayOrder;
        const isDowngrade = planItem.displayOrder < currentPlan.displayOrder;

        return (
          <div
            key={planItem.id}
            className={`group flex flex-col justify-between rounded-2xl p-6 sm:p-7 transition-all duration-200 relative ${
              isPopular
                ? "bg-gradient-to-b from-emerald-500/[0.06] via-card to-card border-2 border-emerald-500/70 dark:border-emerald-500/80 ring-2 ring-emerald-500/15 shadow-lg shadow-emerald-500/10 hover:border-emerald-500 hover:shadow-xl"
                : "bg-gradient-to-b from-card via-card to-card border border-border/80 hover:border-border hover:shadow-md shadow-xs"
            }`}
          >
            {/* Decorative background watermark contained cleanly in pseudo wrapper */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden">
              <div className="absolute -bottom-6 -right-6 w-32 h-32 opacity-[0.03] dark:opacity-[0.05] select-none flex items-center justify-center">
                <WatermarkIcon className="w-full h-full text-foreground" strokeWidth={1} />
              </div>
            </div>

            {/* Single Unique Most Popular Floating Badge (not clipped) */}
            {isPopular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                <span className="px-4 py-1 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white text-[10px] font-black tracking-wider uppercase shadow-md shadow-emerald-600/30 flex items-center gap-1.5 border border-emerald-400/30">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  MOST POPULAR
                </span>
              </div>
            )}

            <div>
              {/* Card Header: 3D Layered Icon + Title & Badge */}
              <div className={`flex items-start justify-between gap-3 mb-3 ${isPopular ? "pt-2" : ""}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${tierTheme.iconWrap}`}>
                    <TierIcon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-black text-foreground text-base sm:text-lg tracking-tight leading-tight">
                      {planItem.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      {tierTheme.tagline}
                    </p>
                  </div>
                </div>
                <PlanBadge plan={planItem.id} size="xs" showIcon={false} />
              </div>

              {/* Target Audience Description */}
              <p className="text-xs text-muted-foreground min-h-[36px] leading-relaxed mb-4">
                {planItem.target || planItem.description}
              </p>

              {/* Price Section */}
              <div className="py-3.5 border-y border-border/60 bg-muted/30 -mx-5 sm:-mx-6 px-5 sm:px-6">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-foreground tracking-tight">
                    {pricingInfo.priceText}
                  </span>
                  {planItem.pricingMode === "FIXED" && planItem.priceNum > 0 && (
                    <span className="text-xs font-semibold text-muted-foreground">
                      /user/month
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground block mt-0.5 font-medium">
                  {pricingInfo.periodText}
                </span>
                {billingCycle === "annual" && pricingInfo.savingsText && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-1">
                    {pricingInfo.savingsText}
                  </span>
                )}
              </div>

              {/* Key Capacity Chips */}
              <div className="grid grid-cols-2 gap-1.5 my-3.5">
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-muted/50 border border-border/50 text-[10.5px] font-medium text-foreground">
                  <Users className="w-3 h-3 text-primary shrink-0" />
                  <span className="truncate">
                    {planItem.limits.maxUsers === -1 ? "Unlimited" : `${planItem.limits.maxUsers}`} Seats
                  </span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-muted/50 border border-border/50 text-[10.5px] font-medium text-foreground">
                  <Target className="w-3 h-3 text-primary shrink-0" />
                  <span className="truncate">
                    {planItem.limits.maxContacts === -1
                      ? "Unlimited"
                      : `${planItem.limits.maxContacts.toLocaleString()}`}{" "}
                    Contacts
                  </span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-muted/50 border border-border/50 text-[10.5px] font-medium text-foreground">
                  <Zap className="w-3 h-3 text-primary shrink-0" />
                  <span className="truncate">
                    {planItem.limits.maxAutomations === -1
                      ? "Unlimited"
                      : `${planItem.limits.maxAutomations}`}{" "}
                    Automations
                  </span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-muted/50 border border-border/50 text-[10.5px] font-medium text-foreground">
                  <HardDrive className="w-3 h-3 text-primary shrink-0" />
                  <span className="truncate">
                    {planItem.limits.storageGb || 1} GB Storage
                  </span>
                </div>
              </div>

              {/* Key Features Entitlements List */}
              <div className="space-y-2 my-4">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                  Key Capabilities Included:
                </p>
                <ul className="space-y-2 text-xs text-foreground/90">
                  {filterPureFeatures(planItem.featureDescriptions || planItem.features || []).map((desc, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div
                        className={`h-4 w-4 rounded-full mt-0.5 shrink-0 flex items-center justify-center ${
                          isPopular
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : "bg-primary/15 text-primary"
                        }`}
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className="leading-snug text-xs font-medium text-foreground/90">
                        {desc}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-4 border-t border-border/60">
              {isCurrent ? (
                <Button
                  disabled
                  variant="outline"
                  className="w-full text-xs font-bold bg-muted/70 text-muted-foreground border-border cursor-default h-10 rounded-xl gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Current Plan
                </Button>
              ) : planItem.pricingMode === "CUSTOM" ? (
                <Button
                  onClick={() => setEnterpriseModalOpen(true)}
                  variant="outline"
                  className="w-full text-xs font-bold border-border hover:bg-muted h-10 rounded-xl gap-1.5 cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-muted-foreground" />
                  Contact Sales
                </Button>
              ) : (
                <Button
                  onClick={() => handleOpenUpgradeModal(planItem)}
                  className={`w-full text-xs font-extrabold shadow-xs h-10 rounded-xl gap-1.5 transition-all cursor-pointer ${
                    isPopular
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20"
                      : isUpgrade
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted hover:bg-muted/80 text-foreground border border-border"
                  }`}
                >
                  <span>
                    {isUpgrade
                      ? `Upgrade to ${planItem.name}`
                      : isDowngrade
                      ? `Switch to ${planItem.name}`
                      : `Choose ${planItem.name}`}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
