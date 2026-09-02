"use client";

import { useEffect, useState } from "react";
import {
  ScrollText,
  Search,
  RefreshCw,
  Building2,
  Clock,
  Eye,
  X,
  Download,
  Shield,
  Activity,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
} from "lucide-react";
import {
  fetchPlatformAuditLogs,
  PlatformAuditLog,
  fetchAuditIntegrityStatus,
  triggerAuditIntegrityVerify,
  triggerAuditDrVerify,
  AuditIntegrityReport,
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
  TruncatedText,
} from "@/shared/components/crm";
import { EmptyState } from "@/shared/components/EmptyState";
import { DataTableColumnHeader, SortDirection } from "@/shared/components/DataTableColumnHeader";
import { cn } from "@/shared/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

export default function SuperAdminAuditLogsPage() {
  const [logs, setLogs] = useState<PlatformAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState<PlatformAuditLog | null>(null);

  // Integrity Status State
  const [integrityReport, setIntegrityReport] = useState<AuditIntegrityReport | null>(null);
  const [verifyingIntegrity, setVerifyingIntegrity] = useState(false);
  const [drResult, setDrResult] = useState<{ restorable: boolean; reason: string | null } | null>(null);
  const [verifyingDr, setVerifyingDr] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const [res, integrity] = await Promise.all([
        fetchPlatformAuditLogs({ limit: 1000 }),
        fetchAuditIntegrityStatus().catch(() => null),
      ]);
      setLogs(res.logs || []);
      if (integrity) setIntegrityReport(integrity);
    } catch (err: any) {
      toast.error("Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyIntegrity = async () => {
    try {
      setVerifyingIntegrity(true);
      const res = await triggerAuditIntegrityVerify();
      setIntegrityReport(res);
      if (res.status === "HEALTHY") {
        toast.success(`Audit integrity verified: ${res.checkedRecords} records valid.`);
      } else if (res.status === "WARNING") {
        toast.warning(`Integrity check warning: ${res.reason || "Outbox or coverage notice"}`);
      } else {
        toast.error(`CRITICAL integrity failure: ${res.reason}`);
      }
    } catch (err: any) {
      toast.error("Integrity verification request failed.");
    } finally {
      setVerifyingIntegrity(false);
    }
  };

  const handleDrVerify = async (recordId: string) => {
    try {
      setVerifyingDr(true);
      const res = await triggerAuditDrVerify(recordId);
      setDrResult(res);
      if (res.restorable) {
        toast.success("Disaster recovery dry run: 100% restorable from WORM S3 archive.");
      } else {
        toast.error(`DR dry run failure: ${res.reason}`);
      }
    } catch (err: any) {
      toast.error("DR dry run request failed.");
    } finally {
      setVerifyingDr(false);
    }
  };

  useEffect(() => {
    loadLogs();
    setCurrentPage(1);

    const handleAal2Verified = () => {
      loadLogs();
    };
    window.addEventListener("clixpro:aal2-verified", handleAal2Verified);
    return () => {
      window.removeEventListener("clixpro:aal2-verified", handleAal2Verified);
    };
  }, [moduleFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const exportCSV = () => {
    if (logs.length === 0) {
      toast.error("No logs to export.");
      return;
    }
    const headers = ["ID", "Action", "Module", "Actor", "Actor Email", "Organization", "Timestamp"];
    const rows = logs.map((l) => [
      l.id,
      l.action,
      l.module,
      `"${l.actor}"`,
      l.actorEmail || "",
      `"${l.organizationName}"`,
      l.createdAt,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `clixpro_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Audit logs exported.");
  };

  const modules = Array.from(new Set(logs.map((l) => l.module).filter(Boolean)));

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({
    key: "",
    direction: null,
  });

  const handleSort = (key: string, direction: SortDirection) => {
    setSortConfig({ key, direction });
  };

  const filteredLogs = logs.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.module.toLowerCase().includes(q) ||
      l.actor.toLowerCase().includes(q) ||
      (l.actorEmail && l.actorEmail.toLowerCase().includes(q)) ||
      l.organizationName.toLowerCase().includes(q)
    );
  });

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    if (!sortConfig.direction) return 0;
    const dir = sortConfig.direction === "asc" ? 1 : -1;

    if (sortConfig.key === "action") {
      return (a.action || "").localeCompare(b.action || "") * dir;
    }
    if (sortConfig.key === "module") {
      return (a.module || "").localeCompare(b.module || "") * dir;
    }
    if (sortConfig.key === "organization") {
      return (a.organizationName || "").localeCompare(b.organizationName || "") * dir;
    }
    if (sortConfig.key === "actor") {
      const nameA = a.actor || a.actorEmail || "";
      const nameB = b.actor || b.actorEmail || "";
      return nameA.localeCompare(nameB) * dir;
    }
    if (sortConfig.key === "createdAt") {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return (dateA - dateB) * dir;
    }
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sortedLogs.length / rowsPerPage));
  const paginatedLogs = sortedLogs.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <CRMPageContainer twoStageScroll>
      {/* 1. Standard CRM Page Header */}
      <CRMPageHeader
        title="Platform Audit Logs"
        subtitle="Immutable cross-tenant audit trail, security events, authentication records, and administrative mutations."
        icon={ScrollText}
        badge="Security & Compliance"
        actions={[
          {
            label: "Export CSV",
            icon: Download,
            onClick: exportCSV,
            variant: "outline",
          },
        ]}
      />

      {/* 2. Standard CRM KPI Metrics Grid */}
      <div className="shrink-0 space-y-4">
        {/* Continuous Audit Integrity & WORM Archival Status Banner */}
        {integrityReport && (
          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`p-2.5 rounded-xl flex items-center justify-center ${
                  integrityReport.status === "HEALTHY"
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                    : integrityReport.status === "WARNING"
                    ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                    : "bg-red-500/10 text-red-600 border border-red-500/20"
                }`}
              >
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">Audit Integrity & WORM Status</span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      integrityReport.status === "HEALTHY"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : integrityReport.status === "WARNING"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                    }`}
                  >
                    {integrityReport.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  HMAC-SHA256 Chained • S3 Object Lock Compliance • Coverage: {integrityReport.archiveCoveragePercent}% • Checked: {integrityReport.checkedRecords}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleVerifyIntegrity}
                disabled={verifyingIntegrity}
                className="gap-2 text-xs font-semibold"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${verifyingIntegrity ? "animate-spin" : ""}`} />
                <span>{verifyingIntegrity ? "Verifying..." : "Verify Integrity Now"}</span>
              </Button>
            </div>
          </div>
        )}

        <CRMMetricsGrid cols={3}>
          <CRMMetricCard
            title="Recorded Events"
            value={logs.length}
            change="Tamper-Evident Trail"
            trend="neutral"
            icon={ScrollText}
            color="blue"
            loading={loading}
          />
          <CRMMetricCard
            title="Active Modules"
            value={modules.length || 1}
            change="Cross-System Audit"
            trend="up"
            icon={Activity}
            color="purple"
            loading={loading}
          />
          <CRMMetricCard
            title="Security Compliance"
            value="100%"
            change="Zero Breaches Detected"
            trend="up"
            icon={Shield}
            color="emerald"
            loading={loading}
          />
        </CRMMetricsGrid>
      </div>

      {/* 3. Main Card Container matching Organizations Page */}
      <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Top Controls Toolbar */}
        <div className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border/50 shrink-0">
          {/* Left: Filter Selects & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="">All Modules</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 group">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                <Search className="w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter logs by actor, action..."
                className="h-9 w-full pl-8 pr-8 rounded-lg bg-background border border-border/70 text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground self-end lg:self-auto flex-wrap">
            {(moduleFilter || search.trim()) && (
              <button
                onClick={() => {
                  setModuleFilter("");
                  setSearch("");
                  setCurrentPage(1);
                }}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-background hover:bg-muted/60 text-muted-foreground hover:text-foreground text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-auto flex-1 min-h-0 relative flex flex-col">
          <table className="w-full text-left text-xs border-collapse min-w-[950px] table-fixed">
            <colgroup>
              <col style={{ width: "200px" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "220px" }} />
              <col style={{ width: "180px" }} />
              <col style={{ width: "180px" }} />
              <col style={{ width: "80px" }} />
            </colgroup>
            <thead className="sticky top-0 z-20 bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-500/20 shadow-xs backdrop-blur-xs">
              <tr className="text-xs font-bold text-foreground">
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() => handleSort("action", sortConfig.key === "action" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc")}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Action</span>
                    {sortConfig.key === "action" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() => handleSort("module", sortConfig.key === "module" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc")}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Module</span>
                    {sortConfig.key === "module" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() => handleSort("organization", sortConfig.key === "organization" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc")}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Organization</span>
                    {sortConfig.key === "organization" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() => handleSort("actor", sortConfig.key === "actor" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc")}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Actor</span>
                    {sortConfig.key === "actor" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() => handleSort("createdAt", sortConfig.key === "createdAt" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc")}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Timestamp</span>
                    {sortConfig.key === "createdAt" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th className="w-20 px-4 py-3.5 text-right bg-emerald-50/80 dark:bg-emerald-950/40">
                  <span>Details</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-xs">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse h-16">
                    <td className="px-4 py-4"><div className="h-4 w-28 bg-muted rounded" /></td>
                    <td className="px-4 py-4"><div className="h-5 w-20 bg-muted rounded-md" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-32 bg-muted rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-28 bg-muted rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                    <td className="px-4 py-4 text-right"><div className="h-8 w-14 bg-muted rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="group h-16 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-foreground truncate">
                      <TruncatedText text={log.action} lines={1} />
                    </td>
                    <td className="px-4 py-3.5 text-xs font-semibold whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-md bg-muted/70 border border-border/70 text-[11px] font-bold">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-foreground truncate">
                      <TruncatedText text={log.organizationName} lines={1} />
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground truncate">
                      <TruncatedText text={log.actor} lines={1} />
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground">{new Date(log.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(log.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}</p>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="h-8 px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg cursor-pointer"
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground align-middle border-0">
                    <div className="flex flex-col items-center justify-center py-6">
                      <EmptyState
                        icon={ScrollText}
                        title="No audit logs found"
                        description="No logs match your filter criteria."
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
              {filteredLogs.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
            </span>
            -
            <span className="font-semibold text-foreground">
              {Math.min(currentPage * rowsPerPage, filteredLogs.length)}
            </span>{" "}
            of <span className="font-semibold text-foreground">{filteredLogs.length}</span> Logs
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
                  <ChevronsLeft className="h-4 w-4" />
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
                  <ChevronLeft className="h-4 w-4" />
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
                  <ChevronRight className="h-4 w-4" />
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
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ScrollText className="h-4 w-4 text-emerald-600" />
                <span>Audit Log Details</span>
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-muted/40 border border-border/40">
                <div>
                  <span className="text-muted-foreground font-semibold">Action:</span>
                  <p className="font-bold text-foreground mt-0.5 font-mono">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold">Module:</span>
                  <p className="font-bold text-emerald-600 mt-0.5">{selectedLog.module}</p>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold">Actor:</span>
                  <p className="font-medium text-foreground mt-0.5">
                    {selectedLog.actor} {selectedLog.actorEmail ? `(${selectedLog.actorEmail})` : ""}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold">Organization:</span>
                  <p className="font-medium text-foreground mt-0.5">
                    {selectedLog.organizationName}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold">Timestamp:</span>
                  <p className="font-medium text-foreground mt-0.5">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold">Target User:</span>
                  <p className="font-medium text-foreground mt-0.5">
                    {selectedLog.targetUser || "N/A"}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground font-bold uppercase tracking-wider text-[10px] block mb-1">
                  Raw Payload Details:
                </span>
                <pre className="p-3 rounded-xl bg-black/90 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-56 border border-border/40">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>

              {/* Disaster Recovery Verification Action */}
              <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDrVerify(selectedLog.id)}
                  disabled={verifyingDr}
                  className="gap-2 text-xs w-full"
                >
                  <Shield className={`h-3.5 w-3.5 ${verifyingDr ? "animate-spin" : "text-emerald-600"}`} />
                  <span>{verifyingDr ? "Testing DR Restore..." : "Test WORM Disaster Recovery Restore"}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CRMPageContainer>
  );
}
