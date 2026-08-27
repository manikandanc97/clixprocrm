"use client";

import React from "react";
import {
  Crown,
  ShieldCheck,
  Building2,
  TrendingUp,
  Headphones,
  User,
  Shield,
  Briefcase,
  Sparkles,
  Code,
  DollarSign,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

export type RoleBadgeSize = "xs" | "sm" | "md" | "lg";
export type RoleBadgeVariant = "subtle" | "solid" | "outline" | "gradient";

interface RoleTheme {
  label: string;
  icon: LucideIcon;
  subtle: string;
  solid: string;
  outline: string;
  gradient: string;
  dotColor: string;
}

const roleThemeConfig: Record<string, RoleTheme> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    icon: Crown,
    subtle: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 shadow-amber-500/5",
    solid: "bg-amber-500 text-white shadow-amber-500/20",
    outline: "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-transparent",
    gradient: "bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    dotColor: "bg-amber-500",
  },
  ADMIN: {
    label: "Admin",
    icon: ShieldCheck,
    subtle: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25 shadow-indigo-500/5",
    solid: "bg-indigo-600 text-white shadow-indigo-500/20",
    outline: "border-indigo-500/40 text-indigo-600 dark:text-indigo-400 bg-transparent",
    gradient: "bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
    dotColor: "bg-indigo-500",
  },
  MANAGER: {
    label: "Manager",
    icon: Building2,
    subtle: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 shadow-emerald-500/5",
    solid: "bg-emerald-600 text-white shadow-emerald-500/20",
    outline: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-transparent",
    gradient: "bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    dotColor: "bg-emerald-500",
  },
  SALES: {
    label: "Sales",
    icon: TrendingUp,
    subtle: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25 shadow-blue-500/5",
    solid: "bg-blue-600 text-white shadow-blue-500/20",
    outline: "border-blue-500/40 text-blue-600 dark:text-blue-400 bg-transparent",
    gradient: "bg-gradient-to-r from-blue-500/15 via-cyan-500/10 to-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
    dotColor: "bg-blue-500",
  },
  SUPPORT: {
    label: "Support",
    icon: Headphones,
    subtle: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25 shadow-orange-500/5",
    solid: "bg-orange-600 text-white shadow-orange-500/20",
    outline: "border-orange-500/40 text-orange-600 dark:text-orange-400 bg-transparent",
    gradient: "bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
    dotColor: "bg-orange-500",
  },
  EMPLOYEE: {
    label: "Employee",
    icon: User,
    subtle: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20 shadow-slate-500/5",
    solid: "bg-slate-600 text-white shadow-slate-500/20",
    outline: "border-slate-500/30 text-slate-600 dark:text-slate-400 bg-transparent",
    gradient: "bg-gradient-to-r from-slate-500/15 via-zinc-500/10 to-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/25",
    dotColor: "bg-slate-500",
  },
  DEVELOPER: {
    label: "Developer",
    icon: Code,
    subtle: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25 shadow-cyan-500/5",
    solid: "bg-cyan-600 text-white shadow-cyan-500/20",
    outline: "border-cyan-500/40 text-cyan-600 dark:text-cyan-400 bg-transparent",
    gradient: "bg-gradient-to-r from-cyan-500/15 via-sky-500/10 to-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
    dotColor: "bg-cyan-500",
  },
  FINANCE: {
    label: "Finance",
    icon: DollarSign,
    subtle: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/25 shadow-teal-500/5",
    solid: "bg-teal-600 text-white shadow-teal-500/20",
    outline: "border-teal-500/40 text-teal-600 dark:text-teal-400 bg-transparent",
    gradient: "bg-gradient-to-r from-teal-500/15 via-emerald-500/10 to-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
    dotColor: "bg-teal-500",
  },
  DEFAULT: {
    label: "Member",
    icon: Shield,
    subtle: "bg-primary/10 text-primary border-primary/20 shadow-primary/5",
    solid: "bg-primary text-primary-foreground shadow-primary/20",
    outline: "border-primary/30 text-primary bg-transparent",
    gradient: "bg-gradient-to-r from-primary/15 to-primary/5 text-primary border-primary/25",
    dotColor: "bg-primary",
  },
};

/**
 * Normalizes input role string to one of our mapped keys
 */
