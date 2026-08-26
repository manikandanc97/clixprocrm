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
  LayoutDashboard,
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
    ? "h-8 px-4 text-xs rounded-lg min-w-[110px]"
    : isLarge
    ? "h-11 px-7 text-sm rounded-xl min-w-[140px]"
    : "h-10 px-6 text-xs sm:text-sm rounded-xl min-w-[130px]";

  const btnContent = (
    <>
      {IconComp && (
        <AppIcon
          name={act.label}
          icon={IconComp}
          size={isSmall ? 14 : 16}
          className={isSmall ? "w-3.5 h-3.5 mr-1.5 shrink-0" : "w-4 h-4 mr-2 shrink-0"}
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
            ? "shadow-sm hover:shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
            : "hover:bg-muted/80 border-border/80",
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
          ? "shadow-sm hover:shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
          : "hover:bg-muted/80 border-border/80",
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "relative w-full rounded-2xl border border-border/60 bg-card/60 dark:bg-card/30 backdrop-blur-md shadow-xs select-none overflow-hidden transition-all duration-300 flex flex-col items-center justify-center text-center",
        isSmall
          ? "p-6 min-h-[200px]"
          : isLarge
          ? "flex-1 h-full p-8 sm:p-12 md:p-16 min-h-[380px]"
          : "flex-1 h-full p-6 sm:p-10 md:p-12 min-h-[300px]",
        className
      )}
      role="region"
      aria-label={title}
    >
      {/* Subtle ambient lighting */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden opacity-50 dark:opacity-30"
        aria-hidden="true"
      >
        <div className="h-48 w-96 rounded-full bg-gradient-to-tr from-primary/15 via-primary/5 to-transparent blur-3xl" />
      </div>

      <div className="max-w-xl mx-auto flex flex-col items-center my-auto">
        {/* Icon Pill */}
        <div className="relative mb-4 group shrink-0">
          <div
            className="absolute inset-0 bg-primary/15 dark:bg-primary/20 rounded-2xl blur-lg scale-125 transition-opacity opacity-75"
            aria-hidden="true"
          />
          <div
            className={cn(
              "relative z-10 flex items-center justify-center rounded-2xl bg-background/90 dark:bg-card/90 border border-primary/20 text-primary shadow-xs",
              isSmall ? "w-10 h-10" : "w-14 h-14"
            )}
          >
            <AppIcon
              name={module || title}
              icon={Icon}
              size={isSmall ? 20 : 28}
              className="text-primary"
            />
          </div>
        </div>

        {/* Badge */}
        {badge && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 text-xs font-bold tracking-wider uppercase rounded-full bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-3 h-3" />
            {badge}
          </span>
        )}

        {/* Title */}
        <h3
          className={cn(
            "font-bold tracking-tight text-foreground",
            isSmall ? "text-sm" : isLarge ? "text-2xl" : "text-lg sm:text-xl"
          )}
        >
          {title}
        </h3>

        {/* Description */}
        <p
          className={cn(
            "text-muted-foreground mt-2 leading-relaxed max-w-md mx-auto",
            isSmall ? "text-xs max-w-xs" : "text-xs sm:text-sm"
          )}
        >
          {description}
        </p>

        {/* Action Buttons */}
        {hasActions && (
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6 shrink-0">
            {resolvedPrimary && <EmptyStateButton action={resolvedPrimary} isPrimary size={size} />}
            {resolvedSecondary && <EmptyStateButton action={resolvedSecondary} isPrimary={false} size={size} />}
            {children}
          </div>
        )}
      </div>
    </motion.div>
  );
}
