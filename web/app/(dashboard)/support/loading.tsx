"use client";

import React from "react";
import { CRMPageContainer } from "@/shared/components/crm";
import { FormSkeleton } from "@/shared/components/skeletons";
import { Skeleton } from "@/shared/ui/skeleton";

export default function Loading() {
  return (
    <CRMPageContainer>
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-md" />
        </div>

        <div className="grid w-full grid-cols-4 max-w-3xl gap-2 mb-4">
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 max-w-3xl">
          <FormSkeleton />
        </div>
      </div>
    </CRMPageContainer>
  );
}
