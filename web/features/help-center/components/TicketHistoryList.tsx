"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import {
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
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
import { Skeleton } from "@/shared/ui/skeleton";
import client from "@/shared/lib/api/client";
import { formatBytes, cn } from "@/shared/lib/utils";
import { useAuth } from "@/features/auth/components/auth-provider";
import ReactMarkdown from "react-markdown";
import { TruncatedText } from "@/shared/components/TruncatedText";
import { formatTicketCode } from "@/shared/lib/ticket-utils";

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

const STATUS_CONFIG = {
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

const PRIORITY_CONFIG = {
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
          "rounded-full bg-linear-to-br from-blue-500/20 to-indigo-500/25 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center ring-1 ring-blue-500/30 shadow-2xs shrink-0 select-none",
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
        "rounded-full bg-linear-to-br from-emerald-500/20 via-teal-500/15 to-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center ring-1 ring-emerald-500/30 shadow-2xs shrink-0 select-none",
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
  const router = useRouter();
  const { user } = useAuth();

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
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
    } catch (err) {
      // Keep cached ticket state
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Target ticket for Edit / Delete operations (supports both list view and modal view)
  const [targetTicket, setTargetTicket] = useState<TicketItem | null>(null);

  // Active ticket being edited (either from targetTicket or fallback to selectedTicket)
  const activeEditTicket = targetTicket || selectedTicket;

  // Track if any modifications have been made to the edit form
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

  // Determine if current logged in user created the selected ticket (or is Admin)
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

  const handleOpenEdit = (ticket: TicketItem) => {
    setSelectedTicket(null); // Close view modal so 2 popups never stack
    setTargetTicket(ticket);
    setEditSubject(ticket.subject);
    setEditCategory(ticket.category || "General Inquiry");
    setEditPriority(ticket.priority || "Medium");
    setEditDescription(ticket.description || "");
    setIsEditDialogOpen(true);
  };

  const handleOpenDelete = (ticket: TicketItem) => {
    setSelectedTicket(null); // Close view modal so 2 popups never stack
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

  // Filtered ticket results
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchesPriority = priorityFilter === "ALL" || t.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-4">
      {/* Filter and Action Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground pointer-events-none">
              <AppIcon name="search" size={15} />
            </div>
            <Input
              placeholder="Search by ticket ID, subject, keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-9 h-9 text-xs bg-background shadow-xs border-border"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground rounded-sm transition-colors cursor-pointer"
                title="Clear search"
              >
                <AppIcon name="close" size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs w-[130px] bg-background shadow-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="WAITING_FOR_USER">Waiting for Reply</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>

          {/* Priority filter */}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-9 text-xs w-[135px] bg-background shadow-xs">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>

          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTickets}
            disabled={loading}
            className="h-9 px-2.5 bg-background shadow-xs cursor-pointer"
            title="Refresh list"
          >
            <AppIcon name="refresh" size={14} className={loading ? "animate-spin" : ""} />
          </Button>

          {/* Create new ticket button */}
          {onNewTicketClick && (
            <Button size="sm" onClick={onNewTicketClick} className="h-9 text-xs gap-1.5 px-3.5 font-semibold cursor-pointer shadow-xs">
              <AppIcon name="plus" size={14} />
              <span>New Ticket</span>
            </Button>
          )}
        </div>
      </div>

      {/* Ticket List View */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl border bg-card space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-border bg-card/50">
          <AppIcon name="supportTickets" size={44} className="text-muted-foreground/40 mx-auto mb-3" />
          <h4 className="font-bold text-base text-foreground mb-1">No Tickets Found</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
            {searchTerm || statusFilter !== "ALL" || priorityFilter !== "ALL"
              ? "No tickets matched your current search filters. Try resetting the filters."
              : "You haven't submitted any support requests yet. If you need assistance, our support engineers are here to help."}
          </p>
          {onNewTicketClick && (
            <Button size="sm" onClick={onNewTicketClick} className="text-xs gap-1.5 cursor-pointer">
              <AppIcon name="plus" size={14} /> Submit a Ticket
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTickets.map((ticket) => {
            const statusStyle = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
            const priorityStyle = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.Medium;
            const hasReplies = ticket.replies && ticket.replies.length > 0;

            return (
              <Card
                key={ticket.id || ticket.ticketId}
                onClick={() => handleSelectTicket(ticket)}
                className="hover:border-primary/50 hover:shadow-sm cursor-pointer transition-all duration-200 bg-card group"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <UserAvatar name={ticket.userName} size="xs" />
                        {/* Ticket Number Badge with Copy */}
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => copyId(ticket.ticketId, e)}
                          className="font-mono text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer"
                          title={`Click to copy ID (${ticket.ticketId})`}
                        >
                          <span>{formatTicketCode(ticket)}</span>
                          {copiedId === ticket.ticketId ? (
                            <AppIcon name="check" size={12} className="text-emerald-500" />
                          ) : (
                            <AppIcon name="copy" size={11} className="opacity-70 hover:opacity-100" />
                          )}
                        </div>

                        {/* Status badge */}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${statusStyle.color}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                          {statusStyle.label}
                        </span>

                        {/* Priority badge */}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${priorityStyle.color}`}
                        >
                          {priorityStyle.label}
                        </span>

                        {/* Category */}
                        <span className="text-[11px] text-muted-foreground font-medium hidden md:inline">
                          • {ticket.category}
                        </span>
                      </div>

                      {/* Ticket Title (Subject Only) */}
                      <TruncatedText
                        text={ticket.subject}
                        lines={1}
                        className="font-bold text-sm text-foreground group-hover:text-primary transition-colors"
                      />
                    </div>

                    {/* Metadata column */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 text-[11px] text-muted-foreground shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                      <span className="flex items-center gap-1">
                        <AppIcon name="clock" size={12} />
                        {formatRelativeTime(ticket.createdAt)}
                      </span>

                      <div className="flex items-center gap-2">
                        {ticket.attachments && ticket.attachments.length > 0 && (
                          <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex items-center gap-1">
                            <AppIcon name="paperclip" size={12} className="text-primary" /> {ticket.attachments.length}
                          </span>
                        )}
                        {hasReplies && (
                          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <AppIcon name="messageSquare" size={12} /> {ticket.replies?.length}
                          </span>
                        )}

                        {/* Action buttons always normally visible for authorized users */}
                        {canManageTicket(ticket) && (
                          <div
                            className="flex items-center gap-1 text-muted-foreground ml-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {ticket.status !== "CLOSED" && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(ticket);
                                }}
                                className="p-1 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-md transition-colors cursor-pointer"
                                title="Edit ticket"
                              >
                                <AppIcon name="edit" size={13} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDelete(ticket);
                              }}
                              className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-md transition-colors cursor-pointer"
                              title="Delete ticket"
                            >
                              <AppIcon name="trash" size={13} />
                            </button>
                          </div>
                        )}

                        <AppIcon name="chevronRight" size={14} className="text-muted-foreground hidden sm:block" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Ticket Details & Discussion Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent
          showCloseButton={false}
          className="max-w-3xl w-full h-[90vh] max-h-[820px] p-0 gap-0 overflow-hidden flex flex-col rounded-2xl border border-border shadow-2xl bg-card"
        >
          {selectedTicket && (
            <>
              {/* Radix Accessibility Requirements */}
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
                        <AppIcon name="check" size={13} className="text-emerald-500 shrink-0" />
                      ) : (
                        <AppIcon name="copy" size={13} className="text-primary/70 group-hover:text-primary shrink-0" />
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
                      {selectedTicket.priority === "Critical" && <AppIcon name="alert" size={13} className="text-rose-500" />}
                      {selectedTicket.priority} Priority
                    </span>

                    {/* Category */}
                    <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/40 hidden md:inline-flex items-center gap-1.5">
                      <AppIcon name="tag" size={12} className="text-muted-foreground" />
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
                            <AppIcon name="edit" size={14} className="text-primary" />
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
                          <AppIcon name="trash" size={14} className="text-destructive" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </>
                    )}

                    {/* Custom Dedicated Close Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedTicket(null)}
                      className="h-8 w-8 p-0 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors group"
                      title="Close dialog"
                    >
                      <AppIcon name="close" size={16} className="text-muted-foreground group-hover:text-foreground" />
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
                    <AppIcon name="clock" size={13} className="text-primary/70" />
                    SLA Target:{" "}
                    <strong className="text-foreground font-semibold">
                      {selectedTicket.estimatedResponseTime || "Within 24 Hours"}
                    </strong>
                  </span>
                  <span className="text-border">•</span>
                  <span>
                    Created {new Date(selectedTicket.createdAt).toLocaleDateString(undefined, {
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
                {/* Unified Conversation Timeline */}
                <div className="p-5 sm:p-6 space-y-4">

                  {/* ── Original Submission (first card in the thread) ── */}
                  <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
                    {/* Card header */}
                    <div className="px-4 py-3 bg-muted/30 border-b border-border/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar name={selectedTicket.userName} size="sm" />
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground">{selectedTicket.userName || "Requester"}</span>
                          <span className="text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/20">Author</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <AppIcon name="clock" size={12} className="opacity-60" />
                          {new Date(selectedTicket.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="text-[9px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border/40">Initial Report</span>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="px-4 py-4 text-sm text-foreground/90 leading-relaxed prose dark:prose-invert max-w-none">
                      <ReactMarkdown>{selectedTicket.description}</ReactMarkdown>
                    </div>

                    {/* Attachments — inline below description */}
                    {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                      <div className="px-4 pb-4 border-t border-border/40 pt-3 space-y-2">
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <AppIcon name="paperclip" size={13} className="text-muted-foreground" />
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
                                      setPreviewMedia({ filename: att.filename, url: att.url!, size: att.size, contentType: att.contentType, isImage: isImg, isVideo: isVid });
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
                                {/* Thumbnail */}
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
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors" title={att.filename}>
                                    {att.filename}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] text-muted-foreground">{att.size ? formatBytes(att.size) : "—"}</span>
                                    {isImg && <span className="text-[9px] px-1 py-0 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase">IMG</span>}
                                    {isVid && <span className="text-[9px] px-1 py-0 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold uppercase">VID</span>}
                                  </div>
                                </div>
                                {/* Actions */}
                                {hasUrl && (
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isImg || isVid) {
                                          setPreviewMedia({ filename: att.filename, url: att.url!, size: att.size, contentType: att.contentType, isImage: isImg, isVideo: isVid });
                                        } else {
                                          window.open(att.url, "_blank");
                                        }
                                      }}
                                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
                                      title="Preview"
                                    >
                                      <AppIcon name="eye" size={14} className="text-muted-foreground group-hover:text-foreground" />
                                    </button>
                                    <a
                                      href={att.url}
                                      download={att.filename}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
                                      title="Download"
                                    >
                                      <AppIcon name="download" size={14} className="text-muted-foreground group-hover:text-foreground" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Replies / Conversation Thread ── */}
                  {(() => {
                    // Deduplicate: filter replies that are identical to the original description
                    const uniqueReplies = (selectedTicket.replies || []).filter(
                      (r) => r.message?.trim() !== selectedTicket.description?.trim()
                    );

                    if (uniqueReplies.length === 0) {
                      return (
                        <div className="text-center py-10 px-4 rounded-xl border border-dashed border-border/60 bg-muted/10">
                          <div className="flex justify-center mb-2.5">
                            <AppIcon name="messageSquare" size={28} className="text-muted-foreground/30" />
                          </div>
                          <p className="text-sm font-semibold text-foreground">No replies yet</p>
                          <p className="text-xs text-muted-foreground mt-1">Use the reply box below to send an update on this ticket.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {/* Thread label */}
                        <div className="flex items-center gap-2 pb-1">
                          <AppIcon name="messageSquare" size={14} className="text-primary" />
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
                              {/* Card Header: Avatar INSIDE box, next to name */}
                              <div className={cn(
                                "px-4 py-2.5 border-b flex items-center justify-between gap-2",
                                isStaffReply ? "bg-primary/5 border-primary/15" : "bg-muted/25 border-border/50"
                              )}>
                                <div className="flex items-center gap-2.5">
                                  <UserAvatar name={reply.author} isStaff={isStaffReply} size="sm" />
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-foreground">{reply.author}</span>
                                    {isStaffReply ? (
                                      <span className="text-[9px] font-bold bg-primary text-primary-foreground py-0.5 px-2 rounded-full flex items-center gap-1">
                                        <AppIcon name="circleCheck" size={11} className="text-primary-foreground" /> Support Staff
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                        {reply.authorRole || "Client"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium shrink-0">
                                  <AppIcon name="clock" size={12} className="opacity-50" />
                                  {new Date(reply.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              {/* Message body */}
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

              {/* Docked Sticky Reply Composer at Bottom */}
              <div className="shrink-0 bg-card/95 border-t border-border/80 p-4 sm:p-5 backdrop-blur-md space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <UserAvatar
                      name={user?.name || user?.email}
                      isStaff={user?.role === "ADMIN" || user?.role === "SUPERADMIN" || (user as any)?.isSuperAdmin}
                      size="xs"
                    />
                    <span>
                      Replying as{" "}
                      <strong className="text-primary font-bold">
                        {user?.name || user?.email?.split("@")[0] || "Workspace Member"}
                      </strong>
                    </span>
                    <span className="text-[9px] font-semibold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md border border-border/60">
                      {user?.role || "Member"}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">
                    Tip: Press <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[9px] font-mono">Ctrl+Enter</kbd> to quickly send
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

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground sm:hidden">
                    Press Ctrl+Enter to send
                  </span>
                  <div className="ml-auto">
                    <Button
                      size="sm"
                      onClick={handleSendReply}
                      disabled={isReplying || !replyText.trim()}
                      className="text-xs font-semibold h-8.5 gap-1.5 px-4 cursor-pointer rounded-lg shadow-sm group"
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
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Ticket Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setTargetTicket(null);
          }
        }}
      >
        <DialogContent className="max-w-lg p-6 rounded-2xl">
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <AppIcon name="edit" size={16} className="text-primary" />
              Edit Ticket #{activeEditTicket?.ticketId}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update the subject, category, priority, or problem description for this ticket.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Subject */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Subject *</Label>
              <Input
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                placeholder="Brief summary of the issue..."
                className="text-xs h-9"
              />
            </div>

            {/* Category & Priority Grid */}
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

            {/* Description */}
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
                <AppIcon name="close" size={14} className="mr-1.5" />
                Cancel
              </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveEdit}
              disabled={isSavingEdit || !isEditDirty || !editSubject.trim() || !editDescription.trim()}
              className="text-xs h-8 gap-1.5 cursor-pointer font-semibold group"
            >
              {isSavingEdit ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <AppIcon name="circleCheck" size={14} className="text-primary-foreground" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Ticket Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setTargetTicket(null);
          }
        }}
      >
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AppIcon name="alert" size={18} className="text-destructive" />
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
              Submitted on {(targetTicket || selectedTicket) ? new Date((targetTicket || selectedTicket)!.createdAt).toLocaleDateString() : ""}
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
              <AppIcon name="close" size={14} className="mr-1.5" />
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteTicket}
              disabled={isDeleting}
              className="text-xs h-8 gap-1.5 font-semibold cursor-pointer group"
            >
              {isDeleting ? (
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

      {/* Media Preview Lightbox Modal (Images & Videos) */}
      <Dialog open={!!previewMedia} onOpenChange={(open) => !open && setPreviewMedia(null)}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-card/95 border-border rounded-2xl shadow-2xl backdrop-blur-xl">
          <DialogHeader className="p-4 border-b border-border/60 flex flex-row items-center justify-between space-y-0">
            <DialogTitle className="text-sm font-bold truncate pr-6 text-foreground flex items-center gap-2">
              {previewMedia?.isVideo ? (
                <AppIcon name="video" size={16} className="text-indigo-500" />
              ) : (
                <AppIcon name="image" size={16} className="text-emerald-500" />
              )}
              <span className="truncate">{previewMedia?.filename}</span>
            </DialogTitle>
            <DialogDescription className="sr-only">Attached media preview lightbox</DialogDescription>
          </DialogHeader>

          {/* Media Player / Image Viewer Container */}
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

          {/* Lightbox Footer with Download and Metadata */}
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
                  <AppIcon name="download" size={14} className="text-primary" /> Download File
                </a>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
