"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import {
  Ticket,
  Search,
  X,
  Plus,
  Download,
  RotateCcw,
  Trash2,
  AlertTriangle,
  MoreVertical,
  Edit,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Clock,
  Paperclip,
  MessageSquare,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { Label } from "@/shared/ui/label";
import { toast } from "sonner";
import client from "@/shared/lib/api/client";
import { formatBytes, cn } from "@/shared/lib/utils";
import { useAuth } from "@/features/auth/components/auth-provider";
import ReactMarkdown from "react-markdown";
import { TruncatedText } from "@/shared/components/TruncatedText";
import { formatTicketCode } from "@/shared/lib/ticket-utils";
import { EmptyState } from "@/shared/components/EmptyState";

export interface TicketItem {
  id: string;
  ticketId: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  category: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "OPEN" | "IN_PROGRESS" | "WAITING_FOR_USER" | "RESOLVED" | "CLOSED";
  description: string;
  diagnostics?: any;
  attachments?: {
    id?: string;
    filename: string;
    size: number;
    url?: string;
    contentType?: string;
  }[];
  estimatedResponseTime?: string;
  createdAt: string;
  updatedAt: string;
  replies?: Array<{
    id: string;
    author: string;
    authorRole: string;
    message: string;
    createdAt: string;
    isStaff: boolean;
  }>;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  OPEN: {
    label: "Open",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  WAITING_FOR_USER: {
    label: "Waiting for Reply",
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
    dot: "bg-purple-500",
  },
  RESOLVED: {
    label: "Resolved",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  CLOSED: {
    label: "Closed",
    color: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
};

const PRIORITY_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  Critical: {
    label: "Critical",
    color: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
  },
  High: {
    label: "High",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  },
  Medium: {
    label: "Medium",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  },
  Low: {
    label: "Low",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  },
};

const CATEGORIES = [
  "Bug Report",
  "Feature Request",
  "Billing & Subscription",
  "Technical Issue",
  "Account / Access",
  "General Inquiry",
];

const isImageFile = (filename: string, contentType?: string) => {
  if (contentType?.startsWith("image/")) return true;
  const ext = filename.toLowerCase().split(".").pop() || "";
  return ["png", "jpg", "jpeg", "webp", "gif", "svg", "bmp"].includes(ext);
};

const isVideoFile = (filename: string, contentType?: string) => {
  if (contentType?.startsWith("video/")) return true;
  const ext = filename.toLowerCase().split(".").pop() || "";
  return ["mp4", "webm", "mov", "avi", "mkv", "m4v"].includes(ext);
};

const getInitials = (name?: string) => {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

function UserAvatar({
  name,
  isStaff = false,
  size = "md",
  className = "",
}: {
  name?: string;
  isStaff?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = getInitials(name);
  const sizeClasses = {
    xs: "w-5 h-5 text-[9px]",
    sm: "w-7 h-7 text-[11px]",
    md: "w-8 h-8 text-xs",
    lg: "w-10 h-10 text-sm",
  }[size];

  if (isStaff) {
    return (
      <div
        className={cn(
          sizeClasses,
          "rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/25 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center ring-1 ring-blue-500/30 shadow-xs shrink-0 select-none",
          className
        )}
        title={name ? `${name} (Support Staff)` : "Support Staff"}
      >
        <AppIcon
          name="security"
          size={size === "xs" ? 11 : size === "sm" ? 13 : 15}
          className="text-blue-600 dark:text-blue-400"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        sizeClasses,
        "rounded-full bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center ring-1 ring-emerald-500/30 shadow-xs shrink-0 select-none",
        className
      )}
      title={name || "User"}
    >
      {initials}
    </div>
  );
}

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
  const [previewMedia, setPreviewMedia] = useState<{
    filename: string;
    url: string;
    size?: number;
    contentType?: string;
    isImage: boolean;
    isVideo: boolean;
  } | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.get("/support/tickets");
      const list = res.data?.data || [];
      setTickets(list);
    } catch (error) {
      console.error("Failed to load tickets:", error);
      toast.error("Could not fetch support tickets.");
    } finally {
      setLoading(false);
    }
  }, []);

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
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter, categoryFilter]);

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
      : (user?.role as any)?.name || (user as any)?.roleName || "";
  const normalizedUserRole = userRoleStr.toUpperCase();
  const isAdminOrOwner =
    normalizedUserRole === "ADMIN" ||
    normalizedUserRole === "SUPERADMIN" ||
    normalizedUserRole === "SUPER_ADMIN" ||
    normalizedUserRole === "OWNER" ||
    normalizedUserRole === "ORG_OWNER" ||
    Boolean((user as any)?.isSuperAdmin);

  const canManageTicket = (ticket: TicketItem | null): boolean => {
    if (!ticket) return false;
    if (isAdminOrOwner) return true;
    if (user?.id && (ticket.userId === user.id || ticket.userId === (user as any)?.sub)) return true;
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
    } catch (error: any) {
      console.error("Reply failed:", error);
      toast.error(error?.response?.data?.error?.message || error?.response?.data?.message || "Failed to send reply.");
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
    } catch (err: any) {
      console.error("Failed to update ticket:", err);
      toast.error(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
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
    } catch (err: any) {
      console.error("Failed to delete ticket:", err);
      toast.error(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
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

    return [...filtered].sort((a: any, b: any) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === "createdAt") {
        aVal = new Date(a.createdAt || 0).getTime();
        bVal = new Date(b.createdAt || 0).getTime();
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

      {/* 3. Bottom Pagination matching Companies / Invoices */}
      <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/50 text-xs font-medium text-muted-foreground bg-card shrink-0 mt-auto">
        <div>
          Showing{" "}
          <span className="font-semibold text-foreground">
            {filteredTickets.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
          </span>
          -
          <span className="font-semibold text-foreground">
            {Math.min(currentPage * rowsPerPage, filteredTickets.length)}
          </span>{" "}
          of <span className="font-semibold text-foreground">{filteredTickets.length}</span> Tickets
        </div>

        <div className="flex items-center gap-4 flex-wrap justify-end">
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

      {/* 4. Ticket Details & Discussion Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent
          showCloseButton={false}
          className="max-w-3xl w-full h-[90vh] max-h-[820px] p-0 gap-0 overflow-hidden flex flex-col rounded-2xl border border-border shadow-2xl bg-card"
        >
          {selectedTicket && (
            <>
              <DialogDescription className="sr-only">
                Ticket details, original report, diagnostic data, attachments, and conversation thread.
              </DialogDescription>

              {/* Sticky Top Header */}
              <div className="shrink-0 bg-card/95 backdrop-blur-md border-b border-border/80 p-5 sm:px-6 sm:py-4.5 space-y-3 relative z-10">
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Badges & Tags */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Ticket Reference Code with Copy button */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => copyId(selectedTicket.ticketId, e)}
                      className="font-mono text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors border border-primary/20 group whitespace-nowrap shrink-0 select-none"
                      title="Click to copy ticket reference"
                    >
                      <span className="whitespace-nowrap font-mono">#{selectedTicket.ticketId}</span>
                      {copiedId === selectedTicket.ticketId ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-primary/70 group-hover:text-primary shrink-0" />
                      )}
                    </div>

                    {/* Status Pill */}
                    <span
                      className={cn(
                        "text-[11px] font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1.5",
                        STATUS_CONFIG[selectedTicket.status]?.color || STATUS_CONFIG.OPEN.color
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full animate-pulse",
                          STATUS_CONFIG[selectedTicket.status]?.dot || "bg-blue-500"
                        )}
                      />
                      {STATUS_CONFIG[selectedTicket.status]?.label || selectedTicket.status}
                    </span>

                    {/* Priority Pill */}
                    <span
                      className={cn(
                        "text-[11px] font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1",
                        PRIORITY_CONFIG[selectedTicket.priority]?.color || PRIORITY_CONFIG.Medium.color
                      )}
                    >
                      {selectedTicket.priority} Priority
                    </span>

                    {/* Category */}
                    <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/40 hidden md:inline-flex items-center gap-1.5">
                      {selectedTicket.category}
                    </span>
                  </div>

                  {/* Right: Actions (Edit, Delete, Close) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isCreator && (
                      <>
                        {selectedTicket.status !== "CLOSED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs px-2.5 sm:px-3 gap-1.5 hover:border-primary/50 hover:bg-primary/5 hover:text-primary cursor-pointer rounded-lg font-medium transition-colors group"
                            onClick={() => handleOpenEdit(selectedTicket)}
                            title="Edit ticket subject & details"
                          >
                            <AppIcon name="edit" icon={Edit} size={14} className="text-primary" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs px-2.5 sm:px-3 gap-1.5 text-destructive hover:bg-destructive/10 hover:border-destructive/40 cursor-pointer rounded-lg font-medium transition-colors group"
                          onClick={() => handleOpenDelete(selectedTicket)}
                          title="Delete this ticket"
                        >
                          <AppIcon name="trash" icon={Trash2} size={14} className="text-destructive" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </>
                    )}

                    {/* Dedicated Close Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedTicket(null)}
                      className="h-8 w-8 p-0 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors group"
                      title="Close dialog"
                    >
                      <X className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                      <span className="sr-only">Close</span>
                    </Button>
                  </div>
                </div>

                {/* Subject Title */}
                <div>
                  <DialogTitle className="text-base sm:text-lg font-bold text-foreground tracking-tight leading-snug text-left">
                    {selectedTicket.subject}
                  </DialogTitle>
                </div>

                {/* Subtitle / Metadata Row */}
                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary/70" />
                    SLA Target:{" "}
                    <strong className="text-foreground font-semibold">
                      {selectedTicket.estimatedResponseTime || "Within 24 Hours"}
                    </strong>
                  </span>
                  <span className="text-border">•</span>
                  <span>
                    Created{" "}
                    {new Date(selectedTicket.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    at{" "}
                    {new Date(selectedTicket.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-border hidden sm:inline">•</span>
                  <span className="hidden sm:inline text-primary/80 font-medium">
                    {formatRelativeTime(selectedTicket.createdAt)}
                  </span>
                </div>
              </div>

              {/* Scrollable Modal Body */}
              <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Original Submission Card */}
                  <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
                    <div className="px-4 py-3 bg-muted/30 border-b border-border/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar name={selectedTicket.userName} size="sm" />
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground">
                            {selectedTicket.userName || "Requester"}
                          </span>
                          <span className="text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                            Author
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3 opacity-60" />
                          {new Date(selectedTicket.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="text-[9px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border/40">
                          Initial Report
                        </span>
                      </div>
                    </div>

                    <div className="px-4 py-4 text-sm text-foreground/90 leading-relaxed prose dark:prose-invert max-w-none">
                      <ReactMarkdown>{selectedTicket.description}</ReactMarkdown>
                    </div>

                    {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                      <div className="px-4 pb-4 border-t border-border/40 pt-3 space-y-2">
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Paperclip className="h-3 w-3 text-muted-foreground" />
                          Attachments ({selectedTicket.attachments.length})
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedTicket.attachments.map((att, idx) => {
                            const isImg = isImageFile(att.filename, att.contentType);
                            const isVid = isVideoFile(att.filename, att.contentType);
                            const hasUrl = Boolean(att.url);
                            return (
                              <div
                                key={idx}
                                onClick={() => {
                                  if (hasUrl) {
                                    if (isImg || isVid) {
                                      setPreviewMedia({
                                        filename: att.filename,
                                        url: att.url!,
                                        size: att.size,
                                        contentType: att.contentType,
                                        isImage: isImg,
                                        isVideo: isVid,
                                      });
                                    } else {
                                      window.open(att.url, "_blank", "noopener,noreferrer");
                                    }
                                  }
                                }}
                                className={cn(
                                  "flex items-center gap-3 p-2.5 rounded-lg border bg-muted/30 hover:border-primary/50 hover:bg-primary/5 transition-all group select-none",
                                  hasUrl ? "cursor-pointer" : "opacity-80"
                                )}
                              >
                                <div className="shrink-0 w-10 h-10 rounded-md bg-muted flex items-center justify-center overflow-hidden border border-border/60">
                                  {hasUrl && isImg ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={att.url} alt={att.filename} className="w-full h-full object-cover" />
                                  ) : hasUrl && isVid ? (
                                    <div className="relative w-full h-full flex items-center justify-center bg-black/80">
                                      <AppIcon name="play" size={16} className="text-white fill-white" />
                                    </div>
                                  ) : (
                                    <AppIcon name="file" size={18} className="text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p
                                    className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors"
                                    title={att.filename}
                                  >
                                    {att.filename}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] text-muted-foreground">
                                      {att.size ? formatBytes(att.size) : "—"}
                                    </span>
                                    {isImg && (
                                      <span className="text-[9px] px-1 py-0 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                                        IMG
                                      </span>
                                    )}
                                    {isVid && (
                                      <span className="text-[9px] px-1 py-0 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold uppercase">
                                        VID
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Conversation Replies Thread */}
                  {(() => {
                    const uniqueReplies = (selectedTicket.replies || []).filter(
                      (r) => r.message?.trim() !== selectedTicket.description?.trim()
                    );

                    if (uniqueReplies.length === 0) {
                      return (
                        <div className="text-center py-10 px-4 rounded-xl border border-dashed border-border/60 bg-muted/10">
                          <div className="flex justify-center mb-2.5">
                            <MessageSquare className="h-7 w-7 text-muted-foreground/30" />
                          </div>
                          <p className="text-sm font-semibold text-foreground">No replies yet</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Use the reply box below to send an update on this ticket.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 pb-1">
                          <MessageSquare className="h-3.5 w-3.5 text-primary" />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Conversation & Activity
                          </span>
                          <span className="text-[9px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                            {uniqueReplies.length}
                          </span>
                        </div>

                        {uniqueReplies.map((reply) => {
                          const isStaffReply = reply.isStaff;
                          return (
                            <div
                              key={reply.id}
                              className={cn(
                                "rounded-xl border bg-card overflow-hidden shadow-2xs",
                                isStaffReply
                                  ? "border-primary/25 ring-1 ring-primary/8"
                                  : "border-border/70"
                              )}
                            >
                              <div
                                className={cn(
                                  "px-4 py-2.5 border-b flex items-center justify-between gap-2",
                                  isStaffReply
                                    ? "bg-primary/5 border-primary/15"
                                    : "bg-muted/25 border-border/50"
                                )}
                              >
                                <div className="flex items-center gap-2.5">
                                  <UserAvatar name={reply.author} isStaff={isStaffReply} size="sm" />
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-foreground">
                                      {reply.author}
                                    </span>
                                    {isStaffReply ? (
                                      <span className="text-[9px] font-bold bg-primary text-primary-foreground py-0.5 px-2 rounded-full flex items-center gap-1">
                                        Support Staff
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                        {reply.authorRole || "Client"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium shrink-0">
                                  <Clock className="h-3 w-3 opacity-50" />
                                  {new Date(reply.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <div className="px-4 py-3.5 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                                {reply.message}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Sticky Reply Composer at Bottom */}
              <div className="shrink-0 bg-card/95 border-t border-border/80 p-4 sm:p-5 backdrop-blur-md space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <UserAvatar
                      name={user?.name || user?.email}
                      isStaff={
                        user?.role === "ADMIN" ||
                        user?.role === "SUPERADMIN" ||
                        (user as any)?.isSuperAdmin
                      }
                      size="xs"
                    />
                    <span>
                      Replying as{" "}
                      <strong className="text-primary font-bold">
                        {user?.name || user?.email?.split("@")[0] || "Workspace Member"}
                      </strong>
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">
                    Tip: Press <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[9px] font-mono">Ctrl+Enter</kbd> to send
                  </span>
                </div>

                <div className="relative">
                  <Textarea
                    placeholder="Write a follow-up, answer questions, or provide updates..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                        e.preventDefault();
                        if (!isReplying && replyText.trim()) {
                          handleSendReply();
                        }
                      }
                    }}
                    rows={3}
                    className="text-xs resize-none rounded-xl bg-background border-border focus-visible:ring-primary/20 pr-4"
                  />
                </div>

                <div className="flex items-center justify-end">
                  <Button
                    size="sm"
                    onClick={handleSendReply}
                    disabled={isReplying || !replyText.trim()}
                    className="text-xs font-semibold h-8.5 gap-1.5 px-4 cursor-pointer rounded-lg shadow-sm"
                  >
                    {isReplying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...
                      </>
                    ) : (
                      <>
                        <AppIcon name="send" size={14} className="text-primary-foreground" /> Send Reply
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 5. Edit Ticket Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setTargetTicket(null);
        }}
      >
        <DialogContent className="max-w-lg p-6 rounded-2xl">
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <AppIcon name="edit" icon={Edit} size={16} className="text-primary" />
              Edit Ticket #{activeEditTicket?.ticketId}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update the subject, category, priority, or problem description for this ticket.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Subject *</Label>
              <Input
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                placeholder="Brief summary of the issue..."
                className="text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Category</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Priority</Label>
                <Select
                  value={editPriority}
                  onValueChange={(val: any) => setEditPriority(val)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Description *</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={5}
                placeholder="Detailed description of the issue..."
                className="text-xs resize-y"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditDialogOpen(false);
                setTargetTicket(null);
              }}
              disabled={isSavingEdit}
              className="text-xs h-8 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveEdit}
              disabled={
                isSavingEdit ||
                !isEditDirty ||
                !editSubject.trim() ||
                !editDescription.trim()
              }
              className="text-xs h-8 gap-1.5 cursor-pointer font-semibold"
            >
              {isSavingEdit ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 6. Delete Single Ticket Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) setTargetTicket(null);
        }}
      >
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Ticket #{(targetTicket || selectedTicket)?.ticketId}?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
              Are you sure you want to permanently delete this support ticket? All associated
              conversation messages and uploaded attachments will be permanently removed. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-destructive/5 rounded-xl border border-destructive/20 text-xs text-foreground/80 space-y-1 my-1">
            <p className="font-semibold text-foreground truncate">
              {(targetTicket || selectedTicket)?.subject}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Submitted on{" "}
              {targetTicket || selectedTicket
                ? new Date((targetTicket || selectedTicket)!.createdAt).toLocaleDateString()
                : ""}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setTargetTicket(null);
              }}
              disabled={isDeleting}
              className="text-xs h-8 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteTicket}
              disabled={isDeleting}
              className="text-xs h-8 gap-1.5 font-semibold cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete Permanently"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 7. Delete Multiple Tickets Confirmation Modal */}
      <Dialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
      >
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete {selectedTicketIds.length} Support Tickets?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
              Are you sure you want to permanently delete {selectedTicketIds.length} selected support
              ticket(s)? All replies, notes, and attachments will be deleted permanently.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsBulkDeleteDialogOpen(false)}
              disabled={isBulkDeleting}
              className="text-xs h-8 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleBulkDeleteTickets}
              disabled={isBulkDeleting}
              className="text-xs h-8 gap-1.5 font-semibold cursor-pointer"
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
                </>
              ) : (
                `Delete (${selectedTicketIds.length}) Tickets`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 8. Media Preview Lightbox Modal */}
      <Dialog open={!!previewMedia} onOpenChange={(open) => !open && setPreviewMedia(null)}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-card/95 border-border rounded-2xl shadow-2xl backdrop-blur-xl">
          <DialogHeader className="p-4 border-b border-border/60 flex flex-row items-center justify-between space-y-0">
            <DialogTitle className="text-sm font-bold truncate pr-6 text-foreground flex items-center gap-2">
              {previewMedia?.filename}
            </DialogTitle>
            <DialogDescription className="sr-only">Attached media preview lightbox</DialogDescription>
          </DialogHeader>

          <div className="p-4 flex items-center justify-center bg-black/5 dark:bg-black/60 min-h-[300px] max-h-[72vh] overflow-hidden select-none">
            {previewMedia?.isVideo ? (
              <video
                src={previewMedia.url}
                controls
                autoPlay
                className="max-h-[68vh] w-auto max-w-full rounded-xl shadow-2xl"
              />
            ) : previewMedia?.isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewMedia.url}
                alt={previewMedia.filename}
                className="max-h-[68vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
              />
            ) : (
              <div className="text-center py-10">
                <AppIcon name="file" size={44} className="text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Preview not available for this file type.</p>
              </div>
            )}
          </div>

          <div className="p-3.5 bg-muted/40 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground px-5">
            <span className="font-mono font-medium">
              {previewMedia?.size ? formatBytes(previewMedia.size) : ""}
            </span>
            <div className="flex items-center gap-2">
              {previewMedia?.url && (
                <a
                  href={previewMedia.url}
                  download={previewMedia.filename}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-1.5 group cursor-pointer"
                >
                  <AppIcon name="download" icon={Download} size={14} className="text-primary" /> Download File
                </a>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

