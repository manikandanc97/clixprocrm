"use client";

import React from "react";
import { CRMCard } from "@/shared/components/crm/CRMCard";
import { CardContent, CardHeader } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  MetricCardSkeleton,
  ChartSkeleton,
  DashboardWidgetSkeleton,
} from "@/shared/components/skeletons";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* 1. Hero Welcome Banner Skeleton */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-6 md:p-8 shadow-xl border border-white/5 min-h-[160px] flex flex-col justify-between">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-28 rounded-full bg-white/10" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-7 w-64 md:w-80 rounded-lg bg-white/15" />
              <Skeleton className="h-4 w-72 md:w-96 rounded-md bg-white/10" />
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Skeleton className="h-10 w-32 rounded-xl bg-white/15" />
          </div>
        </div>
      </div>

      {/* 2. Action & Timeframe Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {["Today", "Week", "Month", "Year"].map((t) => (
            <Skeleton key={t} className="h-8 w-16 rounded-full" />
          ))}
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-28 rounded-xl" />
          <div className="hidden sm:block h-4 w-px bg-border" />
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>
      </div>

      {/* 3. 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>

      {/* 4. Operational Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Main Column (3 Cols) */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          {/* Revenue Chart Widget */}
          <CRMCard noPadding className="flex flex-col overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-5 border-b border-border/40">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
              </div>
              <Skeleton className="h-7 w-20 rounded-lg" />
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <ChartSkeleton height={320} type="area" />
            </CardContent>
          </CRMCard>

          {/* Row: Upcoming Meetings & Pending Tasks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DashboardWidgetSkeleton rows={3} />
            <DashboardWidgetSkeleton rows={3} />
          </div>

          {/* Row: Hot Leads & Recent Activities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DashboardWidgetSkeleton rows={3} />
            <DashboardWidgetSkeleton rows={3} />
          </div>

          {/* Recent Customers Widget */}
          <CRMCard noPadding className="flex flex-col overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-5 border-b border-border/40">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
              <Skeleton className="h-7 w-20 rounded-lg" />
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-2.5 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </CRMCard>
        </div>

        {/* Right Sticky Sidebar (1 Col) */}
        <div className="flex flex-col gap-6 w-full xl:sticky xl:top-24 self-start">
          {/* Revenue Target Widget */}
          <CRMCard noPadding className="flex flex-col overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-5 border-b border-border/40">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </div>
              <Skeleton className="h-7 w-14 rounded-lg" />
            </CardHeader>
            <CardContent className="p-5 flex flex-col items-center">
              <ChartSkeleton height={200} type="donut" />
              <div className="w-full space-y-2 mt-4 pt-3 border-t border-border/40">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </CardContent>
          </CRMCard>

          {/* AI Insights Widget */}
          <CRMCard noPadding className="flex flex-col overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-5 border-b border-border/40">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
              <Skeleton className="h-5 w-14 rounded-full" />
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-16 w-full rounded-xl bg-muted/20" />
              <Skeleton className="h-16 w-full rounded-xl bg-muted/20" />
            </CardContent>
          </CRMCard>

          {/* Mini Calendar Widget */}
          <CRMCard noPadding className="flex flex-col overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-5 border-b border-border/40">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-2.5 w-14" />
                </div>
              </div>
              <Skeleton className="h-7 w-16 rounded-lg" />
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 28 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-full rounded-md" />
                ))}
              </div>
            </CardContent>
          </CRMCard>
        </div>
      </div>
    </div>
  );
}
