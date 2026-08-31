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
          className="rounded-2xl border border-amber-500/30 bg-amber-500/10 shadow-lg"
          style={{ padding: '16px 20px' }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
            {/* Left: Icon + Text */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: '1 1 300px', minWidth: 0 }}>
              <div
                className="shrink-0"
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(245,158,11,0.15)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  color: '#d97706',
                }}
              >
                <ShieldAlert style={{ height: '22px', width: '22px' }} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--foreground)', margin: 0, whiteSpace: 'nowrap' }}>
                    MFA Verification Required (AAL2)
                  </h2>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(245,158,11,0.15)',
                    border: '1px solid rgba(245,158,11,0.3)',
                    color: '#d97706',
                    whiteSpace: 'nowrap',
                  }}>
                    Security Policy
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.5 }}>
                  Super Admin platform data is protected by MFA (AAL2) assurance. Verify your 2FA to unlock live platform telemetry and tenant data.
                </p>
              </div>
            </div>

            {/* Right: CTA Button — always visible */}
            <div style={{ flexShrink: 0 }}>
              <Button
                onClick={triggerMfaModal}
                style={{
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  borderRadius: '12px',
                  padding: '0 20px',
                  height: '40px',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(5,150,105,0.35)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Lock style={{ width: '15px', height: '15px' }} />
                <span>Verify MFA &amp; Unlock</span>
              </Button>
            </div>
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
      <div 
        className="relative overflow-hidden rounded-2xl bg-[#0f172a] p-5 sm:p-6 shadow-xl border border-white/5"
        style={{ minHeight: '148px', color: '#ffffff' }}
      >
        {/* Ambient gradient overlay */}
        <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none" style={{ background: "linear-gradient(to left, color-mix(in srgb, var(--primary) 18%, transparent), transparent)" }} />
        {/* Glow orb */}
        <div className="absolute -top-14 -right-14 w-52 h-52 rounded-full pointer-events-none blur-[72px]" style={{ backgroundColor: "var(--primary)", opacity: 0.2 }} />
        {/* Decorative sparkle */}
        <div className="absolute top-5 right-1/4 opacity-15 animate-pulse pointer-events-none">
          <Sparkles className="w-5 h-5" style={{ color: "#ffffff" }} />
        </div>

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left: Text content */}
          <div style={{ display: 'block', flex: '1 1 0%' }}>
            {/* Badge */}
            <div 
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border mb-3"
              style={{ 
                backgroundColor: "color-mix(in srgb, var(--primary) 15%, transparent)", 
                borderColor: "color-mix(in srgb, var(--primary) 30%, transparent)", 
                color: "var(--primary)" 
              }}
            >
              <Zap className="w-3 h-3" style={{ fill: "var(--primary)" }} />
              Multi-Tenant Core Live
            </div>
            {/* Heading */}
            <div style={{ display: 'block', marginBottom: '6px' }}>
              <h1 style={{ color: '#ffffff', fontSize: '1.375rem', fontWeight: 800, lineHeight: 1.3, margin: 0 }}>
                Welcome back,{" "}
                <span style={{ color: "var(--primary)", fontWeight: 800 }}>
                  {user?.displayName || user?.name || "Platform Admin"}
                </span>
              </h1>
            </div>
            {/* Subtext */}
            <div style={{ display: 'block' }}>
              <p style={{ color: 'rgba(148,163,184,1)', fontSize: '0.8125rem', lineHeight: 1.6, margin: 0, maxWidth: '36rem' }}>
                {aal2Required ? (
                  <span style={{ color: '#fcd34d', fontWeight: 600 }}>
                    AAL2 verification required to load platform metrics and tenant data.
                  </span>
                ) : (
                  <>
                    Your platform is running with{" "}
                    <span style={{ color: "var(--primary)", fontWeight: 600 }}>{metrics.activeOrganizations} active</span>
                    {" "}tenant organizations and{" "}
                    <span style={{ color: "var(--primary)", fontWeight: 600 }}>{metrics.activeUsers}</span>
                    {" "}global users. All services operating smoothly.
                  </>
                )}
              </p>
            </div>
          </div>
          {/* Right: CTA buttons */}
          <div className="flex flex-wrap gap-2.5 shrink-0">
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
              className="rounded-xl px-4 h-9 font-bold transition-all text-xs sm:text-sm"
              style={{ borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.06)", color: "#ffffff" }}
            >
              <Link href="/super-admin/audit-logs">
                <span>Audit Trail</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Filter & Timeframe Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {/* Timeframe selector */}
        <div className="inline-flex items-center bg-muted/60 border border-border/60 rounded-xl p-0.5 shadow-xs">
          {(["Today", "Week", "Month", "Year"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                timeRange === t
                  ? "bg-card text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadData()}
            disabled={loading}
            className="rounded-xl text-xs gap-1.5 h-8 px-3"
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Recent Organizations (2 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 rounded-2xl bg-card border border-border shadow-card p-4 sm:p-5 space-y-3.5"
        >
          <div className="flex items-center justify-between">
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
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Tenant workspaces registered on the platform
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
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead className="sticky top-0 z-20 bg-card border-b border-border/60">
                <tr className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.05em] leading-tight">
                  <th className="h-9 sm:h-10 px-3.5 sm:px-4 py-2 text-left bg-card whitespace-nowrap">Organization</th>
                  <th className="h-9 sm:h-10 px-3.5 sm:px-4 py-2 text-left bg-card whitespace-nowrap">Plan</th>
                  <th className="h-9 sm:h-10 px-3.5 sm:px-4 py-2 text-right bg-card whitespace-nowrap">Users</th>
                  <th className="h-9 sm:h-10 px-3.5 sm:px-4 py-2 text-left bg-card whitespace-nowrap">Status</th>
                  <th className="h-9 sm:h-10 px-3.5 sm:px-4 py-2 text-right bg-card whitespace-nowrap">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse h-12">
                      <td className="px-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-lg bg-muted" />
                          <div className="space-y-1">
                            <div className="h-3 w-20 bg-muted rounded" />
                            <div className="h-2 w-14 bg-muted/60 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="px-3.5"><div className="h-3.5 w-10 bg-muted rounded-full" /></td>
                      <td className="px-3.5"><div className="h-3 w-8 bg-muted rounded" /></td>
                      <td className="px-3.5"><div className="h-3.5 w-12 bg-muted rounded-full" /></td>
                      <td className="px-3.5 text-right"><div className="h-3 w-14 bg-muted rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : data?.recentOrganizations && data.recentOrganizations.length > 0 ? (
                  data.recentOrganizations.slice(0, 5).map((org) => (
                    <tr
                      key={org.id}
                      className="group h-12 hover:bg-muted/[0.03] transition-colors"
                    >
                      <td className="px-3.5 py-2 font-medium text-foreground">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs border border-emerald-500/20 shadow-xs shrink-0">
                            {org.name.charAt(0).toUpperCase()}
                          </div>
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
        <div className="space-y-5">
          {/* Goal Progress Style Emerald Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl bg-emerald-600 text-white p-4 sm:p-5 shadow-xl relative overflow-hidden space-y-3"
          >
            {/* Background shine */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-white/15 text-white">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">Platform Health</h3>
                  <p className="text-[10px] text-emerald-100">Live multi-tenant status</p>
                </div>
              </div>
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-200" />
            </div>

            <div className="pt-1.5 grid grid-cols-2 gap-3 border-t border-white/15">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-200">
                  Active Tenants
                </p>
                <p className="text-xl sm:text-2xl font-black text-white mt-0.5">
                  {aal2Required ? "—" : metrics.activeOrganizations}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-200">
                  Platform Users
                </p>
                <p className="text-xl sm:text-2xl font-black text-white mt-0.5">
                  {aal2Required ? "—" : metrics.activeUsers}
                </p>
              </div>
            </div>

            <div className="space-y-1 pt-0.5">
              <div className="flex justify-between text-[10px] font-semibold text-emerald-100">
                <span>Tenant Activity Target</span>
                <span>{aal2Required ? "AAL2 Locked" : "100%"}</span>
              </div>
              <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
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
            className="rounded-2xl bg-card border border-border shadow-card p-4 sm:p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                <span>Platform Activity</span>
              </h3>
              <Link
                href="/super-admin/audit-logs"
                className="text-[11px] font-bold text-emerald-600 hover:underline"
              >
                All Logs
              </Link>
            </div>

            <div className="space-y-2.5">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-1 animate-pulse pb-2 border-b border-border/40 last:border-0">
                    <div className="h-3 w-28 bg-muted rounded" />
                    <div className="h-2 w-20 bg-muted/60 rounded" />
                  </div>
                ))
              ) : aal2Required ? (
                <div className="text-center py-4 text-xs text-muted-foreground space-y-1">
                  <Lock className="w-4 h-4 mx-auto text-amber-500/60 mb-1" />
                  <p className="font-semibold text-foreground text-xs">Activity Locked</p>
                  <p className="text-[10px]">Verify AAL2 MFA to view audit logs</p>
                </div>
              ) : data?.recentAuditLogs && data.recentAuditLogs.length > 0 ? (
                data.recentAuditLogs.slice(0, 4).map((log) => (
                  <div
                    key={log.id}
                    className="text-xs space-y-0.5 border-b border-border/40 pb-2 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground text-[11.5px]">
                        {log.action.replace(/_/g, " ")}
                      </span>
                      <span className="text-[9.5px] text-muted-foreground">
                        {new Date(log.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-[10.5px]">
                      by <span className="text-foreground font-semibold">{log.actor}</span> ({log.module})
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-3">
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
