"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  fetchPlatformSupportTicketDetails,
  updatePlatformSupportTicketStatus,
  assignPlatformSupportTicket,
  updatePlatformSupportTicket,
  replyPlatformSupportTicket,
  deletePlatformSupportTicket,
  PlatformSupportTicket,
} from "@/shared/lib/api/super-admin.api";
import { useAuth } from "@/features/auth/components/auth-provider";
import { CRMPageContainer, CRMActionMenu } from "@/shared/components/crm";
import { formatTicketCode } from "@/shared/lib/ticket-utils";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { toast } from "sonner";
import { cn, formatBytes } from "@/shared/lib/utils";
import { Loader2, ArrowLeft, MoreHorizontal, Check, RefreshCw } from "lucide-react";

// Status configuration map
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

// Priority configuration map
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

const CATEGORY_OPTIONS = [
  "Bug Report",
  "Feature Request",
  "Billing Issue",
  "Account Access",
  "Integration",
  "General Inquiry",
];

const formatRelativeTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recently";
    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSecs < 60) return "just now";
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  } catch {
    return "Recently";
  }
};

const getInitials = (name?: string) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

function UserAvatar({
  name,
  isStaff,
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

const isImageFile = (filename?: string, contentType?: string) => {
  if (contentType?.startsWith("image/")) return true;
  if (!filename) return false;
  return /\.(png|jpe?g|webp|gif|svg|bmp|ico)$/i.test(filename);
};

const isVideoFile = (filename?: string, contentType?: string) => {
  if (contentType?.startsWith("video/")) return true;
  if (!filename) return false;
  return /\.(mp4|webm|mov|m4v|ogg)$/i.test(filename);
};

export default function SuperAdminTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<PlatformSupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Inline Subject Editing
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [subjectDraft, setSubjectDraft] = useState("");
  const [savingSubject, setSavingSubject] = useState(false);

  // Field Saving States for subtle feedback
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingPriority, setSavingPriority] = useState(false);
  const [savingAssignee, setSavingAssignee] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);

  // Reply Composer
  const [replyText, setReplyText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  // Delete Confirmation Modal
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingTicket, setDeletingTicket] = useState(false);

  // Media Lightbox Preview
  const [previewMedia, setPreviewMedia] = useState<{
    filename: string;
    url: string;
    size?: number;
    contentType?: string;
    isImage: boolean;
    isVideo: boolean;
  } | null>(null);

  // Load Ticket Data
  const loadTicket = useCallback(async () => {
    if (!ticketId) return;
    try {
      setLoading(true);
      const data = await fetchPlatformSupportTicketDetails(ticketId);
      setTicket(data);
      setSubjectDraft(data.subject);
    } catch (err: any) {
      console.error("Failed to load ticket:", err);
      toast.error("Could not find ticket or load ticket thread.");
      router.push("/super-admin/support");
    } finally {
      setLoading(false);
    }
  }, [ticketId, router]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  const copyId = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success(`Copied ticket #${id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Inline Subject Save
  const handleSaveSubject = async () => {
    if (!ticket || !subjectDraft.trim() || subjectDraft.trim() === ticket.subject) {
      setIsEditingSubject(false);
      return;
    }
    try {
      setSavingSubject(true);
      const updated = await updatePlatformSupportTicket(ticket.id, {
        subject: subjectDraft.trim(),
      });
      setTicket(updated);
      setIsEditingSubject(false);
      toast.success("Subject updated successfully");
    } catch (err: any) {
      console.error("Failed to update subject:", err);
      toast.error(err.response?.data?.message || "Failed to update subject");
    } finally {
      setSavingSubject(false);
    }
  };

  // Inline Status Change
  const handleStatusChange = async (newStatus: string) => {
    if (!ticket || ticket.status === newStatus) return;
    try {
      setSavingStatus(true);
      const updated = await updatePlatformSupportTicketStatus(ticket.id, newStatus);
      setTicket(updated);
      toast.success(`Status changed to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
    } catch (err: any) {
      console.error("Failed to update status:", err);
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setSavingStatus(false);
    }
  };

  // Inline Priority Change
  const handlePriorityChange = async (newPriority: string) => {
    if (!ticket || ticket.priority === newPriority) return;
    try {
      setSavingPriority(true);
      const updated = await updatePlatformSupportTicket(ticket.id, {
        priority: newPriority,
      });
      setTicket(updated);
      toast.success(`Priority updated to ${PRIORITY_CONFIG[newPriority]?.label || newPriority}`);
    } catch (err: any) {
      console.error("Failed to update priority:", err);
      toast.error(err.response?.data?.message || "Failed to update priority");
    } finally {
      setSavingPriority(false);
    }
  };

  // Inline Assignee Change
  const handleAssigneeChange = async (newAssigneeId: string) => {
    if (!ticket) return;
    const targetId = newAssigneeId === "unassigned" ? null : newAssigneeId;
    if (ticket.assignedToId === targetId) return;
    try {
      setSavingAssignee(true);
      const updated = await assignPlatformSupportTicket(ticket.id, targetId);
      setTicket(updated);
      toast.success(targetId ? "Ticket assigned successfully" : "Ticket unassigned");
    } catch (err: any) {
      console.error("Failed to assign ticket:", err);
      toast.error(err.response?.data?.message || "Failed to assign ticket");
    } finally {
      setSavingAssignee(false);
    }
  };

  // Inline Category Change
  const handleCategoryChange = async (newCategory: string) => {
    if (!ticket || ticket.category === newCategory) return;
    try {
      setSavingCategory(true);
      const updated = await updatePlatformSupportTicket(ticket.id, {
        category: newCategory,
      });
      setTicket(updated);
      toast.success(`Category updated to ${newCategory}`);
    } catch (err: any) {
      console.error("Failed to update category:", err);
      toast.error(err.response?.data?.message || "Failed to update category");
    } finally {
      setSavingCategory(false);
    }
  };

  // Send Reply or Internal Note
  const handleSendReply = async () => {
    if (!ticket || !replyText.trim()) return;
    try {
      setSendingReply(true);
      const updated = await replyPlatformSupportTicket(
        ticket.id,
        replyText.trim(),
        isInternalNote
      );
      setTicket(updated);
      setReplyText("");
      toast.success(
        isInternalNote ? "Internal staff note recorded" : "Reply sent to customer"
      );
    } catch (err: any) {
      console.error("Failed to send reply:", err);
      toast.error(err.response?.data?.message || "Failed to send response");
    } finally {
      setSendingReply(false);
    }
  };

  // Delete Ticket
  const handleDeleteTicket = async () => {
    if (!ticket) return;
    try {
      setDeletingTicket(true);
      await deletePlatformSupportTicket(ticket.id);
      toast.success(`Ticket #${ticket.ticketNumber} permanently deleted`);
      setIsDeleteDialogOpen(false);
      router.push("/super-admin/support");
    } catch (err: any) {
      console.error("Failed to delete ticket:", err);
      toast.error(err.response?.data?.message || "Failed to delete ticket");
      setDeletingTicket(false);
    }
  };

  if (loading || !ticket) {
    return (
      <CRMPageContainer>
        {/* Full-Page Skeleton */}
        <div className="space-y-6 animate-pulse">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between pb-4 border-b border-border/80">
            <div className="h-6 w-36 bg-muted/60 rounded-md" />
            <div className="h-8 w-20 bg-muted/60 rounded-lg" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-32 bg-muted/60 rounded-lg" />
              <div className="h-7 w-24 bg-muted/50 rounded-lg" />
            </div>
            <div className="h-8 w-2/3 bg-muted/70 rounded-lg" />
            <div className="h-4 w-96 bg-muted/40 rounded" />
          </div>

          {/* 2-Column Skeleton Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
            <div className="lg:col-span-8 space-y-4">
              <div className="h-48 bg-muted/30 rounded-2xl border border-border/60" />
              <div className="h-32 bg-muted/20 rounded-2xl border border-border/60" />
              <div className="h-36 bg-muted/30 rounded-2xl border border-border/60" />
            </div>
            <div className="lg:col-span-4">
              <div className="h-80 bg-muted/30 rounded-2xl border border-border/60" />
            </div>
          </div>
        </div>
      </CRMPageContainer>
    );
  }

  // Deduplicate follow-up messages from initial ticket description
  const followUpMessages = (ticket.messages || []).filter(
    (m) => m.message?.trim() !== ticket.description?.trim()
  );

  return (
    <CRMPageContainer>
      {/* ── TOP UTILITY & BREADCRUMB BAR ── */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-border/80">
        <Link
          href="/super-admin/support"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Support Inbox</span>
        </Link>

        {/* Action Controls: More Menu */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={loadTicket}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
            title="Refresh ticket thread"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="sr-only">Refresh</span>
          </Button>

          {/* Non-destructive More menu */}
          <CRMActionMenu
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs font-medium gap-1.5 rounded-lg border-border/80 hover:bg-muted cursor-pointer"
              >
                <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                <span>More</span>
              </Button>
            }
            items={[
              {
                label: "Delete Ticket",
                icon: "trash",
                variant: "destructive" as const,
                onClick: () => setIsDeleteDialogOpen(true),
              },
            ]}
          />
        </div>
      </div>

      {/* ── PRIMARY TICKET HEADER ── */}
      <div className="py-4 space-y-3">
        {/* Row 1: Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Ticket Reference Code with Copy button */}
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => copyId(ticket.ticketNumber, e)}
            className="font-mono text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors border border-primary/20 group whitespace-nowrap shrink-0 select-none"
            title={`Click to copy ticket reference (${ticket.ticketNumber})`}
          >
            <span className="whitespace-nowrap font-mono">{formatTicketCode(ticket)}</span>
            {ticket.ticketNumber !== formatTicketCode(ticket) && (
              <span className="opacity-60 text-[10px] hidden sm:inline">({ticket.ticketNumber})</span>
            )}
            {copiedId === ticket.ticketNumber ? (
              <AppIcon name="check" size={13} className="text-emerald-500 shrink-0" />
            ) : (
              <AppIcon name="copy" size={13} className="text-primary/70 group-hover:text-primary shrink-0" />
            )}
          </div>

          {/* Workspace Pill */}
          {ticket.tenant && (
            <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-lg border border-border/40 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
              <AppIcon name="companies" size={12} className="text-muted-foreground shrink-0" />
              <span className="font-semibold text-foreground">{ticket.tenant.name}</span>
              {ticket.tenant.plan && (
                <span className="text-[10px] text-muted-foreground/80 font-normal">
                  ({ticket.tenant.plan})
                </span>
              )}
            </span>
          )}

          {/* Category Pill */}
          {ticket.category && (
            <span className="text-[11px] font-medium text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md border border-border/30 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
              <AppIcon name="tag" size={11} className="text-primary/70 shrink-0" />
              {ticket.category}
            </span>
          )}
        </div>

        {/* Row 2: Subject with Inline Editing */}
        <div className="flex items-center gap-3">
          {isEditingSubject ? (
            <div className="flex items-center gap-2 flex-1 max-w-2xl">
              <Input
                value={subjectDraft}
                onChange={(e) => setSubjectDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveSubject();
                  if (e.key === "Escape") {
                    setSubjectDraft(ticket.subject);
                    setIsEditingSubject(false);
                  }
                }}
                autoFocus
                className="h-10 text-base font-bold text-foreground"
                placeholder="Enter ticket subject..."
              />
              <Button
                size="sm"
                onClick={handleSaveSubject}
                disabled={savingSubject || !subjectDraft.trim()}
                className="h-10 px-3 text-xs font-semibold cursor-pointer shrink-0"
              >
                {savingSubject ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSubjectDraft(ticket.subject);
                  setIsEditingSubject(false);
                }}
                className="h-10 px-3 text-xs cursor-pointer shrink-0"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 group">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {ticket.subject}
              </h1>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditingSubject(true)}
                className="h-7 px-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground cursor-pointer rounded-md transition-opacity"
                title="Edit subject inline"
              >
                <AppIcon name="edit" size={13} className="mr-1" />
                Edit
              </Button>
            </div>
          )}
        </div>

        {/* Row 3: Metadata Summary */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <AppIcon name="user" size={12} className="text-primary/70" />
            Requester: <strong className="text-foreground font-semibold">{ticket.createdBy?.name || "Customer"}</strong>
            {ticket.createdBy?.email && (
              <span className="text-[11px] text-muted-foreground font-mono">
                &lt;{ticket.createdBy.email}&gt;
              </span>
            )}
          </span>
          <span className="text-border hidden sm:inline">•</span>
          <span className="flex items-center gap-1">
            <AppIcon name="clock" size={12} className="text-primary/70" />
            Submitted {formatRelativeTime(ticket.createdAt)}
          </span>
          <span className="text-border hidden sm:inline">•</span>
          <span>
            Last updated {formatRelativeTime(ticket.updatedAt)}
          </span>
        </div>
      </div>

      {/* ── TWO-COLUMN DESKTOP ENTERPRISE LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 items-start">
        {/* ── LEFT / MAIN COLUMN: CONVERSATION TIMELINE & COMPOSER (8 COLS) ── */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Initial Report Card */}
          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
            {/* Card Header */}
            <div className="px-5 py-3.5 bg-muted/30 border-b border-border/60 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <UserAvatar name={ticket.createdBy?.name || "Customer"} size="sm" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      {ticket.createdBy?.name || "Requester"}
                    </span>
                    <span className="text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Requester
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                  <AppIcon name="clock" size={12} className="opacity-50" />
                  {formatRelativeTime(ticket.createdAt)}
                </span>
                <span className="text-[9px] font-semibold text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-md border border-border/50">
                  Initial Report
                </span>
              </div>
            </div>

            {/* Card Description */}
            <div className="p-5 sm:p-6 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {ticket.description || "No description provided."}
            </div>

            {/* Inline Attachments */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-2.5 bg-muted/10">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <AppIcon name="paperclip" size={13} className="text-muted-foreground" />
                  Attachments ({ticket.attachments.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ticket.attachments.map((att, idx) => {
                    const isImg = isImageFile(att.fileName, att.fileType);
                    const isVid = isVideoFile(att.fileName, att.fileType);
                    const hasUrl = Boolean(att.fileUrl);
                    return (
                      <div
                        key={att.id || idx}
                        onClick={() => {
                          if (hasUrl) {
                            if (isImg || isVid) {
                              setPreviewMedia({
                                filename: att.fileName,
                                url: att.fileUrl,
                                size: att.fileSize,
                                contentType: att.fileType,
                                isImage: isImg,
                                video: isVid,
                              } as any);
                            } else {
                              window.open(att.fileUrl, "_blank", "noopener,noreferrer");
                            }
                          }
                        }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all group select-none shadow-2xs",
                          hasUrl ? "cursor-pointer" : "opacity-80"
                        )}
                      >
                        {/* Thumbnail */}
                        <div className="shrink-0 w-11 h-11 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border/60">
                          {hasUrl && isImg ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={att.fileUrl} alt={att.fileName} className="w-full h-full object-cover" />
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
                          <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors" title={att.fileName}>
                            {att.fileName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">
                              {att.fileSize ? formatBytes(att.fileSize) : "—"}
                            </span>
                            {isImg && (
                              <span className="text-[9px] px-1.5 py-0 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                                IMG
                              </span>
                            )}
                            {isVid && (
                              <span className="text-[9px] px-1.5 py-0 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold uppercase">
                                VID
                              </span>
                            )}
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
                                  setPreviewMedia({
                                    filename: att.fileName,
                                    url: att.fileUrl,
                                    size: att.fileSize,
                                    contentType: att.fileType,
                                    isImage: isImg,
                                    video: isVid,
                                  } as any);
                                } else {
                                  window.open(att.fileUrl, "_blank");
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
                              title="Preview"
                            >
                              <AppIcon name="eye" size={14} className="text-muted-foreground group-hover:text-foreground" />
                            </button>
                            <a
                              href={att.fileUrl}
                              download={att.fileName}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
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

          {/* Conversation Messages Timeline */}
          {followUpMessages.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1">
                <AppIcon name="messageSquare" size={14} className="text-primary" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Conversation Thread
                </span>
                <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                  {followUpMessages.length}
                </span>
              </div>

              {followUpMessages.map((msg) => {
                if (msg.isInternal) {
                  return (
                    <div
                      key={msg.id}
                      className="rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 overflow-hidden shadow-xs"
                    >
                      <div className="px-5 py-3 border-b border-amber-500/20 bg-amber-500/10 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] font-bold bg-amber-500 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <AppIcon name="lock" size={11} className="text-white" /> Internal Staff Note
                          </span>
                          <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                            {msg.sender?.name || "Support Staff"}
                          </span>
                        </div>
                        <span className="text-[10px] text-amber-800/70 dark:text-amber-300/70 flex items-center gap-1 font-medium">
                          <AppIcon name="clock" size={11} />
                          {formatRelativeTime(msg.createdAt)}
                        </span>
                      </div>
                      <div className="p-5 text-xs sm:text-sm text-amber-950 dark:text-amber-100 whitespace-pre-wrap leading-relaxed">
                        {msg.message}
                      </div>
                    </div>
                  );
                }

                const isStaff = Boolean(msg.isStaff);

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "rounded-2xl border bg-card overflow-hidden shadow-xs",
                      isStaff ? "border-primary/25 ring-1 ring-primary/8" : "border-border/70"
                    )}
                  >
                    <div
                      className={cn(
                        "px-5 py-3 border-b flex items-center justify-between gap-2",
                        isStaff ? "bg-primary/5 border-primary/15" : "bg-muted/25 border-border/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar name={msg.sender?.name || (isStaff ? "Support Staff" : "Customer")} isStaff={isStaff} size="sm" />
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">
                            {msg.sender?.name || (isStaff ? "Support Staff" : "Customer")}
                          </span>
                          {isStaff ? (
                            <span className="text-[9px] font-bold bg-primary text-primary-foreground py-0.5 px-2 rounded-full flex items-center gap-1">
                              <AppIcon name="circleCheck" size={11} className="text-primary-foreground" /> Support Staff
                            </span>
                          ) : (
                            <span className="text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              Client
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium shrink-0">
                        <AppIcon name="clock" size={12} className="opacity-50" />
                        {formatRelativeTime(msg.createdAt)}
                      </span>
                    </div>
                    <div className="p-5 text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      {msg.message}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── BOTTOM REPLY COMPOSER ── */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-foreground">
                Compose Response
              </span>
              <div className="flex items-center gap-1 bg-muted/80 p-1 rounded-xl border border-border/60 text-xs">
                <button
                  type="button"
                  onClick={() => setIsInternalNote(false)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer",
                    !isInternalNote
                      ? "bg-background text-foreground shadow-xs border border-border/60"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <AppIcon name="messageSquare" size={13} className={!isInternalNote ? "text-primary" : "text-muted-foreground"} />
                  <span>Public Customer Reply</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsInternalNote(true)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer",
                    isInternalNote
                      ? "bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30 shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <AppIcon name="lock" size={13} className={isInternalNote ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"} />
                  <span>Internal Staff Note</span>
                </button>
              </div>
            </div>

            <Textarea
              placeholder={
                isInternalNote
                  ? "Write an internal diagnostic note (visible ONLY to support staff and administrators)..."
                  : "Type your response to the customer. This will update the ticket and dispatch an instant notification..."
              }
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className={cn(
                "text-xs sm:text-sm min-h-[110px] resize-none bg-background rounded-xl border-border/80 focus-visible:ring-2 focus-visible:ring-primary/20",
                isInternalNote && "border-amber-500/40 bg-amber-500/5 focus-visible:ring-amber-500/30"
              )}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  handleSendReply();
                }
              }}
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                Press <kbd className="font-mono bg-muted border border-border/70 px-1.5 py-0.5 rounded-md text-[10px] text-muted-foreground font-semibold">Cmd/Ctrl + Enter</kbd> to dispatch
              </span>
              <Button
                size="sm"
                onClick={handleSendReply}
                disabled={sendingReply || !replyText.trim()}
                className={cn(
                  "text-xs font-semibold gap-1.5 h-9 px-4 rounded-xl shadow-xs cursor-pointer transition-all",
                  isInternalNote
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                )}
              >
                {sendingReply ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <AppIcon name="send" size={14} className="text-primary-foreground" />
                    {isInternalNote ? "Save Internal Note" : "Send Reply"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: STICKY TICKET PROPERTIES SIDEBAR (4 COLS) ── */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
          {/* Ticket Management Controls Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider pb-2 border-b border-border/60">
              Ticket Properties
            </h3>

            {/* Status Inline Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground">Status</label>
                {savingStatus && (
                  <span className="text-[10px] text-primary flex items-center gap-1">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" /> Saving...
                  </span>
                )}
              </div>
              <Select value={ticket.status} onValueChange={handleStatusChange} disabled={savingStatus}>
                <SelectTrigger className="h-9 text-xs font-semibold px-3 rounded-xl border bg-background w-full gap-2 shadow-2xs cursor-pointer">
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full animate-pulse shrink-0",
                        STATUS_CONFIG[ticket.status]?.dotClass || "bg-blue-500"
                      )}
                    />
                    <SelectValue placeholder="Select status" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="WAITING_FOR_USER">Waiting for User</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority Inline Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground">Priority</label>
                {savingPriority && (
                  <span className="text-[10px] text-primary flex items-center gap-1">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" /> Saving...
                  </span>
                )}
              </div>
              <Select value={ticket.priority} onValueChange={handlePriorityChange} disabled={savingPriority}>
                <SelectTrigger className="h-9 text-xs font-semibold px-3 rounded-xl border bg-background w-full gap-2 shadow-2xs cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    {ticket.priority === "CRITICAL" && (
                      <AppIcon name="alert" size={13} className="text-rose-500 shrink-0" />
                    )}
                    <SelectValue placeholder="Select priority" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assignee Inline Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground">Assignee</label>
                {savingAssignee && (
                  <span className="text-[10px] text-primary flex items-center gap-1">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" /> Saving...
                  </span>
                )}
              </div>
              <Select
                value={ticket.assignedToId || "unassigned"}
                onValueChange={handleAssigneeChange}
                disabled={savingAssignee}
              >
                <SelectTrigger className="h-9 text-xs font-semibold px-3 rounded-xl border bg-background w-full gap-2 shadow-2xs cursor-pointer">
                  <AppIcon name="userPlus" size={13} className="text-muted-foreground shrink-0" />
                  <span className="truncate">
                    <SelectValue placeholder="Assignee" />
                  </span>
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

            {/* Category Inline Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground">Category</label>
                {savingCategory && (
                  <span className="text-[10px] text-primary flex items-center gap-1">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" /> Saving...
                  </span>
                )}
              </div>
              <Select
                value={ticket.category || "General Inquiry"}
                onValueChange={handleCategoryChange}
                disabled={savingCategory}
              >
                <SelectTrigger className="h-9 text-xs font-semibold px-3 rounded-xl border bg-background w-full gap-2 shadow-2xs cursor-pointer">
                  <AppIcon name="tag" size={13} className="text-muted-foreground shrink-0" />
                  <span className="truncate">
                    <SelectValue placeholder="Select category" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Requester & Workspace Details Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider pb-2 border-b border-border/60">
              Requester & Organization
            </h3>

            {/* Requester Details */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-muted-foreground block">Customer Contact</span>
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 border border-border/50">
                <UserAvatar name={ticket.createdBy?.name || "Customer"} size="md" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">
                    {ticket.createdBy?.name || "Customer"}
                  </p>
                  {ticket.createdBy?.email && (
                    <p className="text-[11px] text-muted-foreground font-mono truncate">
                      {ticket.createdBy.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tenant / Organization Details */}
            {ticket.tenant && (
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-semibold text-muted-foreground block">Workspace</span>
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{ticket.tenant.name}</span>
                    {ticket.tenant.plan && (
                      <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {ticket.tenant.plan}
                      </span>
                    )}
                  </div>
                  {ticket.tenant.slug && (
                    <span className="text-[11px] text-muted-foreground font-mono block">
                      @{ticket.tenant.slug}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MEDIA LIGHTBOX PREVIEW MODAL ── */}
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
              <a
                href={previewMedia?.url}
                download={previewMedia?.filename}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors shadow-2xs"
              >
                <AppIcon name="download" size={13} className="text-primary-foreground" />
                Download
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMedia(null)}
                className="h-8 text-xs cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── DELETE TICKET CONFIRMATION MODAL ── */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AppIcon name="alert" size={18} className="text-destructive" />
              Delete Ticket #{ticket.ticketNumber}?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
              Are you sure you want to permanently delete this support ticket? All messages, internal
              notes, and uploaded attachments will be permanently removed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 bg-destructive/5 rounded-xl border border-destructive/20 text-xs text-foreground/80 space-y-1 my-1">
            <p className="font-semibold text-foreground truncate">{ticket.subject}</p>
            <p className="text-[11px] text-muted-foreground">
              Submitted by {ticket.createdBy?.name || "Customer"} ({ticket.tenant?.name})
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
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteTicket}
              disabled={deletingTicket}
              className="text-xs h-8 gap-1.5 font-semibold cursor-pointer group"
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
    </CRMPageContainer>
  );
}
