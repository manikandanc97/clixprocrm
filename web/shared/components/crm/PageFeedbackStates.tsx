"use client";

import React from "react";
import { AlertCircle, RefreshCw, Loader2, type LucideIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";

import { cn } from "@/shared/lib/utils";
import { EmptyState, type EmptyStateAction } from "@/shared/components/EmptyState";
import {
  PageHeaderSkeleton,
  MetricCardSkeleton,
  ToolbarSkeleton,
  TableSkeleton,
} from "@/shared/components/skeletons";

import { CRMPageContainer } from "./CRMPageContainer";
import { CRMPageHeader, type CRMPageHeaderAction } from "./CRMPageHeader";

/**
 * Metric Card Usage Rule:
 * CRMMetricCard / CRMMetricsGrid are NOT global page requirements.
 * They are designated strictly for Dashboard and Analytics/Reports.
 * Standard CRUD/list pages must not display metric cards or metric skeletons.
 */
export interface LoadingStateProps {
  label?: string;
  message?: string;
  variant?: "skeleton" | "spinner";
  /** Explicitly enable metric card skeletons (Allowed only for Dashboard & Analytics) */
  showMetrics?: boolean;
  className?: string;
  /** Number of table skeleton rows (default: 8) */
  rows?: number;
  /** Number of table skeleton columns (default: 6) */
  cols?: number;
  /** Whether the first column displays an avatar (default: true) */
  hasAvatar?: boolean;
  /** Whether pagination controls are shown below the table (default: true) */
  showPagination?: boolean;
  /** Enable twoStageScroll layout on CRMPageContainer (default: true) */
  twoStageScroll?: boolean;
  /** Dedicated page title for the header */
  title?: string;
  /** Dedicated page description for the header */
  description?: string;
  /** Dedicated page icon for the header */
  icon?: LucideIcon;
  /** Primary action button configuration */
  primaryAction?: CRMPageHeaderAction;
  /** Secondary action buttons configuration */
  secondaryActions?: CRMPageHeaderAction[];
}

export interface ErrorStateProps {
  title?: string;
  message?: string;
  description?: string;
  onRetry?: () => void | Promise<void>;
  className?: string;
}

export interface EmptyStateCardProps {
  title: string;
  message: string;
  icon?: LucideIcon;
  action?: EmptyStateAction;
}

export function PageLoadingState({
  label,
  message,
  variant = "skeleton",
  showMetrics = false,
  className,
  rows = 8,
  cols = 6,
  hasAvatar = true,
  showPagination = true,
  twoStageScroll = true,
  title,
  description,
  icon,
  primaryAction,
  secondaryActions,
}: LoadingStateProps) {
  const displayMessage = message ?? label;

  if (variant === "spinner") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn("flex min-h-[320px] flex-col items-center justify-center gap-3 p-6 text-center", className)}
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {displayMessage && (
          <p className="text-xs font-medium text-muted-foreground">{displayMessage}</p>
        )}
        <span className="sr-only">{displayMessage || "Loading page content..."}</span>
      </div>
    );
  }

  return (
    <CRMPageContainer twoStageScroll={twoStageScroll} className={className}>
      <span className="sr-only">{displayMessage || "Loading page content..."}</span>

      {/* Header: Exact CRMPageHeader if title provided, otherwise fallback PageHeaderSkeleton */}
      {title ? (
        <CRMPageHeader
          title={title}
          description={description}
          icon={icon}
          primaryAction={primaryAction}
          secondaryActions={secondaryActions}
        />
      ) : (
        <PageHeaderSkeleton />
      )}

      {/* Metrics Grid Skeleton — Rendered only when showMetrics is explicitly true */}
      {showMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
      )}

      {/* Canonical Data Card Container with Toolbar and Table Skeletons */}
      <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="shrink-0">
          <ToolbarSkeleton />
        </div>
        <div className="flex-1 min-h-0 flex flex-col">
          <TableSkeleton
            rows={rows}
            cols={cols}
            showPagination={showPagination}
            hasAvatar={hasAvatar}
          />
        </div>
      </div>
    </CRMPageContainer>
  );
}




export function PageErrorState({
  title = "Something went wrong",
  message,
  description,
  onRetry,
  className,
}: ErrorStateProps) {
  const displayDesc = description ?? message ?? "An unexpected error occurred while loading this page.";

  return (
    <div className={cn("flex min-h-[320px] items-center justify-center p-6", className)} role="alert">
      <div className="max-w-md w-full rounded-xl border border-border bg-card px-8 py-10 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-foreground">{title}</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{displayDesc}</p>
        {onRetry && (
          <Button
            onClick={() => void onRetry()}
            variant="outline"
            size="sm"
            className="mt-6 px-5 gap-2 text-xs font-semibold"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </Button>
        )}
      </div>
    </div>
  );
}

export function EmptyStateCard({
  title,
  message,
  icon,
  action,
}: EmptyStateCardProps) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={message}
      action={action}
      className="border-none bg-transparent shadow-none"
    />
  );
}
