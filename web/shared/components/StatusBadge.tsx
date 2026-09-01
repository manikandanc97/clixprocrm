"use client";

import * as React from "react";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";

export type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral" | "primary" | "amber" | "blue" | "indigo" | "rose" | "emerald" | "purple";

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  pulse?: boolean;
  showDot?: boolean;
  className?: string;
}

const variantStyles: Record<StatusVariant, { bg: string, text: string, dot: string }> = {
  success: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  warning: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  danger: { bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
  rose: { bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
  info: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  indigo: { bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", dot: "bg-indigo-500" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", dot: "bg-purple-500" },
  neutral: { bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-500" },
  primary: { bg: "bg-primary/10", text: "text-primary", dot: "bg-primary" },
};

export function StatusBadge({
  status,
  variant = "neutral",
  pulse = false,
  showDot = false,
  className,
}: StatusBadgeProps) {
  const styles = variantStyles[variant] || variantStyles.neutral;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border-none shadow-sm transition-all",
        showDot && "gap-1.5",
        styles.bg,
        styles.text,
        className
      )}
    >
      {showDot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && (
            <span className={cn("animate-pulse absolute inline-flex h-full w-full rounded-full opacity-75", styles.dot)} />
          )}
          <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", styles.dot)} />
        </span>
      )}
      {status}
    </Badge>
  );
}





