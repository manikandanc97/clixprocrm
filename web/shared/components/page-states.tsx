"use client";

import { AlertCircle,  RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

interface LoadingStateProps {
  label?: string;
}

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry: () => void | Promise<void>;
}

interface EmptyStateProps {
  title: string;
  message: string;
}

import { PageHeaderSkeleton, MetricCardSkeleton, ToolbarSkeleton, TableSkeleton, FormSkeleton } from "@/shared/components/skeletons";

export function PageLoadingState(_props: LoadingStateProps) {
  return (
    <div className="flex flex-col space-y-6 w-full p-2 animate-in fade-in duration-200">
      <PageHeaderSkeleton />

      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>

      <ToolbarSkeleton />

      <TableSkeleton rows={8} cols={6} showPagination={true} hasAvatar={true} />
    </div>
  );
}

 
export function ComponentLoadingState(_props: LoadingStateProps) {
  return (
    <div className="flex flex-col space-y-6 w-full">
      <div className="rounded-xl border border-border bg-card p-6 space-y-6 shadow-sm">
        <div className="space-y-2">
          <Skeleton className="h-6 w-[150px]" />
          <Skeleton className="h-4 w-[250px]" />
        </div>
        <FormSkeleton />
      </div>
    </div>
  );
}

export function PageErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex min-h-[320px] items-center justify-center p-6">
      <div className="max-w-md rounded-xl border border-destructive/20 bg-card px-8 py-10 text-center shadow-card">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{message}</p>
        <Button
          onClick={() => void onRetry()}
          className="mt-6 px-6"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}

import { EmptyState } from "@/shared/components/EmptyState";
import { LucideIcon } from "lucide-react";

export function EmptyStateCard({ title, message, icon, action }: EmptyStateProps & { icon?: LucideIcon, action?: ReturnType<typeof JSON.parse> }) {
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
