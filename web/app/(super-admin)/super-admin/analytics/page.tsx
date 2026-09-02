"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Building2,
  Users,
  CreditCard,
  BarChart3,
  RefreshCw,
  Layers,
  ArrowUpRight,
  Database,
  Activity,
} from "lucide-react";
import {
  fetchPlatformAnalytics,
  PlatformAnalyticsData,
} from "@/shared/lib/api/super-admin.api";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import {
  CRMPageContainer,
  CRMPageHeader,
  CRMMetricsGrid,
  CRMMetricCard,
} from "@/shared/components/crm";

export default function SuperAdminAnalyticsPage() {
  const [data, setData] = useState<PlatformAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchPlatformAnalytics();
      setData(res);
    } catch (err: any) {
      toast.error("Failed to load platform analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleAal2Verified = () => {
      loadData();
    };
    window.addEventListener("clixpro:aal2-verified", handleAal2Verified);
    return () => {
      window.removeEventListener("clixpro:aal2-verified", handleAal2Verified);
    };
  }, []);

  const totals = data?.totals || {
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    totalLeads: 0,
    totalDeals: 0,
    totalCustomers: 0,
    totalQuotations: 0,
    estimatedMRR: 0,
    estimatedARR: 0,
  };

  return (
    <CRMPageContainer>
      {/* 1. Standard CRM Page Header */}
      <CRMPageHeader
        title="Platform Analytics"
        subtitle="Cross-tenant SaaS metrics, MRR projections, growth velocity, and system telemetry."
        icon={BarChart3}
        badge="Platform Telemetry"
      />

      {/* 2. Standard CRM KPI Metrics Grid */}
      <div className="shrink-0">
        <CRMMetricsGrid cols={4}>
          <CRMMetricCard
            title="Estimated MRR"
            value={`₹${totals.estimatedMRR.toLocaleString()}`}
            change="Monthly Recurring SaaS"
            trend="up"
            icon={CreditCard}
            color="emerald"
            loading={loading}
          />
          <CRMMetricCard
            title="Projected ARR"
            value={`₹${totals.estimatedARR.toLocaleString()}`}
            change="Annual Run Rate"
            trend="up"
            icon={TrendingUp}
            color="purple"
            loading={loading}
          />
          <CRMMetricCard
            title="Active Tenants"
            value={totals.activeTenants}
            change={`of ${totals.totalTenants} registered`}
            trend="up"
            icon={Building2}
            color="blue"
            loading={loading}
          />
          <CRMMetricCard
            title="CRM Records"
            value={(totals.totalLeads + totals.totalDeals + totals.totalCustomers).toLocaleString()}
            change="Leads, Deals & Customers"
            trend="neutral"
            icon={Database}
            color="cyan"
            loading={loading}
          />
        </CRMMetricsGrid>
      </div>

      {/* 3. Main Charts & Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Workspace Growth Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-card border border-border shadow-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Organization Growth (Last 6 Months)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                New workspace signups and onboarding trajectory
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <Activity className="h-3.5 w-3.5" />
              <span>Platform Expanding</span>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-3 pt-6 pb-2">
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end animate-pulse">
                  <div className="h-3 w-6 bg-muted rounded" />
                  <div
                    className="w-full max-w-[48px] rounded-t-xl bg-muted"
                    style={{ height: `${30 + (idx % 3) * 25}%` }}
                  />
                  <div className="h-2.5 w-10 bg-muted/60 rounded" />
                </div>
              ))
            ) : data?.monthlyTrends && data.monthlyTrends.length > 0 ? (
              data.monthlyTrends.map((t, idx) => {
                const heightPercent = Math.max(14, Math.min(100, (t.organizations || 1) * 25));
                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                  >
                    <span className="text-xs font-bold text-foreground group-hover:text-emerald-600 transition-colors">
                      {t.organizations}
                    </span>
                    <div
                      className="w-full max-w-[48px] rounded-t-xl bg-emerald-600 transition-all duration-300 group-hover:opacity-90 shadow-sm"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[11px] font-semibold text-muted-foreground truncate max-w-full">
                      {t.month}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full text-center text-xs text-muted-foreground py-12">
                No trend data recorded.
              </div>
            )}
          </div>
        </div>

        {/* Plan Revenue Breakdown */}
        <div className="rounded-2xl bg-card border border-border shadow-card p-5 sm:p-6 space-y-4">
          <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-600" />
            <span>Revenue by Tier</span>
          </h3>

          <div className="space-y-3 pt-1">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-muted/40 border border-border/40 space-y-2 animate-pulse">
                  <div className="flex justify-between items-center">
                    <div className="h-3.5 w-20 bg-muted rounded" />
                    <div className="h-3.5 w-16 bg-muted rounded" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-2.5 w-24 bg-muted/60 rounded" />
                    <div className="h-2.5 w-24 bg-muted/60 rounded" />
                  </div>
                </div>
              ))
            ) : data?.planBreakdown && data.planBreakdown.length > 0 ? (
              data.planBreakdown.map((item) => (
                <div
                  key={item.plan}
                  className="p-3.5 rounded-xl bg-muted/40 border border-border/40 space-y-1 hover:bg-muted/60 transition-colors"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold capitalize text-foreground">
                      {item.plan} Tier
                    </span>
                    <span className="font-black text-emerald-600">
                      ₹{item.monthlyRevenue.toLocaleString()}/mo
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>{item.count} active workspaces</span>
                    <span>₹{item.price.toLocaleString()}/mo per org</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                No plan revenue recorded.
              </p>
            )}
          </div>
        </div>
      </div>
    </CRMPageContainer>
  );
}