export function normalizeRoleKey(rawRole?: unknown): string {
  if (!rawRole) return "EMPLOYEE";
  
  let roleStr = "";
  if (typeof rawRole === "string") {
    roleStr = rawRole.trim().toUpperCase();
  } else if (typeof rawRole === "object" && rawRole !== null) {
    roleStr = String((rawRole as { name?: string }).name || "").trim().toUpperCase();
  } else {
    roleStr = String(rawRole).trim().toUpperCase();
  }

  // Common replacements
  const normalized = roleStr.replace(/[\s\-_]+/g, "_");

  if (normalized.includes("SUPER") && normalized.includes("ADMIN")) return "SUPER_ADMIN";
  if (normalized.includes("ADMIN")) return "ADMIN";
  if (normalized.includes("MANAGE") || normalized.includes("LEAD")) return "MANAGER";
  if (normalized.includes("SALE")) return "SALES";
  if (normalized.includes("SUPPORT") || normalized.includes("HELP")) return "SUPPORT";
  if (normalized.includes("DEV") || normalized.includes("ENG")) return "DEVELOPER";
  if (normalized.includes("FINANCE") || normalized.includes("BILLING") || normalized.includes("ACCOUNT")) return "FINANCE";
  if (normalized.includes("EMPLOYEE") || normalized.includes("STAFF") || normalized.includes("MEMBER") || normalized.includes("USER")) return "EMPLOYEE";

  return roleThemeConfig[normalized] ? normalized : "DEFAULT";
}

/**
 * Formats role into a human-readable title string
 */
export function formatRoleLabel(rawRole?: unknown): string {
  if (!rawRole) return "Employee";
  
  let str = "";
  if (typeof rawRole === "string") {
    str = rawRole.trim();
  } else if (typeof rawRole === "object" && rawRole !== null) {
    str = String((rawRole as { name?: string }).name || "").trim();
  } else {
    str = String(rawRole).trim();
  }

  if (!str) return "Employee";

  // Check mapped presets
  const key = normalizeRoleKey(str);
  if (roleThemeConfig[key] && key !== "DEFAULT") {
    return roleThemeConfig[key].label;
  }

  // Convert snake_case or SCREAMING_SNAKE to Title Case
  return str
    .replace(/[_\-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export interface CRMRoleBadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "role"> {
  role?: unknown;
  size?: RoleBadgeSize;
  variant?: RoleBadgeVariant;
  showIcon?: boolean;
  showDot?: boolean;
  className?: string;
  iconClassName?: string;
  children?: React.ReactNode;
}

const sizeConfig: Record<
  RoleBadgeSize,
  { container: string; icon: string; dot: string; text: string }
> = {
  xs: {
    container: "h-5 px-2 py-0.5 gap-1 rounded-md text-[10px]",
    icon: "w-2.5 h-2.5",
    dot: "w-1 h-1",
    text: "text-[10px] font-semibold tracking-tight",
  },
  sm: {
    container: "h-6 px-2.5 py-0.5 gap-1.5 rounded-lg text-xs",
    icon: "w-3 h-3",
    dot: "w-1.5 h-1.5",
    text: "text-xs font-semibold tracking-tight",
  },
  md: {
    container: "h-7 px-3 py-1 gap-1.5 rounded-lg text-xs",
    icon: "w-3.5 h-3.5",
    dot: "w-1.5 h-1.5",
    text: "text-xs font-semibold tracking-tight",
  },
  lg: {
    container: "h-8 px-3.5 py-1.5 gap-2 rounded-xl text-sm",
    icon: "w-4 h-4",
    dot: "w-2 h-2",
    text: "text-sm font-bold tracking-tight",
  },
};

export const CRMRoleBadge: React.FC<CRMRoleBadgeProps> = ({
  role,
  size = "sm",
  variant = "subtle",
  showIcon = true,
  showDot = false,
  className,
  iconClassName,
  children,
  ...props
}) => {
  const roleKey = normalizeRoleKey(role);
  const theme = roleThemeConfig[roleKey] || roleThemeConfig.DEFAULT;
  const RoleIcon = theme.icon;
  const displayText = children ?? formatRoleLabel(role);
  const s = sizeConfig[size] || sizeConfig.sm;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center shrink-0 border select-none transition-all duration-200 shadow-xs",
        s.container,
        theme[variant],
        className
      )}
      {...props}
    >
      {showDot && (
        <span
          className={cn("rounded-full shrink-0", s.dot, theme.dotColor)}
          aria-hidden="true"
        />
      )}

      {showIcon && RoleIcon && (
        <RoleIcon
          className={cn("shrink-0 opacity-90 transition-transform group-hover:scale-105", s.icon, iconClassName)}
          aria-hidden="true"
        />
      )}

      <span className={cn("truncate capitalize", s.text)}>
        {displayText}
      </span>
    </span>
  );
};
