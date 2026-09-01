import React from "react";
import { CRMPageContainer } from "@/shared/components/crm";
import { Skeleton } from "@/shared/ui/skeleton";

export function CompaniesSkeleton() {
  return (
    <CRMPageContainer>
      {/* Header Skeleton */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="h-3 w-64 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* Main Card Container */}
      <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0 mt-4">
        <div className="p-3.5 flex items-center justify-between gap-3 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-64 rounded-lg" />
          </div>
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>

        <div className="p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted/30 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </CRMPageContainer>
  );
}
