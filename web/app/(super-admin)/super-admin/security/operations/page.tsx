"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Activity,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Sparkles,
  Flame,
  Clock,
} from "lucide-react";
import {
  fetchSecOpsSummary,
  fetchPlatformSecurityHealthRows,
  fetchSecurityAlerts,
  triggerSecurityDetection,
  acknowledgeSecurityAlert,
  resolveSecurityAlert,
  escalateAlertToIncident,
  fetchSecurityIncidents,
  acknowledgeSecurityIncident,
  updateSecurityIncidentStatus,
  resolveSecurityIncident,
  emergencyLockUser,
  emergencyUnlockUser,
  emergencyLockTenant,
  emergencyRevokeUser,
  forcePasswordResetUser,
  SecOpsSummaryReport,
  PlatformHealthRow,
  SecurityAlertItem,
  SecurityIncidentItem,
} from "@/shared/lib/api/super-admin.api";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import { CRMPageContainer } from "@/shared/components/crm";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { cn } from "@/shared/lib/utils";

import {
  SecOpsTab,
  EmergencyModalState,
  DEFAULT_HEALTH_ROWS,
} from "./components/types";
import { SecOpsHealthTab } from "./components/SecOpsHealthTab";
import { SecOpsAlertsTab } from "./components/SecOpsAlertsTab";
import { SecOpsIncidentsTab } from "./components/SecOpsIncidentsTab";
import { SecOpsEmergencyTab } from "./components/SecOpsEmergencyTab";
import {
  AlertDetailsModal,
  IncidentWorkflowModal,
  EmergencyControlsModal,
} from "./components/SecOpsModals";

