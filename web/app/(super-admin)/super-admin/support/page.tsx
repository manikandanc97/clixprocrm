"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Ticket,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  fetchPlatformSupportTickets,
  fetchPlatformSupportStats,
  deletePlatformSupportTicket,
  PlatformSupportTicket,
  SupportTicketStats,
} from "@/shared/lib/api/super-admin.api";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { useAuth } from "@/features/auth/components/auth-provider";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { SuperAdminTicketModal } from "./SuperAdminTicketModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { toast } from "sonner";
import {
  CRMPageContainer,
  CRMPageHeader,
  CRMMetricsGrid,
  CRMMetricCard,
  CRMToolbar,
  CRMPagination,
  CRMDataTable,
  CRMTableHeader,
  CRMTableBody,
  CRMTableRow,
  CRMTableCell,
  CRMTableHeaderCell,
  CRMSortIndicator,
  TruncatedText,
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
    badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
    dotClass: "bg-blue-500",
  },
  IN_PROGRESS: {
    label: "In Progress",
    badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    dotClass: "bg-amber-500",
  },
  WAITING_FOR_USER: {
    label: "Waiting for User",
    badgeClass: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
    dotClass: "bg-purple-500",
  },
  RESOLVED: {
    label: "Resolved",
    badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
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
    badgeClass: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400",
  },
  MEDIUM: {
    label: "Medium",
    badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  },
  HIGH: {
    label: "High",
    badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  },
  CRITICAL: {
    label: "Critical",
    badgeClass: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
  },
};

