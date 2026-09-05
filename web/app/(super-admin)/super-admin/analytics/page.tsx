"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp,
  Building2,
  CreditCard,
  BarChart3,
  RefreshCw,
  Layers,
  Activity,
  Calendar,
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldAlert,
  Check,
} from "lucide-react";
import {
  fetchPlatformAnalytics,
  PlatformAnalyticsData,
} from "@/shared/lib/api/super-admin.api";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover";
import { toast } from "sonner";
import {
  CRMPageContainer,
  CRMPageHeader,
  CRMMetricsGrid,
  CRMMetricCard,
} from "@/shared/components/crm";
import { useCurrency } from "@/shared/hooks/use-currency";
import { cn } from "@/shared/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";

type DateRangeOption = "30d" | "3m" | "6m" | "12m" | "custom";

const RANGE_LABELS: Record<DateRangeOption, string> = {
  "30d": "Last 30 Days",
  "3m": "Last 3 Months",
  "6m": "Last 6 Months",
  "12m": "Last 12 Months",
  custom: "Custom Range",
};

export default function SuperAdminAnalyticsPage() {
  const { formatCurrency } = useCurrency();
  const [data, setData] = useState<PlatformAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<DateRangeOption>("6m");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [customPopoverOpen, setCustomPopoverOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const loadData = useCallback(
    async (selectedRange = range, startDate?: string, endDate?: string) => {
      try {
        setLoading(true);
        const params: { range?: string; startDate?: string; endDate?: string } = {
          range: selectedRange,
        };
        if (selectedRange === "custom" && (startDate || customStart)) {
          params.startDate = startDate || customStart;
          params.endDate = endDate || customEnd;
        }
        const res = await fetchPlatformAnalytics(params);
        setData(res);
      } catch {
        toast.error("Failed to load platform analytics.");
      } finally {
        setLoading(false);
      }
    },
    [range, customStart, customEnd]
  );

  useEffect(() => {
    loadData(range);

    const handleAal2Verified = () => {
      loadData(range);
    };
    window.addEventListener("clixpro:aal2-verified", handleAal2Verified);
    return () => {
      window.removeEventListener("clixpro:aal2-verified", handleAal2Verified);
    };
  }, [loadData, range]);

  const handleRangeChange = (newRange: DateRangeOption) => {
    setRange(newRange);
    if (newRange !== "custom") {
      loadData(newRange);
    } else {
      setCustomPopoverOpen(true);
    }
  };

  const handleApplyCustomRange = () => {
    if (!customStart || !customEnd) {
      toast.error("Please specify both start and end dates.");
      return;
    }
    setCustomPopoverOpen(false);
    loadData("custom", customStart, customEnd);
  };

  const kpis = data?.kpis;
  const secondaryKpis = data?.secondaryKpis;
  const growthTrends = data?.growthTrends || [];
  const subscriptionMix = data?.subscriptionMix || [];
  const workspaceHealth = data?.workspaceHealth || {
    active: { count: 0, percentage: 0 },
    trialing: { count: 0, percentage: 0 },
    pastDue: { count: 0, percentage: 0 },
    suspended: { count: 0, percentage: 0 },
    total: 0,
  };

  const totals = data?.totals || {
    totalTenants: 0,
    activeTenants: 0,
    estimatedMRR: 0,
    estimatedARR: 0,
  };

  return (
    <CRMPageContainer>
      {/* ── 1. Page Header + Date Range Selector ── */}
      <CRMPageHeader
        title="Platform Analytics"
        subtitle="Multi-tenant SaaS business performance, revenue growth, and workspace health."
        icon={BarChart3}
        badge="Business Analytics"
      >
        <div className="flex items-center gap-2">
          {/* Date Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 text-xs font-semibold bg-card border-border hover:border-primary/40 shadow-xs"
              >
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{RANGE_LABELS[range]}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground ml-0.5 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 p-1.5">
              {(["30d", "3m", "6m", "12m", "custom"] as DateRangeOption[]).map((opt) => (
                <DropdownMenuItem
                  key={opt}
                  onClick={() => handleRangeChange(opt)}
                  className={cn(
                    "flex items-center justify-between text-xs font-medium cursor-pointer rounded-lg px-2.5 py-1.5",
                    range === opt && "bg-primary/10 text-primary font-bold"
                  )}
                >
                  <span>{RANGE_LABELS[opt]}</span>
                  {range === opt && <Check className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Custom Date Range Popover */}
          <Popover open={customPopoverOpen} onOpenChange={setCustomPopoverOpen}>
            <PopoverTrigger asChild>
              <span className="hidden" />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-4 space-y-3">
              <h4 className="text-xs font-bold text-foreground">Select Custom Date Range</h4>
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Start Date</label>
                  <Input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">End Date</label>
                  <Input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCustomPopoverOpen(false)}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleApplyCustomRange}
                  className="h-7 text-xs font-semibold"
                >
                  Apply Range
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(range)}
            disabled={loading}
            className="h-9 px-3 gap-1.5 text-xs font-semibold bg-card border-border hover:border-primary/40 shadow-xs"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground", loading && "animate-spin text-primary")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </CRMPageHeader>

      {/* ── 2. Top Primary KPI Metrics Grid (Exactly 4 Cards) ── */}
      <div className="shrink-0">
        <CRMMetricsGrid cols={4}>
          {/* Card 1: Monthly Recurring Revenue */}
          <CRMMetricCard
            title="Monthly Recurring Revenue"
            value={formatCurrency(kpis?.mrr?.value ?? totals.estimatedMRR)}
            change={kpis?.mrr?.comparisonText || "vs previous period"}
            trend={kpis?.mrr?.trend || "neutral"}
            icon={CreditCard}
            color="emerald"
            loading={loading}
          />

          {/* Card 2: Active Workspaces */}
          <CRMMetricCard
            title="Active Workspaces"
            value={kpis?.activeWorkspaces?.count ?? totals.activeTenants}
            change={kpis?.activeWorkspaces?.comparisonText || `of ${totals.totalTenants} registered`}
            trend={kpis?.activeWorkspaces?.trend || "neutral"}
            icon={Building2}
            color="blue"
            loading={loading}
          />

          {/* Card 3: Paid Conversion */}
          <CRMMetricCard
            title="Paid Conversion"
            value={`${(kpis?.paidConversion?.ratePercent ?? 0).toFixed(1)}%`}
            change={kpis?.paidConversion?.comparisonText || "0 of 0 workspaces"}
            trend={kpis?.paidConversion?.trend || "neutral"}
            icon={TrendingUp}
            color="purple"
            loading={loading}
          />

          {/* Card 4: Monthly Churn */}
          <CRMMetricCard
            title="Monthly Churn"
            value={`${(kpis?.churn?.ratePercent ?? 0).toFixed(1)}%`}
            change={kpis?.churn?.comparisonText || "0 cancellations in period"}
            trend={kpis?.churn?.trend || "neutral"}
            icon={Activity}
            color="orange"
            loading={loading}
          />
        </CRMMetricsGrid>
      </div>

      {/* ── 3. Workspace Growth Chart + Subscription Mix Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workspace Growth (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-card border border-border shadow-card p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Workspace Growth
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                New and active workspace growth
              </p>
            </div>
            {/* Chart Legend */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 shadow-xs" />
                <span className="font-semibold text-muted-foreground text-[11px]">New Workspaces</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500 shadow-xs" />
                <span className="font-semibold text-muted-foreground text-[11px]">Total Active</span>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            {loading ? (
              <div className="h-full w-full flex items-end justify-between gap-3 animate-pulse pb-4">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div
                      className="w-full max-w-[40px] rounded-t-xl bg-muted"
                      style={{ height: `${25 + (idx % 3) * 25}%` }}
                    />
                    <div className="h-2.5 w-12 bg-muted/60 rounded" />
                  </div>
                ))}
              </div>
            ) : isClient && growthTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={growthTrends}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  barGap={6}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                    opacity={0.4}
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontWeight: 500 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "var(--muted)", opacity: 0.15 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      return (
                        <div className="rounded-xl bg-popover border border-border/80 shadow-lg p-3 text-xs space-y-1.5">
                          <p className="font-bold text-foreground">{label}</p>
                          <div className="flex items-center justify-between gap-4 text-emerald-600 dark:text-emerald-400">
                            <span className="font-medium">New Workspaces:</span>
                            <span className="font-bold">{payload[0]?.value}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-indigo-600 dark:text-indigo-400">
                            <span className="font-medium">Total Active:</span>
                            <span className="font-bold">{payload[1]?.value}</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="newWorkspaces"
                    name="New Workspaces"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="activeWorkspaces"
                    name="Total Active Workspaces"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-xs text-muted-foreground">
                <BarChart3 className="h-8 w-8 mb-2 opacity-30" />
                <p className="font-medium">No workspace growth data available for this range.</p>
              </div>
            )}
          </div>
        </div>

        {/* Subscription Mix Card (1 Col) */}
        <div className="rounded-2xl bg-card border border-border shadow-card p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-600" />
              <span>Subscription Mix</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Distribution across active subscription tiers
            </p>
          </div>

          <div className="space-y-3.5 pt-1">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-muted/30 border border-border/40 space-y-2 animate-pulse">
                  <div className="flex justify-between items-center">
                    <div className="h-3.5 w-20 bg-muted rounded" />
                    <div className="h-3.5 w-12 bg-muted rounded" />
                  </div>
                  <div className="h-2 w-full bg-muted/60 rounded-full" />
                </div>
              ))
            ) : subscriptionMix.length > 0 ? (
              subscriptionMix.map((tier) => {
                const planKey = (tier.planId || "").toLowerCase();
                const isStarter = planKey === "starter";
                const isGrowth = planKey === "growth";
                const isBusiness = planKey === "business";
                const isEnterprise = planKey === "enterprise";

                const progressColor = isStarter
                  ? "bg-blue-600 dark:bg-blue-500"
                  : isGrowth
                  ? "bg-emerald-600 dark:bg-emerald-500"
                  : isBusiness
                  ? "bg-indigo-600 dark:bg-indigo-500"
                  : isEnterprise
                  ? "bg-amber-600 dark:bg-amber-500"
                  : "bg-slate-500 dark:bg-slate-400";

                const badgeStyle = isStarter
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                  : isGrowth
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : isBusiness
                  ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                  : isEnterprise
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";

                return (
                  <div
                    key={tier.planId}
                    className="p-3.5 rounded-xl bg-muted/30 border border-border/40 space-y-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold capitalize text-foreground">
                          {tier.name} Tier
                        </span>
                        {tier.badge && (
                          <span
                            className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded-md border",
                              badgeStyle
                            )}
                          >
                            {tier.badge}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-foreground">
                        {tier.count} <span className="font-normal text-muted-foreground text-[11px]">({tier.percentage}%)</span>
                      </span>
                    </div>

                    {/* Styled Progress Bar */}
                    <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", progressColor)}
                        style={{ width: `${Math.max(tier.percentage, tier.count > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">
                No active subscription mix records found.
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
            <span>Total Active Workspaces</span>
            <span className="font-bold text-foreground">{kpis?.activeWorkspaces?.count ?? totals.activeTenants}</span>
          </div>
        </div>
      </div>

      {/* ── 4. Secondary Compact KPI Row (Exactly 3 Cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Secondary Card 1: New Workspaces */}
        <CRMMetricCard
          title="New Workspaces"
          value={secondaryKpis?.newWorkspaces?.count ?? 0}
          change={secondaryKpis?.newWorkspaces?.comparisonText || "Current period count"}
          trend={secondaryKpis?.newWorkspaces?.trend || "neutral"}
          icon={Building2}
          color="emerald"
          loading={loading}
        />

        {/* Secondary Card 2: Paid Workspaces */}
        <CRMMetricCard
          title="Paid Workspaces"
          value={secondaryKpis?.paidWorkspaces?.count ?? 0}
          change={secondaryKpis?.paidWorkspaces?.comparisonText || "0.0% of active workspaces"}
          trend={secondaryKpis?.paidWorkspaces?.count ? "up" : "neutral"}
          icon={CreditCard}
          color="indigo"
          loading={loading}
        />

        {/* Secondary Card 3: Average Revenue / Workspace (ARPU) */}
        <CRMMetricCard
          title="Average Revenue / Workspace"
          value={formatCurrency(secondaryKpis?.arpu?.value ?? 0)}
          change={secondaryKpis?.arpu?.comparisonText || "Calculated across paid workspaces only"}
          trend={secondaryKpis?.arpu?.value ? "up" : "neutral"}
          icon={TrendingUp}
          color="cyan"
          loading={loading}
        />
      </div>

      {/* ── 5. Compact Workspace Health Section ── */}
      <div className="rounded-2xl bg-card border border-border shadow-card p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-600" />
            <span>Workspace Health</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time operational and subscription status distribution
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Active Health */}
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5 hover:bg-emerald-500/10 transition-colors">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Active</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                {workspaceHealth.active.percentage}%
              </span>
            </div>
            <div className="text-2xl font-black text-foreground">
              {workspaceHealth.active.count}
            </div>
            <p className="text-[11px] text-muted-foreground">
              In good standing & active usage
            </p>
          </div>

          {/* Trialing Health */}
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-1.5 hover:bg-blue-500/10 transition-colors">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-400">
                <Clock className="h-3.5 w-3.5" />
                <span>Trialing</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-500/15 px-2 py-0.5 rounded-full">
                {workspaceHealth.trialing.percentage}%
              </span>
            </div>
            <div className="text-2xl font-black text-foreground">
              {workspaceHealth.trialing.count}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Evaluating platform features
            </p>
          </div>

          {/* Past Due Health */}
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1.5 hover:bg-amber-500/10 transition-colors">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Past Due</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full">
                {workspaceHealth.pastDue.percentage}%
              </span>
            </div>
            <div className="text-2xl font-black text-foreground">
              {workspaceHealth.pastDue.count}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Overdue billing requiring attention
            </p>
          </div>

          {/* Suspended Health */}
          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-1.5 hover:bg-rose-500/10 transition-colors">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Suspended</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded-full">
                {workspaceHealth.suspended.percentage}%
              </span>
            </div>
            <div className="text-2xl font-black text-foreground">
              {workspaceHealth.suspended.count}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Account locked or offboarded
            </p>
          </div>
        </div>
      </div>
    </CRMPageContainer>
  );
}
