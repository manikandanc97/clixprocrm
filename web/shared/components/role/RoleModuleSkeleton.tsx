"use client";

import React from "react";
import { CRMPageContainer } from "@/shared/components/crm";
import { PageHeaderSkeleton } from "@/shared/components/skeletons";
import { Skeleton } from "@/shared/ui/skeleton";

export function RoleModuleSkeleton() {
  return (
    <CRMPageContainer>
      <PageHeaderSkeleton />
      <div className="rounded-xl border border-border bg-card p-10 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/40">
          <Skeleton className="h-6 w-6 rounded-md" />
        </div>
        <div className="space-y-2 max-w-sm mx-auto flex flex-col items-center">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>
    </CRMPageContainer>
  );
}
