"use client";

import React from "react";
import { AlertCircle, RefreshCw, Loader2, type LucideIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/lib/utils";
import { EmptyState, type EmptyStateAction } from "@/shared/components/EmptyState";
import {
  PageHeaderSkeleton,
  MetricCardSkeleton,
  ToolbarSkeleton,
  TableSkeleton,
  FormSkeleton,
} from "@/shared/components/skeletons";

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
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col space-y-6 w-full p-2 animate-in fade-in duration-200", className)}
    >
      <span className="sr-only">{displayMessage || "Loading page content..."}</span>
      <PageHeaderSkeleton />

      {/* Metrics Grid Skeleton — Rendered only when showMetrics is explicitly true */}
      {showMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
      )}

      <ToolbarSkeleton />

      <TableSkeleton rows={8} cols={6} showPagination={true} hasAvatar={true} />
    </div>
  );
}

export function ComponentLoadingState(_props: LoadingStateProps) {
  return (
    <div className="flex flex-col space-y-6 w-full">
      <div className="rounded-xl border border-border bg-card p-6 space-y-6 shadow-xs">
        <div className="space-y-2">
          <Skeleton className="h-6 w-[150px]" />
          <Skeleton className="h-4 w-[250px]" />
        </div>
        <FormSkeleton />
      </div>
    </div>
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
