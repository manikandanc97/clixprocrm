"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-xl border p-4 transition-all duration-200 text-xs flex gap-3 items-start",
  {
    variants: {
      variant: {
        default:
          "bg-muted/40 border-border text-foreground [&>svg]:text-foreground",
        primary:
          "bg-primary/10 border-primary/20 text-foreground [&>svg]:text-primary",
        info:
          "bg-info/10 border-info/20 text-foreground [&>svg]:text-info",
        success:
          "bg-success/10 border-success/20 text-foreground [&>svg]:text-success",
        warning:
          "bg-warning/10 border-warning/20 text-foreground [&>svg]:text-warning",
        destructive:
          "bg-destructive/10 border-destructive/20 text-foreground [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const defaultIcons: Record<string, LucideIcon> = {
  default: Info,
  primary: Info,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: AlertCircle,
};

export interface CRMAlertProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof alertVariants> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  hideIcon?: boolean;
  onDismiss?: () => void;
  action?: React.ReactNode;
}

export function CRMAlert({
  className,
  variant = "default",
  title,
  description,
  children,
  icon: CustomIcon,
  hideIcon = false,
  onDismiss,
  action,
  ...props
}: CRMAlertProps) {
  const IconComponent = CustomIcon || defaultIcons[variant || "default"] || Info;
  const isUrgent = variant === "destructive" || variant === "warning";

  return (
    <div
      role={isUrgent ? "alert" : "status"}
      aria-live={isUrgent ? "assertive" : "polite"}
      className={cn(alertVariants({ variant, className }))}
      {...props}
    >
      {!hideIcon && (
        <div className="shrink-0 mt-0.5">
          <IconComponent className="size-4" />
        </div>
      )}
      <div className="flex-1 min-w-0 space-y-1">
        {title && (
          <h5 className="font-semibold leading-none tracking-tight text-foreground text-xs">
            {title}
          </h5>
        )}
        {description && (
          <div className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </div>
        )}
        {children}
        {action && <div className="pt-2">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="shrink-0 -mr-1 -mt-1 p-1 text-muted-foreground/70 hover:text-foreground rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

// Canonical Aliases
export { CRMAlert as Alert };
