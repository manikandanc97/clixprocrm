"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Radio,
  RefreshCw,
  Search,
  Eye,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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
import { Input } from "@/shared/ui/input";
import { toast } from "sonner";
import {
  CRMPageContainer,
  CRMPageHeader,
  EmptyState,
} from "@/shared/components/crm";
import { AppIcon } from "@/shared/components/icons/icon-registry";

export default function SecurityCenterPage() {
  const [status, setStatus] = useState<SecurityCenterStatus | null>(null);
  const [incidents, setIncidents] = useState<SecurityIncidentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
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

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (severityFilter !== "ALL" && inc.severity !== severityFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        inc.title.toLowerCase().includes(q) ||
        inc.incidentNumber.toLowerCase().includes(q) ||
        inc.description.toLowerCase().includes(q) ||
        (inc.tenantId && inc.tenantId.toLowerCase().includes(q))
      );
    });
  }, [incidents, severityFilter, search]);

  const hasActiveFilters = severityFilter !== "ALL" || search.trim().length > 0;

  const handleClearFilters = () => {
    setSeverityFilter("ALL");
    setSearch("");
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filteredIncidents.length / rowsPerPage));
  const paginatedIncidents = filteredIncidents.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <CRMPageContainer>
      {/* 1. Header Layout */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div
            data-animate-target="true"
            className="group h-10 w-10 rounded-xl bg-card border border-border/80 flex items-center justify-center text-muted-foreground shadow-xs shrink-0 hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer select-none"
          >
            <AppIcon
              name="security"
              icon={ShieldAlert}
              size={18}
              className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors"
            />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              Security Incident & Emergency Center
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Active incident triage, emergency session revocation, tenant lockdown kill-switches, and WORM integrity status.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setEmergencyAction("LOCK_USER")}
            className="group bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-3.5 rounded-lg shadow-xs gap-1.5 cursor-pointer transition-colors"
          >
            <AppIcon name="lock" icon={Lock} size={14} className="w-3.5 h-3.5 text-white shrink-0" />
            <span>Emergency Controls</span>
          </Button>
        </div>
      </div>

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

      {/* 2. Main Card Container matching Organizations Page */}
      <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Top Controls Toolbar */}
        <div className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border/50 shrink-0">
          {/* Left: Filter Selects & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 group">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                <AppIcon name="search" icon={Search} size={14} className="w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Filter incidents by title, ID..."
                className="h-9 pl-8 pr-8 rounded-lg bg-background border-border/70 text-xs shadow-xs focus-visible:ring-2 focus-visible:ring-primary/20"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground self-end lg:self-auto flex-wrap">
            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-background hover:bg-muted/60 text-muted-foreground hover:text-foreground text-xs font-semibold transition-all shadow-xs cursor-pointer animate-in fade-in zoom-in-95 duration-150"
              >
                <AppIcon name="reset" icon={RefreshCw} size={14} className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-auto flex-1 min-h-0 relative flex flex-col">
          <table className="w-full text-left text-xs border-collapse min-w-[950px] table-fixed">
            <colgroup>
              <col style={{ width: "160px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "300px" }} />
              <col style={{ width: "160px" }} />
              <col style={{ width: "90px" }} />
            </colgroup>
            <thead className="sticky top-0 z-20 bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-500/20 shadow-xs backdrop-blur-xs">
              <tr className="text-xs font-bold text-foreground">
                <th className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40">
                  <span>Incident #</span>
                </th>
                <th className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40">
                  <span>Severity</span>
                </th>
                <th className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40">
                  <span>Status</span>
                </th>
                <th className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40">
                  <span>Title</span>
                </th>
                <th className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40">
                  <span>Detected</span>
                </th>
                <th className="w-24 px-4 py-3.5 text-right bg-emerald-50/80 dark:bg-emerald-950/40">
                  <span>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-xs">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse h-16">
                    <td className="px-4 py-4"><div className="h-4 w-24 bg-muted rounded font-mono" /></td>
                    <td className="px-4 py-4"><div className="h-5 w-16 bg-muted rounded-md" /></td>
                    <td className="px-4 py-4"><div className="h-5 w-16 bg-muted rounded-md" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-48 bg-muted rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                    <td className="px-4 py-4 text-right"><div className="h-8 w-16 bg-muted rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedIncidents.length > 0 ? (
                paginatedIncidents.map((inc) => (
                  <tr key={inc.id} className="group h-16 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-foreground">{inc.incidentNumber}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-md text-[10.5px] font-bold tracking-wider uppercase border shadow-xs",
                          inc.severity === "CRITICAL"
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                            : inc.severity === "HIGH"
                            ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
                            : inc.severity === "MEDIUM"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                        )}
                      >
                        {inc.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-md text-[10.5px] font-bold tracking-wider uppercase border shadow-xs",
                          inc.status === "RESOLVED"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : inc.status === "OPEN"
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                            : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                        )}
                      >
                        {inc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-foreground truncate">{inc.title}</td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground">{new Date(inc.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(inc.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}</p>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedIncident(inc)}
                        className="gap-1.5 text-xs h-8 px-2.5 rounded-lg font-semibold text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                      >
                        <AppIcon name="eye" icon={Eye} size={14} className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Inspect</span>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground align-middle border-0">
                    <div className="flex flex-col items-center justify-center py-6">
                      <EmptyState
                        icon={ShieldCheck}
                        title="No matching security incidents found"
                        description="All systems healthy and operating normally."
                        className="border-none bg-transparent shadow-none p-0 min-h-0"
                      />
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination */}
        <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/50 text-xs font-medium text-muted-foreground bg-card shrink-0 mt-auto">
          <div>
            Showing{" "}
            <span className="font-semibold text-foreground">
              {filteredIncidents.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
            </span>
            -
            <span className="font-semibold text-foreground">
              {Math.min(currentPage * rowsPerPage, filteredIncidents.length)}
            </span>{" "}
            of <span className="font-semibold text-foreground">{filteredIncidents.length}</span> Incidents
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2.5 rounded-lg border border-border/60 bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span>
                Page <strong className="text-foreground">{currentPage}</strong> of{" "}
                <strong className="text-foreground">{totalPages}</strong>
              </span>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(1)}
                  className="group h-8 w-8 rounded-lg border-border/60 cursor-pointer disabled:opacity-40"
                  title="First page"
                  aria-label="First page"
                >
                  <AppIcon name="chevronsLeft" icon={ChevronsLeft} size={14} className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="group h-8 w-8 rounded-lg border-border/60 cursor-pointer disabled:opacity-40"
                  title="Previous page"
                  aria-label="Previous page"
                >
                  <AppIcon name="chevronLeft" icon={ChevronLeft} size={14} className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="group h-8 w-8 rounded-lg border-border/60 cursor-pointer disabled:opacity-40"
                  title="Next page"
                  aria-label="Next page"
                >
                  <AppIcon name="chevronRight" icon={ChevronRight} size={14} className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="group h-8 w-8 rounded-lg border-border/60 cursor-pointer disabled:opacity-40"
                  title="Last page"
                  aria-label="Last page"
                >
                  <AppIcon name="chevronsRight" icon={ChevronsRight} size={14} className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
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
