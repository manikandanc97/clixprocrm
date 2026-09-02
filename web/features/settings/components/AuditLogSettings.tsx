"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  History,
  RefreshCw,
  Search,
  X,
  Download,
  RotateCcw,
  Laptop,
  Smartphone,
  Tablet,
  LogIn,
  LogOut,
  Key,
  ShieldCheck,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { EmptyState } from "@/shared/components/EmptyState";
import { cn } from "@/shared/lib/utils";
import {
  fetchSecurityActivity,
  SecurityActivityDto,
} from "@/shared/lib/api/sessions.api";
import { toast } from "sonner";

export default function AuditLogSettings() {
  const [actionFilter, setActionFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{
    key: "action" | "module" | "client" | "ipAddress" | "createdAt";
    direction: "asc" | "desc";
  } | null>({
    key: "createdAt",
    direction: "desc",
  });

  const {
    data: activityData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["security-activity", currentPage, rowsPerPage],
    queryFn: () => fetchSecurityActivity(currentPage, 100),
    staleTime: 30_000,
  });

  const rawActivities = useMemo(
    () => (Array.isArray(activityData?.activity) ? activityData.activity : []),
    [activityData]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, actionFilter]);

  const hasActiveFilters = actionFilter !== "ALL" || searchTerm.trim().length > 0;

  const handleClearFilters = () => {
    setActionFilter("ALL");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleSort = (key: "action" | "module" | "client" | "ipAddress" | "createdAt") => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) {
        return { key, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { key, direction: "desc" };
      }
      return null;
    });
  };

  const filteredActivities = useMemo(() => {
    const filtered = rawActivities.filter((a) => {
      const act = (a.action || "").toLowerCase();
      if (actionFilter === "login" && !act.includes("login") && !act.includes("signin")) {
        return false;
      }
      if (actionFilter === "password" && !act.includes("password")) {
        return false;
      }
      if (actionFilter === "mfa" && !act.includes("mfa") && !act.includes("2fa")) {
        return false;
      }
      if (actionFilter === "revoke" && !act.includes("revoke") && !act.includes("logout")) {
        return false;
      }

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        act.includes(term) ||
        (a.module && a.module.toLowerCase().includes(term)) ||
        (a.ipAddress && a.ipAddress.toLowerCase().includes(term)) ||
        (a.browser && a.browser.toLowerCase().includes(term)) ||
        (a.operatingSystem && a.operatingSystem.toLowerCase().includes(term))
      );
    });

    if (!sortConfig) return filtered;
    const dir = sortConfig.direction === "asc" ? 1 : -1;

    return [...filtered].sort((a, b) => {
      if (sortConfig.key === "action") {
        return (a.action || "").localeCompare(b.action || "") * dir;
      }
      if (sortConfig.key === "module") {
        return (a.module || "").localeCompare(b.module || "") * dir;
      }
      if (sortConfig.key === "client") {
        const clientA = `${a.browser || ""} ${a.operatingSystem || ""}`;
        const clientB = `${b.browser || ""} ${b.operatingSystem || ""}`;
        return clientA.localeCompare(clientB) * dir;
      }
      if (sortConfig.key === "ipAddress") {
        return (a.ipAddress || "").localeCompare(b.ipAddress || "") * dir;
      }
      if (sortConfig.key === "createdAt") {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return (timeA - timeB) * dir;
      }
      return 0;
    });
  }, [rawActivities, searchTerm, actionFilter, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredActivities.length / rowsPerPage));
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const getActionBadge = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("login") || act.includes("signin")) {
      return (
        <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 gap-1 shrink-0">
          <LogIn className="w-3 h-3" />
          Sign In
        </Badge>
      );
    }
    if (act.includes("password")) {
      return (
        <Badge variant="outline" className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20 gap-1 shrink-0">
          <Key className="w-3 h-3" />
          Password Change
        </Badge>
      );
    }
    if (act.includes("mfa") || act.includes("2fa")) {
      return (
        <Badge variant="outline" className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20 gap-1 shrink-0">
          <ShieldCheck className="w-3 h-3" />
          MFA Event
        </Badge>
      );
    }
    if (act.includes("revoke") || act.includes("logout")) {
      return (
        <Badge variant="outline" className="text-[10px] font-bold text-destructive bg-destructive/10 border-destructive/20 gap-1 shrink-0">
          <LogOut className="w-3 h-3" />
          Session Revoke
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground shrink-0">
        {action}
      </Badge>
    );
  };

  const getDeviceIcon = (act: SecurityActivityDto) => {
    const os = (act.operatingSystem || "").toLowerCase();
    const dev = (act.deviceType || "").toLowerCase();
    if (dev === "mobile" || os.includes("ios") || os.includes("android")) {
      return <Smartphone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />;
    }
    if (dev === "tablet" || os.includes("ipad")) {
      return <Tablet className="w-3.5 h-3.5 text-muted-foreground shrink-0" />;
    }
    return <Laptop className="w-3.5 h-3.5 text-muted-foreground shrink-0" />;
  };

  const exportCSV = () => {
    if (filteredActivities.length === 0) {
      toast.error("No audit logs available to export.");
      return;
    }
    const headers = ["Timestamp", "Action", "Module", "IP Address", "Browser", "Operating System"];
    const rows = filteredActivities.map((a) => [
      `"${a.createdAt}"`,
      `"${a.action}"`,
      `"${a.module || ""}"`,
      `"${a.ipAddress || ""}"`,
      `"${a.browser || ""}"`,
      `"${a.operatingSystem || ""}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clixpro_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Audit logs exported successfully.");
  };

  return (
    <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
      {/* Top Controls Toolbar - Exactly matches Contacts / Employees / Companies */}
      <div className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border/50 shrink-0">
        {/* Left: Action Filter & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-9 px-3 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
          >
            <option value="ALL">All Actions</option>
            <option value="login">Sign In / Logins</option>
            <option value="password">Password Changes</option>
            <option value="mfa">MFA Events</option>
            <option value="revoke">Session Revocations</option>
          </select>

          {/* Search Input */}
          <div className="relative w-full sm:w-64 group">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
              <AppIcon
                name="search"
                icon={Search}
                size={14}
                className="w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors"
              />
            </div>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search audit logs..."
              className="h-9 pl-8 pr-8 rounded-lg bg-background border-border/70 text-xs shadow-xs focus-visible:ring-2 focus-visible:ring-primary/20"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
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
              <AppIcon
                name="reset"
                icon={RotateCcw}
                size={14}
                className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
              />
              <span>Reset Filters</span>
            </button>
          )}

          {/* Export Button */}
          <button
            onClick={exportCSV}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-background hover:bg-muted/50 text-foreground text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <AppIcon
              name="export"
              icon={Download}
              size={14}
              className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
            />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Table Content - Vertical & Horizontal Scroll Owner with Sticky Emerald Header */}
      <div className="overflow-auto flex-1 min-h-0 relative flex flex-col kanban-board-scroll">
        <table className="w-full text-left text-xs border-collapse min-w-[950px] table-fixed">
          <colgroup>
            <col style={{ width: "320px" }} />
            <col style={{ width: "130px" }} />
            <col style={{ width: "240px" }} />
            <col style={{ width: "140px" }} />
            <col style={{ width: "180px" }} />
          </colgroup>
          <thead className="sticky top-0 z-20 bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-500/20 shadow-xs backdrop-blur-xs">
            <tr className="text-xs font-bold text-foreground">
              <th
                className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                onClick={() => handleSort("action")}
              >
                <div className="flex items-center gap-1.5">
                  <span>Event / Action</span>
                  {sortConfig?.key === "action" && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                onClick={() => handleSort("module")}
              >
                <div className="flex items-center gap-1.5">
                  <span>Module</span>
                  {sortConfig?.key === "module" && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                onClick={() => handleSort("client")}
              >
                <div className="flex items-center gap-1.5">
                  <span>Client &amp; Device</span>
                  {sortConfig?.key === "client" && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                onClick={() => handleSort("ipAddress")}
              >
                <div className="flex items-center gap-1.5">
                  <span>IP Address</span>
                  {sortConfig?.key === "ipAddress" && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-3.5 text-right bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                onClick={() => handleSort("createdAt")}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Timestamp</span>
                  {sortConfig?.key === "createdAt" && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-xs">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse h-16">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-5 w-16 bg-muted rounded-md shrink-0" />
                      <div className="h-4 w-32 bg-muted rounded" />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-5 w-14 bg-muted rounded-md" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 bg-muted rounded shrink-0" />
                      <div className="h-4 w-36 bg-muted rounded" />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-5 w-24 bg-muted rounded font-mono" />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="h-4 w-28 bg-muted rounded ml-auto" />
                  </td>
                </tr>
              ))
            ) : paginatedActivities.length > 0 ? (
              paginatedActivities.map((act) => (
                <tr
                  key={act.id}
                  className="group h-16 hover:bg-muted/30 transition-colors"
                >
                  {/* Event / Action */}
                  <td className="px-4 py-3.5 overflow-hidden">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {getActionBadge(act.action)}
                      <span className="font-bold text-xs text-foreground truncate">
                        {act.action}
                      </span>
                    </div>
                  </td>

                  {/* Module */}
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted/60 text-muted-foreground uppercase tracking-wide border border-border/50">
                      {act.module || "AUTH"}
                    </span>
                  </td>

                  {/* Client & Device */}
                  <td className="px-4 py-3.5 text-muted-foreground overflow-hidden">
                    <div className="flex items-center gap-2 min-w-0">
                      {getDeviceIcon(act)}
                      <span className="truncate">
                        {act.browser || "Browser"} on {act.operatingSystem || "OS"}
                      </span>
                    </div>
                  </td>

                  {/* IP Address */}
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-[11px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded border border-border/40">
                      {act.ipAddress || "—"}
                    </span>
                  </td>

                  {/* Timestamp */}
                  <td className="px-4 py-3.5 text-right text-muted-foreground text-[11px]">
                    <div className="flex items-center justify-end gap-1.5">
                      <Clock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                      <span>{new Date(act.createdAt).toLocaleString()}</span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground align-middle border-0">
                  <div className="flex flex-col items-center justify-center py-6">
                    <EmptyState
                      icon={History}
                      title="No audit records found"
                      description="No audit records match your current search or filter criteria."
                      className="border-none bg-transparent shadow-none p-0 min-h-0"
                      action={
                        hasActiveFilters
                          ? {
                              label: "Reset Filters",
                              onClick: handleClearFilters,
                              icon: RotateCcw,
                            }
                          : undefined
                      }
                    />
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Pagination - Exactly matches Contacts / Employees / Companies */}
      <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/50 text-xs font-medium text-muted-foreground bg-card shrink-0 mt-auto">
        <div>
          Showing{" "}
          <span className="font-semibold text-foreground">
            {filteredActivities.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
          </span>
          -
          <span className="font-semibold text-foreground">
            {Math.min(currentPage * rowsPerPage, filteredActivities.length)}
          </span>{" "}
          of <span className="font-semibold text-foreground">{filteredActivities.length}</span> Audit Events
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
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
