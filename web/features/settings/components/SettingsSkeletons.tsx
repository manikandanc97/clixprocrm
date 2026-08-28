import React from "react";
import { CRMCard } from "@/shared/components/crm/CRMCard";
import { Skeleton } from "@/shared/ui/skeleton";

export function WorkspaceSettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Workspace Branding Card */}
      <CRMCard className="p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border/40">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3 w-72" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        <div className="flex flex-col lg:flex-row items-stretch gap-6">
          {/* Logo Box */}
          <div className="p-4 rounded-xl border border-border/60 bg-muted/20 flex items-center gap-4 lg:w-[360px] shrink-0">
            <Skeleton className="w-20 h-20 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-2.5 w-32" />
              <Skeleton className="h-7 w-20 rounded-lg mt-1" />
            </div>
          </div>

          {/* Color Palettes */}
          <div className="flex-1 space-y-3">
            <Skeleton className="h-3.5 w-32" />
            <div className="flex flex-wrap gap-2.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="w-8 h-8 rounded-full" />
              ))}
            </div>
            <div className="pt-2 flex items-center gap-3">
              <Skeleton className="h-10 w-32 rounded-xl" />
              <Skeleton className="h-10 w-24 rounded-xl" />
            </div>
          </div>
        </div>
      </CRMCard>

      {/* Workspace Details Card */}
      <CRMCard className="p-6 space-y-6">
        <div className="space-y-1.5 pb-4 border-b border-border/40">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-64" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </CRMCard>

      {/* Save Action Footer */}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
    </div>
  );
}

export function SecuritySettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5 pb-1">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-3 w-80" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 2FA Card */}
        <CRMCard className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>

          <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3">
            <Skeleton className="h-4 w-52" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>

          <div className="pt-2">
            <Skeleton className="h-8.5 w-28 rounded-lg" />
          </div>
        </CRMCard>

        {/* Org Policy Card */}
        <CRMCard className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </CRMCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Notification Card */}
        <CRMCard className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-2.5 w-56" />
            </div>
            <Skeleton className="h-5 w-9 rounded-full" />
          </div>
        </CRMCard>

        {/* Privacy Card */}
        <CRMCard className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-2.5 w-56" />
            </div>
            <Skeleton className="h-8.5 w-28 rounded-lg" />
          </div>
        </CRMCard>
      </div>
    </div>
  );
}

export function AISettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Model Provider Card */}
      <CRMCard className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/40">
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="space-y-2 max-w-md">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </CRMCard>

      {/* AI Features Toggles Card */}
      <CRMCard className="p-6 space-y-5">
        <div className="space-y-1.5 pb-3 border-b border-border/40">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-64" />
        </div>

        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/20"
            >
              <div className="flex items-center gap-3.5">
                <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-44" />
                  <Skeleton className="h-2.5 w-64" />
                </div>
              </div>
              <Skeleton className="w-10 h-6 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      </CRMCard>
    </div>
  );
}
