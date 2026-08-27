"use client";

import { useState, useEffect, useMemo } from "react";
import { BarChart3, Download, Calendar, TrendingUp, Users, IndianRupee, Target, RefreshCcw, Settings, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { PageErrorState } from "@/shared/components/page-states";
import { ReportsSkeleton } from "@/features/reports/components/ReportsSkeleton";
import { useReports } from "@/shared/hooks/use-crm";
import { useCurrency } from "@/shared/hooks/use-currency";
import { CRMPageHeader, CRMMetricCard, CRMPageContainer, CRMMetricsGrid } from "@/shared/components/crm";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/shared/ui/sheet";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import RevenueTargetSettings from "@/features/settings/components/RevenueTargetSettings";

const RevenueChart = dynamic(() => import("@/features/reports/components/RevenueChart"));
const ConversionChart = dynamic(() => import("@/features/reports/components/ConversionChart"));
const PerformanceTable = dynamic(() => import("@/features/reports/components/PerformanceTable"));
const AnalyticsSummary = dynamic(() => import("@/features/reports/components/AnalyticsSummary"));
const SalesFunnel = dynamic(() => import("@/features/reports/components/SalesFunnel"));
const RevenueTarget = dynamic(() => import("@/features/reports/components/RevenueTarget"));
const LeadSourceChart = dynamic(() => import("@/features/reports/components/LeadSourceChart"));
const SalesActivities = dynamic(() => import("@/features/reports/components/SalesActivities"));
const TopCustomers = dynamic(() => import("@/features/reports/components/TopCustomers"));
const RecentActivities = dynamic(() => import("@/features/reports/components/RecentActivities"));
const UpcomingFollowUps = dynamic(() => import("@/features/reports/components/UpcomingFollowUps"));
const AIInsights = dynamic(() => import("@/features/reports/components/AIInsights"));

import { EmptyState } from "@/shared/components/EmptyState";
import { useRouter } from "next/navigation";
import { LayoutDashboard, UserPlus } from "lucide-react";
import React from "react";

const ReportsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<{ startDate?: string, endDate?: string, assignedToId?: string }>({});
  const [isTargetsConfigOpen, setIsTargetsConfigOpen] = useState(false);
  
  const { data, isLoading: loading, error, refetch, isFetching } = useReports(filters);
  
  const { CurrencyIcon } = useCurrency();

  useEffect(() => {
    const cust = searchParams.get("customize");
    if (cust === "targets" || cust === "true") {
      setIsTargetsConfigOpen(true);
    }
  }, [searchParams]);

  const hasReportsData = useMemo(() => {
    if (!data) return false;

    // Check if any metric in stats is non-zero
    const hasNonZeroStats = (data.stats || []).some((s) => {
      const num = typeof s.value === "string" 
        ? parseFloat(s.value.replace(/[^0-9.-]+/g, "")) 
        : Number(s.value);
      return !isNaN(num) && num > 0;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasRevenue = (data.revenueChart || []).some((r: any) => Number(r.revenue ?? r.total ?? r.value ?? 0) > 0);
    const hasPerformance = (data.performance || []).some((p) => Number(p.dealsClosed || p.revenueValue || 0) > 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasFunnel = (data.funnel || []).some((f: any) => Number(f.count || f.value || 0) > 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasSalesActivities = (data.salesActivities || []).some((s: any) => Number(s.value || 0) > 0);
    const hasRecentActivities = (data.recentActivities?.length || 0) > 0;
    const hasTopCustomers = (data.topCustomers || []).some((c) => Number(c.revenue || 0) > 0);
    const hasUpcomingFollowUps = (data.upcomingFollowUps?.length || 0) > 0;

    return Boolean(
      hasNonZeroStats ||
      hasRevenue ||
      hasPerformance ||
      hasFunnel ||
      hasSalesActivities ||
      hasRecentActivities ||
      hasTopCustomers ||
      hasUpcomingFollowUps
    );
  }, [data]);

  const handleTimePeriod = () => {
    // Demo implementation for toggling this month filter
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    if (filters.startDate === firstDay) {
      setFilters({});
      toast.success("Filters cleared");
    } else {
      setFilters({ ...filters, startDate: firstDay });
      toast.info("Filtered by This Month");
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Dashboard refreshed");
  };

  const handleDownload = () => {
    if (!data || !data.performance) {
       toast.error("No data available to export");
       return;
    }

    try {
      const headers = ["Team Member", "Deals Closed", "Revenue Value", "Conversion Rate"];
      const rows = data.performance.map(p => [
        `"${p.name}"`,
        p.dealsClosed,
        p.revenueValue,
        `"${p.conversionRate}"`
      ]);
      
      const csvContent = [
        headers.join(","),
        ...rows.map(r => r.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `CRM_Performance_Report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Export Successful", {
        description: "Your team performance report has been downloaded as a CSV.",
      });
    } catch {
      toast.error("Export Failed", { description: "An error occurred while generating the report." });
    }
  };

  if (loading && !data) {
    return <ReportsSkeleton />;
  }

  if (error && !data) {
    return (
      <PageErrorState
        title="Reports unavailable"
        message={(error as Error).message || "An error occurred"}
        onRetry={() => { refetch(); }}
      />
    );
  }

  if (!hasReportsData) {
    return (
      <CRMPageContainer>
        <CRMPageHeader 
          title="Reports & Analytics"
          subtitle="Comprehensive breakdown of your sales performance, revenue targets, and team efficiency."
          icon={BarChart3}
          badge="Business Intelligence"
          actions={[
            {
              label: "Refresh",
              icon: RefreshCcw,
              onClick: handleRefresh,
              variant: "outline",
            },
          ]}
        />

        <div className="flex-1 min-h-0 flex flex-col pt-2">
          <EmptyState
            module="reports"
            action={{
              label: "Go to Dashboard",
              onClick: () => router.push("/dashboard"),
              icon: LayoutDashboard,
            }}
            secondaryAction={{
              label: "Create First Lead",
              onClick: () => router.push("/contacts?status=lead"),
              icon: UserPlus,
            }}
          />
        </div>
      </CRMPageContainer>
    );
  }

  return (
    <CRMPageContainer>
      <CRMPageHeader 
        title="Reports & Analytics"
        subtitle="Comprehensive breakdown of your sales performance, revenue targets, and team efficiency."
        icon={BarChart3}
        badge="Business Intelligence"
        actions={[
          {
            label: "Targets",
            icon: Target,
            onClick: () => setIsTargetsConfigOpen(true),
            variant: "outline",
          },
          {
            label: "Refresh",
            icon: RefreshCcw,
            onClick: handleRefresh,
            variant: "outline",
          },
          {
            label: "This Month",
            icon: Calendar,
            onClick: handleTimePeriod,
            variant: filters.startDate ? "default" : "outline"
          },
          {
            label: "Export",
            icon: Download,
            onClick: handleDownload,
            variant: "default"
          }
        ]}
      />

      <CRMMetricsGrid cols={4} className="gap-4">
        {(data?.stats ?? []).map((stat, index) => {
          const Icon = stat.title.toLowerCase().includes("revenue") || stat.title.toLowerCase().includes("size") ? CurrencyIcon :
            stat.title.toLowerCase().includes("conversion") || stat.title.toLowerCase().includes("win") ? Target :
            stat.title.toLowerCase().includes("deal") || stat.title.toLowerCase().includes("lead") ? Users :
            TrendingUp;

          // Define an array of premium colors
          const colors: ReturnType<typeof JSON.parse>[] = ["indigo", "violet", "emerald", "rose", "pink", "cyan", "amber", "blue"];
          // We can use a deterministic color based on index or title. Let's map by title or index.
          let assignedColor = stat.color || colors[index % colors.length];

          // Let's refine based on the title to have semantic colors
          const lowerTitle = stat.title.toLowerCase();
          if (lowerTitle.includes("won") || lowerTitle.includes("conversion")) assignedColor = "emerald";
          else if (lowerTitle.includes("lost")) assignedColor = "pink"; // fallback to pink/rose
          else if (lowerTitle.includes("open")) assignedColor = "cyan";
          else if (lowerTitle.includes("total")) assignedColor = "indigo";
          else if (lowerTitle.includes("avg") || lowerTitle.includes("size")) assignedColor = "violet";
          else if (lowerTitle.includes("forecast")) assignedColor = "orange";
          else if (lowerTitle.includes("revenue")) assignedColor = "blue";

          return (
            <CRMMetricCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              trend={stat.positive ? "up" : "down"}
              icon={Icon}
              color={assignedColor}
              sparklineData={stat.sparklineData}
              delay={0.05 * (index + 1)}
            />
          );
        })}
      </CRMMetricsGrid>

      <AnalyticsSummary insights={data?.insights ?? []} />

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
        <div className="xl:col-span-2 space-y-5 h-full flex flex-col">
          <div className="flex-1 min-h-[400px] flex flex-col">
             <RevenueChart data={data?.revenueChart || []} loading={isFetching} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
             <div className="min-h-[350px] flex flex-col">
               <ConversionChart data={data?.conversionChart || []} loading={isFetching} />
             </div>
             <div className="min-h-[350px] flex flex-col">
               <SalesFunnel data={data?.funnel ?? []} />
             </div>
          </div>
        </div>
        
        <div className="space-y-5 h-full flex flex-col">
          <RevenueTarget data={data?.revenueTarget ?? null} />
          <div className="flex-1 min-h-[300px] flex flex-col">
            <LeadSourceChart data={data?.leadSources ?? []} loading={isFetching} />
          </div>
          <div className="flex-1 min-h-[300px] flex flex-col">
            <SalesActivities data={data?.salesActivities ?? []} loading={isFetching} />
          </div>
        </div>
      </div>

      {/* Secondary Row: Customers, Activities, Follow-ups, Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="min-h-[400px] flex flex-col h-full">
          <TopCustomers data={data?.topCustomers ?? []} loading={isFetching} />
        </div>
        <div className="min-h-[400px] flex flex-col h-full">
          <RecentActivities data={data?.recentActivities ?? []} loading={isFetching} />
        </div>
        <div className="min-h-[400px] flex flex-col h-full">
          <UpcomingFollowUps data={data?.upcomingFollowUps ?? []} loading={isFetching} />
        </div>
        <div className="min-h-[400px] flex flex-col h-full">
          <AIInsights />
        </div>
      </div>

      {/* Team Performance */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-bold tracking-tight text-foreground">Team Performance</h2>
          <p className="text-muted-foreground text-sm font-medium">Detailed breakdown of sales representative metrics and activity.</p>
        </div>
        
        <PerformanceTable performance={data?.performance || []} />
      </div>

      {/* Revenue Targets Configuration Drawer */}
      <Sheet open={isTargetsConfigOpen} onOpenChange={setIsTargetsConfigOpen}>
        <SheetContent
          side="right"
          className="p-0 sm:max-w-2xl md:max-w-3xl lg:max-w-4xl w-full flex flex-col h-full bg-background border-l border-border/80 shadow-2xl z-50"
        >
          <SheetHeader className="px-6 py-4.5 border-b border-border/60 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                  <Target className="w-4.5 h-4.5" />
                </div>
                <div>
                  <SheetTitle className="text-base font-bold">Revenue Targets</SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground">
                    Set and manage monthly, quarterly, and annual sales quotas and milestones.
                  </SheetDescription>
                </div>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 min-h-0 overflow-y-auto p-6 custom-scrollbar">
            <RevenueTargetSettings />
          </div>
        </SheetContent>
      </Sheet>
    </CRMPageContainer>
  );
};

export default ReportsPage;
