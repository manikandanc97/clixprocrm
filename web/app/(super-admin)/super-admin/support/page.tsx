"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Ticket,
  Search,
  X,
  Download,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Trash2,
  AlertTriangle,
  Eye,
  RotateCcw,
  Copy,
  Check,
  UserCheck,
} from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import {
  fetchPlatformSupportTickets,
  deletePlatformSupportTicket,
  PlatformSupportTicket,
} from "@/shared/lib/api/super-admin.api";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { SuperAdminTicketModal } from "./SuperAdminTicketModal";
import {
  CRMPageContainer,
  formatTicketCode,
} from "@/shared/components/crm";
import { EmptyState } from "@/shared/components/EmptyState";
import { cn } from "@/shared/lib/utils";

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  OPEN: {
    label: "Open",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    dotClass: "bg-blue-500",
  },
  IN_PROGRESS: {
    label: "In Progress",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    dotClass: "bg-amber-500",
  },
  WAITING_FOR_USER: {
    label: "Waiting for User",
    badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    dotClass: "bg-purple-500",
  },
  RESOLVED: {
    label: "Resolved",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dotClass: "bg-emerald-500",
  },
  CLOSED: {
    label: "Closed",
    badgeClass: "bg-muted text-muted-foreground border-border",
    dotClass: "bg-muted-foreground",
  },
};

