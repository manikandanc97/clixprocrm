"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import {
  Check,
  Clock,
  Copy,
  Edit,
  Loader2,
  MessageSquare,
  Paperclip,
  Trash2,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { formatBytes, cn } from "@/shared/lib/utils";
import { useAuth } from "@/features/auth/components/auth-provider";
import {
  TicketItem,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  isImageFile,
  isVideoFile,
  formatRelativeTime,
} from "./ticket-history.types";
import { UserAvatar } from "./UserAvatar";
import { PreviewMediaData } from "./TicketMediaPreviewDialog";

interface TicketDetailsModalProps {
  selectedTicket: TicketItem | null;
  onClose: () => void;
  isCreator: boolean;
  copiedId: string | null;
  copyId: (id: string, e: React.MouseEvent) => void;
  handleOpenEdit: (t: TicketItem) => void;
  handleOpenDelete: (t: TicketItem) => void;
  setPreviewMedia: (media: PreviewMediaData) => void;
  replyText: string;
  setReplyText: (text: string) => void;
  isReplying: boolean;
  handleSendReply: () => void;
}

export function TicketDetailsModal({
  selectedTicket,
  onClose,
  isCreator,
  copiedId,
  copyId,
  handleOpenEdit,
  handleOpenDelete,
  setPreviewMedia,
  replyText,
  setReplyText,
  isReplying,
  handleSendReply,
}: TicketDetailsModalProps) {
  const { user } = useAuth();
  if (!selectedTicket) return null;

  return (
    <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-3xl w-full h-[90vh] max-h-[820px] p-0 gap-0 overflow-hidden flex flex-col rounded-2xl border border-border shadow-2xl bg-card"
      >
        <DialogDescription className="sr-only">
          Ticket details, original report, diagnostic data, attachments, and conversation thread.
        </DialogDescription>

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
                      onClick={onClose}
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
                        Boolean((user as { isSuperAdmin?: boolean } | undefined)?.isSuperAdmin)
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
      </DialogContent>
    </Dialog>
  );
}
