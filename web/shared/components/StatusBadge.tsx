"use client";

import * as React from "react";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";

export type StatusVariant =
  | "success"
  | "warning"
  | "danger"
  | "destructive"
  | "info"
  | "neutral"
  | "primary"
  | "amber"
  | "blue"
  | "indigo"
  | "rose"
  | "emerald"
  | "purple"
  | "slate";

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  pulse?: boolean;
  showDot?: boolean;
  className?: string;
}

const variantStyles: Record<StatusVariant, { bg: string; text: string; dot: string; border: string }> = {
  success: { bg: "bg-success/15", text: "text-success", dot: "bg-success", border: "border-success/25" },
  emerald: { bg: "bg-success/15", text: "text-success", dot: "bg-success", border: "border-success/25" },
  warning: { bg: "bg-warning/15", text: "text-warning", dot: "bg-warning", border: "border-warning/25" },
  amber: { bg: "bg-warning/15", text: "text-warning", dot: "bg-warning", border: "border-warning/25" },
  danger: { bg: "bg-destructive/15", text: "text-destructive", dot: "bg-destructive", border: "border-destructive/25" },
  destructive: { bg: "bg-destructive/15", text: "text-destructive", dot: "bg-destructive", border: "border-destructive/25" },
  rose: { bg: "bg-destructive/15", text: "text-destructive", dot: "bg-destructive", border: "border-destructive/25" },
  info: { bg: "bg-info/15", text: "text-info", dot: "bg-info", border: "border-info/25" },
  blue: { bg: "bg-info/15", text: "text-info", dot: "bg-info", border: "border-info/25" },
  indigo: { bg: "bg-info/15", text: "text-info", dot: "bg-info", border: "border-info/25" },
  purple: { bg: "bg-info/15", text: "text-info", dot: "bg-info", border: "border-info/25" },
  neutral: { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground", border: "border-border/50" },
  slate: { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground", border: "border-border/50" },
  primary: { bg: "bg-primary/15", text: "text-primary", dot: "bg-primary", border: "border-primary/25" },
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
        "inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-xs transition-colors",
        showDot && "gap-1.5",
        styles.bg,
        styles.text,
        styles.border,
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





