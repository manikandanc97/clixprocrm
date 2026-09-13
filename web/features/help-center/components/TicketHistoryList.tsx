"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import {
  Ticket,
  Search,
  X,
  Plus,
  Download,
  RotateCcw,
  Trash2,
  MoreVertical,
  Edit,
  Eye,
  Paperclip,
  MessageSquare,
  Copy,
  Check,
} from "lucide-react";
import { CRMPagination } from "@/shared/components/crm";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { toast } from "sonner";
import client from "@/shared/lib/api/client";
import { cn } from "@/shared/lib/utils";
import { useAuth } from "@/features/auth/components/auth-provider";
import { TruncatedText } from "@/shared/components/TruncatedText";
import { formatTicketCode } from "@/shared/lib/ticket-utils";
import { EmptyState } from "@/shared/components/EmptyState";
import {
  TicketItem,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  CATEGORIES,
} from "./ticket-history/ticket-history.types";
import { UserAvatar } from "./ticket-history/UserAvatar";
import { TicketMediaPreviewDialog, PreviewMediaData } from "./ticket-history/TicketMediaPreviewDialog";
import { TicketDeleteDialog } from "./ticket-history/TicketDeleteDialog";
import { TicketEditModal } from "./ticket-history/TicketEditModal";
import { TicketDetailsModal } from "./ticket-history/TicketDetailsModal";

export type { TicketItem };


interface TicketHistoryListProps {
  onNewTicketClick?: () => void;
}

