"use client";

import React from "react";
import { CRMPageContainer, CRMMetricsGrid, CRMPageHeader } from "@/shared/components/crm";
import {
  MetricCardSkeleton,
  ToolbarSkeleton,
  TableSkeleton,
  ChartSkeleton,
  CardSkeleton,
} from "@/shared/components/skeletons";
import { Skeleton } from "@/shared/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import {
  Users,
  CreditCard,
  Layers,
  ShieldAlert,
  ScrollText,
  TrendingUp,
} from "lucide-react";

export function SuperAdminUsersSkeleton() {
  return (
    <CRMPageContainer>
      <CRMPageHeader
        title="Platform Users"
        subtitle="Manage all global users, roles, account statuses, and root credentials."
        icon={Users}
        badge="User Governance"
      />

      <div className="shrink-0">
        <CRMMetricsGrid cols={4}>
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </CRMMetricsGrid>
      </div>

      <div className="flex-1 flex flex-col gap-4 min-h-0 mt-4">
        <ToolbarSkeleton />
        <TableSkeleton rows={10} cols={6} showPagination={true} hasAvatar={true} />
      </div>
    </CRMPageContainer>
  );
}

export function SuperAdminPlansSkeleton() {
  return (
    <CRMPageContainer>
      <CRMPageHeader
        title="Subscription Plans & Tiers"
        subtitle="Manage SaaS tiers, feature limits, pricing packaging, and tenant entitlements."
        icon={CreditCard}
        badge="Monetization Engine"
      />

      <div className="shrink-0">
        <CRMMetricsGrid cols={4}>
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </CRMMetricsGrid>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3.5 w-full" />
              <div className="pt-3 border-t border-border/50 space-y-2.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <Skeleton className="w-4 h-4 rounded-full shrink-0" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                ))}
              </div>
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
          </Card>
        ))}
      </div>
    </CRMPageContainer>
  );
}

