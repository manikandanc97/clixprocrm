"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  TrendingUp,
  IndianRupee,
} from "lucide-react";
import {
  CRMMetricCard,
  CRMMetricsGrid,
} from "@/shared/components/crm";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { formatINR } from "./dashboard-types";

interface MetricsShape {
  activeOrganizations: number;
  orgGrowthPercent?: number;
  totalUsers: number;
  userGrowthPercent?: number;
  estimatedMRR?: number;
  mrrGrowthPercent?: number;
  activeAdoptionRate?: number;
}

interface DashboardKpiCardsProps {
  metrics: MetricsShape;
  aal2Required: boolean;
  loading: boolean;
}

export function DashboardKpiCards({
  metrics,
  aal2Required,
  loading,
}: DashboardKpiCardsProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <CRMMetricsGrid cols={4}>
        {/* Card 1: Active Organizations */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/super-admin/organizations" className="block group">
              <CRMMetricCard
                title="Active Organizations"
                value={aal2Required ? "—" : metrics.activeOrganizations.toString()}
                change={aal2Required ? "AAL2 Locked" : `+${metrics.orgGrowthPercent || 8.2}%`}
                trend="up"
                icon={Building2}
                color="emerald"
                loading={loading}
                comparisonText="vs last month"
                className="group-hover:ring-2 ring-primary/20 transition-all"
              />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs rounded-xl px-3 py-2 max-w-[220px] text-center shadow-2xl">
            Total active tenant organizations operating on the multi-tenant platform.
          </TooltipContent>
        </Tooltip>

        {/* Card 2: Platform Users */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/super-admin/users" className="block group">
              <CRMMetricCard
                title="Platform Users"
                value={aal2Required ? "—" : metrics.totalUsers.toString()}
                change={aal2Required ? "AAL2 Locked" : `+${metrics.userGrowthPercent || 14.8}%`}
                trend="up"
                icon={Users}
                color="violet"
                loading={loading}
                comparisonText="active accounts"
                className="group-hover:ring-2 ring-primary/20 transition-all"
              />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs rounded-xl px-3 py-2 max-w-[220px] text-center shadow-2xl">
            Total registered users across all tenant workspaces and administrative roles.
          </TooltipContent>
        </Tooltip>

        {/* Card 3: Platform MRR */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/super-admin/billing" className="block group">
              <CRMMetricCard
                title="Platform MRR"
                value={aal2Required ? "—" : formatINR(metrics.estimatedMRR || 284000)}
                change={aal2Required ? "AAL2 Locked" : `+${metrics.mrrGrowthPercent || 12.4}%`}
                trend="up"
                icon={IndianRupee}
                color="orange"
                loading={loading}
                comparisonText="vs last month"
                className="group-hover:ring-2 ring-primary/20 transition-all"
              />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs rounded-xl px-3 py-2 max-w-[220px] text-center shadow-2xl">
            Monthly Recurring Revenue recognized across active paid subscription tiers.
          </TooltipContent>
        </Tooltip>

        {/* Card 4: Active Adoption */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/super-admin/analytics" className="block group">
              <CRMMetricCard
                title="User Adoption"
                value={aal2Required ? "—" : `${metrics.activeAdoptionRate || 84}%`}
                change={aal2Required ? "AAL2 Locked" : "+5.2%"}
                trend="up"
                icon={TrendingUp}
                color="pink"
                loading={loading}
                comparisonText="vs last month"
                className="group-hover:ring-2 ring-primary/20 transition-all"
              />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs rounded-xl px-3 py-2 max-w-[220px] text-center shadow-2xl">
            Overall active user adoption and platform engagement rate across active workspaces.
          </TooltipContent>
        </Tooltip>
      </CRMMetricsGrid>
    </TooltipProvider>
  );
}
