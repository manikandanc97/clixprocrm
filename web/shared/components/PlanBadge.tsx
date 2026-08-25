"use client";

import * as React from "react";
import { Sparkles, Zap, ShieldCheck, Box, Building2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export interface PlanBadgeProps {
  plan?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

interface PlanStyleConfig {
  bg: string;
  text: string;
  border: string;
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
}

export const getPlanConfig = (rawPlan?: string | null): PlanStyleConfig => {
  const normalized = (rawPlan || "").trim().toLowerCase();

  if (normalized === "growth" || normalized === "pro" || normalized === "professional") {
    return {
      bg: "bg-emerald-500/10 hover:bg-emerald-500/15 dark:bg-emerald-500/20",
      text: "text-emerald-700 dark:text-emerald-300 font-bold",
      border: "border-emerald-500/30 dark:border-emerald-500/40",
      icon: Sparkles,
      label: "GROWTH",
    };
  }

  if (normalized === "business") {
    return {
      bg: "bg-indigo-500/10 hover:bg-indigo-500/15 dark:bg-indigo-500/20",
      text: "text-indigo-700 dark:text-indigo-300 font-bold",
      border: "border-indigo-500/30 dark:border-indigo-500/40",
      icon: Building2,
      label: "BUSINESS",
    };
  }

  if (normalized === "enterprise" || normalized === "custom") {
    return {
      bg: "bg-amber-500/10 hover:bg-amber-500/15 dark:bg-amber-500/20",
      text: "text-amber-700 dark:text-amber-300 font-bold",
      border: "border-amber-500/30 dark:border-amber-500/40",
      icon: ShieldCheck,
      label: "ENTERPRISE",
    };
  }

  if (normalized === "starter") {
    return {
      bg: "bg-sky-500/10 hover:bg-sky-500/15 dark:bg-sky-500/20",
      text: "text-sky-700 dark:text-sky-300 font-bold",
      border: "border-sky-500/30 dark:border-sky-500/40",
      icon: Zap,
      label: "STARTER",
    };
  }

  if (normalized === "free" || normalized === "sandbox" || normalized === "") {
    return {
      bg: "bg-slate-500/10 hover:bg-slate-500/15 dark:bg-slate-500/20",
      text: "text-slate-700 dark:text-slate-300 font-bold",
      border: "border-slate-500/25 dark:border-slate-500/30",
      icon: Box,
      label: "FREE",
    };
  }

  return {
    bg: "bg-muted/80 hover:bg-muted dark:bg-muted/60",
    text: "text-foreground font-bold",
    border: "border-border",
    label: (rawPlan || "FREE").toUpperCase(),
  };
};

export function PlanBadge({
  plan,
  size = "md",
  showIcon = true,
  className,
}: PlanBadgeProps) {
  const config = getPlanConfig(plan);
  const Icon = config.icon;

  const sizeClasses = {
    xs: "text-[8.5px] px-1.5 py-0.5 gap-1 tracking-wider uppercase leading-none rounded-md",
    sm: "text-[9.5px] px-2 py-0.5 gap-1 tracking-wider uppercase leading-none rounded-md",
    md: "text-xs px-2.5 py-1 gap-1.5 rounded-lg",
    lg: "text-xs px-3 py-1.5 gap-1.5 font-semibold rounded-lg",
  };

  const iconSizes = {
    xs: "h-2.5 w-2.5",
    sm: "h-2.5 w-2.5",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center border shadow-xs transition-colors",
        config.bg,
        config.text,
        config.border,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && Icon && (
        <Icon className={cn("shrink-0 opacity-85", iconSizes[size])} />
      )}
      <span>{config.label}</span>
    </span>
  );
}

