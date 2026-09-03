"use client";

import * as React from "react";
import Link from "next/link";
import {
  LucideIcon,
  Inbox,
  Users,
  UserCheck,
  Building2,
  Handshake,
  CheckSquare,
  CalendarDays,
  FileText,
  Receipt,
  Package,
  FolderOpen,
  Plus,
  Upload,
  Sparkles,
  BarChart3,
  BrainCircuit,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { motion } from "framer-motion";
import { AppIcon } from "@/shared/components/icons/icon-registry";

export type CRMModuleType =
  | "leads"
  | "customers"
  | "companies"
  | "deals"
  | "tasks"
  | "meetings"
  | "quotations"
  | "invoices"
  | "products"
  | "documents"
  | "reports"
  | "analytics";

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: LucideIcon;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
  disabled?: boolean;
}

export interface EmptyStateProps {
  module?: CRMModuleType;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  badge?: string;
  guidanceItems?: unknown[];
  action?: EmptyStateAction;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  size?: "default" | "sm" | "lg";
  className?: string;
  children?: React.ReactNode;
}

export const MODULE_PRESETS: Record<
  CRMModuleType,
  {
    icon: LucideIcon;
    title: string;
    description: string;
    defaultPrimaryLabel: string;
    defaultPrimaryIcon?: LucideIcon;
    defaultSecondaryLabel?: string;
    defaultSecondaryIcon?: LucideIcon;
  }
> = {
  leads: {
    icon: Users,
    title: "No leads found",
    description:
      "Capture and manage prospective customers in one central pipeline.",
    defaultPrimaryLabel: "Create Lead",
    defaultPrimaryIcon: Plus,
    defaultSecondaryLabel: "Import Data",
    defaultSecondaryIcon: Upload,
  },
  customers: {
    icon: UserCheck,
    title: "No customers found",
    description:
      "Manage customer accounts and communication history in one unified view.",
    defaultPrimaryLabel: "Add Customer",
    defaultPrimaryIcon: Plus,
    defaultSecondaryLabel: "Import Customers",
    defaultSecondaryIcon: Upload,
  },
  companies: {
    icon: Building2,
    title: "No companies found",
    description:
      "Organize enterprise accounts, hierarchy, and business accounts.",
    defaultPrimaryLabel: "Add Company",
    defaultPrimaryIcon: Plus,
    defaultSecondaryLabel: "Import Companies",
    defaultSecondaryIcon: Upload,
  },
  deals: {
    icon: Handshake,
    title: "No deals found",
    description:
      "Track your sales pipeline from initial proposal to closed won.",
    defaultPrimaryLabel: "Create Deal",
    defaultPrimaryIcon: Plus,
    defaultSecondaryLabel: "Import Deals",
    defaultSecondaryIcon: Upload,
  },
  tasks: {
    icon: CheckSquare,
    title: "No tasks found",
    description:
      "Stay on top of follow-ups, calls, and team deliverables.",
    defaultPrimaryLabel: "Create Task",
    defaultPrimaryIcon: Plus,
  },
  meetings: {
    icon: CalendarDays,
    title: "No meetings scheduled",
    description:
      "Schedule discovery calls, product demos, and client meetings.",
    defaultPrimaryLabel: "Schedule Meeting",
    defaultPrimaryIcon: Plus,
  },
  quotations: {
    icon: FileText,
    title: "No quotations created",
    description:
      "Generate and send professional proposals to your clients.",
    defaultPrimaryLabel: "Create Quote",
    defaultPrimaryIcon: Plus,
  },
  invoices: {
    icon: Receipt,
    title: "No invoices generated",
    description:
      "Manage client billing and track payments in real time.",
    defaultPrimaryLabel: "Create Invoice",
    defaultPrimaryIcon: Plus,
  },
  products: {
    icon: Package,
    title: "No products added",
    description:
      "Build your product catalog to speed up pricing and proposals.",
    defaultPrimaryLabel: "Add Product",
    defaultPrimaryIcon: Plus,
  },
  documents: {
    icon: FolderOpen,
    title: "No documents uploaded",
    description:
      "Store client contracts, proposals, and legal agreements securely.",
    defaultPrimaryLabel: "Upload Document",
    defaultPrimaryIcon: Plus,
  },
  reports: {
    icon: BarChart3,
    title: "No reports generated",
    description: "Build custom reports to analyze sales velocity and team metrics.",
    defaultPrimaryLabel: "Create Report",
    defaultPrimaryIcon: Plus,
  },
  analytics: {
    icon: BrainCircuit,
    title: "No analytics available",
    description:
      "Enable analytics integration to see real-time pipeline performance.",
    defaultPrimaryLabel: "Configure Analytics",
    defaultPrimaryIcon: Sparkles,
  },
};

