"use client";

import React from "react";
import { CRMPageContainer, CRMMetricsGrid } from "@/shared/components/crm";
import {
  MetricCardSkeleton,
  ChartSkeleton,
  TableSkeleton,
} from "@/shared/components/skeletons";
import { Skeleton } from "@/shared/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";

export function SuperAdminDashboardSkeleton() {
  return (
    <CRMPageContainer>
      {/* 1. Welcome Hero Banner Skeleton */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-6 md:p-8 shadow-xl border border-white/5 min-h-[160px] flex flex-col justify-between">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-3">
            <Skeleton className="h-5 w-36 rounded-full bg-white/10" />
            <div className="space-y-1.5">
              <Skeleton className="h-7 w-64 md:w-80 rounded-lg bg-white/15" />
              <Skeleton className="h-4 w-72 md:w-96 rounded-md bg-white/10" />
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Skeleton className="h-10 w-36 rounded-xl bg-white/15" />
            <Skeleton className="h-10 w-28 rounded-xl bg-white/10" />
          </div>
        </div>
      </div>

      {/* 2. Timeframe & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {["Today", "Week", "Month", "Year"].map((t) => (
            <Skeleton key={t} className="h-8 w-16 rounded-lg" />
          ))}
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>
      </div>

      {/* 3. Core KPI Metrics Grid */}
      <CRMMetricsGrid cols={4}>
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </CRMMetricsGrid>

      {/* 4. Platform Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card border-border/60 rounded-2xl overflow-hidden shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-5 border-b border-border/40">
            <div className="space-y-1">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-2.5 w-60" />
            </div>
            <Skeleton className="h-7 w-20 rounded-lg" />
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <ChartSkeleton height={280} type="area" />
          </CardContent>
        </Card>

        <Card className="bg-card border-border/60 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
          <CardHeader className="p-5 border-b border-border/40">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-2.5 w-48 mt-1" />
          </CardHeader>
          <CardContent className="p-5 flex flex-col items-center justify-center flex-1">
            <ChartSkeleton height={180} type="donut" />
          </CardContent>
        </Card>
      </div>

      {/* 5. Recent Organizations Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <TableSkeleton rows={5} cols={7} showPagination={false} hasAvatar={true} />
      </div>
    </CRMPageContainer>
  );
}