export function TicketHistoryList({ onNewTicketClick }: TicketHistoryListProps) {
  const { user } = useAuth();

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Selection & Pagination & Sorting
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{
    key: "ticketId" | "subject" | "userName" | "category" | "priority" | "status" | "createdAt";
    direction: "asc" | "desc";
  } | null>(null);

  const setSort = (key: "ticketId" | "subject" | "userName" | "category" | "priority" | "status" | "createdAt") => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        return null;
      }
      return { key, direction: "asc" };
    });
    setCurrentPage(1);
  };

  // Ticket modal details state
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit ticket state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editSubject, setEditSubject] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPriority, setEditPriority] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  const [editDescription, setEditDescription] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete ticket state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Target ticket for Edit / Delete operations
  const [targetTicket, setTargetTicket] = useState<TicketItem | null>(null);

  // Attachment media preview lightbox state
  const [previewMedia, setPreviewMedia] = useState<PreviewMediaData | null>(null);

  const handleSelectTicket = async (ticket: TicketItem) => {
    setSelectedTicket(ticket);
    try {
      const res = await client.get(`/support/tickets/${ticket.ticketId || ticket.id}`);
      if (res.data?.data) {
        setSelectedTicket(res.data.data);
        setTickets((prev) =>
          prev.map((t) => (t.ticketId === res.data.data.ticketId ? res.data.data : t))
        );
      }
    } catch {
      // Keep cached ticket state
    }
  };

  useEffect(() => {
    let active = true;
    client.get("/support/tickets")
      .then((res) => {
        if (!active) return;
        setTickets(res.data?.data || []);
      })
      .catch((error) => {
        if (!active) return;
        console.error("Failed to load tickets:", error);
        toast.error("Could not fetch support tickets.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const [prevFilterKey, setPrevFilterKey] = useState(
    `${searchTerm}::${statusFilter}::${priorityFilter}::${categoryFilter}`
  );
  const currentFilterKey = `${searchTerm}::${statusFilter}::${priorityFilter}::${categoryFilter}`;
  if (currentFilterKey !== prevFilterKey) {
    setPrevFilterKey(currentFilterKey);
    setCurrentPage(1);
  }

  // Active ticket being edited
  const activeEditTicket = targetTicket || selectedTicket;

  const isEditDirty = Boolean(
    activeEditTicket && (
      editSubject.trim() !== (activeEditTicket.subject || "").trim() ||
      editCategory !== (activeEditTicket.category || "General Inquiry") ||
      editPriority !== (activeEditTicket.priority || "Medium") ||
      editDescription.trim() !== (activeEditTicket.description || "").trim()
    )
  );

  // Safely extract user role string and determine privileges
  const userRoleStr =
    typeof user?.role === "string"
      ? user.role
      : (user?.role as { name?: string } | undefined)?.name || (user as { roleName?: string } | undefined)?.roleName || "";
  const normalizedUserRole = userRoleStr.toUpperCase();
  const isAdminOrOwner =
    normalizedUserRole === "ADMIN" ||
    normalizedUserRole === "SUPERADMIN" ||
    normalizedUserRole === "SUPER_ADMIN" ||
    normalizedUserRole === "OWNER" ||
    normalizedUserRole === "ORG_OWNER" ||
    Boolean((user as { isSuperAdmin?: boolean } | undefined)?.isSuperAdmin);

  const canManageTicket = (ticket: TicketItem | null): boolean => {
    if (!ticket) return false;
    if (isAdminOrOwner) return true;
    if (user?.id && (ticket.userId === user.id || ticket.userId === (user as { sub?: string } | undefined)?.sub)) return true;
    if (user?.email && ticket.userEmail?.toLowerCase() === user.email?.toLowerCase()) return true;
    return false;
  };

  const isCreator = canManageTicket(selectedTicket);

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;

    try {
      setIsReplying(true);
      const res = await client.post(`/support/tickets/${selectedTicket.ticketId}/reply`, {
        message: replyText.trim(),
      });
      const updatedTicket = res.data?.data;
      if (updatedTicket) {
        setSelectedTicket(updatedTicket);
        setTickets((prev) =>
          prev.map((t) => (t.ticketId === updatedTicket.ticketId ? updatedTicket : t))
        );
      }
      setReplyText("");
      toast.success("Reply added to ticket thread.");
    } catch (error: unknown) {
      console.error("Reply failed:", error);
      const errRes = error as { response?: { data?: { error?: { message?: string }; message?: string } } } | undefined;
      toast.error(errRes?.response?.data?.error?.message || errRes?.response?.data?.message || "Failed to send reply.");
    } finally {
      setIsReplying(false);
    }
  };

  const handleOpenEdit = (ticket: TicketItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedTicket(null);
    setTargetTicket(ticket);
    setEditSubject(ticket.subject);
    setEditCategory(ticket.category || "General Inquiry");
    setEditPriority(ticket.priority || "Medium");
    setEditDescription(ticket.description || "");
    setIsEditDialogOpen(true);
  };

  const handleOpenDelete = (ticket: TicketItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedTicket(null);
    setTargetTicket(ticket);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    const activeTarget = targetTicket || selectedTicket;
    if (!activeTarget) return;
    if (!editSubject.trim()) {
      toast.error("Subject is required");
      return;
    }
    if (!editDescription.trim()) {
      toast.error("Description cannot be empty");
      return;
    }

    try {
      setIsSavingEdit(true);
      const res = await client.patch(`/support/tickets/${activeTarget.ticketId || activeTarget.id}`, {
        subject: editSubject.trim(),
        category: editCategory,
        priority: editPriority,
        description: editDescription.trim(),
      });

      const updatedTicket = res.data?.data;
      if (updatedTicket) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === updatedTicket.id || t.ticketId === updatedTicket.ticketId ? updatedTicket : t
          )
        );
      }
      setIsEditDialogOpen(false);
      setTargetTicket(null);
      toast.success("Ticket updated successfully!");
    } catch (err: unknown) {
      console.error("Failed to update ticket:", err);
      const errRes = err as { response?: { data?: { error?: { message?: string }; message?: string } } } | undefined;
      toast.error(
        errRes?.response?.data?.error?.message ||
        errRes?.response?.data?.message ||
        "Failed to update ticket details."
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteTicket = async () => {
    const activeTarget = targetTicket || selectedTicket;
    if (!activeTarget) return;

    try {
      setIsDeleting(true);
      await client.delete(`/support/tickets/${activeTarget.ticketId || activeTarget.id}`);
      setTickets((prev) =>
        prev.filter((t) => t.id !== activeTarget.id && t.ticketId !== activeTarget.ticketId)
      );
      setSelectedTicketIds((prev) =>
        prev.filter((id) => id !== activeTarget.id && id !== activeTarget.ticketId)
      );
      setSelectedTicket(null);
      setIsDeleteDialogOpen(false);
      const deletedNumber = activeTarget.ticketId;
      setTargetTicket(null);
      toast.success(`Ticket #${deletedNumber} deleted successfully.`);
    } catch (err: unknown) {
      console.error("Failed to delete ticket:", err);
      const errRes = err as { response?: { data?: { error?: { message?: string }; message?: string } } } | undefined;
      toast.error(
        errRes?.response?.data?.error?.message ||
        errRes?.response?.data?.message ||
        "Failed to delete ticket."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDeleteTickets = async () => {
    if (selectedTicketIds.length === 0) return;

    try {
      setIsBulkDeleting(true);
      for (const id of selectedTicketIds) {
        try {
          await client.delete(`/support/tickets/${id}`);
        } catch (err) {
          console.error(`Failed to delete ticket ${id}`, err);
        }
      }
      setTickets((prev) =>
        prev.filter((t) => !selectedTicketIds.includes(t.id) && !selectedTicketIds.includes(t.ticketId))
      );
      toast.success(`${selectedTicketIds.length} ticket(s) deleted successfully.`);
      setSelectedTicketIds([]);
      setIsBulkDeleteDialogOpen(false);
    } catch {
      toast.error("Failed to complete bulk ticket deletion.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const copyId = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("Ticket ID copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

      if (diffInHours < 1) return "Just now";
      if (diffInHours < 24) return `${diffInHours}h ago`;
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return "Recently";
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return { date: "—", time: "" };
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

  const hasActiveFilters =
    statusFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    categoryFilter !== "ALL" ||
    searchTerm.trim().length > 0;

  const handleClearFilters = () => {
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setCategoryFilter("ALL");
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Filtered & Sorted ticket results
  const filteredTickets = useMemo(() => {
    const filtered = tickets.filter((t) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (t.ticketId && t.ticketId.toLowerCase().includes(q)) ||
        (t.subject && t.subject.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.userName && t.userName.toLowerCase().includes(q)) ||
        (t.userEmail && t.userEmail.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q));

      const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
      const matchesPriority = priorityFilter === "ALL" || t.priority === priorityFilter;
      const matchesCategory = categoryFilter === "ALL" || t.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });

    if (!sortConfig) return filtered;

    return [...filtered].sort((a: TicketItem, b: TicketItem) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === "createdAt") {
        aVal = new Date(a.createdAt || 0).getTime() as unknown as string;
        bVal = new Date(b.createdAt || 0).getTime() as unknown as string;
      } else {
        aVal = (aVal ?? "").toString().toLowerCase();
        bVal = (bVal ?? "").toString().toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [tickets, searchTerm, statusFilter, priorityFilter, categoryFilter, sortConfig]);

  const exportCSV = () => {
    if (tickets.length === 0) {
      toast.error("No support tickets available to export.");
      return;
    }
    const headers = [
      "Ticket ID",
      "Subject",
      "Requester Name",
      "Requester Email",
      "Category",
      "Priority",
      "Status",
      "Replies Count",
      "Created At",
    ];
    const rows = filteredTickets.map((t) => [
      t.ticketId || t.id,
      `"${(t.subject || "").replace(/"/g, '""')}"`,
      `"${(t.userName || "").replace(/"/g, '""')}"`,
      `"${(t.userEmail || "").replace(/"/g, '""')}"`,
      `"${(t.category || "").replace(/"/g, '""')}"`,
      t.priority || "Medium",
      t.status || "OPEN",
      t.replies?.length || 0,
      t.createdAt || "",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `clixpro_support_tickets_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Support tickets exported successfully.");
  };

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / rowsPerPage));
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
      {/* 1. Top Controls Toolbar matching Organizations & Companies table */}
      <div className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border/50 shrink-0">
        {/* Left: Filter Selects & Search Input */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_USER">Waiting for Reply</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-9 px-3 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-3 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer hidden sm:block"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
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
              placeholder="Search tickets..."
              className="h-9 pl-8 pr-8 rounded-lg bg-background border-border/70 text-xs shadow-xs focus-visible:ring-2 focus-visible:ring-primary/20"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground self-end lg:self-auto flex-wrap">
          {/* Multi-Select Delete Button with count */}
          {selectedTicketIds.length > 0 && (
            <button
              onClick={() => setIsBulkDeleteDialogOpen(true)}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-all shadow-xs cursor-pointer animate-in fade-in zoom-in-95 duration-150"
            >
              <AppIcon
                name="trash"
                icon={Trash2}
                size={14}
                className="w-3.5 h-3.5 text-rose-500 shrink-0"
              />
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
            <AppIcon
              name="export"
              icon={Download}
              size={14}
              className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
            />
            <span>Export</span>
          </button>

          {/* Create new ticket button */}
          {onNewTicketClick && (
            <Button
              onClick={onNewTicketClick}
              className="group bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-3.5 rounded-lg shadow-xs gap-1.5 cursor-pointer transition-colors"
            >
              <AppIcon
                name="plus"
                icon={Plus}
                size={14}
                className="w-3.5 h-3.5 text-white shrink-0"
              />
              <span>New Ticket</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Table Content - Vertical & Horizontal Scroll with Sticky Header */}
      <div className="overflow-auto flex-1 min-h-0 relative flex flex-col kanban-board-scroll">
        <table className="w-full text-left text-xs border-collapse min-w-[1050px] table-fixed">
          <colgroup>
            <col style={{ width: "48px" }} />
            <col style={{ width: "130px" }} />
            <col style={{ width: "280px" }} />
            <col style={{ width: "180px" }} />
            <col style={{ width: "150px" }} />
            <col style={{ width: "120px" }} />
            <col style={{ width: "140px" }} />
            <col style={{ width: "150px" }} />
            <col style={{ width: "64px" }} />
          </colgroup>
          <thead className="sticky top-0 z-20 bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-500/20 shadow-xs backdrop-blur-xs">
            <tr className="text-xs font-bold text-foreground">
              {/* Checkbox Header */}
              <th className="w-12 px-4 py-3.5 text-center bg-emerald-50/80 dark:bg-emerald-950/40 border-r border-emerald-500/15">
                <input
                  type="checkbox"
                  checked={
                    paginatedTickets.length > 0 &&
                    paginatedTickets.every((t) =>
                      selectedTicketIds.includes(t.ticketId || t.id)
                    )
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      const pageIds = paginatedTickets.map((t) => t.ticketId || t.id);
                      setSelectedTicketIds(
                        Array.from(new Set([...selectedTicketIds, ...pageIds]))
                      );
                    } else {
                      const pageIds = new Set(
                        paginatedTickets.map((t) => t.ticketId || t.id)
                      );
                      setSelectedTicketIds(
                        selectedTicketIds.filter((id) => !pageIds.has(id))
                      );
                    }
                  }}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
              </th>

              {/* Ticket ID */}
              <th
                className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                onClick={() => setSort("ticketId")}
              >
                <div className="flex items-center gap-1.5">
                  <span>Ticket ID</span>
                  {sortConfig?.key === "ticketId" && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>

              {/* Subject */}
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

              {/* Requester */}
              <th
                className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                onClick={() => setSort("userName")}
              >
                <div className="flex items-center gap-1.5">
                  <span>Requester</span>
                  {sortConfig?.key === "userName" && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>

              {/* Category */}
              <th
                className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                onClick={() => setSort("category")}
              >
                <div className="flex items-center gap-1.5">
                  <span>Category</span>
                  {sortConfig?.key === "category" && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>

              {/* Priority */}
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

              {/* Status */}
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

              {/* Created Date */}
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

              {/* Actions */}
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
                    <div className="h-5 w-20 bg-muted rounded" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1.5">
                      <div className="h-4 w-48 bg-muted rounded" />
                      <div className="h-3 w-28 bg-muted/60 rounded" />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 bg-muted rounded-full shrink-0" />
                      <div className="h-3.5 w-24 bg-muted rounded" />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-5 w-24 bg-muted rounded-md" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-5 w-16 bg-muted rounded-md" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-5 w-20 bg-muted rounded-full" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-3.5 w-20 bg-muted rounded" />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="h-7 w-7 bg-muted rounded ml-auto" />
                  </td>
                </tr>
              ))
            ) : paginatedTickets.length > 0 ? (
              paginatedTickets.map((ticket) => {
                const isSelected = selectedTicketIds.includes(
                  ticket.ticketId || ticket.id
                );
                const statusStyle =
                  STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
                const priorityStyle =
                  PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.Medium;
                const { date, time } = formatDate(ticket.createdAt);
                const hasReplies = ticket.replies && ticket.replies.length > 0;
                const hasAttachments =
                  ticket.attachments && ticket.attachments.length > 0;

                return (
                  <tr
                    key={ticket.id || ticket.ticketId}
                    className={cn(
                      "group h-16 hover:bg-muted/30 transition-colors cursor-pointer",
                      isSelected && "bg-primary/[0.03]"
                    )}
                    onClick={() => handleSelectTicket(ticket)}
                  >
                    {/* Checkbox */}
                    <td
                      className="px-4 py-3.5 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          const id = ticket.ticketId || ticket.id;
                          setSelectedTicketIds((prev) =>
                            prev.includes(id)
                              ? prev.filter((item) => item !== id)
                              : [...prev, id]
                          );
                        }}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                      />
                    </td>

                    {/* Ticket Code */}
                    <td className="px-4 py-3.5 font-medium overflow-hidden">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => copyId(ticket.ticketId, e)}
                        className="font-mono text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-md inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-primary/20"
                        title={`Click to copy ID (${ticket.ticketId})`}
                      >
                        <span>{formatTicketCode(ticket)}</span>
                        {copiedId === ticket.ticketId ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                        )}
                      </div>
                    </td>

                    {/* Subject & Activity indicators */}
                    <td className="px-4 py-3.5 overflow-hidden">
                      <div className="min-w-0 pr-2">
                        <TruncatedText
                          text={ticket.subject}
                          lines={1}
                          className="font-bold text-sm text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
                        />
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                          {hasAttachments && (
                            <span className="flex items-center gap-1 text-[10px] font-medium bg-muted px-1.5 py-0.2 rounded text-muted-foreground">
                              <Paperclip className="h-3 w-3 text-primary" />
                              {ticket.attachments?.length}
                            </span>
                          )}
                          {hasReplies && (
                            <span className="flex items-center gap-1 text-[10px] font-medium bg-primary/10 px-1.5 py-0.2 rounded text-primary">
                              <MessageSquare className="h-3 w-3" />
                              {ticket.replies?.length}
                            </span>
                          )}
                          <span className="truncate">{formatRelativeTime(ticket.createdAt)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Requester */}
                    <td className="px-4 py-3.5 overflow-hidden">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar name={ticket.userName} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs text-foreground truncate">
                            {ticket.userName || "User"}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono truncate">
                            {ticket.userEmail || "—"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-medium text-foreground bg-muted/60 px-2 py-1 rounded-md border border-border/40 inline-block truncate max-w-[130px]">
                        {ticket.category || "General Inquiry"}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1",
                          priorityStyle.color
                        )}
                      >
                        {priorityStyle.label}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1.5",
                          statusStyle.color
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusStyle.dot)} />
                        {statusStyle.label}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="px-4 py-3.5">
                      <p className="text-xs font-semibold text-foreground">{date}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{time}</p>
                    </td>

                    {/* Actions */}
                    <td
                      className="px-4 py-3.5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
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
                          className="w-44 rounded-xl p-1.5 shadow-lg border-border bg-popover text-popover-foreground"
                        >
                          <DropdownMenuItem
                            onClick={() => handleSelectTicket(ticket)}
                            className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 hover:bg-muted focus:bg-muted"
                          >
                            <AppIcon
                              name="eye"
                              icon={Eye}
                              size={14}
                              className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                            />
                            <span>View Details</span>
                          </DropdownMenuItem>

                          {canManageTicket(ticket) && ticket.status !== "CLOSED" && (
                            <DropdownMenuItem
                              onClick={(e) => handleOpenEdit(ticket, e)}
                              className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 hover:bg-muted focus:bg-muted"
                            >
                              <AppIcon
                                name="edit"
                                icon={Edit}
                                size={14}
                                className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                              />
                              <span>Edit Ticket</span>
                            </DropdownMenuItem>
                          )}

                          {canManageTicket(ticket) && (
                            <>
                              <DropdownMenuSeparator className="my-1" />
                              <DropdownMenuItem
                                onClick={(e) => handleOpenDelete(ticket, e)}
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
                            </>
                          )}
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
                      description={
                        hasActiveFilters
                          ? "No tickets match your current search or filter criteria."
                          : "You haven't submitted any support requests yet. If you need assistance, our support engineers are here to help."
                      }
                      className="border-none bg-transparent shadow-none p-0 min-h-0"
                      action={
                        hasActiveFilters
                          ? {
                              label: "Clear Filters",
                              onClick: handleClearFilters,
                              icon: RotateCcw,
                            }
                          : onNewTicketClick
                          ? {
                              label: "Submit a Ticket",
                              onClick: onNewTicketClick,
                              icon: Plus,
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

      {/* 3. Bottom Pagination */}
      <CRMPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredTickets.length}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={(rows) => {
          setRowsPerPage(rows);
          setCurrentPage(1);
        }}
        itemName="Tickets"
      />


      {/* 4. Ticket Details & Discussion Dialog */}
      <TicketDetailsModal
        selectedTicket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        isCreator={isCreator}
        copiedId={copiedId}
        copyId={copyId}
        handleOpenEdit={handleOpenEdit}
        handleOpenDelete={handleOpenDelete}
        setPreviewMedia={setPreviewMedia}
        replyText={replyText}
        setReplyText={setReplyText}
        isReplying={isReplying}
        handleSendReply={handleSendReply}
      />

      {/* 5. Edit Ticket Dialog */}
      <TicketEditModal
        isEditDialogOpen={isEditDialogOpen}
        setIsEditDialogOpen={setIsEditDialogOpen}
        activeEditTicket={activeEditTicket}
        editSubject={editSubject}
        setEditSubject={setEditSubject}
        editCategory={editCategory}
        setEditCategory={setEditCategory}
        editPriority={editPriority}
        setEditPriority={setEditPriority}
        editDescription={editDescription}
        setEditDescription={setEditDescription}
        isSavingEdit={isSavingEdit}
        isEditDirty={isEditDirty}
        onSaveEdit={handleSaveEdit}
        onCancel={() => {
          setIsEditDialogOpen(false);
          setTargetTicket(null);
        }}
      />

      {/* 6 & 7. Delete Single / Multiple Tickets Confirmation Dialog */}
      <TicketDeleteDialog
        isDeleteDialogOpen={isDeleteDialogOpen}
        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
        targetTicket={targetTicket}
        selectedTicket={selectedTicket}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setTargetTicket(null);
        }}
        onConfirmDelete={handleDeleteTicket}
        isDeleting={isDeleting}
        isBulkDeleteDialogOpen={isBulkDeleteDialogOpen}
        setIsBulkDeleteDialogOpen={setIsBulkDeleteDialogOpen}
        selectedTicketCount={selectedTicketIds.length}
        onConfirmBulkDelete={handleBulkDeleteTickets}
        isBulkDeleting={isBulkDeleting}
      />

      {/* 8. Media Preview Lightbox Modal */}
      <TicketMediaPreviewDialog
        previewMedia={previewMedia}
        onOpenChange={(open) => !open && setPreviewMedia(null)}
      />
    </div>
  );
}
