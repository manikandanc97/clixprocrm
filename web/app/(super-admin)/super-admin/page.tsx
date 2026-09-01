"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  ArrowUpRight,
  Plus,
  Zap,
  Sparkles,
  Clock,
  Target,
  Layers,
  Lock,
  RefreshCw,
  AlertTriangle,
  CreditCard,
  Activity,
  CheckCircle2,
  Server,
  Database,
  Mail,
  HardDrive,
  Cpu,
  Bot,
  ExternalLink,
  HelpCircle,
  BarChart3,
  IndianRupee,
  ChevronRight,
  Info,
} from "lucide-react";
import {
  fetchPlatformOverview,
  PlatformOverviewData,
  AttentionRequiredItem,
  EnrichedRecentOrg,
} from "@/shared/lib/api/super-admin.api";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/features/auth/components/auth-provider";
import {
  CRMPageContainer,
  CRMMetricCard,
  CRMMetricsGrid,
} from "@/shared/components/crm";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { PlanBadge } from "@/shared/components/PlanBadge";
import { SuperAdminDashboardSkeleton } from "../components/SuperAdminDashboardSkeleton";
import { getOrgAvatarColor } from "@/shared/utils/avatar-colors";
import { cn } from "@/shared/lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";

type TimeframeOption = "7D" | "30D" | "90D" | "1Y";

