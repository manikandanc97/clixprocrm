"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Loader2, type LucideIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { motion } from "framer-motion";
import { AppIcon } from "@/shared/components/icons/icon-registry";

export interface CRMPageHeaderAction {
  label: string;
  icon?: LucideIcon | string;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  disabled?: boolean;
  loading?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface CRMPageHeaderProps {
  title: string;
  /** Canonical description text or node */
  description?: string | React.ReactNode;
  /** Legacy alias for description */
  subtitle?: string | React.ReactNode;
  breadcrumbs?: BreadcrumbItem[] | React.ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  badge?: string | React.ReactNode;
  /** Dedicated primary action button */
  primaryAction?: CRMPageHeaderAction;
  /** Secondary action buttons */
  secondaryActions?: CRMPageHeaderAction[];
  /** Legacy array of actions */
  actions?: CRMPageHeaderAction[];
  /** Dedicated right-side custom slot */
  rightContent?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const CRMPageHeader = ({
  title,
  description,
  subtitle,
  breadcrumbs,
  icon: Icon,
  iconColor = "text-muted-foreground",
  badge,
  primaryAction,
  secondaryActions,
  actions,
  rightContent,
  children,
  className,
}: CRMPageHeaderProps) => {
  const resolvedDescription = description ?? subtitle;

  const renderBreadcrumbs = () => {
    if (!breadcrumbs) return null;
    if (React.isValidElement(breadcrumbs)) {
      return <div className="mb-1.5">{breadcrumbs}</div>;
    }
    if (Array.isArray(breadcrumbs) && breadcrumbs.length > 0) {
      return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.label + idx}>
                {idx > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/60 shrink-0" />}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-foreground transition-colors truncate max-w-[140px] sm:max-w-none"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={cn("truncate max-w-[160px] sm:max-w-none", isLast && "font-medium text-foreground")}>
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      );
    }
    return null;
  };

  const renderAction = (action: CRMPageHeaderAction, idx: number, isPrimary: boolean) => {
    const variant = action.variant || (isPrimary ? "default" : "outline");
    return (
      <Button
        key={`action-${idx}-${action.label}`}
        onClick={action.onClick}
        variant={variant}
        size="sm"
        disabled={action.disabled || action.loading}
        className={cn(
          "text-xs font-semibold h-9 px-3.5 flex-1 sm:flex-none transition-all duration-150",
          isPrimary && "shadow-xs"
        )}
      >
        {action.loading ? (
          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin shrink-0" />
        ) : action.icon ? (
          typeof action.icon === "string" ? (
            <AppIcon
              name={action.icon}
              size={14}
              className="w-3.5 h-3.5 mr-1.5 shrink-0"
            />
          ) : (
            <action.icon className="w-3.5 h-3.5 mr-1.5 shrink-0" />
          )
        ) : null}
        <span className="truncate">{action.label}</span>
      </Button>
    );
  };

  const hasStructuredActions = Boolean(primaryAction || (secondaryActions && secondaryActions.length > 0));
  const hasLegacyActions = Boolean(actions && actions.length > 0);
  const hasActions = hasStructuredActions || hasLegacyActions || Boolean(children) || Boolean(rightContent);

  return (
    <header className={cn("flex flex-col justify-between gap-3 sm:flex-row sm:items-center", className)}>
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-start sm:items-center gap-3 min-w-0"
      >
        {Icon && (
          <div
            data-animate-target="true"
            className="group h-10 w-10 rounded-xl bg-card border border-border/80 flex items-center justify-center text-muted-foreground shadow-xs shrink-0 hover:border-primary/40 hover:bg-muted/30 transition-all select-none mt-0.5 sm:mt-0"
          >
            <AppIcon
              name={title}
              icon={Icon}
              size={18}
              className={cn("w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors", iconColor)}
            />
          </div>
        )}

        <div className="min-w-0 flex-1">
          {renderBreadcrumbs()}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
              {title}
            </h1>
            {badge && (
              typeof badge === "string" ? (
                <span className="rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary shadow-xs shrink-0">
                  {badge}
                </span>
              ) : (
                badge
              )
            )}
          </div>
          {resolvedDescription && (
            <div className="text-xs text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
              {resolvedDescription}
            </div>
          )}
        </div>
      </motion.div>

      {hasActions && (
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-2.5 shrink-0 justify-start sm:justify-end"
        >
          {rightContent}
          {children}

          {/* Structured actions */}
          {secondaryActions && secondaryActions.map((act, i) => renderAction(act, i, false))}
          {primaryAction && renderAction(primaryAction, 999, true)}

          {/* Legacy actions fallback if primaryAction/secondaryActions not provided */}
          {!hasStructuredActions && actions && actions.map((action, index) => {
            const isPrimary = index === actions.length - 1;
            return renderAction(action, index, isPrimary);
          })}
        </motion.div>
      )}
    </header>
  );
};











