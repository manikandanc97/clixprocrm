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

export function SuperAdminModulesSkeleton() {
  return (
    <CRMPageContainer>
      <CRMPageHeader
        title="CRM Modules & Feature Flags"
        subtitle="Dynamically toggle, reorder, and configure standard & custom CRM modules across tenants."
        icon={Layers}
        badge="Module Management"
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
        <TableSkeleton rows={8} cols={6} showPagination={true} hasAvatar={false} />
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
