"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Users, 
  Target, 
  TrendingUp, 
  ChevronDown 
} from "lucide-react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { PageErrorState } from "@/shared/components/crm/PageFeedbackStates";
import { ReportsSkeleton } from "@/features/reports/components/ReportsSkeleton";
import { useReports } from "@/shared/hooks/use-crm";
import { useCurrency } from "@/shared/hooks/use-currency";
import { CRMMetricCard, CRMPageContainer, CRMMetricsGrid } from "@/shared/components/crm";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { toast } from "sonner";
import RevenueTargetSettings from "@/features/settings/components/RevenueTargetSettings";
import { useAuth } from "@/features/auth/components/auth-provider";

const RevenueChart = dynamic(() => import("@/features/reports/components/RevenueChart"));
const RevenueTarget = dynamic(() => import("@/features/reports/components/RevenueTarget"));
const LeadSourceChart = dynamic(() => import("@/features/reports/components/LeadSourceChart"));
const SalesActivities = dynamic(() => import("@/features/reports/components/SalesActivities"));
const TopCustomers = dynamic(() => import("@/features/reports/components/TopCustomers"));
const RecentActivities = dynamic(() => import("@/features/reports/components/RecentActivities"));
const UpcomingFollowUps = dynamic(() => import("@/features/reports/components/UpcomingFollowUps"));
const PerformanceTable = dynamic(() => import("@/features/reports/components/PerformanceTable"));

type PeriodKey = "all" | "today" | "this_week" | "this_month" | "this_quarter" | "this_year";

const PERIOD_LABELS: Record<PeriodKey, string> = {
  all: "All Time",
  today: "Today",
  this_week: "This Week",
  this_month: "This Month",
  this_quarter: "This Quarter",
  this_year: "This Year",
};

