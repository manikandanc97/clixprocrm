"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  ShieldCheck,
  ShieldAlert,
  Ban,
  TrendingUp,
  ArrowUpRight,
  Plus,
  Zap,
  Sparkles,
  Clock,
  Filter,
  Target,
  Layers,
  Lock,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import {
  fetchPlatformOverview,
  PlatformOverviewData,
} from "@/shared/lib/api/super-admin.api";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useAuth } from "@/features/auth/components/auth-provider";
import {
  CRMPageContainer,
  CRMMetricCard,
  CRMMetricsGrid,
} from "@/shared/components/crm";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { PlanBadge } from "@/shared/components/PlanBadge";
import { EmptyState } from "@/shared/components/EmptyState";

export default function SuperAdminDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<PlatformOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aal2Required, setAal2Required] = useState(false);
  const [timeRange, setTimeRange] = useState<"Today" | "Week" | "Month" | "Year">("Month");

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

  const metrics = data?.metrics || {
    totalOrganizations: 0,
    activeOrganizations: 0,
    suspendedOrganizations: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalLeads: 0,
    totalCustomers: 0,
    totalDeals: 0,
  };

  return (
    <CRMPageContainer>
      {/* AAL2 Security Elevation Alert Banner */}
      {aal2Required && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-900 dark:text-amber-200 shadow-lg relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                  <span>MFA Verification Required (AAL2 Assurance)</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    Security Policy
                  </span>
                </h2>
                <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                  Super Admin platform telemetry and tenant databases are protected by strict Level 2 Multi-Factor Authentication assurance. Complete 2FA verification to unlock live platform data.
                </p>
              </div>
            </div>

            <Button
              onClick={triggerMfaModal}
              className="rounded-xl px-5 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md text-xs sm:text-sm shrink-0 gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Verify MFA & Unlock</span>
            </Button>
          </div>
        </motion.div>
      )}

      {/* General Non-AAL Error Banner */}
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
            className="h-8 text-xs font-bold gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </Button>
        </div>
      )}

      {/* 1. Sleek Welcome Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl bg-slate-950 p-5 sm:p-6 shadow-xl border border-white/5"
      >
        {/* Dynamic Theme Reactive Ambient Gradients */}
        <div 
          className="absolute top-0 right-0 w-1/2 h-full pointer-events-none transition-all duration-500" 
          style={{
            background: "linear-gradient(to left, color-mix(in srgb, var(--primary) 20%, transparent), transparent)"
          }}
        />
        <div 
          className="absolute -top-16 -right-16 w-56 h-56 blur-[80px] rounded-full pointer-events-none transition-all duration-500" 
          style={{
            backgroundColor: "var(--primary)",
            opacity: 0.22
          }}
        />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              {/* Dynamic Status Badge */}
              <div 
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)",
                  borderColor: "color-mix(in srgb, var(--primary) 28%, transparent)",
                  color: "var(--primary)"
                }}
              >
                <Zap className="w-3 h-3" style={{ fill: "var(--primary)", color: "var(--primary)" }} />
                Multi-Tenant Core Live
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Welcome back, <span className="capitalize font-extrabold transition-colors duration-300" style={{ color: "var(--primary)" }}>{user?.displayName || user?.name || "Platform Admin"}</span>
              </h1>
              <div className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
                {aal2Required ? (
                  <span className="text-amber-300 font-semibold">
                    AAL2 verification required to load platform metrics and tenant data.
                  </span>
                ) : (
                  <>
                    Your platform is running with <span className="font-semibold transition-colors duration-300" style={{ color: "var(--primary)" }}>{metrics.activeOrganizations} active</span> tenant organizations and <span className="font-semibold transition-colors duration-300" style={{ color: "var(--primary)" }}>{metrics.activeUsers}</span> global users. All multi-tenant services are operating smoothly.
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Button
              asChild
              className="rounded-xl px-5 h-10 bg-white text-slate-950 hover:bg-slate-200 font-bold transition-all shadow-md text-xs sm:text-sm"
            >
              <Link href="/super-admin/organizations" className="flex items-center gap-2">
                <span>View Organizations</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-xl px-5 h-10 border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold transition-all text-xs sm:text-sm"
            >
              <Link href="/super-admin/audit-logs">
                <span>Audit Trail</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Decorative Sparkle */}
        <div className="absolute top-6 right-1/4 opacity-20 animate-pulse pointer-events-none">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
      </motion.div>

      {/* 2. Filter & Timeframe Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Timeframe selector */}
        <div className="inline-flex items-center bg-muted/60 border border-border/60 rounded-xl p-1 shadow-sm">
          {(["Today", "Week", "Month", "Year"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                timeRange === t
                  ? "bg-card text-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadData()}
            disabled={loading}
            className="rounded-xl text-xs gap-1.5 h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Link href="/super-admin/organizations">
            <Button
              size="sm"
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 h-9 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Organization</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 3. Core KPI Metrics Grid */}
      <CRMMetricsGrid cols={4}>
        {/* Card 1: Total Organizations */}
        <Link href="/super-admin/organizations" className="block group">
          <CRMMetricCard
            title="Total Organizations"
            value={aal2Required ? "—" : metrics.totalOrganizations.toString()}
            change={aal2Required ? "AAL2 Required" : `${metrics.activeOrganizations} Active`}
            trend="up"
            icon={Building2}
            color="emerald"
            loading={loading}
            comparisonText="active tenants"
            className="group-hover:ring-2 ring-emerald-500/20 transition-all"
          />
        </Link>

        {/* Card 2: Platform Users */}
        <Link href="/super-admin/users" className="block group">
          <CRMMetricCard
            title="Platform Users"
            value={aal2Required ? "—" : metrics.totalUsers.toString()}
            change={aal2Required ? "AAL2 Required" : `${metrics.activeUsers} Active`}
            trend="neutral"
            icon={Users}
            color="indigo"
            loading={loading}
            comparisonText="active accounts"
            className="group-hover:ring-2 ring-indigo-500/20 transition-all"
          />
        </Link>

        {/* Card 3: Total CRM Records */}
        <Link href="/super-admin/analytics" className="block group">
          <CRMMetricCard
            title="CRM Activity"
            value={aal2Required ? "—" : (metrics.totalLeads + metrics.totalDeals + metrics.totalCustomers).toString()}
            change={aal2Required ? "AAL2 Required" : `${metrics.totalLeads} Leads • ${metrics.totalDeals} Deals`}
            trend="up"
            icon={Target}
            color="cyan"
            loading={loading}
            comparisonText="cross-tenant data"
            className="group-hover:ring-2 ring-cyan-500/20 transition-all"
          />
        </Link>

        {/* Card 4: Platform System Health */}
        <Link href="/super-admin/settings" className="block group">
          <CRMMetricCard
            title="System Health"
            value={aal2Required ? "—" : "99.9%"}
            change={aal2Required ? "AAL2 Required" : "All Systems Normal"}
            trend="up"
            icon={TrendingUp}
            color="orange"
            loading={loading}
            comparisonText="uptime guarantee"
            className="group-hover:ring-2 ring-orange-500/20 transition-all"
          />
        </Link>
      </CRMMetricsGrid>

      {/* 4. Main Platform Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Organizations (2 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 rounded-2xl bg-card border border-border shadow-card p-6 space-y-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">
                    Recent Organizations
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    Live
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tenant workspaces registered on the platform and current status
                </p>
              </div>
            </div>

            <Link
              href="/super-admin/organizations"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider transition-colors"
            >
              View All
            </Link>
          </div>

          <div className="overflow-auto rounded-xl border border-border/60">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="sticky top-0 z-20 bg-card border-b border-border/60">
                <tr className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.05em] leading-tight">
                  <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left bg-card whitespace-nowrap">Organization</th>
                  <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left bg-card whitespace-nowrap">Plan</th>
                  <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-right bg-card whitespace-nowrap">Users</th>
                  <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left bg-card whitespace-nowrap">Status</th>
                  <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-right bg-card whitespace-nowrap">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse h-14">
                      <td className="px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-muted" />
                          <div className="space-y-1">
                            <div className="h-3.5 w-24 bg-muted rounded" />
                            <div className="h-2.5 w-16 bg-muted/60 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4"><div className="h-4 w-12 bg-muted rounded-full" /></td>
                      <td className="px-4"><div className="h-3.5 w-10 bg-muted rounded" /></td>
                      <td className="px-4"><div className="h-4 w-14 bg-muted rounded-full" /></td>
                      <td className="px-4 text-right"><div className="h-3.5 w-16 bg-muted rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : data?.recentOrganizations && data.recentOrganizations.length > 0 ? (
                  data.recentOrganizations.map((org) => (
                    <tr
                      key={org.id}
                      className="group h-14 hover:bg-muted/[0.03] transition-colors"
                    >
                      <td className="px-4 font-medium text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs border border-emerald-500/20 shadow-sm shrink-0">
                            {org.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href="/super-admin/organizations"
                              className="font-bold text-xs text-foreground group-hover:text-emerald-600 transition-colors truncate block"
                            >
                              {org.name}
                            </Link>
                            <p className="text-[11px] text-muted-foreground font-mono truncate">
                              /{org.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4">
                        <PlanBadge plan={org.plan} size="sm" />
                      </td>
                      <td className="px-4 text-xs text-muted-foreground font-medium">
                        <span className="text-foreground font-semibold">{org.userCount}</span> users
                      </td>
                      <td className="px-4">
                        <StatusBadge
                          status={org.status === "ACTIVE" ? "Active" : "Suspended"}
                          variant={org.status === "ACTIVE" ? "emerald" : "rose"}
                        />
                      </td>
                      <td className="px-4 text-right text-xs text-muted-foreground font-medium">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : aal2Required ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-10 text-center text-xs text-muted-foreground"
                    >
                      <Lock className="h-8 w-8 mx-auto mb-2 text-amber-500/60" />
                      <p className="font-semibold text-foreground">Platform Access Locked</p>
                      <p className="text-muted-foreground mt-0.5">AAL2 Multi-Factor Authentication is required to view tenant workspaces.</p>
                      <Button
                        size="sm"
                        onClick={triggerMfaModal}
                        className="mt-3 h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Verify MFA</span>
                      </Button>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-10 text-center text-xs text-muted-foreground"
                    >
                      <Building2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      No organizations created yet. Click &quot;Create Organization&quot; to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Right Column: Goal Progress Emerald Card & Activity (1 col) */}
        <div className="space-y-6">
          {/* Goal Progress Style Emerald Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl bg-emerald-600 text-white p-6 shadow-xl relative overflow-hidden space-y-4"
          >
            {/* Background shine */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/15 text-white">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Platform Health</h3>
                  <p className="text-[11px] text-emerald-100">Live multi-tenant status</p>
                </div>
              </div>
              <ShieldCheck className="h-5 w-5 text-emerald-200" />
            </div>

            <div className="pt-2 grid grid-cols-2 gap-4 border-t border-white/15">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                  Active Tenants
                </p>
                <p className="text-2xl font-black text-white mt-0.5">
                  {aal2Required ? "—" : metrics.activeOrganizations}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                  Platform Users
                </p>
                <p className="text-2xl font-black text-white mt-0.5">
                  {aal2Required ? "—" : metrics.activeUsers}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-semibold text-emerald-100">
                <span>Tenant Activity Target</span>
                <span>{aal2Required ? "AAL2 Locked" : "100%"}</span>
              </div>
              <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: aal2Required ? "0%" : "100%" }}
                />
              </div>
            </div>
          </motion.div>

          {/* Platform Activity Feed */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-card border border-border shadow-card p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                <span>Platform Activity</span>
              </h3>
              <Link
                href="/super-admin/audit-logs"
                className="text-xs font-bold text-emerald-600 hover:underline"
              >
                All Logs
              </Link>
            </div>

            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-1.5 animate-pulse pb-2 border-b border-border/40 last:border-0">
                    <div className="h-3 w-28 bg-muted rounded" />
                    <div className="h-2.5 w-20 bg-muted/60 rounded" />
                  </div>
                ))
              ) : aal2Required ? (
                <div className="text-center py-6 text-xs text-muted-foreground space-y-1">
                  <Lock className="w-5 h-5 mx-auto text-amber-500/60 mb-1" />
                  <p className="font-semibold text-foreground">Activity Locked</p>
                  <p className="text-[11px]">Verify AAL2 MFA to view audit logs</p>
                </div>
              ) : data?.recentAuditLogs && data.recentAuditLogs.length > 0 ? (
                data.recentAuditLogs.slice(0, 4).map((log) => (
                  <div
                    key={log.id}
                    className="text-xs space-y-0.5 border-b border-border/40 pb-2.5 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        {log.action.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(log.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-[11px]">
                      by <span className="text-foreground font-semibold">{log.actor}</span> ({log.module})
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No recent audit activities.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </CRMPageContainer>
  );
}
