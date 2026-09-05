"use client";

import { CRMPageContainer, CRMMetricsGrid } from "@/shared/components/crm";
import { MetricCardSkeleton } from "@/shared/components/skeletons";
import { Skeleton } from "@/shared/ui/skeleton";
import { Card } from "@/shared/ui/card";

export function SuperAdminDashboardSkeleton() {
  return (
    <CRMPageContainer className="pb-8 sm:pb-10 md:pb-12">
      {/* 1. Welcome Hero Banner Skeleton */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0f172a] p-5 sm:p-6 shadow-xl border border-white/5 min-h-[148px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2.5">
            <Skeleton className="h-5 w-40 rounded-full bg-white/10" />
            <Skeleton className="h-7 w-64 md:w-80 rounded-lg bg-white/15" />
            <Skeleton className="h-4 w-72 md:w-96 rounded-md bg-white/10" />
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Skeleton className="h-9 w-36 rounded-xl bg-white/15" />
            <Skeleton className="h-9 w-28 rounded-xl bg-white/10" />
          </div>
        </div>
      </div>

      {/* 2. Timeframe & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {["7D", "30D", "90D", "1Y"].map((t) => (
            <Skeleton key={t} className="h-8 w-12 rounded-lg" />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-xl" />
          <Skeleton className="h-8 w-36 rounded-xl" />
        </div>
      </div>

      {/* 3. Core KPI Metrics Grid (4 Cards matching Admin Dashboard) */}
      <CRMMetricsGrid cols={4}>
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </CRMMetricsGrid>

      {/* 4. Row 1: Organization Growth & Attention Required */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 bg-card border-border/60 rounded-xl shadow-card p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-60" />
            </div>
            <Skeleton className="h-7 w-28 rounded-lg" />
          </div>
          <div className="grid grid-cols-4 gap-2 pt-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-56 w-full rounded-xl" />
        </Card>

        <Card className="bg-card border-border/60 rounded-xl shadow-card p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="space-y-2.5 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </Card>
      </div>

      {/* 5. Row 2: Platform Usage & Platform Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 bg-card border-border/60 rounded-xl shadow-card p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <div className="grid grid-cols-4 gap-2 pt-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </Card>

        <Card className="bg-card border-border/60 rounded-xl shadow-card p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="space-y-2 pt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        </Card>
      </div>

      {/* 6. Row 3: Module Adoption & Billing Snapshot / Tenant Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="bg-card border-border/60 rounded-xl shadow-card p-4 sm:p-5 space-y-3">
          <Skeleton className="h-4 w-36" />
          <div className="space-y-2.5 pt-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full rounded-md" />
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2 bg-card border-border/60 rounded-xl shadow-card p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-7 w-24 rounded-lg" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
          <div className="pt-2 space-y-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
        </Card>
      </div>

      {/* 7. Recent Organizations Table */}
      <div className="rounded-xl border border-border/60 bg-card shadow-card p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-7 w-20 rounded-lg" />
        </div>
        <div className="space-y-2 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </CRMPageContainer>
  );
}

