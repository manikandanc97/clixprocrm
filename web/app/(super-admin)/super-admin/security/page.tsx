"use client";

import { useEffect, useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Shield,
  AlertTriangle,
  Lock,
  Unlock,
  Radio,
  RefreshCw,
  Search,
  Filter,
  Eye,
  CheckCircle,
  X,
  UserX,
  Building,
  KeyRound,
  FileCheck,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import {
  fetchSecurityCenterStatus,
  fetchSecurityIncidents,
  createSecurityIncident,
  resolveSecurityIncident,
  emergencyLockUser,
  emergencyUnlockUser,
  emergencyLockTenant,
  emergencyUnlockTenant,
  generateBreakGlassCode,
  enablePlatformEmergency,
  disablePlatformEmergency,
  SecurityCenterStatus,
  SecurityIncidentItem,
} from "@/shared/lib/api/super-admin.api";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import {
  CRMPageContainer,
  CRMPageHeader,
  CRMMetricsGrid,
  CRMMetricCard,
  CRMToolbar,
  CRMPagination,
} from "@/shared/components/crm";

export default function SecurityCenterPage() {
  const [status, setStatus] = useState<SecurityCenterStatus | null>(null);
  const [incidents, setIncidents] = useState<SecurityIncidentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncidentItem | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolving, setResolving] = useState(false);

  // Emergency Modal State
  const [emergencyAction, setEmergencyAction] = useState<
    "LOCK_USER" | "LOCK_TENANT" | "PLATFORM_EMERGENCY" | null
  >(null);
  const [targetId, setTargetId] = useState("");
  const [reason, setReason] = useState("");
  const [confirmationInput, setConfirmationInput] = useState("");
  const [breakGlassCode, setBreakGlassCode] = useState("");
  const [executingEmergency, setExecutingEmergency] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statusRes, incidentsRes] = await Promise.all([
        fetchSecurityCenterStatus().catch(() => null),
        fetchSecurityIncidents({ limit: 50 }).catch(() => ({ incidents: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } })),
      ]);
      if (statusRes) setStatus(statusRes);
      setIncidents(incidentsRes.incidents || []);
    } catch (err: any) {
      toast.error("Failed to load security center data.");
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

  const handleResolveIncident = async () => {
    if (!selectedIncident || !resolutionNotes.trim()) {
      toast.error("Resolution notes are required.");
      return;
    }
    try {
      setResolving(true);
      await resolveSecurityIncident(selectedIncident.id, resolutionNotes);
      toast.success(`Incident ${selectedIncident.incidentNumber} marked RESOLVED.`);
      setSelectedIncident(null);
      setResolutionNotes("");
      loadData();
    } catch (err: any) {
      toast.error("Failed to resolve incident.");
    } finally {
      setResolving(false);
    }
  };

  const handleExecuteEmergency = async () => {
    if (!reason || reason.trim().length < 10) {
      toast.error("Detailed reason (min 10 chars) is required.");
      return;
    }

    try {
      setExecutingEmergency(true);
      if (emergencyAction === "LOCK_USER") {
        if (confirmationInput !== "LOCK USER") {
          toast.error('Type "LOCK USER" to confirm.');
          return;
        }
        await emergencyLockUser(targetId, reason, confirmationInput);
        toast.success(`User ${targetId} locked and sessions terminated.`);
      } else if (emergencyAction === "LOCK_TENANT") {
        if (confirmationInput !== "LOCK TENANT") {
          toast.error('Type "LOCK TENANT" to confirm.');
          return;
        }
        await emergencyLockTenant(targetId, reason, confirmationInput);
        toast.success(`Tenant ${targetId} locked and operations halted.`);
      } else if (emergencyAction === "PLATFORM_EMERGENCY") {
        if (confirmationInput !== "ENABLE EMERGENCY MODE") {
          toast.error('Type "ENABLE EMERGENCY MODE" to confirm.');
          return;
        }
        await enablePlatformEmergency(reason, confirmationInput, breakGlassCode);
        toast.success("PLATFORM EMERGENCY LOCKDOWN ENABLED.");
      }

      setEmergencyAction(null);
      setTargetId("");
      setReason("");
      setConfirmationInput("");
      setBreakGlassCode("");
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Emergency action failed.");
    } finally {
      setExecutingEmergency(false);
    }
  };

  const handleGenerateBreakGlass = async () => {
    try {
      const code = await generateBreakGlassCode();
      setBreakGlassCode(code);
      toast.success("Break-glass confirmation code generated.");
    } catch (err: any) {
      toast.error("Failed to generate break-glass code.");
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (severityFilter && inc.severity !== severityFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      inc.title.toLowerCase().includes(q) ||
      inc.incidentNumber.toLowerCase().includes(q) ||
      inc.description.toLowerCase().includes(q) ||
      (inc.tenantId && inc.tenantId.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredIncidents.length / rowsPerPage));
  const paginatedIncidents = filteredIncidents.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <CRMPageContainer twoStageScroll>
      {/* 1. Page Header */}
      <CRMPageHeader
        title="Security Incident & Emergency Center"
        subtitle="Active incident triage, emergency session revocation, tenant lockdown kill-switches, and WORM integrity status."
        icon={ShieldAlert}
        badge="Enterprise SecOps"
        actions={[
          {
            label: "Emergency Controls",
            icon: Lock,
            onClick: () => setEmergencyAction("LOCK_USER"),
            variant: "default",
          },
          {
            label: "Refresh Status",
            icon: RefreshCw,
            onClick: loadData,
            variant: "outline",
          },
        ]}
      />

      {/* Global Emergency Alert Banner */}
      {status?.emergencyMode && (
        <div className="p-4 rounded-2xl bg-red-500/10 border-2 border-red-500/30 text-red-700 dark:text-red-300 flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <Radio className="h-6 w-6 text-red-600 animate-spin" />
            <div>
              <h4 className="font-bold text-sm">GLOBAL PLATFORM EMERGENCY MODE ACTIVE</h4>
              <p className="text-xs mt-0.5">{status.emergencyReason || "Platform lockdown in effect. Normal CRM requests blocked."}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="bg-background text-foreground text-xs"
            onClick={async () => {
              await disablePlatformEmergency("Emergency lifted by Super Admin");
              toast.success("Platform emergency mode disabled.");
              loadData();
            }}
          >
            Disable Emergency Mode
          </Button>
        </div>
      )}

      {/* 2. Security KPI Metrics */}
      <div className="shrink-0">
        <CRMMetricsGrid cols={4}>
          <CRMMetricCard
            title="Open Incidents"
            value={status?.openIncidents ?? 0}
            change="Active Triage"
            trend="neutral"
            icon={ShieldAlert}
            color="orange"
            loading={loading}
          />
          <CRMMetricCard
            title="Critical Incidents"
            value={status?.criticalIncidents ?? 0}
            change="Requires Immediate Action"
            trend="down"
            icon={AlertTriangle}
            color="pink"
            loading={loading}
          />
          <CRMMetricCard
            title="Locked Accounts"
            value={`${status?.lockedUsers ?? 0} Users / ${status?.lockedTenants ?? 0} Tenants`}
            change="Access Terminated"
            trend="neutral"
            icon={Lock}
            color="purple"
            loading={loading}
          />
          <CRMMetricCard
            title="WORM Archive Coverage"
            value={`${status?.archiveCoveragePercent ?? 100}%`}
            change={`${status?.checkedRecords ?? 0} Verified Immutable`}
            trend="up"
            icon={FileCheck}
            color="emerald"
            loading={loading}
          />
        </CRMMetricsGrid>
      </div>

      {/* 3. Two-Stage Scroll Workspace */}
      <div className="crm-table-workspace-sticky">
        <CRMToolbar
          searchQuery={search}
          setSearchQuery={setSearch}
          placeholder="Filter incidents by title, ID, or IP address..."
          sticky={false}
        >
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="h-9 px-3 rounded-xl bg-card border border-border text-xs font-semibold text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </CRMToolbar>

        {/* 4. Incidents Table */}
        <div className={cn("crm-table-wrap", filteredIncidents.length <= rowsPerPage && "crm-table-no-pagination")}>
          <div className="overflow-auto flex-1 min-h-0">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-20 bg-card border-b border-border/60 text-[12px] font-semibold uppercase tracking-[0.05em] leading-tight text-muted-foreground">
                <tr>
                  <th className="h-10 sm:h-11 py-2.5 px-4 sm:px-6 text-left bg-card whitespace-nowrap">Incident #</th>
                  <th className="h-10 sm:h-11 py-2.5 px-4 sm:px-6 text-left bg-card whitespace-nowrap">Severity</th>
                  <th className="h-10 sm:h-11 py-2.5 px-4 sm:px-6 text-left bg-card whitespace-nowrap">Status</th>
                  <th className="h-10 sm:h-11 py-2.5 px-4 sm:px-6 text-left bg-card">Title</th>
                  <th className="h-10 sm:h-11 py-2.5 px-4 sm:px-6 text-left bg-card whitespace-nowrap">Detected</th>
                  <th className="h-10 sm:h-11 py-2.5 px-4 sm:px-6 text-right bg-card whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {paginatedIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      <ShieldCheck className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                      <p className="font-semibold text-foreground">No matching security incidents found</p>
                      <p className="text-xs text-muted-foreground">All systems healthy and operating normally.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedIncidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-foreground">{inc.incidentNumber}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            inc.severity === "CRITICAL"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              : inc.severity === "HIGH"
                              ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300"
                              : inc.severity === "MEDIUM"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                          }`}
                        >
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            inc.status === "RESOLVED"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : inc.status === "OPEN"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                          }`}
                        >
                          {inc.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground max-w-xs truncate">{inc.title}</td>
                      <td className="py-3 px-4 text-muted-foreground">{new Date(inc.createdAt).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedIncident(inc)}
                          className="gap-1.5 text-xs h-7"
                        >
                          <Eye className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Inspect</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {filteredIncidents.length > rowsPerPage && (
          <CRMPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredIncidents.length}
            rowsPerPage={rowsPerPage}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={setRowsPerPage}
          />
        )}
      </div>

      {/* Incident Details & Resolution Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                <span>Incident {selectedIncident.incidentNumber}</span>
              </h3>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/40 space-y-2">
                <div>
                  <span className="text-muted-foreground font-semibold">Title:</span>
                  <p className="font-bold text-foreground mt-0.5">{selectedIncident.title}</p>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold">Description:</span>
                  <p className="text-muted-foreground mt-0.5">{selectedIncident.description}</p>
                </div>
              </div>

              {selectedIncident.status !== "RESOLVED" && (
                <div className="space-y-2 pt-2">
                  <label className="text-muted-foreground font-bold uppercase tracking-wider text-[10px] block">
                    Resolution Notes (Required):
                  </label>
                  <textarea
                    rows={3}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Describe how the incident was investigated, contained, and resolved..."
                    className="w-full p-2.5 rounded-xl bg-background border border-border text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                  <Button
                    size="sm"
                    onClick={handleResolveIncident}
                    disabled={resolving}
                    className="w-full gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>{resolving ? "Resolving..." : "Mark Incident Resolved"}</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Emergency Action Modal with Explicit Confirmation */}
      {emergencyAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-rose-500/40 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-bold text-rose-600 flex items-center gap-2">
                <Lock className="h-5 w-5" />
                <span>Emergency Security Kill-Switch</span>
              </h3>
              <button
                onClick={() => setEmergencyAction(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={emergencyAction === "LOCK_USER" ? "destructive" : "outline"}
                  onClick={() => setEmergencyAction("LOCK_USER")}
                  className="text-xs flex-1"
                >
                  Lock User
                </Button>
                <Button
                  size="sm"
                  variant={emergencyAction === "LOCK_TENANT" ? "destructive" : "outline"}
                  onClick={() => setEmergencyAction("LOCK_TENANT")}
                  className="text-xs flex-1"
                >
                  Lock Tenant
                </Button>
                <Button
                  size="sm"
                  variant={emergencyAction === "PLATFORM_EMERGENCY" ? "destructive" : "outline"}
                  onClick={() => setEmergencyAction("PLATFORM_EMERGENCY")}
                  className="text-xs flex-1"
                >
                  Platform Lockdown
                </Button>
              </div>

              {emergencyAction !== "PLATFORM_EMERGENCY" && (
                <div>
                  <label className="text-muted-foreground font-semibold block mb-1">
                    {emergencyAction === "LOCK_USER" ? "User ID / UUID:" : "Tenant ID / UUID:"}
                  </label>
                  <input
                    type="text"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    placeholder="Enter target UUID..."
                    className="w-full p-2.5 rounded-xl bg-background border border-border text-xs focus:ring-1 focus:ring-rose-500 outline-none font-mono"
                  />
                </div>
              )}

              {emergencyAction === "PLATFORM_EMERGENCY" && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 space-y-2">
                  <p className="font-semibold text-red-600">Break-Glass Server Verification:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={breakGlassCode || "Click to generate single-use code"}
                      className="w-full p-2 rounded-lg bg-background border border-border text-xs font-mono font-bold"
                    />
                    <Button size="sm" variant="outline" onClick={handleGenerateBreakGlass}>
                      Generate
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <label className="text-muted-foreground font-semibold block mb-1">
                  Reason for Emergency Action (min 10 characters):
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Detailed justification for incident audit record..."
                  className="w-full p-2.5 rounded-xl bg-background border border-border text-xs focus:ring-1 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
                <p className="font-bold text-[11px] mb-1">
                  Type{" "}
                  <span className="font-mono underline">
                    {emergencyAction === "LOCK_USER"
                      ? "LOCK USER"
                      : emergencyAction === "LOCK_TENANT"
                      ? "LOCK TENANT"
                      : "ENABLE EMERGENCY MODE"}
                  </span>{" "}
                  to confirm:
                </p>
                <input
                  type="text"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  placeholder="Type exact confirmation..."
                  className="w-full p-2 rounded-lg bg-background border border-border text-xs font-mono font-bold text-foreground outline-none"
                />
              </div>

              <Button
                size="sm"
                variant="destructive"
                onClick={handleExecuteEmergency}
                disabled={executingEmergency}
                className="w-full gap-2 text-xs font-bold"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>{executingEmergency ? "Executing Emergency Action..." : "Execute Emergency Kill-Switch"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </CRMPageContainer>
  );
}