function ModulesTableRowSkeleton() {
  return (
    <tr className="border-b border-border/50 h-16">
      {/* Order col: up btn + number + down btn */}
      <td className="px-3 py-4 w-16 text-center">
        <div className="flex items-center justify-center gap-1">
          <Skeleton className="w-5 h-5 rounded-md" />
          <Skeleton className="w-4 h-3.5" />
          <Skeleton className="w-5 h-5 rounded-md" />
        </div>
      </td>

      {/* Module & Route: icon + name + badge + route chip */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      </td>

      {/* Category & Access: group badge + permission chip */}
      <td className="px-4 py-4">
        <div className="flex flex-col gap-1 items-start">
          <Skeleton className="h-5 w-24 rounded-lg" />
          <Skeleton className="h-4 w-20 rounded" />
        </div>
      </td>

      {/* Type: Core / Custom badge */}
      <td className="px-4 py-4 text-center">
        <Skeleton className="h-5 w-14 rounded-full mx-auto" />
      </td>

      {/* Global Status: toggle + label */}
      <td className="px-4 py-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <Skeleton className="h-5 w-9 rounded-full" />
          <Skeleton className="h-3.5 w-8" />
        </div>
      </td>

      {/* Sidebar Nav: visibility pill */}
      <td className="px-4 py-4 text-center">
        <Skeleton className="h-6 w-20 rounded-lg mx-auto" />
      </td>

      {/* Actions: dropdown btn */}
      <td className="px-4 py-4 text-right">
        <Skeleton className="h-8 w-8 rounded-lg ml-auto" />
      </td>
    </tr>
  );
}

export function SuperAdminModulesSkeleton() {
  return (
    <CRMPageContainer>
      <CRMPageHeader
        title="Platform Modules & Navigation"
        subtitle="Manage global modules, menu hierarchy, icon customization, routing, and access visibility across ClixProCRM."
        icon={Layers}
        badge="Module Management"
      />

      {/* Tab Scope Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-card border border-border shadow-xs shrink-0">
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/50">
          <Skeleton className="h-8 w-44 rounded-lg" />
          <Skeleton className="h-8 w-52 rounded-lg" />
        </div>
        <Skeleton className="h-3.5 w-72 mx-3" />
      </div>

      {/* Toolbar: Search + 2 dropdowns */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        <Skeleton className="h-10 w-full sm:w-80 rounded-xl" />
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* Table */}
      <div className="w-full">
        <div className="w-full overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="sticky top-0 z-20 bg-card border-b border-border/60">
                <tr className="h-10 sm:h-11">
                  <th className="px-3 sm:px-4 py-2.5 w-16">
                    <Skeleton className="h-2.5 w-10 mx-auto" />
                  </th>
                  <th className="px-4 sm:px-6 py-2.5">
                    <Skeleton className="h-2.5 w-24" />
                  </th>
                  <th className="px-4 sm:px-6 py-2.5">
                    <Skeleton className="h-2.5 w-28" />
                  </th>
                  <th className="px-4 sm:px-6 py-2.5 text-center">
                    <Skeleton className="h-2.5 w-10 mx-auto" />
                  </th>
                  <th className="px-4 sm:px-6 py-2.5 text-center">
                    <Skeleton className="h-2.5 w-24 mx-auto" />
                  </th>
                  <th className="px-4 sm:px-6 py-2.5 text-center">
                    <Skeleton className="h-2.5 w-20 mx-auto" />
                  </th>
                  <th className="px-4 sm:px-6 py-2.5 text-right">
                    <Skeleton className="h-2.5 w-14 ml-auto" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ModulesTableRowSkeleton key={i} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-3 py-2 mt-2">
          <Skeleton className="h-3.5 w-44" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      </div>
    </CRMPageContainer>
  );
}

export function SuperAdminSecuritySkeleton() {
  return (
    <CRMPageContainer>
      <CRMPageHeader
        title="Security Operations & Incident Response"
        subtitle="Live telemetry, emergency kill-switches, tenant quarantines, and security audit logs."
        icon={ShieldAlert}
        badge="SOC Level 1"
      />

      <div className="shrink-0">
        <CRMMetricsGrid cols={4}>
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </CRMMetricsGrid>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>

      <div className="flex-1 flex flex-col gap-4 min-h-0 mt-6">
        <div className="space-y-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-64" />
        </div>
        <TableSkeleton rows={5} cols={6} showPagination={true} hasAvatar={false} />
      </div>
    </CRMPageContainer>
  );
}

export function SuperAdminAuditLogsSkeleton() {
  return (
    <CRMPageContainer>
      <CRMPageHeader
        title="Immutable Audit Logs & Compliance Trail"
        subtitle="Cryptographically-verifiable platform logs, root actor tracking, and compliance evidence."
        icon={ScrollText}
        badge="Audit Trail"
      />

      <div className="shrink-0">
        <CRMMetricsGrid cols={4}>
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </CRMMetricsGrid>
      </div>

      <div className="flex-1 flex flex-col gap-4 min-h-0 mt-4">
        <ToolbarSkeleton />
        <TableSkeleton rows={10} cols={6} showPagination={true} hasAvatar={false} />
      </div>
    </CRMPageContainer>
  );
}

export function SuperAdminAnalyticsSkeleton() {
  return (
    <CRMPageContainer>
      <CRMPageHeader
        title="Global Platform Analytics"
        subtitle="Multi-tenant growth metrics, system capacity, and operational telemetry."
        icon={TrendingUp}
        badge="Real-time Analytics"
      />

      <div className="shrink-0">
        <CRMMetricsGrid cols={4}>
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </CRMMetricsGrid>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Card className="lg:col-span-2 p-6 space-y-4">
          <Skeleton className="h-5 w-44" />
          <ChartSkeleton height={280} type="area" />
        </Card>
        <Card className="p-6 space-y-4 flex flex-col items-center justify-center">
          <Skeleton className="h-5 w-36 self-start" />
          <ChartSkeleton height={200} type="donut" />
        </Card>
      </div>
    </CRMPageContainer>
  );
}