const PRIORITY_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  LOW: {
    label: "Low",
    badgeClass: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  },
  MEDIUM: {
    label: "Medium",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  HIGH: {
    label: "High",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  CRITICAL: {
    label: "Critical",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
};

export default function SuperAdminSupportPage() {
  const [tickets, setTickets] = useState<PlatformSupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters, Sorting & Pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [sortConfig, setSortConfig] = useState<{
    key: "ticketNumber" | "subject" | "createdBy" | "priority" | "status" | "assignedTo" | "createdAt";
    direction: "asc" | "desc";
  } | null>(null);

  const setSort = (key: "ticketNumber" | "subject" | "createdBy" | "priority" | "status" | "assignedTo" | "createdAt") => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        return null;
      }
      return { key, direction: "asc" };
    });
    setCurrentPage(1);
  };

  // Delete State
  const [ticketToDelete, setTicketToDelete] = useState<PlatformSupportTicket | null>(null);
  const [deletingTicket, setDeletingTicket] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Selected ticket for modal details view
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // UI helpers
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyId = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success(`Copied ticket #${id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: dateStr, time: "" };
    const date = d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return { date, time };
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const ticketsData = await fetchPlatformSupportTickets({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        priority: priorityFilter === "ALL" ? undefined : priorityFilter,
        search: search.trim() || undefined,
        page: currentPage,
        limit: rowsPerPage,
        sortBy: sortConfig?.key,
        sortOrder: sortConfig?.direction,
      });

      setTickets(ticketsData.tickets || []);
      setTotalPages(ticketsData.pagination?.totalPages || 1);
      setTotalCount(ticketsData.pagination?.total || 0);
    } catch (err: any) {
      console.error("Failed to load support tickets:", err);
      toast.error("Failed to fetch support tickets from database.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, search, currentPage, rowsPerPage, sortConfig]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenTicket = (ticket: PlatformSupportTicket) => {
    setSelectedTicketId(ticket.id);
  };

  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return;
    try {
      setDeletingTicket(true);
      await deletePlatformSupportTicket(ticketToDelete.id);
      setSelectedTicketIds((prev) => prev.filter((id) => id !== ticketToDelete.id));
      setTicketToDelete(null);
      if (selectedTicketId === ticketToDelete.id) {
        setSelectedTicketId(null);
      }
      toast.success(`Ticket #${ticketToDelete.ticketNumber || ticketToDelete.id} deleted successfully.`);
      await loadData();
    } catch (err: any) {
      console.error("Failed to delete ticket:", err);
      toast.error(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        "Failed to delete ticket."
      );
    } finally {
      setDeletingTicket(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTicketIds.length === 0) return;
    try {
      setBulkDeleting(true);
      await Promise.all(selectedTicketIds.map((id) => deletePlatformSupportTicket(id)));
      toast.success(`${selectedTicketIds.length} ticket(s) deleted permanently.`);
      setSelectedTicketIds([]);
      setBulkDeleteModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete selected tickets."
      );
    } finally {
      setBulkDeleting(false);
    }
  };

  const hasActiveFilters = statusFilter !== "ALL" || priorityFilter !== "ALL" || search.trim().length > 0;

  const handleClearFilters = () => {
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setSearch("");
    setCurrentPage(1);
  };

  const exportCSV = () => {
    if (tickets.length === 0) {
      toast.error("No tickets available to export.");
      return;
    }
    const headers = [
      "Ticket #",
      "Subject",
      "Category",
      "Customer Name",
      "Customer Email",
      "Workspace",
      "Priority",
      "Status",
      "Assigned To",
      "Created At",
    ];
    const rows = tickets.map((t) => [
      t.ticketNumber || t.id,
      `"${(t.subject || "").replace(/"/g, '""')}"`,
      `"${(t.category || "").replace(/"/g, '""')}"`,
      `"${(t.createdBy?.name || "").replace(/"/g, '""')}"`,
      `"${(t.createdBy?.email || "").replace(/"/g, '""')}"`,
      `"${(t.tenant?.name || "").replace(/"/g, '""')}"`,
      t.priority,
      t.status,
      `"${(t.assignedTo?.name || t.assignedTo?.email || "Unassigned").replace(/"/g, '""')}"`,
      t.createdAt,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clixpro_support_tickets_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Support tickets exported successfully.");
  };

  return (
    <CRMPageContainer twoStageScroll>
      {/* 1. Header Layout */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div
            data-animate-target="true"
            className="group h-10 w-10 rounded-xl bg-card border border-border/80 flex items-center justify-center text-muted-foreground shadow-xs shrink-0 hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer select-none"
          >
            <AppIcon
              name="support"
              icon={Ticket}
              size={18}
              className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors"
            />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              Platform Support Desk & Inbox
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live multi-tenant queue for customer inquiries, escalations, and technical troubleshooting.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Main Card Container matching Organizations Page */}
      <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Top Controls Toolbar */}
        <div className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border/50 shrink-0">
          {/* Left: Filter Selects & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_FOR_USER">Waiting for User</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
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
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search ticket #, subject..."
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
            {/* Multi-Select Delete Button */}
            {selectedTicketIds.length > 0 && (
              <button
                onClick={() => setBulkDeleteModalOpen(true)}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-all shadow-xs cursor-pointer animate-in fade-in zoom-in-95 duration-150"
              >
                <AppIcon name="trash" icon={Trash2} size={14} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Delete ({selectedTicketIds.length})</span>
              </button>
            )}

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
              <AppIcon name="export" icon={Download} size={14} className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Table Content - Vertical & Horizontal Scroll Owner with Sticky Header */}
        <div className="overflow-auto flex-1 min-h-0 relative flex flex-col">
          <table className="w-full text-left text-xs border-collapse min-w-[1000px] table-fixed">
            <colgroup>
              <col style={{ width: "48px" }} />
              <col style={{ width: "100px" }} />
              <col style={{ width: "280px" }} />
              <col style={{ width: "140px" }} />
              <col style={{ width: "100px" }} />
              <col style={{ width: "125px" }} />
              <col style={{ width: "145px" }} />
              <col style={{ width: "140px" }} />
              <col style={{ width: "64px" }} />
            </colgroup>
            <thead className="sticky top-0 z-20 bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-500/20 shadow-xs backdrop-blur-xs">
              <tr className="text-xs font-bold text-foreground">
                <th className="w-12 px-4 py-3.5 text-center bg-emerald-50/80 dark:bg-emerald-950/40 border-r border-emerald-500/15">
                  <input
                    type="checkbox"
                    checked={
                      tickets.length > 0 &&
                      tickets.every((t) => selectedTicketIds.includes(t.id))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTicketIds(
                          Array.from(new Set([...selectedTicketIds, ...tickets.map((t) => t.id)]))
                        );
                      } else {
                        const pageIds = new Set(tickets.map((t) => t.id));
                        setSelectedTicketIds(selectedTicketIds.filter((id) => !pageIds.has(id)));
                      }
                    }}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                  />
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() => setSort("ticketNumber")}
                >
                  <div className="flex items-center gap-1.5">
                    <span>T-No</span>
                    {sortConfig?.key === "ticketNumber" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() => setSort("subject")}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Subject</span>
                    {sortConfig?.key === "subject" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() => setSort("createdBy")}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Raised By</span>
                    {sortConfig?.key === "createdBy" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() => setSort("priority")}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Priority</span>
                    {sortConfig?.key === "priority" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() => setSort("status")}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    {sortConfig?.key === "status" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() => setSort("assignedTo")}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Assigned To</span>
                    {sortConfig?.key === "assignedTo" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() => setSort("createdAt")}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Created Date</span>
                    {sortConfig?.key === "createdAt" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="w-16 px-4 py-3.5 text-right bg-emerald-50/80 dark:bg-emerald-950/40">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-xs">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse h-16">
                    <td className="px-4 py-4 text-center">
                      <div className="h-4 w-4 bg-muted rounded mx-auto" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-16 bg-muted rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-48 bg-muted rounded" />
                        <div className="h-2.5 w-24 bg-muted/60 rounded" />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-32 bg-muted rounded" />
                        <div className="h-2.5 w-20 bg-muted/60 rounded" />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 w-16 bg-muted rounded-md" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 w-20 bg-muted rounded-md" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-24 bg-muted rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-24 bg-muted rounded" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="h-6 w-6 bg-muted rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : tickets.length > 0 ? (
                tickets.map((t) => {
                  const statusInfo = STATUS_CONFIG[t.status] || STATUS_CONFIG.OPEN;
                  const priorityInfo = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.MEDIUM;
                  const ticketDisplayCode = formatTicketCode(t);
                  const { date, time } = formatDate(t.createdAt);
                  const isSelected = selectedTicketIds.includes(t.id);

                  return (
                    <tr
                      key={t.id}
                      className={cn(
                        "group h-16 hover:bg-muted/30 transition-colors",
                        isSelected && "bg-primary/[0.03]"
                      )}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedTicketIds((prev) =>
                              prev.includes(t.id) ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                            );
                          }}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                        />
                      </td>

                      {/* Ticket Number / Reference */}
                      <td className="px-4 py-3.5 font-mono font-bold text-primary whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            onClick={() => handleOpenTicket(t)}
                            className="hover:underline cursor-pointer"
                          >
                            {ticketDisplayCode}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => copyId(t.ticketNumber || ticketDisplayCode, e)}
                            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity text-muted-foreground hover:text-foreground cursor-pointer"
                            title={`Copy Reference (${t.ticketNumber || ticketDisplayCode})`}
                          >
                            {copiedId === (t.ticketNumber || ticketDisplayCode) ? (
                              <AppIcon name="check" icon={Check} size={13} className="text-emerald-500" />
                            ) : (
                              <AppIcon name="copy" icon={Copy} size={13} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Subject & Category */}
                      <td className="px-4 py-3.5 overflow-hidden">
                        <div className="min-w-0 max-w-[250px]">
                          <p
                            onClick={() => handleOpenTicket(t)}
                            className="font-bold text-sm text-foreground hover:text-emerald-600 transition-colors cursor-pointer truncate"
                          >
                            {t.subject}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {t.category ? (
                              <span className="capitalize">{t.category.toLowerCase().replace(/_/g, " ")}</span>
                            ) : (
                              "General Inquiry"
                            )}
                          </p>
                        </div>
                      </td>

                      {/* Raised By / Workspace */}
                      <td className="px-4 py-3.5 overflow-hidden">
                        <div className="min-w-0 max-w-[130px]">
                          <p className="font-semibold text-foreground text-xs truncate">
                            {t.createdBy?.name || "Customer"}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono truncate">
                            {t.tenant?.name ? (
                              <span>{t.tenant.name}</span>
                            ) : (
                              t.createdBy?.email || "Unknown"
                            )}
                          </p>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold uppercase tracking-wider border shadow-xs",
                            priorityInfo.badgeClass
                          )}
                        >
                          {priorityInfo.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10.5px] font-bold tracking-wider uppercase border shadow-xs",
                            statusInfo.badgeClass
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusInfo.dotClass)} />
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Assigned To */}
                      <td className="px-4 py-3.5 text-xs font-semibold text-foreground overflow-hidden">
                        {t.assignedTo ? (
                          <div className="flex items-center gap-1.5 text-muted-foreground min-w-0 max-w-[150px]">
                            <UserCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="text-foreground font-semibold truncate text-xs">
                              {t.assignedTo.name || t.assignedTo.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">Unassigned</span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-semibold text-foreground">{date}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{time}</p>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 rounded-xl p-1.5 shadow-lg border-border bg-popover text-popover-foreground"
                          >
                            <DropdownMenuItem
                              onClick={() => handleOpenTicket(t)}
                              className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 hover:bg-muted focus:bg-muted"
                            >
                              <AppIcon
                                name="overview"
                                icon={Eye}
                                size={14}
                                className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                              />
                              <span>View Ticket</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1" />
                            <DropdownMenuItem
                              onClick={() => setTicketToDelete(t)}
                              className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
                            >
                              <AppIcon
                                name="trash"
                                icon={Trash2}
                                size={14}
                                className="w-3.5 h-3.5 text-destructive shrink-0"
                              />
                              <span>Delete Ticket</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-muted-foreground align-middle border-0">
                    <div className="flex flex-col items-center justify-center py-6">
                      <EmptyState
                        icon={Ticket}
                        title="No support tickets found"
                        description="No tickets match your search or filter criteria."
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
              {totalCount === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
            </span>
            -
            <span className="font-semibold text-foreground">
              {Math.min(currentPage * rowsPerPage, totalCount)}
            </span>{" "}
            of <span className="font-semibold text-foreground">{totalCount}</span> Tickets
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
                <option value={15}>15</option>
                <option value={25}>25</option>
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
                {/* First Page */}
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

                {/* Previous Page */}
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

                {/* Next Page */}
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

                {/* Last Page */}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!ticketToDelete} onOpenChange={(open) => !open && setTicketToDelete(null)}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AppIcon name="alert" icon={AlertTriangle} size={18} className="text-destructive" />
              Delete Ticket #{ticketToDelete?.ticketNumber || ticketToDelete?.id}?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
              Are you sure you want to permanently delete this support ticket? All messages, internal
              notes, and uploaded attachments will be permanently removed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-destructive/5 rounded-xl border border-destructive/20 text-xs text-foreground/80 space-y-1 my-1">
            <p className="font-semibold text-foreground truncate">{ticketToDelete?.subject}</p>
            <p className="text-[11px] text-muted-foreground">
              Submitted by {ticketToDelete?.createdBy?.name || "Customer"} ({ticketToDelete?.tenant?.name || "Workspace"})
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTicketToDelete(null)}
              disabled={deletingTicket}
              className="text-xs h-8 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteTicket}
              disabled={deletingTicket}
              className="text-xs h-8 gap-1.5 font-semibold cursor-pointer"
            >
              {deletingTicket ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <AppIcon name="trash" icon={Trash2} size={14} className="text-destructive-foreground" /> Delete Permanently
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Modal */}
      <Dialog open={bulkDeleteModalOpen} onOpenChange={setBulkDeleteModalOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AppIcon name="alert" icon={AlertTriangle} size={18} className="text-destructive" />
              Delete {selectedTicketIds.length} Support Ticket(s)?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
              Are you sure you want to permanently delete these selected support tickets? All corresponding replies, messages, and attachments will be permanently removed from the system.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBulkDeleteModalOpen(false)}
              disabled={bulkDeleting}
              className="text-xs h-8 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="text-xs h-8 gap-1.5 font-semibold cursor-pointer"
            >
              {bulkDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <AppIcon name="trash" icon={Trash2} size={14} className="text-destructive-foreground" /> Delete Selected ({selectedTicketIds.length})
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Super Admin Ticket Details & Triage Modal */}
      <SuperAdminTicketModal
        ticketId={selectedTicketId}
        open={!!selectedTicketId}
        onOpenChange={(open) => !open && setSelectedTicketId(null)}
        onTicketUpdated={loadData}
      />
    </CRMPageContainer>
  );
}
