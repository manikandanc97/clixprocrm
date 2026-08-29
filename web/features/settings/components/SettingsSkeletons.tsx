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

export function AuditLogSettingsSkeleton() {
  return (
    <div className="space-y-6">
      <CRMCard className="p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
          <div className="flex items-start gap-3">
            <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-4.5 w-48" />
              <Skeleton className="h-3 w-80" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="pt-2 pb-1">
          <Skeleton className="h-9 max-w-sm rounded-lg" />
        </div>

        {/* Audit Log Table Skeleton */}
        <div className="mt-3 border rounded-xl overflow-hidden divide-y divide-border/50">
          <div className="grid grid-cols-12 bg-card border-b border-border/60 px-4 py-2.5 h-10 sm:h-11 items-center">
            <Skeleton className="col-span-4 h-3.5 w-28" />
            <Skeleton className="col-span-3 h-3.5 w-24" />
            <Skeleton className="col-span-2 h-3.5 w-20" />
            <Skeleton className="col-span-3 h-3.5 w-20 ml-auto" />
          </div>

          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-12 items-center px-4 py-3 gap-3"
            >
              <div className="col-span-4 flex items-center gap-2.5">
                <Skeleton className="w-6 h-6 rounded-md shrink-0" />
                <Skeleton className="h-3.5 w-32" />
              </div>
              <div className="col-span-3">
                <Skeleton className="h-3.5 w-36" />
              </div>
              <div className="col-span-2">
                <Skeleton className="h-3.5 w-24 font-mono" />
              </div>
              <div className="col-span-3 flex justify-end">
                <Skeleton className="h-3.5 w-28" />
              </div>
            </div>
          ))}
        </div>
      </CRMCard>
    </div>
  );
}

export function SessionsSettingsSkeleton() {
  return (
    <div className="space-y-6">
      <CRMCard className="p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
          <div className="flex items-start gap-3">
            <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4.5 w-44" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-3 w-80" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>

        {/* Session Cards List */}
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3 flex-1">
                <Skeleton className="w-9 h-9 rounded-lg shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-44" />
                    {i === 0 && <Skeleton className="h-4.5 w-20 rounded-full" />}
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end shrink-0">
                <Skeleton className="h-7 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </CRMCard>
    </div>
  );
}

export function InvoiceSettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/80">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-5 w-60" />
          </div>
          <Skeleton className="h-3 w-96" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      {/* Grid: Numbering & Tax */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1 */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="h-4 w-44" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-full rounded-md" />
              <Skeleton className="h-2.5 w-32" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Bank & Payout Details */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
        </div>
      </div>

      {/* Section 4: Default Notes & Terms */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-4 shadow-xs">
        <Skeleton className="h-4 w-44" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-20 w-full rounded-md" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-20 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SubscriptionSettingsSkeleton() {
  return (
    <div className="space-y-8 max-w-5xl">
      {/* 1. CURRENT PLAN HERO SUMMARY CARD */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs relative overflow-hidden space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>

            <div className="flex items-baseline gap-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-28" />
            </div>

            <Skeleton className="h-3.5 w-4/5 max-w-xl" />

            <div className="flex items-center gap-4 pt-1">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-3.5 w-44" />
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
        </div>

        {/* 2. LIVE USAGE OVERVIEW */}
        <div className="pt-6 border-t border-border/60 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="h-3 w-36" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl bg-muted/40 border border-border/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="w-3.5 h-3.5 rounded" />
                    <Skeleton className="h-3.5 w-20" />
                  </div>
                  <Skeleton className="h-3.5 w-12" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