export default function SecurityOperationsPage() {
  const [summary, setSummary] = useState<SecOpsSummaryReport | null>(null);
  const [healthRows, setHealthRows] = useState<PlatformHealthRow[]>(DEFAULT_HEALTH_ROWS);
  const [alerts, setAlerts] = useState<SecurityAlertItem[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncidentItem[]>([]);
  const [, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<SecOpsTab>("health");

  // Filters & Search
  const [alertStatusFilter, setAlertStatusFilter] = useState("ALL");
  const [alertSeverityFilter, setAlertSeverityFilter] = useState("ALL");
  const [alertSearch, setAlertSearch] = useState("");
  const [incidentSearch, setIncidentSearch] = useState("");
  const [incidentStatusFilter, setIncidentStatusFilter] = useState("ALL");

  // Selected Alert / Incident Modal
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlertItem | null>(null);
  const [alertResolveNotes, setAlertResolveNotes] = useState("");
  const [resolvingAlert, setResolvingAlert] = useState(false);

  const [selectedIncident, setSelectedIncident] = useState<SecurityIncidentItem | null>(null);
  const [incidentResolveNotes, setIncidentResolveNotes] = useState("");
  const [updatingIncident, setUpdatingIncident] = useState(false);

  // Emergency Control Modal
  const [emergencyModal, setEmergencyModal] = useState<EmergencyModalState>({
    action: null,
    targetId: "",
    reason: "",
    confirmText: "",
  });
  const [executingEmergency, setExecutingEmergency] = useState(false);

  // Pagination for Alerts
  const [alertPage, setAlertPage] = useState(1);
  const [alertRowsPerPage, setAlertRowsPerPage] = useState(10);

  // Pagination for Incidents
  const [incidentPage, setIncidentPage] = useState(1);
  const [incidentRowsPerPage, setIncidentRowsPerPage] = useState(10);

  const loadData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [summaryRes, healthRes, alertsRes, incidentsRes] = await Promise.all([
        fetchSecOpsSummary().catch(() => null),
        fetchPlatformSecurityHealthRows().catch(() => []),
        fetchSecurityAlerts({ limit: 100 }).catch(() => ({ alerts: [], pagination: { total: 0 } })),
        fetchSecurityIncidents({ limit: 100 }).catch(() => ({ incidents: [], pagination: { total: 0 } })),
      ]);

      if (summaryRes) setSummary(summaryRes);
      if (healthRes && healthRes.length > 0) {
        setHealthRows(healthRes);
      } else if (summaryRes?.servicesHealth && summaryRes.servicesHealth.length > 0) {
        setHealthRows(summaryRes.servicesHealth);
      }
      setAlerts(alertsRes.alerts || []);
      setIncidents(incidentsRes.incidents || []);
    } catch {
      // Keep existing data gracefully
    } finally {
      setLoading(false);
    }
  };

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

    const handleAal2Verified = () => {
      if (isCancelled) return;
      loadData(true);
    };
    window.addEventListener("clixpro:aal2-verified", handleAal2Verified);
    return () => {
      isCancelled = true;
      window.removeEventListener("clixpro:aal2-verified", handleAal2Verified);
    };
  }, []);

  const handleRunDetection = async () => {
    try {
      setDetecting(true);
      const res = await triggerSecurityDetection();
      if (res.alertsCreated > 0) {
        toast.success(`Security scan complete: ${res.alertsCreated} security alert(s) detected.`);
        setActiveTab("alerts");
      } else {
        toast.success("Threat detection scan complete: No anomalous security events detected.");
      }
      loadData(true);
    } catch {
      toast.error("Threat detection scan failed.");
    } finally {
      setDetecting(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await acknowledgeSecurityAlert(alertId);
      toast.success("Security alert acknowledged.");
      loadData(true);
      if (selectedAlert?.id === alertId) setSelectedAlert(null);
    } catch {
      toast.error("Failed to acknowledge security alert.");
    }
  };

  const handleResolveAlert = async () => {
    if (!selectedAlert) return;
    try {
      setResolvingAlert(true);
      await resolveSecurityAlert(selectedAlert.id, alertResolveNotes || "Resolved by Super Admin");
      toast.success("Security alert marked RESOLVED.");
      setSelectedAlert(null);
      setAlertResolveNotes("");
      loadData(true);
    } catch {
      toast.error("Failed to resolve security alert.");
    } finally {
      setResolvingAlert(false);
    }
  };

  const handleEscalateAlert = async (alertId: string) => {
    try {
      const res = await escalateAlertToIncident(alertId);
      toast.success(`Alert escalated to Incident #${res.incident.incidentNumber}.`);
      loadData(true);
      if (selectedAlert?.id === alertId) setSelectedAlert(null);
      setActiveTab("incidents");
    } catch {
      toast.error("Failed to escalate alert to incident.");
    }
  };

  const handleAcknowledgeIncident = async (incidentId: string) => {
    try {
      await acknowledgeSecurityIncident(incidentId);
      toast.success("Security incident acknowledged & investigation initiated.");
      loadData(true);
      if (selectedIncident?.id === incidentId) setSelectedIncident(null);
    } catch {
      toast.error("Failed to acknowledge incident.");
    }
  };

  const handleUpdateIncidentStatus = async (status: string) => {
    if (!selectedIncident) return;
    try {
      setUpdatingIncident(true);
      if (status === "RESOLVED") {
        if (!incidentResolveNotes || incidentResolveNotes.trim().length < 5) {
          toast.error("Resolution notes (min 5 chars) are required to resolve an incident.");
          return;
        }
        await resolveSecurityIncident(selectedIncident.id, incidentResolveNotes);
        toast.success(`Incident #${selectedIncident.incidentNumber} marked RESOLVED.`);
      } else {
        await updateSecurityIncidentStatus(selectedIncident.id, status, incidentResolveNotes || undefined);
        toast.success(`Incident status updated to ${status}.`);
      }
      setSelectedIncident(null);
      setIncidentResolveNotes("");
      loadData(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update incident.";
      toast.error(msg);
    } finally {
      setUpdatingIncident(false);
    }
  };

  const handleExecuteEmergency = async () => {
    const { action, targetId, reason, confirmText } = emergencyModal;
    if (!targetId || !targetId.trim()) {
      toast.error("Target identifier (UUID / Email) is required.");
      return;
    }
    if (!reason || reason.trim().length < 5) {
      toast.error("Detailed justification reason (at least 5 characters) is required.");
      return;
    }

    try {
      setExecutingEmergency(true);
      if (action === "LOCK_USER") {
        if (confirmText !== "LOCK USER") {
          toast.error('Please type "LOCK USER" exactly to confirm.');
          return;
        }
        await emergencyLockUser(targetId.trim(), reason.trim(), confirmText);
        toast.success(`User ${targetId} locked and active sessions terminated.`);
      } else if (action === "UNLOCK_USER") {
        await emergencyUnlockUser(targetId.trim(), reason.trim());
        toast.success(`User ${targetId} account unlocked.`);
      } else if (action === "REVOKE_SESSIONS") {
        await emergencyRevokeUser(targetId.trim(), reason.trim());
        toast.success(`All active sessions for user ${targetId} have been revoked.`);
      } else if (action === "FORCE_RESET") {
        await forcePasswordResetUser(targetId.trim(), reason.trim());
        toast.success(`Password reset forced for user ${targetId}. Existing sessions invalidated.`);
      } else if (action === "LOCK_TENANT") {
        if (confirmText !== "LOCK TENANT") {
          toast.error('Please type "LOCK TENANT" exactly to confirm.');
          return;
        }
        await emergencyLockTenant(targetId.trim(), reason.trim(), confirmText);
        toast.success(`Tenant organization ${targetId} suspended and access revoked.`);
      }

      setEmergencyModal({ action: null, targetId: "", reason: "", confirmText: "" });
      loadData(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Emergency action failed.";
      toast.error(msg);
    } finally {
      setExecutingEmergency(false);
    }
  };

  // Filtered Alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (alertStatusFilter !== "ALL" && a.status !== alertStatusFilter) return false;
      if (alertSeverityFilter !== "ALL" && a.severity !== alertSeverityFilter) return false;
      if (!alertSearch.trim()) return true;
      const q = alertSearch.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.alertType.toLowerCase().includes(q) ||
        (a.userId && a.userId.toLowerCase().includes(q))
      );
    });
  }, [alerts, alertStatusFilter, alertSeverityFilter, alertSearch]);

  const alertTotalPages = Math.max(1, Math.ceil(filteredAlerts.length / alertRowsPerPage));
  const paginatedAlerts = filteredAlerts.slice(
    (alertPage - 1) * alertRowsPerPage,
    alertPage * alertRowsPerPage
  );

  // Filtered Incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (incidentStatusFilter !== "ALL" && inc.status !== incidentStatusFilter) return false;
      if (!incidentSearch.trim()) return true;
      const q = incidentSearch.toLowerCase();
      return (
        inc.title.toLowerCase().includes(q) ||
        inc.incidentNumber.toLowerCase().includes(q) ||
        inc.description.toLowerCase().includes(q) ||
        (inc.tenantId && inc.tenantId.toLowerCase().includes(q))
      );
    });
  }, [incidents, incidentStatusFilter, incidentSearch]);

  const incidentTotalPages = Math.max(1, Math.ceil(filteredIncidents.length / incidentRowsPerPage));
  const paginatedIncidents = filteredIncidents.slice(
    (incidentPage - 1) * incidentRowsPerPage,
    incidentPage * incidentRowsPerPage
  );

  const openAlertsCount = alerts.filter((a) => a.status !== "RESOLVED").length;
  const openIncidentsCount = incidents.filter((i) => i.status !== "RESOLVED").length;

  return (
    <CRMPageContainer twoStageScroll className="space-y-4 sm:space-y-5">
      {/* 1. Header Layout matching ClixProCRM Design Standard */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div
            data-animate-target="true"
            className="group h-10 w-10 rounded-xl bg-card border border-border/80 flex items-center justify-center text-muted-foreground shadow-xs shrink-0 hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer select-none"
          >
            <AppIcon
              name="security"
              icon={Activity}
              size={18}
              className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors"
            />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                Security Operations &amp; Governance
              </h1>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-wide border uppercase",
                  summary?.overallStatus === "DEGRADED"
                    ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-500/20"
                    : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-500/20"
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full animate-pulse",
                    summary?.overallStatus === "DEGRADED" ? "bg-rose-500" : "bg-emerald-500"
                  )}
                />
                {summary?.overallStatusBadge || "System Healthy"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Authoritative platform security telemetry, live subsystem health, and incident response.
            </p>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handleRunDetection}
            disabled={detecting}
            variant="outline"
            className="group font-semibold text-xs h-9 px-3 rounded-lg shadow-xs gap-1.5 cursor-pointer transition-colors"
          >
            <AppIcon
              name="sparkles"
              icon={Sparkles}
              size={14}
              className={cn("w-3.5 h-3.5 text-primary shrink-0", detecting && "animate-spin")}
            />
            <span>{detecting ? "Scanning Telemetry..." : "Run Threat Detection"}</span>
          </Button>

          <Button
            onClick={() =>
              setEmergencyModal({
                action: "FORCE_RESET",
                targetId: "",
                reason: "",
                confirmText: "",
              })
            }
            className="group bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-3.5 rounded-lg shadow-xs gap-1.5 cursor-pointer transition-colors"
          >
            <AppIcon name="lock" icon={Lock} size={14} className="w-3.5 h-3.5 text-white shrink-0" />
            <span>Emergency Action</span>
          </Button>
        </div>
      </div>

      {/* 2. Navigation Segmented Tabs */}
      <div className="flex items-center justify-between border-b border-border/60 pb-1">
        <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/50">
          <button
            type="button"
            onClick={() => setActiveTab("health")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              activeTab === "health"
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Platform Health (6)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("alerts")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              activeTab === "alerts"
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>Threat Alerts</span>
            {openAlertsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-orange-500/15 text-orange-600 font-extrabold text-[10px]">
                {openAlertsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("incidents")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              activeTab === "incidents"
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>Incident Response</span>
            {openIncidentsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500/15 text-rose-600 font-extrabold text-[10px]">
                {openIncidentsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("emergency")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              activeTab === "emergency"
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span>Emergency Controls</span>
          </button>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
          <Clock className="w-3 h-3 text-muted-foreground" />
          Last verified: {summary?.lastCheckedAt ? new Date(summary.lastCheckedAt).toLocaleTimeString() : "Live"}
        </span>
      </div>

      {/* 3. Tab 1: Platform Security Health */}
      {activeTab === "health" && (
        <SecOpsHealthTab healthRows={healthRows} />
      )}

      {/* 4. Tab 2: Security Alerts & Threat Detections */}
      {activeTab === "alerts" && (
        <SecOpsAlertsTab
          filteredAlerts={filteredAlerts}
          paginatedAlerts={paginatedAlerts}
          alertStatusFilter={alertStatusFilter}
          setAlertStatusFilter={setAlertStatusFilter}
          alertSeverityFilter={alertSeverityFilter}
          setAlertSeverityFilter={setAlertSeverityFilter}
          alertSearch={alertSearch}
          setAlertSearch={setAlertSearch}
          alertPage={alertPage}
          setAlertPage={setAlertPage}
          alertRowsPerPage={alertRowsPerPage}
          setAlertRowsPerPage={setAlertRowsPerPage}
          alertTotalPages={alertTotalPages}
          setSelectedAlert={setSelectedAlert}
          handleAcknowledgeAlert={handleAcknowledgeAlert}
          handleEscalateAlert={handleEscalateAlert}
        />
      )}

      {/* 5. Tab 3: Security Incident Response */}
      {activeTab === "incidents" && (
        <SecOpsIncidentsTab
          filteredIncidents={filteredIncidents}
          paginatedIncidents={paginatedIncidents}
          incidentStatusFilter={incidentStatusFilter}
          setIncidentStatusFilter={setIncidentStatusFilter}
          incidentSearch={incidentSearch}
          setIncidentSearch={setIncidentSearch}
          incidentPage={incidentPage}
          setIncidentPage={setIncidentPage}
          incidentRowsPerPage={incidentRowsPerPage}
          setIncidentRowsPerPage={setIncidentRowsPerPage}
          incidentTotalPages={incidentTotalPages}
          setSelectedIncident={setSelectedIncident}
          handleAcknowledgeIncident={handleAcknowledgeIncident}
        />
      )}

      {/* 6. Tab 4: Emergency Security Controls Panel */}
      {activeTab === "emergency" && (
        <SecOpsEmergencyTab setEmergencyModal={setEmergencyModal} />
      )}

      {/* 7. Alert Details Modal */}
      {selectedAlert && (
        <AlertDetailsModal
          selectedAlert={selectedAlert}
          setSelectedAlert={setSelectedAlert}
          alertResolveNotes={alertResolveNotes}
          setAlertResolveNotes={setAlertResolveNotes}
          resolvingAlert={resolvingAlert}
          handleAcknowledgeAlert={handleAcknowledgeAlert}
          handleEscalateAlert={handleEscalateAlert}
          handleResolveAlert={handleResolveAlert}
        />
      )}

      {/* 8. Incident Workflow Modal */}
      {selectedIncident && (
        <IncidentWorkflowModal
          selectedIncident={selectedIncident}
          setSelectedIncident={setSelectedIncident}
          incidentResolveNotes={incidentResolveNotes}
          setIncidentResolveNotes={setIncidentResolveNotes}
          updatingIncident={updatingIncident}
          handleUpdateIncidentStatus={handleUpdateIncidentStatus}
        />
      )}

      {/* 9. Emergency Controls Modal */}
      <EmergencyControlsModal
        emergencyModal={emergencyModal}
        setEmergencyModal={setEmergencyModal}
        executingEmergency={executingEmergency}
        handleExecuteEmergency={handleExecuteEmergency}
      />
    </CRMPageContainer>
  );
}
