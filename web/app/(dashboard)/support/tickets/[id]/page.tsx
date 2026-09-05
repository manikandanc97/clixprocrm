"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import client from "@/shared/lib/api/client";
import { useAuth } from "@/features/auth/components/auth-provider";
import { CRMPageContainer, CRMActionMenu } from "@/shared/components/crm";
import { formatTicketCode } from "@/shared/lib/ticket-utils";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { toast } from "sonner";
import { cn, formatBytes } from "@/shared/lib/utils";
import { Loader2, ArrowLeft, MoreHorizontal } from "lucide-react";

interface TicketAttachment {
  id?: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
}

interface TicketMessage {
  id: string;
  message: string;
  isStaff?: boolean;
  isInternal?: boolean;
  createdAt: string;
  sender?: {
    id: string;
    name?: string;
    email?: string;
    avatar?: string;
  };
}

interface UserTicketDetail {
  id: string;
  ticketId?: string;
  ticketNumber?: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  estimatedResponseTime?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    name?: string;
    email?: string;
  };
  assignedTo?: {
    id: string;
    name?: string;
    email?: string;
  };
  attachments?: TicketAttachment[];
  messages?: TicketMessage[];
}

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

export default function CustomerTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<UserTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Inline Subject Editing
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [subjectDraft, setSubjectDraft] = useState("");
  const [savingSubject, setSavingSubject] = useState(false);

  // Reply Composer
  const [replyText, setReplyText] = useState("");
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

  // Fetch Ticket Data
  const loadTicket = useCallback(async () => {
    if (!ticketId) return;
    try {
      setLoading(true);
      const res = await client.get(`/support/tickets/${ticketId}`);
      const data = res.data?.data;
      if (!data) throw new Error("Ticket not found");
      setTicket(data);
      setSubjectDraft(data.subject);
    } catch (err: any) {
      console.error("Failed to load ticket:", err);
      toast.error("Could not find ticket or load ticket thread.");
      router.push("/support");
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
      const res = await client.patch(`/support/tickets/${ticket.id}`, {
        subject: subjectDraft.trim(),
      });
      const updated = res.data?.data || { ...ticket, subject: subjectDraft.trim() };
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

  // Send Reply
  const handleSendReply = async () => {
    if (!ticket || !replyText.trim()) return;
    try {
      setSendingReply(true);
      const res = await client.post(`/support/tickets/${ticket.id}/reply`, {
        message: replyText.trim(),
      });
      const updated = res.data?.data;
      if (updated) {
        setTicket(updated);
      } else {
        await loadTicket();
      }
      setReplyText("");
      toast.success("Reply sent to support team");
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
      await client.delete(`/support/tickets/${ticket.id}`);
      toast.success(`Ticket #${ticket.ticketNumber || ticket.ticketId} deleted successfully`);
      setIsDeleteDialogOpen(false);
      router.push("/support");
    } catch (err: any) {
      console.error("Failed to delete ticket:", err);
      toast.error(err.response?.data?.message || "Failed to delete ticket");
      setDeletingTicket(false);
    }
  };

  if (loading || !ticket) {
    return (
      <CRMPageContainer>
        <div className="space-y-6 animate-pulse">
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

  const ticketRefCode = ticket.ticketNumber || ticket.ticketId || ticket.id;
  const statusConfig = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
  const priorityConfig = PRIORITY_CONFIG[ticket.priority?.toUpperCase()] || PRIORITY_CONFIG.MEDIUM;

  const followUpMessages = (ticket.messages || []).filter(
    (m) => m.message?.trim() !== ticket.description?.trim()
  );

  return (
    <CRMPageContainer>
      {/* ── TOP BREADCRUMB & UTILITY BAR ── */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-border/80">
        <Link
          href="/support"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Help & Support</span>
        </Link>

        <div className="flex items-center gap-2">
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
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Reference Code */}
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => copyId(ticketRefCode, e)}
            className="font-mono text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors border border-primary/20 group whitespace-nowrap shrink-0 select-none"
            title={`Click to copy ticket reference (${ticketRefCode})`}
          >
            <span className="whitespace-nowrap font-mono">{formatTicketCode(ticket)}</span>
            {ticketRefCode !== formatTicketCode(ticket) && (
              <span className="opacity-60 text-[10px] hidden sm:inline">({ticketRefCode})</span>
            )}
            {copiedId === ticketRefCode ? (
              <AppIcon name="check" size={13} className="text-emerald-500 shrink-0" />
            ) : (
              <AppIcon name="copy" size={13} className="text-primary/70 group-hover:text-primary shrink-0" />
            )}
          </div>

          {/* Category Pill */}
          {ticket.category && (
            <span className="text-[11px] font-medium text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-lg border border-border/30 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
              <AppIcon name="tag" size={12} className="text-primary/70 shrink-0" />
              {ticket.category}
            </span>
          )}

          {/* Status Badge */}
          <span
            className={cn(
              "text-xs font-semibold px-2.5 py-1 rounded-lg border inline-flex items-center gap-1.5 whitespace-nowrap",
              statusConfig.badgeClass
            )}
          >
            <span className={cn("w-2 h-2 rounded-full", statusConfig.dotClass)} />
            {statusConfig.label}
          </span>
        </div>

        {/* Subject with Inline Edit */}
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

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <AppIcon name="user" size={12} className="text-primary/70" />
            Submitted by: <strong className="text-foreground font-semibold">{ticket.createdBy?.name || user?.name || "You"}</strong>
          </span>
          <span className="text-border hidden sm:inline">•</span>
          <span className="flex items-center gap-1">
            <AppIcon name="clock" size={12} className="text-primary/70" />
            Created {formatRelativeTime(ticket.createdAt)}
          </span>
          <span className="text-border hidden sm:inline">•</span>
          <span>
            Updated {formatRelativeTime(ticket.updatedAt)}
          </span>
        </div>
      </div>

      {/* ── TWO-COLUMN DESKTOP ENTERPRISE LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 items-start">
        {/* ── LEFT / MAIN COLUMN: CONVERSATION TIMELINE & COMPOSER (8 COLS) ── */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Initial Report Card */}
          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 bg-muted/30 border-b border-border/60 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <UserAvatar name={ticket.createdBy?.name || user?.name || "You"} size="sm" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      {ticket.createdBy?.name || user?.name || "You"}
                    </span>
                    <span className="text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Author
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
                  Responses & Updates
                </span>
                <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                  {followUpMessages.length}
                </span>
              </div>

              {followUpMessages.map((msg) => {
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
                        <UserAvatar name={msg.sender?.name || (isStaff ? "Support Team" : "You")} isStaff={isStaff} size="sm" />
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">
                            {msg.sender?.name || (isStaff ? "Support Team" : "You")}
                          </span>
                          {isStaff ? (
                            <span className="text-[9px] font-bold bg-primary text-primary-foreground py-0.5 px-2 rounded-full flex items-center gap-1">
                              <AppIcon name="circleCheck" size={11} className="text-primary-foreground" /> Support Representative
                            </span>
                          ) : (
                            <span className="text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              You
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
                Add a Reply
              </span>
              <span className="text-[11px] text-muted-foreground">
                Our support team will receive an immediate notification
              </span>
            </div>

            <Textarea
              placeholder="Type your response to the support team or provide additional details..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="text-xs sm:text-sm min-h-[110px] resize-none bg-background rounded-xl border-border/80 focus-visible:ring-2 focus-visible:ring-primary/20"
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  handleSendReply();
                }
              }}
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                Press <kbd className="font-mono bg-muted border border-border/70 px-1.5 py-0.5 rounded-md text-[10px] text-muted-foreground font-semibold">Cmd/Ctrl + Enter</kbd> to send
              </span>
              <Button
                size="sm"
                onClick={handleSendReply}
                disabled={sendingReply || !replyText.trim()}
                className="text-xs font-semibold gap-1.5 h-9 px-4 rounded-xl shadow-xs cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
              >
                {sendingReply ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <AppIcon name="send" size={14} className="text-primary-foreground" />
                    Send Reply
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: STICKY TICKET PROPERTIES SIDEBAR (4 COLS) ── */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider pb-2 border-b border-border/60">
              Ticket Details
            </h3>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Status</label>
              <div>
                <span
                  className={cn(
                    "text-xs font-semibold px-2.5 py-1 rounded-lg border inline-flex items-center gap-1.5 whitespace-nowrap",
                    statusConfig.badgeClass
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-full", statusConfig.dotClass)} />
                  {statusConfig.label}
                </span>
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Priority</label>
              <div>
                <span
                  className={cn(
                    "text-xs font-semibold px-2.5 py-1 rounded-lg border inline-flex items-center gap-1 whitespace-nowrap",
                    priorityConfig.badgeClass
                  )}
                >
                  {ticket.priority?.toUpperCase() === "CRITICAL" && (
                    <AppIcon name="alert" size={13} className="text-rose-500 shrink-0" />
                  )}
                  {priorityConfig.label} Priority
                </span>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Category</label>
              <p className="text-xs font-bold text-foreground">{ticket.category || "General"}</p>
            </div>

            {/* Assigned Representative */}
            <div className="space-y-1 pt-1 border-t border-border/40">
              <label className="text-[11px] font-semibold text-muted-foreground">Support Representative</label>
              {ticket.assignedTo ? (
                <div className="flex items-center gap-2 pt-0.5">
                  <UserAvatar name={ticket.assignedTo.name} isStaff={true} size="xs" />
                  <span className="text-xs font-bold text-foreground">{ticket.assignedTo.name || ticket.assignedTo.email}</span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Assigned to Tier 1 Queue</p>
              )}
            </div>

            {/* Response Time SLA */}
            {ticket.estimatedResponseTime && (
              <div className="space-y-1 pt-1 border-t border-border/40">
                <label className="text-[11px] font-semibold text-muted-foreground">Estimated Response Time</label>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {ticket.estimatedResponseTime}
                </p>
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
              Delete Ticket #{ticketRefCode}?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
              Are you sure you want to permanently delete this support ticket? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 bg-destructive/5 rounded-xl border border-destructive/20 text-xs text-foreground/80 space-y-1 my-1">
            <p className="font-semibold text-foreground truncate">{ticket.subject}</p>
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
