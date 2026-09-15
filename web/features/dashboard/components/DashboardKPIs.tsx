"use client";

import React, { useMemo } from "react";
import { 
  Users, 
  Target, 
  TrendingUp, 
} from "lucide-react";
import { useAuth } from "@/features/auth/components/auth-provider";
import { CRM_ROLES } from "@/shared/lib/auth/rbac/roles";
import { CRMMetricCard, CRMMetricsGrid } from "@/shared/components/crm";
import { useDashboardData, useLeads, usePipeline } from "@/shared/hooks/use-dashboard";
import { useCurrency } from "@/shared/hooks/use-currency";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import EmployeeDashboardKPIs from "./EmployeeDashboardKPIs";

const TOP_KPI_IDS = ["revenue", "newLeads", "activeDeals", "winRate"];

export default function DashboardKPIs() {
  const { access, user } = useAuth();
  const dashboardQuery = useDashboardData();
  const leadsQuery = useLeads();
  const pipelineQuery = usePipeline();
  const { formatCurrency, CurrencyIcon } = useCurrency();

  // Extract query data safely
  const dashboardData = dashboardQuery.data;
  const leadsData = leadsQuery.data;
  const pipelineData = pipelineQuery.data;

  // Retrieve metrics returned by the dashboard API
  const dashboardStats = dashboardData?.stats || [];
  const dashboardRevenue = dashboardStats.find(s => s.title === "Revenue");
  const dashboardLeads = dashboardStats.find(s => s.title === "Total Leads");
  const dashboardActiveDeals = dashboardStats.find(s => s.title === "Active Deals" || s.title === "Total Deals");
  const dashboardWinRate = dashboardStats.find(s => s.title === "Win Rate" || s.title === "Conversion Rate");
  
  // Retrieve metrics returned by the pipeline API as fallback
  const pipelineActiveDeals = pipelineData?.stats?.find(s => s.title === "Active Deals");
  const pipelineWinRate = pipelineData?.stats?.find(s => s.title === "Win Rate");

  // Query primitive states for stable memoization
  const dashboardLoading = dashboardQuery.isLoading;
  const dashboardError = dashboardQuery.isError;
  const leadsLoading = leadsQuery.isLoading;
  const leadsError = leadsQuery.isError;
  const pipelineLoading = pipelineQuery.isLoading;
  const pipelineError = pipelineQuery.isError;

  // Streamlined 4 Core Premium KPI Cards System
  const kpiConfigs = useMemo(() => [
    {
      id: "revenue",
      title: "Revenue",
      getValue: () => {
        if (dashboardError) return "Error";
        return formatCurrency(dashboardRevenue?.valueAmount || 0);
      },
      getChange: () => dashboardRevenue?.change || "0.0%",
      getTrend: () => {
        if (dashboardRevenue?.trend) return dashboardRevenue.trend;
        if (!dashboardRevenue || dashboardRevenue.change === "0.0%" || dashboardRevenue.change === "+0.0%") return "neutral" as const;
        return dashboardRevenue.positive ? ("up" as const) : ("down" as const);
      },
      icon: CurrencyIcon,
      color: "emerald" as const,
      loading: dashboardLoading,
      sparklineData: dashboardRevenue?.sparklineData,
      href: "/analytics",
      tooltip: "Total recognized revenue generated across all closed deals.",
    },
    {
      id: "newLeads",
      title: "Total Leads",
      getValue: () => {
        if (dashboardError && leadsError) return "Error";
        return dashboardLeads?.value || leadsData?.summary?.total?.toLocaleString("en-US") || "0";
      },
      getChange: () => dashboardLeads?.change || "0.0%",
      getTrend: () => {
        if (dashboardLeads?.trend) return dashboardLeads.trend;
        if (!dashboardLeads || dashboardLeads.change === "0.0%" || dashboardLeads.change === "+0.0%") return "neutral" as const;
        return dashboardLeads.positive ? ("up" as const) : ("down" as const);
      },
      icon: Users,
      color: "violet" as const,
      loading: dashboardLoading || leadsLoading,
      sparklineData: dashboardLeads?.sparklineData || [],
      href: "/leads",
      tooltip: "Total number of leads accumulated.",
    },
    {
      id: "activeDeals",
      title: "Active Deals",
      getValue: () => {
        if (dashboardError && pipelineError) return "Error";
        return dashboardActiveDeals?.value || pipelineActiveDeals?.value || "0 Deals";
      },
      getChange: () => dashboardActiveDeals?.change || (pipelineActiveDeals as ReturnType<typeof JSON.parse>)?.change || "0.0%",
      getTrend: () => {
        const dealStat = dashboardActiveDeals || pipelineActiveDeals;
        if (dealStat?.trend) return dealStat.trend;
        if (!dealStat || dealStat.change === "0.0%" || dealStat.change === "+0.0%") return "neutral" as const;
        return (dealStat as ReturnType<typeof JSON.parse>).positive ? ("up" as const) : ("down" as const);
      },
      icon: Target,
      color: "orange" as const,
      loading: dashboardLoading || pipelineLoading,
      sparklineData: dashboardActiveDeals?.sparklineData || (pipelineActiveDeals as ReturnType<typeof JSON.parse>)?.sparklineData || [],
      href: "/pipeline",
      tooltip: "Number of active deals currently in the pipeline.",
    },
    {
      id: "winRate",
      title: "Conversion Rate",
      getValue: () => {
        if (dashboardError && pipelineError) return "Error";
        return dashboardWinRate?.value || pipelineWinRate?.value || "0%";
      },
      getChange: () => dashboardWinRate?.change || (pipelineWinRate as ReturnType<typeof JSON.parse>)?.change || "0.0%",
      getTrend: () => {
        const winStat = dashboardWinRate || pipelineWinRate;
        if (winStat?.trend) return winStat.trend;
        if (!winStat || winStat.change === "0.0%" || winStat.change === "+0.0%") return "neutral" as const;
        return (winStat as ReturnType<typeof JSON.parse>).positive ? ("up" as const) : ("down" as const);
      },
      icon: TrendingUp,
      color: "pink" as const,
      loading: dashboardLoading || pipelineLoading,
      sparklineData: dashboardWinRate?.sparklineData || (pipelineWinRate as ReturnType<typeof JSON.parse>)?.sparklineData || [],
      href: "/analytics",
      tooltip: "Percentage of leads successfully converted to closed deals.",
    },
  ], [
    dashboardLoading, dashboardError, dashboardRevenue, dashboardLeads, dashboardActiveDeals, dashboardWinRate,
    leadsLoading, leadsError, leadsData, 
    pipelineLoading, pipelineError, pipelineActiveDeals, pipelineWinRate, 
    formatCurrency, CurrencyIcon
  ]);

  // RBAC & KPI Layout Protection:
  // Admin bypasses widget permission checks entirely.
  // All other roles must have the widget ID in their dashboardWidgets list.
  const isSuperAdmin = (user as { isSuperAdmin?: boolean } | null)?.isSuperAdmin;
  const accessibleKpis = useMemo(() => {
    return kpiConfigs
      .filter(kpi => TOP_KPI_IDS.includes(kpi.id))
      .filter(kpi =>
        user?.role === CRM_ROLES.SUPER_ADMIN ||
        user?.role === CRM_ROLES.ADMIN ||
        isSuperAdmin === true ||
        access.roleName === "Super Admin" ||
        access.roleName === "Admin" ||
        access.dashboardWidgets.includes(kpi.id)
      );
  }, [kpiConfigs, access.roleName, access.dashboardWidgets, user?.role, isSuperAdmin]);

  // ─── Employee role: render personal dashboard cards instead ──────────────
  // This prevents the org-wide KPI cards from showing for Employee users
  // and removes the "No dashboard metrics authorized" empty state.
  const normalizedRole = user?.role?.toUpperCase();
  if (normalizedRole === CRM_ROLES.EMPLOYEE) {
    return <EmployeeDashboardKPIs />;
  }

  // Graceful empty state (should never be reached for well-configured roles)
  if (accessibleKpis.length === 0) {
    return (
      <div className="py-10 text-center border border-dashed border-border rounded-xl bg-card">
        <p className="text-sm text-muted-foreground font-medium">
          No dashboard metrics configured for your role.
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <CRMMetricsGrid>
        {accessibleKpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Tooltip key={kpi.title}>
              <TooltipTrigger asChild>
                <Link href={kpi.href} className="block group">
                  <CRMMetricCard
                    title={kpi.title}
                    value={kpi.getValue()}
                    change={kpi.getChange()}
                    trend={kpi.getTrend()}
                    icon={Icon}
                    color={kpi.color}
                    sparklineData={kpi.sparklineData}
                    delay={0.08 * (index + 1)}
                    loading={kpi.loading}
                  />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs rounded-xl px-3 py-2 max-w-[200px] text-center shadow-2xl">
                {kpi.tooltip}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </CRMMetricsGrid>
    </TooltipProvider>
  );
}
