"use client";

import React from "react";
import {
  TrendingUp,
  Sparkles,
  Layers,
  Plus,
  Building2,
  CheckCircle2,
  Clock,
  Shield,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { PlanBadge } from "@/shared/components/PlanBadge";
import { PlatformBillingSettingsData } from "@/shared/lib/api/super-admin.api";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";

interface BillingOverviewTabProps {
  kpis: {
    mrr: number;
    arr: number;
    totalRevenue: number;
    paidRevenue: number;
    pendingRevenue: number;
    pendingInvoicesCount: number;
    overdueRevenue: number;
    totalRefunds: number;
    paidSubscriptions: number;
    totalSubscriptions: number;
    totalOrganizations: number;
  };
  totalWorkspacesCount: number;
  invoicesCount: number;
  configForm: Partial<PlatformBillingSettingsData>;
  planDistribution: Array<{ name: string; count: number; revenue: number; percentage?: number }>;
  trendData: Array<{ month: string; revenue: number; projected: number; invoices: number }>;
  isClient: boolean;
  formatCurrency: (amount: number, currency?: string) => string;
  onNavigatePlans: () => void;
  onNewSubscription: () => void;
}

export function BillingOverviewTab({
  kpis,
  totalWorkspacesCount,
  invoicesCount,
  configForm,
  planDistribution,
  trendData,
  isClient,
  formatCurrency,
  onNavigatePlans,
  onNewSubscription,
}: BillingOverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Zero Data Onboarding Banner if total revenue is 0 */}
      {kpis.totalRevenue === 0 && (
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-4.5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-foreground">
                Ready to scale platform billing across {totalWorkspacesCount} workspaces
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Currently all registered organizations are on the Free starter tier. Configure paid packages in Plans or assign workspaces to Growth or Business tiers to generate recurring revenue.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onNavigatePlans}
              className="h-8 px-3 text-xs font-semibold gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" /> Configure Plans
            </Button>
            <Button
              size="sm"
              onClick={onNewSubscription}
              className="h-8 px-3 text-xs font-semibold gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> New Subscription
            </Button>
          </div>
        </div>
      )}

      {/* Main Revenue Chart & Tier Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Revenue Run-Rate Trend (2 Columns) */}
        <div className="lg:col-span-2 bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  Monthly Platform Revenue Trend
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Historical SaaS recurring revenue and run-rate trajectory (6 Months)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                MRR Trajectory
              </span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="rounded-xl bg-muted/40 border border-border/40 p-2.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Current MRR</span>
              <p className="text-sm sm:text-base font-bold font-mono text-foreground mt-0.5">
                {formatCurrency(kpis.mrr)}
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 border border-border/40 p-2.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Projected ARR</span>
              <p className="text-sm sm:text-base font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                {formatCurrency(kpis.arr)}
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 border border-border/40 p-2.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Invoices Issued</span>
              <p className="text-sm sm:text-base font-bold font-mono text-foreground mt-0.5">
                {invoicesCount}
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 border border-border/40 p-2.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Settlement Rate</span>
              <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                100%
              </p>
            </div>
          </div>

          {/* Chart Component / Empty State */}
          <div className="h-56 w-full pt-2">
            {isClient ? (
              kpis.totalRevenue === 0 && kpis.mrr === 0 && !trendData.some((d) => d.revenue > 0) ? (
                <div className="h-full w-full flex flex-col items-center justify-center rounded-xl bg-muted/10 border border-dashed border-border/60 p-6 text-center">
                  <div className="w-10 h-10 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-center text-muted-foreground/70 mb-2">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground">No revenue recorded yet</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1">
                    Revenue trends will appear here once paid subscriptions begin.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="billingRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                    <XAxis
                      dataKey="month"
                      stroke="var(--muted-foreground)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                        borderRadius: "12px",
                        fontSize: "11px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                      formatter={(val) => [formatCurrency(Number(val)), "Revenue"]}
                      labelStyle={{ fontWeight: "bold", color: "var(--foreground)" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#billingRevGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )
            ) : null}
          </div>
        </div>

        {/* Tier Distribution (1 Column) */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> Workspace Tier Distribution
              </h3>
              <span className="text-xs font-mono font-bold text-muted-foreground">
                {totalWorkspacesCount} orgs
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Breakdown of organizations across canonical billing tiers
            </p>

            <div className="space-y-3.5">
              {planDistribution.map((p) => {
                const pct = totalWorkspacesCount > 0 ? Math.round((p.count / totalWorkspacesCount) * 100) : 0;
                return (
                  <div key={p.name} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PlanBadge plan={p.name} size="sm" />
                        <span className="text-xs font-bold text-foreground capitalize">{p.name} Tier</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-foreground">
                        {p.count} {p.count === 1 ? "org" : "orgs"}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden">
                      <div
                        style={{ width: `${Math.max(p.count > 0 ? 4 : 0, pct)}%` }}
                        className={`h-full rounded-full transition-all ${
                          p.name.toLowerCase() === "free"
                            ? "bg-slate-400 dark:bg-slate-600"
                            : p.name.toLowerCase() === "starter"
                            ? "bg-blue-500"
                            : p.name.toLowerCase() === "growth" || p.name.toLowerCase() === "pro"
                            ? "bg-emerald-500"
                            : p.name.toLowerCase() === "business"
                            ? "bg-indigo-500"
                            : "bg-amber-500"
                        }`}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                      <span>{pct}% of total workspaces</span>
                      <span className="font-mono font-semibold text-foreground">
                        {formatCurrency(p.revenue)}/mo
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Paid Subscriptions</span>
            <span className="font-mono font-bold text-foreground">
              {kpis.paidSubscriptions} of {totalWorkspacesCount} orgs
            </span>
          </div>
        </div>
      </div>

      {/* SaaS Health & Cash Flow Breakdown (3 Non-Duplicative Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-semibold">Collected Revenue</span>
            <div className="text-lg font-black text-foreground font-mono mt-0.5">
              {formatCurrency(kpis.paidRevenue)}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Settled successfully</span>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 border border-amber-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-semibold">Outstanding Revenue</span>
            <div className="text-lg font-black text-foreground font-mono mt-0.5">
              {formatCurrency(kpis.pendingRevenue)}
            </div>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
              {kpis.pendingInvoicesCount} {kpis.pendingInvoicesCount === 1 ? "invoice" : "invoices"} awaiting payment
            </span>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 border border-purple-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-semibold">Payment Gateway</span>
            <div className="text-lg font-black text-foreground uppercase mt-0.5">
              {configForm.paymentGateway || "RAZORPAY"}
            </div>
            <span className="text-[11px] text-muted-foreground">GSTIN: {configForm.gstin || "29AAAAA0000A1Z5"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