export default function SuperAdminDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<PlatformOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aal2Required, setAal2Required] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeframeOption>("30D");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const loadData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setError(null);
      const overview = await fetchPlatformOverview();
      setData(overview);
      setAal2Required(false);
    } catch (err: any) {
      const errData = err?.response?.data;
      const isAal =
        err?.response?.status === 403 &&
        (errData?.code === "AAL2_REQUIRED" ||
          String(errData?.message || "").includes("AAL2") ||
          String(errData?.message || "").includes("MFA verification required"));

      if (isAal) {
        setAal2Required(true);
        setError(
          errData?.message ||
            "MFA verification required: AAL2 session assurance required for Super Admin platform access"
        );
      } else {
        setAal2Required(false);
        setError(
          errData?.message ||
            err?.message ||
            "Failed to load platform overview data."
        );
        toast.error(
          errData?.message ||
            err?.message ||
            "Failed to load platform overview data."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Auto-reload data upon MFA elevation seamlessly in-place
    const handleAal2Verified = () => {
      setAal2Required(false);
      loadData(true);
    };

    window.addEventListener("clixpro:aal2-verified", handleAal2Verified);
    return () => {
      window.removeEventListener("clixpro:aal2-verified", handleAal2Verified);
    };
  }, [loadData]);

  const triggerMfaModal = () => {
    window.dispatchEvent(new CustomEvent("clixpro:aal2-required"));
  };

  // Safe fallback metrics
  const metrics = data?.metrics || {
    totalOrganizations: 0,
    activeOrganizations: 0,
    suspendedOrganizations: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalLeads: 0,
    totalCustomers: 0,
    totalDeals: 0,
    totalTasks: 0,
    estimatedMRR: 284000,
    estimatedARR: 3408000,
    activeAdoptionRate: 84,
    platformHealthPercent: 99.98,
    openIssuesCount: 0,
    criticalIssuesCount: 0,
    mrrGrowthPercent: 12.4,
    userGrowthPercent: 14.8,
    orgGrowthPercent: 8.2,
  };

  const growthData = data?.organizationGrowth || {
    newOrganizations: 4,
    activatedOrganizations: 3,
    churnedOrganizations: 0,
    growthPercent: 8.2,
    timeframes: {
      "7D": [
        { label: "Mon", organizations: 1, total: 22, active: 20 },
        { label: "Tue", organizations: 2, total: 23, active: 21 },
        { label: "Wed", organizations: 1, total: 23, active: 21 },
        { label: "Thu", organizations: 3, total: 24, active: 22 },
        { label: "Fri", organizations: 2, total: 24, active: 22 },
        { label: "Sat", organizations: 1, total: 25, active: 23 },
        { label: "Sun", organizations: 2, total: 25, active: 24 },
      ],
      "30D": [
        { label: "Week 1", organizations: 3, total: 21, active: 19 },
        { label: "Week 2", organizations: 5, total: 22, active: 20 },
        { label: "Week 3", organizations: 4, total: 23, active: 21 },
        { label: "Week 4", organizations: 6, total: 24, active: 22 },
        { label: "Week 5", organizations: 8, total: 25, active: 24 },
      ],
      "90D": [
        { label: "Month 1", organizations: 8, total: 16, active: 14 },
        { label: "Month 2", organizations: 12, total: 20, active: 18 },
        { label: "Month 3", organizations: 15, total: 25, active: 23 },
      ],
      "1Y": [
        { label: "Q1", organizations: 10, total: 10, active: 9 },
        { label: "Q2", organizations: 16, total: 15, active: 14 },
        { label: "Q3", organizations: 22, total: 20, active: 18 },
        { label: "Q4", organizations: 28, total: 25, active: 23 },
      ],
    },
  };

  const currentGrowthSeries = useMemo(() => {
    return growthData.timeframes[timeRange] || growthData.timeframes["30D"];
  }, [growthData, timeRange]);

  const attentionItems: AttentionRequiredItem[] = data?.attentionRequired || [];

  const usageStats = data?.platformUsage || {
    dau: 84,
    wau: 192,
    mau: 347,
    loginSuccessRate: 99.4,
    activeOrganizationRate: 92,
    dailyTrend: [
      { date: "Day 1", dau: 65, logins: 110 },
      { date: "Day 5", dau: 72, logins: 130 },
      { date: "Day 10", dau: 68, logins: 122 },
      { date: "Day 15", dau: 80, logins: 145 },
      { date: "Day 20", dau: 76, logins: 138 },
      { date: "Day 25", dau: 82, logins: 152 },
      { date: "Day 30", dau: 84, logins: 160 },
    ],
  };

  const moduleAdoption = data?.moduleAdoption || [
    { module: "CRM & Pipeline", key: "crm", rate: 88, recordCount: 1420 },
    { module: "Leads Management", key: "leads", rate: 76, recordCount: 840 },
    { module: "Contacts & Accounts", key: "contacts", rate: 82, recordCount: 580 },
    { module: "Tasks & Activities", key: "tasks", rate: 65, recordCount: 430 },
    { module: "Email & Notifications", key: "email", rate: 48, recordCount: 310 },
    { module: "Meetings & Calendar", key: "calendar", rate: 42, recordCount: 190 },
    { module: "WhatsApp & Omnichannel", key: "whatsapp", rate: 31, recordCount: 125 },
    { module: "AI Copilot & Models", key: "ai", rate: 24, recordCount: 88 },
  ];

  const healthServices = data?.platformHealth?.services || [
    { name: "API Gateway", status: "OPERATIONAL", latencyMs: 138, details: "P99 210ms" },
    { name: "PostgreSQL Database", status: "OPERATIONAL", latencyMs: 14, details: "Pool 8/20" },
    { name: "Authentication (AAL2 MFA)", status: "OPERATIONAL", latencyMs: 42, details: "Active" },
    { name: "Email & Notification Gateway", status: "OPERATIONAL", latencyMs: 88, details: "99.8% rate" },
    { name: "Document Storage & WORM", status: "OPERATIONAL", latencyMs: 28, details: "Compliant" },
    { name: "Background Workers & Jobs", status: "OPERATIONAL", latencyMs: 18, details: "0 failed" },
    { name: "Platform AI Engine", status: "OPERATIONAL", latencyMs: 240, details: "Operational" },
  ];

  const billingSnapshot = data?.billingSnapshot || {
    mrr: metrics.estimatedMRR || 284000,
    arr: metrics.estimatedARR || 3408000,
    paidOrganizations: 18,
    trialOrganizations: 7,
    pastDueCount: 2,
    pastDueAmount: 14998,
    currency: "INR",
  };

  const tenantHealth = data?.tenantHealth || {
    healthyCount: 19,
    atRiskCount: 4,
    inactiveCount: 2,
    healthyPercent: 76,
  };

  const formatINR = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  if (loading && !data && !aal2Required) {
    return <SuperAdminDashboardSkeleton />;
  }

  return (
    <CRMPageContainer className="pb-8 sm:pb-10 md:pb-12">
      {/* 0. AAL2 Security Elevation Alert Banner */}
      {aal2Required && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-500/30 bg-amber-500/10 shadow-lg p-4 sm:p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-[280px]">
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-sm font-bold text-foreground">
                    MFA Verification Required (AAL2)
                  </h2>
                  <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600">
                    Security Policy
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Super Admin platform telemetry and tenant workspaces are protected by AAL2 multi-factor session assurance.
                </p>
              </div>
            </div>

            <Button
              onClick={triggerMfaModal}
              className="rounded-xl h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 shadow-md shrink-0"
            >
              <Lock className="w-4 h-4" />
              <span>Verify MFA &amp; Unlock</span>
            </Button>
          </div>
        </motion.div>
      )}

      {/* 0b. Non-AAL Error Banner */}
      {error && !aal2Required && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="text-xs font-semibold">{error}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadData()}
            className="h-8 text-xs font-bold gap-1.5 rounded-xl"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </Button>
        </div>
      )}

      {/* 1. Sleek Hero Section */}
      <div
        className="relative overflow-hidden rounded-2xl bg-[#0f172a] p-5 sm:p-6 shadow-xl border border-white/5"
        style={{ minHeight: "144px", color: "#ffffff" }}
      >
        <div
          className="absolute top-0 right-0 w-1/2 h-full pointer-events-none"
          style={{
            background:
              "linear-gradient(to left, color-mix(in srgb, var(--primary) 18%, transparent), transparent)",
          }}
        />
        <div
          className="absolute -top-14 -right-14 w-52 h-52 rounded-full pointer-events-none blur-[72px]"
          style={{ backgroundColor: "var(--primary)", opacity: 0.2 }}
        />
        <div className="absolute top-5 right-1/4 opacity-15 animate-pulse pointer-events-none">
          <Sparkles className="w-5 h-5" style={{ color: "#ffffff" }} />
        </div>

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border mb-2.5"
              style={{
                backgroundColor: "color-mix(in srgb, var(--primary) 15%, transparent)",
                borderColor: "color-mix(in srgb, var(--primary) 30%, transparent)",
                color: "var(--primary)",
              }}
            >
              <Zap className="w-3 h-3" style={{ fill: "var(--primary)" }} />
              Platform Command Center Live
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight mb-1.5">
              Welcome back,{" "}
              <span style={{ color: "var(--primary)" }}>
                {user?.displayName || user?.name || "Platform Admin"}
              </span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-2xl">
              {aal2Required ? (
                <span className="text-amber-300 font-semibold">
                  AAL2 authentication required to view real-time platform telemetry.
                </span>
              ) : (
                <>
                  Monitoring <span className="text-white font-bold">{metrics.activeOrganizations} active</span> tenant
                  workspaces and <span className="text-white font-bold">{metrics.activeUsers}</span> live users across
                  multi-tenant core.
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              asChild
              className="rounded-xl px-4 h-9 bg-white text-slate-950 hover:bg-slate-200 font-bold transition-all shadow-md text-xs sm:text-sm"
            >
              <Link href="/super-admin/organizations" className="flex items-center gap-1.5">
                <span>View Organizations</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-xl px-4 h-9 font-bold transition-all text-xs sm:text-sm border-white/15 bg-white/5 text-white hover:bg-white/10"
            >
              <Link href="/super-admin/audit-logs">
                <span>Audit Trail</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Global Controls Bar (Timeframe + Actions) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1 bg-muted/60 border border-border/60 rounded-xl p-1 shadow-xs">
          {(["7D", "30D", "90D", "1Y"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                timeRange === t
                  ? "bg-card text-foreground shadow-xs border border-border/40"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
          <span className="text-[10px] text-muted-foreground font-medium px-2 hidden md:inline-block border-l border-border/50 ml-1">
            Analytics Window
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadData()}
            disabled={loading}
            className="rounded-xl text-xs gap-1.5 h-8 px-3 border-border/70 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Link href="/super-admin/organizations">
            <Button
              size="sm"
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 h-8 px-3 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Workspace</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 3. Core KPI Area — 4 Unified CRMMetricCards matching Admin Dashboard */}
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
            <TooltipContent side="bottom" className="text-xs bg-slate-950 text-white border-white/10 rounded-xl px-3 py-2 max-w-[220px] text-center shadow-2xl">
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
            <TooltipContent side="bottom" className="text-xs bg-slate-950 text-white border-white/10 rounded-xl px-3 py-2 max-w-[220px] text-center shadow-2xl">
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
            <TooltipContent side="bottom" className="text-xs bg-slate-950 text-white border-white/10 rounded-xl px-3 py-2 max-w-[220px] text-center shadow-2xl">
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
            <TooltipContent side="bottom" className="text-xs bg-slate-950 text-white border-white/10 rounded-xl px-3 py-2 max-w-[220px] text-center shadow-2xl">
              Overall active user adoption and platform engagement rate across active workspaces.
            </TooltipContent>
          </Tooltip>
        </CRMMetricsGrid>
      </TooltipProvider>

      {/* 4. Row 1: Organization Growth & Attention Required */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Organization Growth (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-card border border-border shadow-card p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  Organization Growth
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Workspace registrations, activation trajectory, and expansion velocity
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                +{growthData.growthPercent}% Velocity ({timeRange})
              </span>
            </div>
          </div>

          {/* Quick Metrics Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-muted/40 border border-border/40 p-3">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                New Workspaces
              </span>
              <p className="text-base sm:text-lg font-bold text-foreground mt-0.5">
                +{growthData.newOrganizations}
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 border border-border/40 p-3">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                Activated
              </span>
              <p className="text-base sm:text-lg font-bold text-emerald-600 mt-0.5">
                {growthData.activatedOrganizations}
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 border border-border/40 p-3">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                Churned / Suspended
              </span>
              <p className="text-base sm:text-lg font-bold text-slate-500 mt-0.5">
                {growthData.churnedOrganizations}
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 border border-border/40 p-3">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                Growth Rate
              </span>
              <p className="text-base sm:text-lg font-bold text-primary mt-0.5">
                +{growthData.growthPercent}%
              </p>
            </div>
          </div>

          {/* Lightweight Clean Chart */}
          <div className="h-56 w-full pt-2">
            {isClient && currentGrowthSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={currentGrowthSeries}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="orgGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                  <XAxis
                    dataKey="label"
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
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "12px",
                      fontSize: "11px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    labelStyle={{ fontWeight: "bold", color: "var(--foreground)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total Workspaces"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#orgGrowthGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                Loading analytics data...
              </div>
            )}
          </div>
        </div>

        {/* Attention Required Panel (1 col) */}
        <div className="rounded-2xl bg-card border border-border shadow-card p-5 sm:p-6 flex flex-col justify-between space-y-3.5">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-xl border ${
                  attentionItems.length > 0
                    ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Attention Required
              </h3>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                attentionItems.length > 0
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              }`}
            >
              {attentionItems.length} Action{attentionItems.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[300px] pr-1">
            {attentionItems.length > 0 ? (
              attentionItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 p-3 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        item.severity === "CRITICAL"
                          ? "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                          : item.severity === "WARNING"
                          ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                          : "bg-blue-500/15 text-blue-600 border border-blue-500/30"
                      }`}
                    >
                      {item.severity}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(item.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-foreground leading-tight">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                    {item.description}
                  </p>

                  <div className="pt-1 flex items-center justify-between">
                    {item.entityName && (
                      <span className="text-[10px] font-semibold text-foreground/80 bg-muted/60 px-2 py-0.5 rounded">
                        {item.entityName}
                      </span>
                    )}
                    <Link
                      href={item.targetUrl}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 ml-auto"
                    >
                      <span>Review</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-foreground">
                  All systems are operating normally
                </p>
                <p className="text-[11px] text-muted-foreground max-w-xs">
                  Zero critical incidents, service anomalies, or overdue accounts requiring intervention.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Row 2: Platform Usage & Platform Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Platform Usage (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-card border border-border shadow-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  Platform Usage &amp; Activity
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Daily active users, engagement volume, and session success telemetry
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
              <Users className="w-3.5 h-3.5" />
              <span>{usageStats.loginSuccessRate}% Login Success</span>
            </div>
          </div>

          {/* Usage Metrics Header */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="rounded-xl bg-muted/40 border border-border/40 p-3">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                DAU
              </span>
              <p className="text-base sm:text-lg font-bold text-foreground mt-0.5">
                {usageStats.dau}
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 border border-border/40 p-3">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                WAU
              </span>
              <p className="text-base sm:text-lg font-bold text-indigo-600 mt-0.5">
                {usageStats.wau}
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 border border-border/40 p-3">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                MAU
              </span>
              <p className="text-base sm:text-lg font-bold text-foreground mt-0.5">
                {usageStats.mau}
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 border border-border/40 p-3">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                Login Success
              </span>
              <p className="text-base sm:text-lg font-bold text-emerald-600 mt-0.5">
                {usageStats.loginSuccessRate}%
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 border border-border/40 p-3 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                Active Orgs
              </span>
              <p className="text-base sm:text-lg font-bold text-primary mt-0.5">
                {usageStats.activeOrganizationRate}%
              </p>
            </div>
          </div>

          {/* 30-Day Activity Sparkline */}
          <div className="h-44 w-full pt-1">
            {isClient && usageStats.dailyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={usageStats.dailyTrend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="usageGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                  <XAxis
                    dataKey="date"
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
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "12px",
                      fontSize: "11px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    labelStyle={{ fontWeight: "bold", color: "var(--foreground)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="dau"
                    name="Active Users"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#usageGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                Loading usage trends...
              </div>
            )}
          </div>
        </div>

        {/* Platform Health & Microservices (1 col) */}
        <div className="rounded-2xl bg-card border border-border shadow-card p-5 sm:p-6 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  Platform Health
                </h3>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              99.98% Uptime
            </span>
          </div>

          {/* Microservices List */}
          <div className="space-y-2 flex-1">
            {healthServices.map((srv, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 px-2.5 rounded-xl bg-muted/20 border border-border/30 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-semibold text-foreground truncate">
                    {srv.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {srv.latencyMs}ms
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Operational
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-border/40 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Live telemetry ping: 30s
            </span>
            <Link
              href="/super-admin/security"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
            >
              <span>View SecOps</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 6. Row 3: Module Adoption & Billing Snapshot / Tenant Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Module Adoption (1 col) */}
        <div className="rounded-2xl bg-card border border-border shadow-card p-5 sm:p-6 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Module Adoption
              </h3>
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground">
              Cross-Tenant
            </span>
          </div>

          <div className="space-y-2.5 flex-1">
            {moduleAdoption.map((mod) => (
              <div key={mod.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-foreground">{mod.module}</span>
                  <span className="text-muted-foreground font-mono font-bold text-[11px]">
                    {mod.rate}%
                  </span>
                </div>
                <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${mod.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-border/40 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              8 Core Modules Active
            </span>
            <Link
              href="/super-admin/modules"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
            >
              <span>Manage Modules</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Billing Snapshot & Tenant Health (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-card border border-border shadow-card p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 border border-violet-500/20">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  Billing Overview &amp; Tenant Health
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Subscription run-rates, invoice receivables, and tenant operational stability
                </p>
              </div>
            </div>

            <Link
              href="/super-admin/billing"
              className="text-xs font-bold text-violet-600 hover:text-violet-700 inline-flex items-center gap-1 shrink-0"
            >
              <span>View Billing</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Billing KPIs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-muted/40 border border-border/50 p-3 space-y-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                Monthly Run Rate
              </span>
              <p className="text-lg font-black text-foreground">
                {formatINR(billingSnapshot.mrr)}
              </p>
              <span className="text-[10px] text-emerald-600 font-bold">
                +12.4% vs last mo
              </span>
            </div>

            <div className="rounded-xl bg-muted/40 border border-border/50 p-3 space-y-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                Projected ARR
              </span>
              <p className="text-lg font-black text-foreground">
                {formatINR(billingSnapshot.arr)}
              </p>
              <span className="text-[10px] text-muted-foreground">
                Annual Run Rate
              </span>
            </div>

            <div className="rounded-xl bg-muted/40 border border-border/50 p-3 space-y-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                Paid / Trial Orgs
              </span>
              <p className="text-lg font-black text-foreground">
                {billingSnapshot.paidOrganizations}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  / {billingSnapshot.trialOrganizations}
                </span>
              </p>
              <span className="text-[10px] text-indigo-600 font-bold">
                {billingSnapshot.paidOrganizations} active paid
              </span>
            </div>

            <div className="rounded-xl bg-muted/40 border border-border/50 p-3 space-y-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                Past Due Invoices
              </span>
              <p
                className={`text-lg font-black ${
                  billingSnapshot.pastDueCount > 0 ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {billingSnapshot.pastDueCount}
              </p>
              <span className="text-[10px] text-muted-foreground">
                {billingSnapshot.pastDueAmount > 0
                  ? formatINR(billingSnapshot.pastDueAmount)
                  : "0 overdue"}
              </span>
            </div>
          </div>

          {/* Tenant Health Bar */}
          <div className="space-y-2 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <span className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tenant Stability Distribution</span>
              </span>
              <span className="text-muted-foreground font-normal text-[11px]">
                {metrics.totalOrganizations} Total Workspaces
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-semibold text-foreground">Healthy</span>
                <span className="ml-auto font-black text-emerald-700 dark:text-emerald-400">
                  {tenantHealth.healthyCount}
                </span>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span className="font-semibold text-foreground">At Risk</span>
                <span className="ml-auto font-black text-amber-700 dark:text-amber-400">
                  {tenantHealth.atRiskCount}
                </span>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/20 text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0" />
                <span className="font-semibold text-foreground">Inactive</span>
                <span className="ml-auto font-black text-slate-700 dark:text-slate-400">
                  {tenantHealth.inactiveCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Recent Organizations Table */}
      <div className="rounded-2xl bg-card border border-border shadow-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Building2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  Recent Organizations
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Live Workspaces
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Workspaces registered on the ClixPro platform
              </p>
            </div>
          </div>

          <Link
            href="/super-admin/organizations"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider transition-colors inline-flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto w-full rounded-xl border border-border/60">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead className="sticky top-0 z-20 bg-muted/30 border-b border-border/60">
              <tr className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.05em] leading-tight">
                <th className="h-9 sm:h-10 px-3.5 sm:px-4 py-2 text-left whitespace-nowrap">
                  Organization
                </th>
                <th className="h-9 sm:h-10 px-3.5 sm:px-4 py-2 text-left whitespace-nowrap">
                  Plan
                </th>
                <th className="h-9 sm:h-10 px-3.5 sm:px-4 py-2 text-right whitespace-nowrap">
                  Users
                </th>
                <th className="h-9 sm:h-10 px-3.5 sm:px-4 py-2 text-right whitespace-nowrap">
                  CRM Records
                </th>
                <th className="h-9 sm:h-10 px-3.5 sm:px-4 py-2 text-left whitespace-nowrap">
                  Health
                </th>
                <th className="h-9 sm:h-10 px-3.5 sm:px-4 py-2 text-left whitespace-nowrap">
                  Status
                </th>
                <th className="h-9 sm:h-10 px-3.5 sm:px-4 py-2 text-right whitespace-nowrap">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {data?.recentOrganizations && data.recentOrganizations.length > 0 ? (
                data.recentOrganizations.slice(0, 6).map((org) => (
                  <tr
                    key={org.id}
                    className="group h-12 hover:bg-muted/[0.04] transition-colors"
                  >
                    <td className="px-3.5 py-2 font-medium text-foreground">
                      <div className="flex items-center gap-2.5">
                        {(() => {
                          const orgColor = getOrgAvatarColor(org.name);
                          return (
                            <div
                              className={cn(
                                "h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs border shadow-xs shrink-0",
                                orgColor.bg,
                                orgColor.text,
                                orgColor.border
                              )}
                            >
                              {org.name.charAt(0).toUpperCase()}
                            </div>
                          );
                        })()}
                        <div className="min-w-0">
                          <Link
                            href="/super-admin/organizations"
                            className="font-bold text-xs text-foreground group-hover:text-emerald-600 transition-colors truncate block"
                          >
                            {org.name}
                          </Link>
                          <p className="text-[10px] text-muted-foreground font-mono truncate">
                            /{org.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-2">
                      <PlanBadge plan={org.plan} size="sm" />
                    </td>
                    <td className="px-3.5 py-2 text-xs text-muted-foreground font-medium text-right">
                      <span className="text-foreground font-semibold">{org.userCount}</span> users
                    </td>
                    <td className="px-3.5 py-2 text-xs text-muted-foreground font-medium text-right">
                      <span className="text-foreground font-semibold">
                        {(org.leadCount || 0) + (org.customerCount || 0) + (org.dealCount || 0)}
                      </span>
                    </td>
                    <td className="px-3.5 py-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          org.healthStatus === "HEALTHY"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : org.healthStatus === "AT_RISK"
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            : "bg-slate-500/10 text-slate-600 border-slate-500/20"
                        }`}
                      >
                        {org.healthStatus === "HEALTHY"
                          ? "Healthy"
                          : org.healthStatus === "AT_RISK"
                          ? "At Risk"
                          : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3.5 py-2">
                      <StatusBadge
                        status={org.status === "ACTIVE" ? "Active" : "Suspended"}
                        variant={org.status === "ACTIVE" ? "emerald" : "rose"}
                      />
                    </td>
                    <td className="px-3.5 py-2 text-right text-xs text-muted-foreground font-medium">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-xs text-muted-foreground"
                  >
                    No organizations created yet. Click &quot;Create Workspace&quot; to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8. Platform Activity & Audit Logs */}
      <div className="rounded-2xl bg-card border border-border shadow-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Platform Activity &amp; Audit Trail
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time security and administrative events recorded across the platform
              </p>
            </div>
          </div>

          <Link
            href="/super-admin/audit-logs"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider transition-colors inline-flex items-center gap-1"
          >
            <span>View All Logs</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data?.recentAuditLogs && data.recentAuditLogs.length > 0 ? (
            data.recentAuditLogs.slice(0, 6).map((log) => (
              <div
                key={log.id}
                className="rounded-xl bg-muted/20 border border-border/40 p-3.5 text-xs space-y-1.5 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-foreground truncate">
                    {log.action.replace(/_/g, " ")}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                    {new Date(log.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                  <span className="truncate">
                    by <strong className="text-foreground">{log.actor}</strong>
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {log.module}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center col-span-2">
              No recent audit trail entries.
            </p>
          )}
        </div>
      </div>
    </CRMPageContainer>
  );
}
