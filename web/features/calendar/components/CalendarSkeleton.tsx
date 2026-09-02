"use client";

import React from "react";
import { CRMPageContainer } from "@/shared/components/crm";
import { Skeleton } from "@/shared/ui/skeleton";

export function CalendarSkeleton() {
  return (
    <CRMPageContainer className="min-h-full bg-background/50">
      {/* ── HEADER SKELETON ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div>
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-3 w-24 hidden sm:block" />
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Skeleton className="w-7 h-7 rounded-md" />
            <Skeleton className="w-12 h-7 rounded-md" />
            <Skeleton className="w-7 h-7 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-44 h-8 rounded-md hidden md:block" />
          <Skeleton className="w-40 h-8 rounded-md" />
          <Skeleton className="w-24 h-8 rounded-md" />
        </div>
      </div>

      {/* ── MAIN: Sidebar + Grid SKELETON ── */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        {/* Sidebar */}
        <div className="hidden lg:flex w-[300px] xl:w-[320px] flex-shrink-0 flex-col bg-card rounded-xl shadow-sm border border-border/50 p-6 space-y-6">
          <Skeleton className="w-full h-56 rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-3 w-24" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        </div>

        {/* Main: Filter Bar + Grid */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {/* Filter Bar Skeleton */}
          <div className="p-2 rounded-xl bg-card border border-border/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-20 rounded-lg" />
              <Skeleton className="h-7 w-28 rounded-lg" />
              <Skeleton className="h-7 w-32 rounded-lg" />
              <Skeleton className="h-7 w-24 rounded-lg" />
              <Skeleton className="h-7 w-32 rounded-lg" />
            </div>
            <Skeleton className="h-6 w-16 rounded-md hidden sm:block" />
          </div>

          {/* Calendar Grid Skeleton */}
          <div className="h-[800px] bg-card rounded-xl shadow-sm border border-border/50 p-4 lg:p-6 flex flex-col">
            <div className="grid grid-cols-7 gap-2 mb-4 border-b border-border/30 pb-4">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Skeleton key={i} className="h-4 w-8 mx-auto" />
              ))}
            </div>
            <div className="flex-1 grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="w-full h-full min-h-[100px] rounded-xl opacity-50" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </CRMPageContainer>
  );
}
