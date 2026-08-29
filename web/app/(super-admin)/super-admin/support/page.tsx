"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Ticket,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Building2,
  User,
  Paperclip,
  Send,
  Lock,
  MessageSquare,
  Shield,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Eye,
  UserCheck,
  Filter,
} from "lucide-react";
import {
  fetchPlatformSupportTickets,
  fetchPlatformSupportStats,
  fetchPlatformSupportTicketDetails,
  replyPlatformSupportTicket,
  updatePlatformSupportTicketStatus,
  assignPlatformSupportTicket,
  PlatformSupportTicket,
  SupportTicketStats,
} from "@/shared/lib/api/super-admin.api";
import { useAuth } from "@/features/auth/components/auth-provider";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent } from "@/shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { toast } from "sonner";
import {
  CRMPageContainer,
  CRMPageHeader,
  CRMMetricsGrid,
  CRMMetricCard,
  CRMPagination,
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
    dotClass: "bg-amber-500 animate-pulse",
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
  CRITICAL: {
    label: "Critical",
    badgeClass: "bg-rose-500/15 text-rose-600 border-rose-500/30 dark:text-rose-400 font-bold",
  },
  HIGH: {
    label: "High",
    badgeClass: "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400 font-semibold",
  },
  MEDIUM: {
    label: "Medium",
    badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  },
  LOW: {
    label: "Low",
    badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  },
};