const ReportsPage = () => {
  const { isHydrated, isAuthenticated, isInitializing } = useAuth();
  const searchParams = useSearchParams();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>("this_month");
  const [filters, setFilters] = useState<{ startDate?: string; endDate?: string; assignedToId?: string }>({});
  const [isTargetsConfigOpen, setIsTargetsConfigOpen] = useState(false);
  
  const { data, isLoading: loading, isPending, error, refetch, isFetching } = useReports(filters);
  const { CurrencyIcon, formatCurrency } = useCurrency();

  useEffect(() => {
    const cust = searchParams.get("customize");
    if (cust === "targets" || cust === "true") {
      setIsTargetsConfigOpen(true);
    }
  }, [searchParams]);

  // Handle date period selection
  const handlePeriodSelect = (period: PeriodKey) => {
    setSelectedPeriod(period);
    const now = new Date();

    if (period === "all") {
      setFilters({});
      toast.success("Showing All Time reports");
      return;
    }

    if (period === "today") {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      setFilters({ startDate: today });
      toast.info("Filtered by Today");
      return;
    }

    if (period === "this_week") {
      const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();
      setFilters({ startDate: firstDayOfWeek });
      toast.info("Filtered by This Week");
      return;
    }

    if (period === "this_month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      setFilters({ startDate: firstDay });
      toast.info("Filtered by This Month");
      return;
    }

    if (period === "this_quarter") {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      const firstDay = new Date(now.getFullYear(), quarterMonth, 1).toISOString();
      setFilters({ startDate: firstDay });
      toast.info("Filtered by This Quarter");
      return;
    }

    if (period === "this_year") {
      const firstDay = new Date(now.getFullYear(), 0, 1).toISOString();
      setFilters({ startDate: firstDay });
      toast.info("Filtered by This Year");
      return;
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Dashboard refreshed");
  };

  const handleDownload = () => {
    if (!data || !data.performance || data.performance.length === 0) {
      toast.error("No data available to export");
      return;
    }

    try {
      const headers = ["Team Member", "Deals Closed", "Revenue Value", "Conversion Rate"];
      const rows = data.performance.map((p) => [
        `"${p.name}"`,
        p.dealsClosed,
        p.revenueValue,
        `"${p.conversionRate}"`
      ]);
      
      const csvContent = [
        headers.join(","),
        ...rows.map((r) => r.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `CRM_Reports_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Export Successful", {
        description: "Reports data has been downloaded as a CSV.",
      });
    } catch {
      toast.error("Export Failed", { description: "An error occurred while generating the report." });
    }
  };

  // Extract the 4 canonical metrics from stats & report data
  const metricStats = useMemo(() => {
    const statsArray = data?.stats || [];

    const totalLeadsStat = statsArray.find((s) => s.title.toLowerCase().includes("total lead"));
    const wonDealsStat = statsArray.find((s) => s.title.toLowerCase().includes("won deal"));
    const revenueStat = statsArray.find((s) => s.title.toLowerCase() === "revenue");
    const conversionStat = statsArray.find((s) => s.title.toLowerCase().includes("conversion"));

    const totalLeadsVal = totalLeadsStat?.value ?? (data?.leadSources?.reduce((acc, curr) => acc + curr.value, 0) || 0);
    const wonDealsVal = wonDealsStat?.value ?? 0;
    const revenueVal = revenueStat ? (typeof revenueStat.value === "number" ? formatCurrency(revenueStat.value) : revenueStat.value) : formatCurrency(data?.revenueTarget?.revenue || 0);
    const conversionVal = conversionStat?.value ?? "0.0%";

    return {
      totalLeads: {
        title: "Total Leads",
        value: totalLeadsVal,
        change: totalLeadsStat?.change || undefined,
        trend: (totalLeadsStat?.positive ? "up" : "neutral") as "up" | "down" | "neutral",
      },
      wonDeals: {
        title: "Won Deals",
        value: wonDealsVal,
        change: wonDealsStat?.change || undefined,
        trend: (wonDealsStat?.positive ? "up" : "neutral") as "up" | "down" | "neutral",
      },
      revenue: {
        title: "Revenue",
        value: revenueVal,
        change: revenueStat?.change || undefined,
        trend: (revenueStat?.positive ? "up" : "neutral") as "up" | "down" | "neutral",
      },
      conversionRate: {
        title: "Conversion Rate",
        value: typeof conversionVal === "number" ? `${conversionVal}%` : conversionVal,
        change: conversionStat?.change || undefined,
        trend: (conversionStat?.positive ? "up" : "neutral") as "up" | "down" | "neutral",
      },
    };
  }, [data, formatCurrency]);

  const isInitialLoading = !data && (loading || isPending || !isHydrated || !isAuthenticated || isInitializing);

  if (isInitialLoading) {
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

  return (
    <CRMPageContainer twoStageScroll className="pb-12 sm:pb-16">
      {/* 1. Header Layout - Consistent with Contacts, Companies, Deals, etc. */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div
            data-animate-target="true"
            className="group h-10 w-10 rounded-xl bg-card border border-border/80 flex items-center justify-center text-muted-foreground shadow-xs shrink-0 hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer select-none"
          >
            <AppIcon
              name="reports"
              icon={BarChart3}
              size={18}
              className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors"
            />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              Reports & Analytics
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Comprehensive breakdown of your sales performance and team efficiency.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="group font-semibold text-xs h-9 px-3 rounded-lg shadow-xs gap-1.5 cursor-pointer border-border/70 bg-background hover:bg-muted/50 text-foreground"
              >
                <Calendar className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
                <span>{PERIOD_LABELS[selectedPeriod]}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => handlePeriodSelect("this_month")}>This Month</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePeriodSelect("today")}>Today</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePeriodSelect("this_week")}>This Week</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePeriodSelect("this_quarter")}>This Quarter</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePeriodSelect("this_year")}>This Year</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePeriodSelect("all")}>All Time</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export Button */}
          <Button
            onClick={handleDownload}
            className="group bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-3.5 rounded-lg shadow-xs gap-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-white shrink-0" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* 2. Top 4 Metric Cards */}
      <CRMMetricsGrid cols={4} className="gap-4 sm:gap-5">
        {/* Card 1: Total Leads */}
        <CRMMetricCard
          title={metricStats.totalLeads.title}
          value={metricStats.totalLeads.value}
          change={metricStats.totalLeads.change}
          trend={metricStats.totalLeads.trend}
          icon={Users}
          color="emerald"
          delay={0.05}
        />

        {/* Card 2: Won Deals */}
        <CRMMetricCard
          title={metricStats.wonDeals.title}
          value={metricStats.wonDeals.value}
          change={metricStats.wonDeals.change}
          trend={metricStats.wonDeals.trend}
          icon={Target}
          color="blue"
          delay={0.1}
        />

        {/* Card 3: Revenue */}
        <CRMMetricCard
          title={metricStats.revenue.title}
          value={metricStats.revenue.value}
          change={metricStats.revenue.change}
          trend={metricStats.revenue.trend}
          icon={CurrencyIcon}
          color="purple"
          delay={0.15}
        />

        {/* Card 4: Conversion Rate */}
        <CRMMetricCard
          title={metricStats.conversionRate.title}
          value={metricStats.conversionRate.value}
          change={metricStats.conversionRate.change}
          trend={metricStats.conversionRate.trend}
          icon={TrendingUp}
          color="orange"
          delay={0.2}
        />
      </CRMMetricsGrid>

      {/* 3. Main Row 2: Revenue Trend & Goal Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        <div className="lg:col-span-7 min-h-[350px] flex flex-col">
          <RevenueChart data={data?.revenueChart || []} loading={isFetching} />
        </div>
        <div className="lg:col-span-5 min-h-[350px] flex flex-col">
          <RevenueTarget 
            data={data?.revenueTarget ?? null} 
            onOpenSettings={() => setIsTargetsConfigOpen(true)} 
          />
        </div>
      </div>

      {/* 4. Row 3: Lead Sources & Sales Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">
        <div className="min-h-[260px] flex flex-col">
          <LeadSourceChart data={data?.leadSources ?? []} loading={isFetching} />
        </div>
        <div className="min-h-[260px] flex flex-col">
          <SalesActivities data={data?.salesActivities ?? []} loading={isFetching} />
        </div>
      </div>

      {/* 5. Row 4: Top Customers, Recent Activity, Upcoming Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-stretch">
        <div className="min-h-[260px] flex flex-col">
          <TopCustomers data={data?.topCustomers ?? []} loading={isFetching} />
        </div>
        <div className="min-h-[260px] flex flex-col">
          <RecentActivities data={data?.recentActivities ?? []} loading={isFetching} />
        </div>
        <div className="min-h-[260px] flex flex-col">
          <UpcomingFollowUps data={data?.upcomingFollowUps ?? []} loading={isFetching} />
        </div>
      </div>

      {/* 6. Row 5: Team Performance */}
      <div className="w-full">
        <PerformanceTable performance={data?.performance || []} />
      </div>

      {/* Revenue Targets Configuration Modal */}
      <Dialog open={isTargetsConfigOpen} onOpenChange={setIsTargetsConfigOpen}>
        <DialogContent
          className="p-0 sm:max-w-2xl md:max-w-3xl lg:max-w-4xl w-[95vw] max-h-[85vh] flex flex-col bg-card border border-border/80 shadow-2xl rounded-2xl overflow-hidden z-50"
        >
          <DialogHeader className="px-6 py-4.5 border-b border-border/60 bg-muted/20 flex-row items-center justify-between gap-4 space-y-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                <Target className="w-4.5 h-4.5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">Revenue Targets</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Set and manage monthly, quarterly, and annual sales quotas and milestones.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto p-6 custom-scrollbar bg-background/50">
            <RevenueTargetSettings />
          </div>
        </DialogContent>
      </Dialog>
    </CRMPageContainer>
  );
};

export default ReportsPage;