function EmptyStateButton({
  action: act,
  isPrimary,
  size,
}: {
  action: EmptyStateAction;
  isPrimary: boolean;
  size: "default" | "sm" | "lg";
}) {
  const IconComp = act.icon;
  const isSmall = size === "sm";
  const isLarge = size === "lg";

  const variant = act.variant || (isPrimary ? "default" : "outline");

  const sizeClass = isSmall
    ? "h-7.5 px-3 text-xs rounded-lg min-w-[90px]"
    : isLarge
    ? "h-10 px-6 text-sm rounded-xl min-w-[130px]"
    : "h-8.5 px-4 text-xs font-semibold rounded-xl min-w-[110px]";

  const btnContent = (
    <>
      {IconComp && (
        <AppIcon
          name={act.label}
          icon={IconComp}
          size={isSmall ? 13 : 15}
          className={isSmall ? "w-3 h-3 mr-1.5 shrink-0" : "w-3.5 h-3.5 mr-1.5 shrink-0"}
          aria-hidden="true"
        />
      )}
      <span>{act.label}</span>
    </>
  );

  if (act.href) {
    return (
      <Button
        key={act.label}
        asChild
        variant={variant}
        disabled={act.disabled}
        className={cn(
          "font-semibold transition-all duration-200 active:scale-[0.98]",
          isPrimary
            ? "shadow-xs hover:shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
            : "hover:bg-muted/80 border-border/80 text-foreground",
          sizeClass,
          act.className
        )}
      >
        <Link href={act.href}>{btnContent}</Link>
      </Button>
    );
  }

  return (
    <Button
      key={act.label}
      onClick={act.onClick}
      variant={variant}
      disabled={act.disabled}
      className={cn(
        "font-semibold transition-all duration-200 active:scale-[0.98]",
        isPrimary
          ? "shadow-xs hover:shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
          : "hover:bg-muted/80 border-border/80 text-foreground",
        sizeClass,
        act.className
      )}
    >
      {btnContent}
    </Button>
  );
}

export function EmptyState({
  module,
  icon: customIcon,
  title: customTitle,
  description: customDescription,
  badge,
  action,
  primaryAction,
  secondaryAction,
  size = "default",
  className,
  children,
}: EmptyStateProps) {
  const preset = module ? MODULE_PRESETS[module] : undefined;

  const Icon: LucideIcon = customIcon || preset?.icon || Inbox;
  const title = customTitle || preset?.title || "No records found";
  const description =
    customDescription ||
    preset?.description ||
    "There are currently no items to display in this view.";

  // Normalize primary action
  const resolvedPrimary: EmptyStateAction | undefined =
    action || primaryAction
      ? {
          label: (action || primaryAction)!.label,
          onClick: (action || primaryAction)!.onClick,
          href: (action || primaryAction)!.href,
          icon:
            (action || primaryAction)!.icon ||
            (!action && !primaryAction?.icon ? preset?.defaultPrimaryIcon : undefined),
          variant: (action || primaryAction)!.variant || "default",
          className: (action || primaryAction)!.className,
          disabled: (action || primaryAction)!.disabled,
        }
      : preset
      ? {
          label: preset.defaultPrimaryLabel,
          icon: preset.defaultPrimaryIcon,
          variant: "default",
        }
      : undefined;

  const resolvedSecondary: EmptyStateAction | undefined = secondaryAction
    ? {
        label: secondaryAction.label,
        onClick: secondaryAction.onClick,
        href: secondaryAction.href,
        icon: secondaryAction.icon || preset?.defaultSecondaryIcon,
        variant: secondaryAction.variant || "outline",
        className: secondaryAction.className,
        disabled: secondaryAction.disabled,
      }
    : undefined;

  const isSmall = size === "sm";
  const isLarge = size === "lg";
  const hasActions = Boolean(resolvedPrimary || resolvedSecondary || children);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "relative w-full rounded-2xl border border-border/50 bg-card/50 dark:bg-card/25 backdrop-blur-md shadow-xs select-none overflow-hidden transition-all duration-300 flex flex-col items-center justify-center text-center",
        isSmall
          ? "p-4 min-h-[140px]"
          : isLarge
          ? "flex-1 h-full p-8 min-h-[280px]"
          : "flex-1 h-full p-5 sm:p-6 min-h-[180px]",
        className
      )}
      role="region"
      aria-label={title}
    >
      {/* Subtle ambient lighting */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden opacity-30 dark:opacity-20"
        aria-hidden="true"
      >
        <div className="h-32 w-64 rounded-full bg-gradient-to-tr from-primary/15 via-primary/5 to-transparent blur-2xl" />
      </div>

      <div className="max-w-md mx-auto flex flex-col items-center my-auto">
        {/* Icon Pill */}
        <div className="relative mb-3 group shrink-0">
          <div
            className="absolute inset-0 bg-primary/15 dark:bg-primary/20 rounded-2xl blur-md scale-110 transition-opacity opacity-70"
            aria-hidden="true"
          />
          <div
            className={cn(
              "relative z-10 flex items-center justify-center rounded-2xl bg-background/95 dark:bg-card/95 border border-primary/20 text-primary shadow-xs transition-transform duration-200 group-hover:scale-105",
              isSmall ? "w-8 h-8 rounded-xl" : isLarge ? "w-13 h-13" : "w-11 h-11"
            )}
          >
            <AppIcon
              name={module || title}
              icon={Icon}
              size={isSmall ? 16 : isLarge ? 24 : 20}
              className="text-primary"
            />
          </div>
        </div>

        {/* Badge */}
        {badge && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 mb-2.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-2.5 h-2.5" />
            {badge}
          </span>
        )}

        {/* Title */}
        <h3
          className={cn(
            "font-bold tracking-tight text-foreground",
            isSmall ? "text-xs sm:text-sm" : isLarge ? "text-lg sm:text-xl" : "text-sm sm:text-base"
          )}
        >
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p
            className={cn(
              "text-muted-foreground mt-1 leading-relaxed max-w-sm mx-auto",
              isSmall ? "text-[11px] max-w-xs" : "text-xs sm:text-[13px]"
            )}
          >
            {description}
          </p>
        )}

        {/* Action Buttons */}
        {hasActions && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3.5 shrink-0">
            {resolvedPrimary && <EmptyStateButton action={resolvedPrimary} isPrimary size={size} />}
            {resolvedSecondary && <EmptyStateButton action={resolvedSecondary} isPrimary={false} size={size} />}
            {children}
          </div>
        )}
      </div>
    </motion.div>
  );
}
