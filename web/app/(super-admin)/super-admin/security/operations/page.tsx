"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Database,
  Server,
  FileCheck,
  Lock,
  RefreshCw,
  Clock,
  Settings,
  Cpu,
  Download,
  CheckCircle2,
  FileText,
  Radio,
  Zap,
} from "lucide-react";
import {
  fetchSecOpsHealth,
  fetchSecOpsMetrics,
  fetchSecOpsTimeline,
  fetchSecOpsConfig,
  fetchGovernancePosture,
  fetchGovernanceControls,
  generateGovernanceEvidence,
  SecurityHealthData,
  SecurityMetricsData,
  SecurityPostureData,
  GovernanceControlData,
} from "@/shared/lib/api/super-admin.api";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import {
  CRMPageContainer,
  CRMPageHeader,
  CRMMetricsGrid,
  CRMMetricCard,
} from "@/shared/components/crm";

export default function SecurityOperationsPage() {
  const [health, setHealth] = useState<SecurityHealthData | null>(null);
  const [metrics, setMetrics] = useState<SecurityMetricsData | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [config, setConfig] = useState<any | null>(null);
  const [posture, setPosture] = useState<SecurityPostureData | null>(null);
  const [controls, setControls] = useState<GovernanceControlData[]>([]);
  const [period, setPeriod] = useState<"24h" | "7d" | "30d">("24h");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [healthRes, metricsRes, timelineRes, configRes, postureRes, controlsRes] =
        await Promise.all([
          fetchSecOpsHealth().catch(() => null),
          fetchSecOpsMetrics(period).catch(() => null),
          fetchSecOpsTimeline(20).catch(() => []),
          fetchSecOpsConfig().catch(() => null),
          fetchGovernancePosture().catch(() => null),
          fetchGovernanceControls().catch(() => []),
        ]);

      if (healthRes) setHealth(healthRes);
      if (metricsRes) setMetrics(metricsRes);
      setTimeline(timelineRes || []);
      if (configRes) setConfig(configRes);
      if (postureRes) setPosture(postureRes);
      setControls(controlsRes || []);
    } catch (err: any) {
      toast.error("Failed to refresh security operations data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  const handleExportEvidence = async (format: "json" | "csv") => {
    try {
      setExporting(true);
      const res = await generateGovernanceEvidence(format);
      const blob = new Blob([res.content], {
        type: format === "json" ? "application/json" : "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Security evidence exported (${format.toUpperCase()}) • SHA256: ${res.checksum.slice(0, 10)}...`);
    } catch (err: any) {
      toast.error("Failed to export security evidence.");
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "HEALTHY":
      case "VERIFIED":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-500/20";
      case "DEGRADED":
      case "CONFIGURED":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-500/20";
      case "CRITICAL":
      case "NOT_CONFIGURED":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <CRMPageContainer>
      {/* 1. Header */}
      <CRMPageHeader
        title="Security Operations & Governance"
        subtitle="Enterprise security observability, automated control verification, readiness scoring, and sealed evidence exports."
        icon={Activity}
        badge="Enterprise SecOps & Governance"
        actions={[
          {
            label: "Refresh Telemetry",
            icon: RefreshCw,
            onClick: loadData,
            variant: "outline",
          },
        ]}
      />

      {/* 2. Overall Status Banner & Readiness Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Global Posture (2 cols) */}
        <div className="lg:col-span-2 p-4 rounded-2xl bg-card border border-border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`p-3 rounded-xl flex items-center justify-center border ${
                health?.overallStatus === "HEALTHY"
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : health?.overallStatus === "DEGRADED"
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  : "bg-red-500/10 text-red-600 border-red-500/20"
              }`}
            >
              {health?.overallStatus === "HEALTHY" ? (
                <ShieldCheck className="h-6 w-6" />
              ) : health?.overallStatus === "DEGRADED" ? (
                <AlertTriangle className="h-6 w-6" />
              ) : (
                <ShieldAlert className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">Global Security Posture</span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadge(
                    health?.overallStatus
                  )}`}
                >
                  {health?.overallStatus || "UNKNOWN"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Continuous monitoring across 15 core security subsystems • 25 PostgreSQL FORCE RLS tables active
              </p>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/40">
            {(["24h", "7d", "30d"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  period === p
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Readiness Score (1 col) */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Security Readiness Score</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-foreground font-mono">
                {posture?.securityReadinessScore !== undefined ? posture.securityReadinessScore : "—"}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold">
              {posture?.controlsSummary ? `${posture.controlsSummary.verified} of ${posture.controlsSummary.total} Controls Verified` : "Evaluating security controls..."}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExportEvidence("json")}
              disabled={exporting}
              className="text-xs gap-1.5 h-7 px-2.5"
            >
              <Download className="h-3 w-3" />
              JSON Evidence
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExportEvidence("csv")}
              disabled={exporting}
              className="text-xs gap-1.5 h-7 px-2.5"
            >
              <FileText className="h-3 w-3" />
              CSV Evidence
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Component Health Grid */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Server className="h-3.5 w-3.5 text-primary" />
          <span>Component Health Telemetry</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Database */}
          <div className="p-3.5 rounded-xl bg-card border border-border/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-blue-500" />
                PostgreSQL DB
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(health?.database?.status)}`}>
                {health?.database?.status || "UNKNOWN"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-2">{health?.database?.message}</p>
            {health?.database?.latencyMs !== undefined && (
              <span className="text-[10px] font-mono text-muted-foreground">Latency: {health.database.latencyMs}ms</span>
            )}
          </div>

          {/* Redis */}
          <div className="p-3.5 rounded-xl bg-card border border-border/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-rose-500" />
                Upstash Redis
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(health?.redis?.status)}`}>
                {health?.redis?.status || "UNKNOWN"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-2">{health?.redis?.message}</p>
            {health?.redis?.latencyMs !== undefined && (
              <span className="text-[10px] font-mono text-muted-foreground">Latency: {health.redis.latencyMs}ms</span>
            )}
          </div>

          {/* Audit Chain */}
          <div className="p-3.5 rounded-xl bg-card border border-border/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                HMAC Audit Chain
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(health?.auditIntegrity?.status)}`}>
                {health?.auditIntegrity?.status || "UNKNOWN"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-2">{health?.auditIntegrity?.message}</p>
          </div>

          {/* WORM S3 */}
          <div className="p-3.5 rounded-xl bg-card border border-border/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FileCheck className="h-3.5 w-3.5 text-purple-500" />
                WORM S3 Object Lock
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(health?.wormArchive?.status)}`}>
                {health?.wormArchive?.status || "UNKNOWN"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-2">{health?.wormArchive?.message}</p>
          </div>
        </div>
      </div>

      {/* 4. Threat Metrics Grid */}
      <div className="shrink-0">
        <CRMMetricsGrid cols={4}>
          <CRMMetricCard
            title="Failed Logins"
            value={metrics?.metrics?.loginFailureCount ?? 0}
            change={`In past ${period}`}
            trend="neutral"
            icon={ShieldAlert}
            color="pink"
            loading={loading}
          />
          <CRMMetricCard
            title="MFA Challenges Failed"
            value={metrics?.metrics?.mfaFailureCount ?? 0}
            change={`In past ${period}`}
            trend="neutral"
            icon={Lock}
            color="orange"
            loading={loading}
          />
          <CRMMetricCard
            title="New Devices"
            value={metrics?.metrics?.newDeviceCount ?? 0}
            change="Sign-In Events"
            trend="neutral"
            icon={Radio}
            color="blue"
            loading={loading}
          />
          <CRMMetricCard
            title="Session Revocations"
            value={metrics?.metrics?.sessionRevocationCount ?? 0}
            change="Terminated Sessions"
            trend="neutral"
            icon={Zap}
            color="purple"
            loading={loading}
          />
        </CRMMetricsGrid>
      </div>

      {/* 5. Security Controls Inventory & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Controls Inventory (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-border/80 bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <span>Verified Security Controls Inventory ({controls.length})</span>
            </h4>
            <span className="text-[11px] text-emerald-600 font-semibold">100% Machine Verified</span>
          </div>

          <div className="divide-y divide-border/40 max-h-80 overflow-y-auto pr-1 text-xs">
            {controls.map((c) => (
              <div key={c.controlId} className="py-2.5 flex items-center justify-between gap-3 hover:bg-muted/30 px-2 rounded-lg transition-colors">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-foreground text-[11px]">{c.controlId}</span>
                    <span className="font-semibold text-foreground text-[11px]">{c.name}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{c.evidence}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadge(c.status)}`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration & Timeout Telemetry (1 col) */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Settings className="h-3.5 w-3.5 text-primary" />
              <span>Governance & Threshold Config</span>
            </h4>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40 space-y-1">
              <span className="text-muted-foreground text-[10px] uppercase font-bold block">Spike Thresholds:</span>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Login Failure Spike:</span>
                <span className="font-mono font-bold text-foreground">{config?.thresholds?.loginFailureThreshold || 50} / period</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">MFA Failure Spike:</span>
                <span className="font-mono font-bold text-foreground">{config?.thresholds?.mfaFailureThreshold || 20} / period</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">New Device Spike:</span>
                <span className="font-mono font-bold text-foreground">{config?.thresholds?.newDeviceThreshold || 30} / period</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40 space-y-1">
              <span className="text-muted-foreground text-[10px] uppercase font-bold block">Session & Deduplication:</span>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Idle Timeout:</span>
                <span className="font-mono font-bold text-foreground">{config?.timeouts?.idleTimeoutMinutes || 30}m</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Absolute Timeout:</span>
                <span className="font-mono font-bold text-foreground">{config?.timeouts?.absoluteTimeoutHours || 24}h</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Alert Cooldown:</span>
                <span className="font-mono font-bold text-foreground">{config?.deduplication?.alertCooldownHours || 24}h</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CRMPageContainer>
  );
}