export default function SuperAdminSupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<PlatformSupportTicket[]>([]);
  const [stats, setStats] = useState<SupportTicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Active Ticket Drawer / Modal
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketDetails, setTicketDetails] = useState<PlatformSupportTicket | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Reply Composer
  const [replyText, setReplyText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  // UI helpers
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

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
  }, [statusFilter, priorityFilter, search, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open ticket thread details
  const handleOpenTicket = async (ticket: PlatformSupportTicket) => {
    setSelectedTicketId(ticket.id);
    setLoadingDetails(true);
    try {
      const fullTicket = await fetchPlatformSupportTicketDetails(ticket.id);
      setTicketDetails(fullTicket);
    } catch (err: any) {
      console.error("Failed to fetch ticket thread:", err);
      toast.error("Could not load ticket thread details.");
    } finally {
      setLoadingDetails(false);
    }
  };

  // Submit reply or internal note
  const handleSendReply = async () => {
    if (!ticketDetails || !replyText.trim()) return;

    try {
      setSendingReply(true);
      const updated = await replyPlatformSupportTicket(
        ticketDetails.id,
        replyText.trim(),
        isInternalNote
      );

      setTicketDetails(updated);
      setTickets((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
      setReplyText("");
      toast.success(
        isInternalNote
          ? "Internal staff note recorded (hidden from customer)."
          : "Reply dispatched to customer successfully."
      );
      loadData();
    } catch (err: any) {
      console.error("Failed to submit reply:", err);
      toast.error(err?.response?.data?.error?.message || "Failed to post message.");
    } finally {
      setSendingReply(false);
    }
  };

  // Update Status
  const handleStatusChange = async (newStatus: string) => {
    if (!ticketDetails) return;
    try {
      const updated = await updatePlatformSupportTicketStatus(ticketDetails.id, newStatus);
      setTicketDetails(updated);
      setTickets((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
      toast.success(`Ticket status updated to ${newStatus.replace(/_/g, " ")}.`);
      loadData();
    } catch (err: any) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update status.");
    }
  };

  // Assign ticket
  const handleAssignTicket = async (assigneeId: string) => {
    if (!ticketDetails) return;
    try {
      const targetId = assigneeId === "unassigned" ? null : assigneeId;
      const updated = await assignPlatformSupportTicket(ticketDetails.id, targetId);
      setTicketDetails(updated);
      setTickets((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
      toast.success(targetId ? "Ticket assigned successfully." : "Ticket unassigned.");
      loadData();
    } catch (err: any) {
      console.error("Failed to assign ticket:", err);
      toast.error("Failed to update ticket assignment.");
    }
  };

  const copyText = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
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
    <CRMPageContainer>
      {/* Header */}
      <CRMPageHeader
        title="Platform Support Desk & Inbox"
        subtitle="Live multi-tenant queue for customer inquiries, critical escalations, and technical troubleshooting."
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

      {/* Metrics Row */}
      <CRMMetricsGrid>
        <CRMMetricCard
          title="Total Tickets"
          value={stats?.total ?? 0}
          icon={Ticket}
          color="primary"
          comparisonText="All Workspaces"
        />
        <CRMMetricCard
          title="Open Queue"
          value={stats?.open ?? 0}
          icon={AlertCircle}
          color="blue"
          comparisonText="Requires Action"
        />
        <CRMMetricCard
          title="In Progress"
          value={stats?.inProgress ?? 0}
          icon={Clock}
          color="orange"
          comparisonText="Active Investigation"
        />
        <CRMMetricCard
          title="Critical Escalations"
          value={stats?.critical ?? 0}
          icon={AlertTriangle}
          color="pink"
          comparisonText="Urgent Attention"
        />
        <CRMMetricCard
          title="Resolved"
          value={stats?.resolved ?? 0}
          icon={CheckCircle2}
          color="emerald"
          comparisonText="Closed & Resolved"
        />
      </CRMMetricsGrid>

      {/* Filter & Command Center */}
      <Card className="border-border shadow-card rounded-2xl overflow-hidden mt-4">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full md:max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search ticket #, subject, workspace, customer email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select
                value={priorityFilter}
                onValueChange={(val) => {
                  setPriorityFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs w-[140px]">
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
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-border/40 pt-3">
            {[
              { id: "ALL", label: "All Tickets", count: stats?.total },
              { id: "OPEN", label: "Open", count: stats?.open },
              { id: "IN_PROGRESS", label: "In Progress", count: stats?.inProgress },
              { id: "WAITING_FOR_USER", label: "Waiting for User", count: stats?.waitingForUser },
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
                  "px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0",
                  statusFilter === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                )}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full",
                      statusFilter === tab.id
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card className="border-border shadow-card rounded-2xl overflow-hidden mt-4">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Ticket Ref</th>
                  <th className="py-3 px-4">Subject & Details</th>
                  <th className="py-3 px-4">Workspace</th>
                  <th className="py-3 px-4">Raised By</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={9} className="py-4 px-4">
                        <div className="h-4 bg-muted rounded w-full" />
                      </td>
                    </tr>
                  ))
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center">
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

                    return (
                      <tr
                        key={t.id}
                        onClick={() => handleOpenTicket(t)}
                        className="hover:bg-muted/40 transition-colors cursor-pointer group"
                      >
                        {/* Reference */}
                        <td className="py-3 px-4 font-mono font-bold text-primary whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>{t.ticketNumber}</span>
                            <button
                              type="button"
                              onClick={(e) => copyText(t.ticketNumber, e)}
                              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity text-muted-foreground hover:text-foreground"
                              title="Copy Reference"
                            >
                              {copiedId === t.ticketNumber ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Subject */}
                        <td className="py-3 px-4 max-w-[280px]">
                          <div className="font-semibold text-foreground truncate">
                            {t.subject}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {t.description}
                          </div>
                        </td>

                        {/* Workspace */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="font-medium text-foreground">
                              {t.tenant?.name || "Workspace"}
                            </span>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border">
                              {t.tenant?.plan || "free"}
                            </span>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-medium text-foreground">
                            {t.createdBy?.name || "Customer"}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {t.createdBy?.email}
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge variant="outline" className={cn("text-[10px]", priorityInfo.badgeClass)}>
                            {priorityInfo.label}
                          </Badge>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
                              statusInfo.badgeClass
                            )}
                          >
                            <span className={cn("w-1.5 h-1.5 rounded-full", statusInfo.dotClass)} />
                            {statusInfo.label}
                          </span>
                        </td>

                        {/* Assignee */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {t.assignedTo ? (
                            <div className="flex items-center gap-1.5 text-foreground font-medium">
                              <UserCheck className="w-3.5 h-3.5 text-primary" />
                              <span>{t.assignedTo.name || t.assignedTo.email}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* Created At */}
                        <td className="py-3 px-4 whitespace-nowrap text-muted-foreground text-[11px]">
                          {formatRelativeTime(t.createdAt)}
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenTicket(t);
                            }}
                            className="h-8 px-2.5 text-xs font-semibold gap-1 text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-border/70 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Showing {tickets.length} of {totalCount} tickets
              </span>
              <CRMPagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalCount}
                rowsPerPage={15}
                onPageChange={setPage}
                onRowsPerPageChange={() => {}}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Details & Conversation Modal */}
      <Dialog
        open={Boolean(selectedTicketId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTicketId(null);
            setTicketDetails(null);
            setShowDiagnostics(false);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl border-border bg-card">
          {loadingDetails || !ticketDetails ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
              <p className="text-xs text-muted-foreground">Loading ticket conversation...</p>
            </div>
          ) : (
            <>
              {/* Modal Header */}
              <div className="p-5 border-b border-border/80 bg-muted/20 shrink-0 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary text-sm">
                        {ticketDetails.ticketNumber}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          PRIORITY_CONFIG[ticketDetails.priority]?.badgeClass
                        )}
                      >
                        {PRIORITY_CONFIG[ticketDetails.priority]?.label}
                      </Badge>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border",
                          STATUS_CONFIG[ticketDetails.status]?.badgeClass
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            STATUS_CONFIG[ticketDetails.status]?.dotClass
                          )}
                        />
                        {STATUS_CONFIG[ticketDetails.status]?.label}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-foreground">
                      {ticketDetails.subject}
                    </h2>
                  </div>

                  {/* Top Actions: Status & Assignee */}
                  <div className="flex items-center gap-2">
                    <Select
                      value={ticketDetails.status}
                      onValueChange={handleStatusChange}
                    >
                      <SelectTrigger className="h-8 text-xs font-semibold w-[150px]">
                        <SelectValue placeholder="Update Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="WAITING_FOR_USER">Waiting for User</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={ticketDetails.assignedToId || "unassigned"}
                      onValueChange={handleAssignTicket}
                    >
                      <SelectTrigger className="h-8 text-xs font-semibold w-[150px]">
                        <SelectValue placeholder="Assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {user?.id && (
                          <SelectItem value={user.id}>
                            Assign to Me ({user.name || "Super Admin"})
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Metadata Pills */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                  <div className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    <span className="font-semibold text-foreground">
                      {ticketDetails.tenant?.name}
                    </span>
                    <span>({ticketDetails.tenant?.plan})</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span>{ticketDetails.createdBy?.name}</span>
                    <span className="font-mono text-[11px]">
                      &lt;{ticketDetails.createdBy?.email}&gt;
                    </span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>Submitted {formatRelativeTime(ticketDetails.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Modal Body: Scrollable Thread */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0 bg-background/50">
                {/* Diagnostics Toggle */}
                {ticketDetails.diagnostics && (
                  <div className="border border-border/70 rounded-xl p-3 bg-muted/30 text-xs">
                    <button
                      type="button"
                      onClick={() => setShowDiagnostics((prev) => !prev)}
                      className="flex items-center justify-between w-full font-semibold text-foreground"
                    >
                      <span className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-primary" />
                        Client & System Diagnostics
                      </span>
                      <span className="text-primary text-[11px]">
                        {showDiagnostics ? "Hide Details" : "Show Details"}
                      </span>
                    </button>

                    {showDiagnostics && (
                      <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div>
                          <span className="text-muted-foreground">Browser: </span>
                          <span>{ticketDetails.diagnostics?.browser || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">OS: </span>
                          <span>{ticketDetails.diagnostics?.operatingSystem || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">URL: </span>
                          <span className="truncate block">
                            {ticketDetails.diagnostics?.currentUrl || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">App Version: </span>
                          <span>{ticketDetails.diagnostics?.appVersion || "1.2.0"}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Attachments */}
                {ticketDetails.attachments && ticketDetails.attachments.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Paperclip className="w-3 h-3" /> Attachments ({ticketDetails.attachments.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {ticketDetails.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={att.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-xs text-primary font-medium transition-colors"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span className="truncate max-w-[180px]">{att.fileName}</span>
                          <span className="text-[10px] text-muted-foreground">
                            ({Math.round(att.fileSize / 1024)} KB)
                          </span>
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Thread Messages */}
                <div className="space-y-3 pt-2">
                  {(ticketDetails.messages || []).map((msg) => {
                    if (msg.isInternal) {
                      return (
                        <div
                          key={msg.id}
                          className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                              <Lock className="w-3.5 h-3.5" />
                              Internal Staff Note (Hidden from Customer)
                            </span>
                            <span className="text-[10px] opacity-75">
                              {msg.sender?.name} • {formatRelativeTime(msg.createdAt)}
                            </span>
                          </div>
                          <div className="whitespace-pre-wrap leading-relaxed font-sans">
                            {msg.message}
                          </div>
                        </div>
                      );
                    }

                    const isCustomer = !msg.isStaff;

                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "p-3.5 rounded-xl text-xs space-y-1.5 border leading-relaxed",
                          isCustomer
                            ? "bg-muted/40 border-border/80 text-foreground mr-8"
                            : "bg-primary/5 border-primary/20 text-foreground ml-8"
                        )}
                      >
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span
                            className={cn(
                              isCustomer
                                ? "text-foreground font-bold"
                                : "text-primary font-bold flex items-center gap-1"
                            )}
                          >
                            {!isCustomer && <ShieldCheck className="w-3 h-3" />}
                            {msg.sender?.name || (isCustomer ? "Customer" : "Support Staff")}
                          </span>
                          <span className="text-muted-foreground text-[10px]">
                            {formatRelativeTime(msg.createdAt)}
                          </span>
                        </div>
                        <div className="whitespace-pre-wrap">{msg.message}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer: Reply Composer */}
              <div className="p-4 border-t border-border/80 bg-muted/20 shrink-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    Compose Response
                  </span>
                  <div className="flex items-center gap-1.5 bg-background border border-border p-0.5 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(false)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1",
                        !isInternalNote
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <MessageSquare className="w-3 h-3" /> Public Customer Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(true)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1",
                        isInternalNote
                          ? "bg-amber-600 text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Lock className="w-3 h-3" /> Internal Staff Note
                    </button>
                  </div>
                </div>

                <Textarea
                  placeholder={
                    isInternalNote
                      ? "Write an internal diagnostic note (e.g. database query findings, engineer handover notes). This will NOT be sent to the customer..."
                      : "Type your response to the customer. This will update the ticket and send an instant notification..."
                  }
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className={cn(
                    "text-xs min-h-[90px] resize-none",
                    isInternalNote && "border-amber-500/40 bg-amber-500/5 focus-visible:ring-amber-500"
                  )}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                      handleSendReply();
                    }
                  }}
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-muted-foreground">
                    Press <kbd className="font-mono bg-muted px-1 rounded">Cmd/Ctrl + Enter</kbd> to dispatch
                  </span>
                  <Button
                    size="sm"
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyText.trim()}
                    className={cn(
                      "text-xs font-semibold gap-1.5 h-8 px-4",
                      isInternalNote && "bg-amber-600 hover:bg-amber-700 text-white"
                    )}
                  >
                    <Send className="w-3 h-3" />
                    <span>
                      {sendingReply
                        ? "Posting..."
                        : isInternalNote
                        ? "Add Internal Note"
                        : "Send Reply"}
                    </span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </CRMPageContainer>
  );
}
