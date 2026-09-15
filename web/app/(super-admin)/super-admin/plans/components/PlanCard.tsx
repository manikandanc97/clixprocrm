"use client";

import {
  Building2,
  Sparkles,
  Edit,
  Bot,
  HardDrive,
  Users,
  Target,
  Trash2,
  Shield,
  TrendingUp,
  Crown,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { formatPlanPrice, PlatformPlanItem } from "@/shared/lib/api/super-admin.api";
import { PlanEntitlementsList } from "./PlanEntitlementsList";

interface PlanCardProps {
  plan: PlatformPlanItem;
  distributionCount: number;
  onConfigure: (plan: PlatformPlanItem) => void;
  onDelete: (plan: PlatformPlanItem) => void;
}

export function PlanCard({
  plan,
  distributionCount,
  onConfigure,
  onDelete,
}: PlanCardProps) {
  const planId = (plan.id || "").toLowerCase();
  const planName = (plan.name || "").toLowerCase();
  const isPopular = Boolean(plan.highlight || planId === "starter" || planName === "starter");
  const isCustom = plan.pricingMode === "CUSTOM";
  const planFeatures = Array.isArray(plan.features) ? plan.features : [];

  const getTierTheme = () => {
    if (planName.includes("free") || planId.includes("free")) {
      return {
        icon: Shield,
        iconBackdrop: "bg-blue-500/20",
        iconFront: "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm shadow-blue-500/25",
        cardBorder: "border-border/80",
        gradientBg: "from-blue-500/[0.03] via-card to-card",
        watermarkIcon: Shield,
      };
    }
    if (planName.includes("starter") || planId.includes("starter") || isPopular) {
      return {
        icon: Sparkles,
        iconBackdrop: "bg-emerald-500/25",
        iconFront: "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/30",
        cardBorder: "border-emerald-500/50 ring-1 ring-emerald-500/30 shadow-md shadow-emerald-500/5",
        gradientBg: "from-emerald-500/[0.08] via-emerald-500/[0.015] to-card",
        watermarkIcon: Sparkles,
      };
    }
    if (planName.includes("growth") || planName.includes("pro") || planId.includes("growth")) {
      return {
        icon: TrendingUp,
        iconBackdrop: "bg-purple-500/20",
        iconFront: "bg-gradient-to-br from-purple-600 to-indigo-600 shadow-sm shadow-purple-500/25",
        cardBorder: "border-border/80",
        gradientBg: "from-purple-500/[0.03] via-card to-card",
        watermarkIcon: TrendingUp,
      };
    }
    return {
      icon: Crown,
      iconBackdrop: "bg-amber-500/20",
      iconFront: "bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm shadow-amber-500/25",
      cardBorder: "border-border/80",
      gradientBg: "from-amber-500/[0.03] via-card to-card",
      watermarkIcon: Crown,
    };
  };

  const tierTheme = getTierTheme();
  const HeaderIcon = tierTheme.icon;
  const WatermarkIcon = tierTheme.watermarkIcon;

  return (
    <div
      className={`rounded-2xl border p-5 flex flex-col justify-between relative overflow-hidden ${
        isPopular
          ? "border-emerald-500/50 bg-gradient-to-b from-emerald-500/[0.08] via-card to-card ring-1 ring-emerald-500/30 shadow-md shadow-emerald-500/10"
          : `${tierTheme.cardBorder} bg-gradient-to-b ${tierTheme.gradientBg} shadow-xs`
      }`}
    >
      {/* Decorative Background Watermark Icon */}
      <div className="pointer-events-none absolute -bottom-6 -right-6 w-32 h-32 opacity-[0.03] dark:opacity-[0.05] select-none flex items-center justify-center">
        <WatermarkIcon className="w-full h-full text-foreground" strokeWidth={1} />
      </div>

      {/* Most Popular Floating Pill */}
      {isPopular && (
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 z-20">
          <span className="px-3.5 py-1 rounded-b-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white text-[10px] font-extrabold tracking-wider uppercase shadow-md shadow-emerald-600/30 flex items-center gap-1.5 border-x border-b border-emerald-400/30">
            <Sparkles className="h-3 w-3 animate-pulse text-amber-300" />
            MOST POPULAR
          </span>
        </div>
      )}

      <div className="space-y-3.5 flex flex-col z-10">
        {/* Card Header: 3D Layered Icon Box + Title & ACTIVE badge */}
        <div className="shrink-0 pt-1">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* 3D Layered Icon */}
              <div className="relative flex items-center justify-center shrink-0">
                <div
                  className={`absolute -left-0.5 -top-0.5 w-10 h-10 rounded-xl ${tierTheme.iconBackdrop}`}
                />
                <div
                  className={`relative z-10 flex size-10 items-center justify-center rounded-xl text-white ${tierTheme.iconFront}`}
                >
                  <HeaderIcon className="h-5 w-5" />
                </div>
              </div>

              <div>
                <h3 className="font-extrabold text-lg text-foreground tracking-tight leading-none">
                  {plan.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-snug line-clamp-1">
                  {plan.description || "Platform SaaS subscription tier."}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="shrink-0">
              {plan.status === "ACTIVE" ? (
                <Badge variant="success" className="gap-1.5 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ACTIVE
                </Badge>
              ) : (
                <Badge variant="neutral">
                  {plan.status}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Price & Workspaces Section */}
        <div className="pt-2.5 border-t border-border/50 shrink-0 flex items-center justify-between gap-2.5">
          {isCustom ? (
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-2xl font-black text-foreground tracking-tight">
                Custom
              </span>
              <p className="text-[11px] text-muted-foreground font-medium truncate">
                Contact Sales
              </p>
            </div>
          ) : (
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                {formatPlanPrice(plan.priceNum, plan.currency)}
              </span>
              <span className="text-xs font-semibold text-muted-foreground shrink-0">
                / month
              </span>
            </div>
          )}

          {/* Small Workspaces Card on Right */}
          <div className="flex items-center gap-2 py-1.5 px-2.5 rounded-xl bg-muted/40 border border-border/50 shadow-2xs shrink-0">
            <div className="h-6 w-6 rounded-lg bg-background flex items-center justify-center text-muted-foreground border border-border/40 shadow-2xs shrink-0">
              <Building2 className="h-3 w-3" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] uppercase font-bold text-muted-foreground block leading-none tracking-wider">
                Workspaces
              </span>
              <span className="font-extrabold text-foreground text-xs block leading-tight mt-0.5">
                {distributionCount} {distributionCount === 1 ? "org" : "orgs"}
              </span>
            </div>
          </div>
        </div>

        {/* Resource Limits: 2x2 Clean Micro-Tiles Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 shrink-0">
          {/* Users */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/40">
            <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Users className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block leading-none tracking-wider">Users</span>
              <span className="font-extrabold text-foreground text-xs truncate block mt-0.5">
                {plan.maxUsers === -1 ? "Unlimited" : `${plan.maxUsers} Users`}
              </span>
            </div>
          </div>

          {/* Leads */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/40">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Target className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block leading-none tracking-wider">Leads</span>
              <span className="font-extrabold text-foreground text-xs truncate block mt-0.5">
                {plan.maxLeads === -1 ? "Unlimited" : `${(plan.maxLeads || 0).toLocaleString()}`}
              </span>
            </div>
          </div>

          {/* Storage */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/40">
            <div className="h-7 w-7 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <HardDrive className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block leading-none tracking-wider">Storage</span>
              <span className="font-extrabold text-foreground text-xs truncate block mt-0.5">
                {plan.storageGb || 1} GB Cloud
              </span>
            </div>
          </div>

          {/* AI Quota */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/40">
            <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block leading-none tracking-wider">AI Daily</span>
              <span className="font-extrabold text-foreground text-xs truncate block mt-0.5">
                {plan.aiEnabled ? `${((plan.dailyTokenLimit || 0) / 1000).toFixed(0)}k tokens` : "Disabled"}
              </span>
            </div>
          </div>
        </div>

        {/* Included Entitlements */}
        <PlanEntitlementsList features={planFeatures} />
      </div>

      {/* Card Action Footer */}
      <div className="pt-4 mt-3.5 border-t border-border/40 shrink-0 flex items-center gap-2 z-10">
        <Button
          variant={isPopular ? "default" : "outline"}
          size="sm"
          className={`flex-1 rounded-xl text-xs font-bold h-9.5 transition-all shadow-2xs cursor-pointer ${
            isPopular
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/25 border-none"
              : "bg-background hover:bg-muted text-foreground border-border/80 hover:border-border"
          }`}
          onClick={() => onConfigure(plan)}
        >
          <Edit className="h-3.5 w-3.5 mr-1.5" />
          Edit Plan
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9.5 w-9.5 shrink-0 transition-colors cursor-pointer"
          title={`Delete Plan ${plan.name}`}
          onClick={() => onDelete(plan)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
