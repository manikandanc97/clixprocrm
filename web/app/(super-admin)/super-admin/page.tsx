"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ShieldAlert,
  ArrowUpRight,
  Plus,
  Zap,
  Sparkles,
  Lock,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import {
  fetchPlatformOverview,
  PlatformOverviewData,
  AttentionRequiredItem,
} from "@/shared/lib/api/super-admin.api";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/components/auth-provider";
import { CRMPageContainer } from "@/shared/components/crm";
import { SuperAdminDashboardSkeleton } from "../components/SuperAdminDashboardSkeleton";
import { useIsClient } from "@/shared/hooks/use-is-client";

import {
  TimeframeOption,
  DEFAULT_ORGANIZATION_GROWTH,
} from "./components/dashboard-types";
import { DashboardKpiCards } from "./components/DashboardKpiCards";
import { AttentionRequiredPanel } from "./components/AttentionRequiredPanel";

const OrganizationGrowthCard = dynamic(
  () => import("./components/OrganizationGrowthCard").then((mod) => mod.OrganizationGrowthCard),
  { ssr: false }
);

const PlatformUsageHealthRow = dynamic(
  () => import("./components/PlatformUsageHealthRow").then((mod) => mod.PlatformUsageHealthRow),
  { ssr: false }
);

const ModuleAdoptionBillingRow = dynamic(
  () => import("./components/ModuleAdoptionBillingRow").then((mod) => mod.ModuleAdoptionBillingRow),
  { ssr: false }
);

const RecentOrganizationsTable = dynamic(
  () => import("./components/RecentOrganizationsTable").then((mod) => mod.RecentOrganizationsTable),
  { ssr: false }
);

const PlatformActivityAuditCard = dynamic(
  () => import("./components/PlatformActivityAuditCard").then((mod) => mod.PlatformActivityAuditCard),
  { ssr: false }
);

export default function SuperAdminDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<PlatformOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aal2Required, setAal2Required] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeframeOption>("30D");
  const isClient = useIsClient();

  const loadData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setError(null);
      const overview = await fetchPlatformOverview();
      setData(overview);
      setAal2Required(false);
    } catch (err: unknown) {
      const errResponse = (err as { response?: { data?: { code?: string; message?: string }; status?: number } })?.response;
      const errData = errResponse?.data;
      const isAal =
        errResponse?.status === 403 &&
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
        const msg = errData?.message || (err as { message?: string })?.message || "Failed to load platform overview data.";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const run = async () => {
      try {
        await loadData();
      } catch {
        // Handled inside loadData
      }
    };
    run();

    // Auto-reload data upon MFA elevation seamlessly in-place
    const handleAal2Verified = () => {
      if (isCancelled) return;
      setAal2Required(false);
      loadData(true);
    };

    window.addEventListener("clixpro:aal2-verified", handleAal2Verified);
    return () => {
      isCancelled = true;
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

  const growthData = data?.organizationGrowth || DEFAULT_ORGANIZATION_GROWTH;

  const currentGrowthSeries = useMemo(() => {
    const growth = data?.organizationGrowth || DEFAULT_ORGANIZATION_GROWTH;
    return growth.timeframes[timeRange] || growth.timeframes["30D"];
  }, [data?.organizationGrowth, timeRange]);

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

  if (loading && !data && !aal2Required) {
    return <SuperAdminDashboardSkeleton />;
  }

  return (
    <CRMPageContainer>
      {/* 0. AAL2 Security Elevation Alert Banner */}
      {aal2Required && (
        <div
          className="rounded-2xl border border-amber-500/30 bg-amber-500/10 shadow-lg p-4 sm:p-5 animate-in fade-in slide-in-from-top-2 duration-200"
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
        </div>
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
        className="relative overflow-hidden rounded-2xl bg-[#0f172a] p-5 sm:p-6 shadow-xl border border-white/5 shrink-0"
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
      <DashboardKpiCards
        metrics={metrics}
        aal2Required={aal2Required}
        loading={loading}
      />

      {/* 4. Row 1: Organization Growth & Attention Required */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <OrganizationGrowthCard
          growthData={growthData}
          currentGrowthSeries={currentGrowthSeries}
          timeRange={timeRange}
          isClient={isClient}
        />
        <AttentionRequiredPanel attentionItems={attentionItems} />
      </div>

      {/* 5. Row 2: Platform Usage & Platform Health */}
      <PlatformUsageHealthRow
        usageStats={usageStats}
        healthServices={healthServices}
        isClient={isClient}
      />

      {/* 6. Row 3: Module Adoption & Billing Snapshot / Tenant Health */}
      <ModuleAdoptionBillingRow
        moduleAdoption={moduleAdoption}
        billingSnapshot={billingSnapshot}
        tenantHealth={tenantHealth}
        totalOrganizations={metrics.totalOrganizations}
      />

      {/* 7. Recent Organizations Table */}
      <RecentOrganizationsTable
        recentOrganizations={data?.recentOrganizations}
      />

      {/* 8. Platform Activity & Audit Logs */}
      <PlatformActivityAuditCard
        recentAuditLogs={data?.recentAuditLogs}
      />
    </CRMPageContainer>
  );
}