export default function SuperAdminSupportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<PlatformSupportTicket[]>([]);
  const [stats, setStats] = useState<SupportTicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters, Sorting & Pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortConfig, setSortConfig] = useState<{
    key: "ticketNumber" | "subject" | "createdBy" | "priority" | "status" | "assignedTo" | "createdAt";
    direction: "asc" | "desc";
  } | null>(null);

  const handleSort = (
    key: "ticketNumber" | "subject" | "createdBy" | "priority" | "status" | "assignedTo" | "createdAt"
  ) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        return null;
      }
      return { key, direction: "asc" };
    });
    setPage(1);
  };

  // Delete state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<PlatformSupportTicket | null>(null);
  const [deletingTicket, setDeletingTicket] = useState(false);

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

  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [ticketsData, statsData] = await Promise.all([
        fetchPlatformSupportTickets({
          status: statusFilter === "ALL" ? undefined : statusFilter,
          priority: priorityFilter === "ALL" ? undefined : priorityFilter,
          search: search.trim() || undefined,
          page,
          limit: 15,
          sortBy: sortConfig?.key,
          sortOrder: sortConfig?.direction,
        }),
        fetchPlatformSupportStats(),
      ]);

      setTickets(ticketsData.tickets);
      setTotalPages(ticketsData.pagination.totalPages);
      setTotalCount(ticketsData.pagination.total);
      setStats(statsData);
    } catch (err: any) {
      console.error("Failed to load support tickets:", err);
      toast.error("Failed to fetch support tickets from database.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, priorityFilter, search, page, sortConfig]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenTicket = (ticket: PlatformSupportTicket) => {
    setSelectedTicketId(ticket.id);
  };

  const handleOpenDelete = (ticket: PlatformSupportTicket, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTicketToDelete(ticket);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return;
    try {
      setDeletingTicket(true);
      await deletePlatformSupportTicket(ticketToDelete.id);
      setTickets((prev) => prev.filter((t) => t.id !== ticketToDelete.id));
      setIsDeleteDialogOpen(false);
      setTicketToDelete(null);
      toast.success(`Ticket #${ticketToDelete.ticketNumber} deleted permanently.`);
      loadData();
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

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 30) return `${diffDays}d ago`;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "Recently";
    }
  };

  return (
    <CRMPageContainer twoStageScroll>
      {/* 1. Standard CRM Page Header */}
      <CRMPageHeader
        title="Platform Support Desk & Inbox"
        subtitle="Live multi-tenant queue for customer inquiries, escalations, and technical troubleshooting."
        icon={Ticket}
        badge="Platform Operations"
        actions={[
          {
            label: refreshing ? "Refreshing..." : "Refresh Queue",
            icon: RefreshCw,
            onClick: loadData,
            variant: "outline",
          },
        ]}
      />

      {/* 2. Standard CRM KPI Metrics Grid */}
      <div className="shrink-0">
        <CRMMetricsGrid>
          <CRMMetricCard
            title="Total Tickets"
            value={stats?.total ?? 0}
            icon={Ticket}
            color="primary"
            comparisonText="All Workspaces"
            loading={loading}
          />
          <CRMMetricCard
            title="Open Queue"
            value={stats?.open ?? 0}
            icon={AlertCircle}
            color="blue"
            comparisonText="Requires Action"
            loading={loading}
          />
          <CRMMetricCard
            title="In Progress"
            value={stats?.inProgress ?? 0}
            icon={Clock}
            color="orange"
            comparisonText="Active Investigation"
            loading={loading}
          />
          <CRMMetricCard
            title="Resolved"
            value={stats?.resolved ?? 0}
            icon={CheckCircle2}
            color="emerald"
            comparisonText="Closed & Resolved"
            loading={loading}
          />
        </CRMMetricsGrid>
      </div>

      {/* 3. Two-Stage Scroll Workspace */}
      <div className="crm-table-workspace-sticky">
        <CRMToolbar
          searchQuery={search}
          setSearchQuery={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search ticket #, subject, workspace, customer email..."
          sticky={false}
        >
        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority Filter */}
          <Select
            value={priorityFilter}
            onValueChange={(val) => {
              setPriorityFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 text-xs w-[140px] bg-card border-border">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Tabs */}
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60 shadow-sm">
            {[
              { id: "ALL", label: "All", count: stats?.total },
              { id: "OPEN", label: "Open", count: stats?.open },
              { id: "IN_PROGRESS", label: "In Progress", count: stats?.inProgress },
              { id: "WAITING_FOR_USER", label: "Waiting", count: stats?.waitingForUser },
              { id: "RESOLVED", label: "Resolved", count: stats?.resolved },
              { id: "CLOSED", label: "Closed", count: stats?.closed },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0",
                  statusFilter === tab.id
                    ? "bg-card text-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full",
                      statusFilter === tab.id
                        ? "bg-primary/10 text-primary font-bold"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </CRMToolbar>

      {/* 4. Standard CRM Data Table */}
      <CRMDataTable hasPagination={totalPages > 1}>
        <CRMTableHeader>
          <tr className="text-[12px] font-semibold uppercase tracking-[0.05em] leading-tight text-muted-foreground whitespace-nowrap">
            <CRMTableHeaderCell 
              className="cursor-pointer group select-none whitespace-nowrap"
              onClick={() => handleSort("ticketNumber")}
            >
              <div className="flex items-center gap-1.5">
                <span>T-No</span>
                <CRMSortIndicator active={sortConfig?.key === "ticketNumber"} direction={sortConfig?.direction} />
              </div>
            </CRMTableHeaderCell>

            <CRMTableHeaderCell 
              className="cursor-pointer group select-none"
              onClick={() => handleSort("subject")}
            >
              <div className="flex items-center gap-1.5">
                <span>Subject</span>
                <CRMSortIndicator active={sortConfig?.key === "subject"} direction={sortConfig?.direction} />
              </div>
            </CRMTableHeaderCell>

            <CRMTableHeaderCell 
              className="cursor-pointer group select-none whitespace-nowrap"
              onClick={() => handleSort("createdBy")}
            >
              <div className="flex items-center gap-1.5">
                <span>Raised By</span>
                <CRMSortIndicator active={sortConfig?.key === "createdBy"} direction={sortConfig?.direction} />
              </div>
            </CRMTableHeaderCell>

            <CRMTableHeaderCell 
              className="cursor-pointer group select-none whitespace-nowrap"
              onClick={() => handleSort("priority")}
            >
              <div className="flex items-center gap-1.5">
                <span>Priority</span>
                <CRMSortIndicator active={sortConfig?.key === "priority"} direction={sortConfig?.direction} />
              </div>
            </CRMTableHeaderCell>

            <CRMTableHeaderCell 
              className="cursor-pointer group select-none whitespace-nowrap"
              onClick={() => handleSort("status")}
            >
              <div className="flex items-center gap-1.5">
                <span>Status</span>
                <CRMSortIndicator active={sortConfig?.key === "status"} direction={sortConfig?.direction} />
              </div>
            </CRMTableHeaderCell>

            <CRMTableHeaderCell 
              className="cursor-pointer group select-none whitespace-nowrap"
              onClick={() => handleSort("assignedTo")}
            >
              <div className="flex items-center gap-1.5">
                <span>Assigned To</span>
                <CRMSortIndicator active={sortConfig?.key === "assignedTo"} direction={sortConfig?.direction} />
              </div>
            </CRMTableHeaderCell>

            <CRMTableHeaderCell 
              className="cursor-pointer group select-none whitespace-nowrap"
              onClick={() => handleSort("createdAt")}
            >
              <div className="flex items-center gap-1.5">
                <span>Created</span>
                <CRMSortIndicator active={sortConfig?.key === "createdAt"} direction={sortConfig?.direction} />
              </div>
            </CRMTableHeaderCell>

            <CRMTableHeaderCell className="text-right whitespace-nowrap">Actions</CRMTableHeaderCell>
          </tr>
        </CRMTableHeader>

        <CRMTableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse h-16">
                <td className="px-6 py-4">
                  <div className="h-4 w-12 bg-muted rounded" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-3.5 w-48 bg-muted rounded" />
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-24 bg-muted rounded" />
                    <div className="h-2.5 w-32 bg-muted/60 rounded" />
                  </div>
                </td>
                <td className="px-6 py-4"><div className="h-4 w-14 bg-muted rounded-full" /></td>
                <td className="px-6 py-4"><div className="h-4 w-20 bg-muted rounded-full" /></td>
                <td className="px-6 py-4"><div className="h-3.5 w-24 bg-muted rounded" /></td>
                <td className="px-6 py-4"><div className="h-3.5 w-16 bg-muted rounded" /></td>
                <td className="px-6 py-4 text-right"><div className="h-8 w-16 bg-muted rounded-lg ml-auto" /></td>
              </tr>
            ))
          ) : tickets.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-16 text-center">
                <EmptyState
                  icon={Ticket}
                  title="No Support Tickets Found"
                  description="There are no support tickets matching the selected filters."
                />
              </td>
            </tr>
          ) : (
            tickets.map((t) => {
              const statusInfo = STATUS_CONFIG[t.status] || STATUS_CONFIG.OPEN;
              const priorityInfo = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.MEDIUM;
              const ticketDisplayCode = formatTicketCode(t);

              return (
                <CRMTableRow
                  key={t.id}
                  onClick={() => handleOpenTicket(t)}
                >
                  {/* Reference */}
                  <CRMTableCell className="font-mono font-bold text-primary whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>{ticketDisplayCode}</span>
                      <button
                        type="button"
                        onClick={(e) => copyId(t.ticketNumber || ticketDisplayCode, e)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity text-muted-foreground hover:text-foreground cursor-pointer"
                        title={`Copy Reference (${t.ticketNumber || ticketDisplayCode})`}
                      >
                        {copiedId === (t.ticketNumber || ticketDisplayCode) ? (
                          <AppIcon name="check" size={13} className="text-emerald-500" />
                        ) : (
                          <AppIcon name="copy" size={13} />
                        )}
                      </button>
                    </div>
                  </CRMTableCell>

                  {/* Subject */}
                  <CRMTableCell className="max-w-[320px] min-w-[200px]">
                    <TruncatedText
                      text={t.subject}
                      lines={1}
                      className="font-semibold text-sm text-foreground hover:text-primary transition-colors cursor-pointer"
                    />
                  </CRMTableCell>

                  {/* Customer */}
                  <CRMTableCell className="whitespace-nowrap">
                    <div className="min-w-0 max-w-[190px]">
                      <TruncatedText
                        text={t.createdBy?.name || "Customer"}
                        lines={1}
                        className="font-medium text-sm text-foreground"
                      />
                      <TruncatedText
                        text={t.createdBy?.email}
                        lines={1}
                        className="text-[10px] text-muted-foreground font-mono mt-0.5"
                      />
                    </div>
                  </CRMTableCell>

                  {/* Priority */}
                  <CRMTableCell className="whitespace-nowrap">
                    <Badge variant="outline" className={cn("text-[10px]", priorityInfo.badgeClass)}>
                      {priorityInfo.label}
                    </Badge>
                  </CRMTableCell>

                  {/* Status */}
                  <CRMTableCell className="whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
                        statusInfo.badgeClass
                      )}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusInfo.dotClass)} />
                      {statusInfo.label}
                    </span>
                  </CRMTableCell>

                  {/* Assignee */}
                  <CRMTableCell className="whitespace-nowrap">
                    {t.assignedTo ? (
                      <div className="flex items-center gap-1.5 text-sm text-foreground font-medium min-w-0 max-w-[180px]">
                        <AppIcon name="userCheck" size={13} className="text-primary shrink-0" />
                        <TruncatedText
                          text={t.assignedTo.name || t.assignedTo.email}
                          lines={1}
                          className="font-medium text-sm text-foreground"
                        />
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">Unassigned</span>
                    )}
                  </CRMTableCell>

                  {/* Created At */}
                  <CRMTableCell className="whitespace-nowrap text-muted-foreground text-[11px]">
                    {formatRelativeTime(t.createdAt)}
                  </CRMTableCell>

                  {/* Actions */}
                  <CRMTableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenTicket(t);
                        }}
                        className="h-8 px-2.5 text-xs font-semibold gap-1 text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
                      >
                        <AppIcon name="eye" size={14} />
                        <span>View</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleOpenDelete(t, e)}
                        className="h-8 px-2 text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        title="Delete Ticket"
                      >
                        <AppIcon name="trash" size={14} />
                      </Button>
                    </div>
                  </CRMTableCell>
                </CRMTableRow>
              );
            })
          )}
        </CRMTableBody>
      </CRMDataTable>

      {/* 5. Pagination */}
      {!loading && totalPages > 1 && (
        <CRMPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalCount}
          rowsPerPage={15}
          onPageChange={setPage}
          onRowsPerPageChange={() => {}}
          itemName="Tickets"
        />
      )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AppIcon name="alert" size={18} className="text-destructive" />
              Delete Ticket #{ticketToDelete?.ticketNumber}?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
              Are you sure you want to permanently delete this support ticket? All messages, internal
              notes, and uploaded attachments will be permanently removed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-destructive/5 rounded-xl border border-destructive/20 text-xs text-foreground/80 space-y-1 my-1">
            <p className="font-semibold text-foreground truncate">{ticketToDelete?.subject}</p>
            <p className="text-[11px] text-muted-foreground">
              Submitted by {ticketToDelete?.createdBy?.name || "Customer"} ({ticketToDelete?.tenant?.name})
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deletingTicket}
              className="text-xs h-8 cursor-pointer"
            >
              <AppIcon name="close" size={14} className="mr-1.5" />
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
                  <AppIcon name="trash" size={14} className="text-destructive-foreground" /> Delete Permanently
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
