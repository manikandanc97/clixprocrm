"use client";

import React from "react";
import { PlatformSupportTicket } from "@/shared/lib/api/super-admin.api";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { formatRelativeTime } from "@/shared/utils/formatters";
import { UserAvatar } from "@/features/help-center/components/ticket-history/UserAvatar";
import {
  TicketAttachmentList,
  TicketMessageItem,
} from "@/features/help-center/components/ticket-shared";
import { MediaPreviewItem } from "./ticket-modal-types";

interface TicketConversationPanelProps {
  ticket: PlatformSupportTicket;
  followUpMessages: NonNullable<PlatformSupportTicket["messages"]>;
  replyText: string;
  setReplyText: (text: string) => void;
  isInternalNote: boolean;
  setIsInternalNote: (isInternal: boolean) => void;
  sendingReply: boolean;
  onSendReply: () => void;
  onPreviewMedia: (media: MediaPreviewItem) => void;
}

export function TicketConversationPanel({
  ticket,
  followUpMessages,
  replyText,
  setReplyText,
  isInternalNote,
  setIsInternalNote,
  sendingReply,
  onSendReply,
  onPreviewMedia,
}: TicketConversationPanelProps) {
  return (
    <div className="lg:col-span-8 space-y-4">
      {/* Initial Report Card */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
        <div className="px-4 py-3 bg-muted/30 border-b border-border/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <UserAvatar name={ticket.createdBy?.name || "Customer"} size="sm" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-foreground">
                {ticket.createdBy?.name || "Requester"}
              </span>
              <span className="text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                Author
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <AppIcon name="clock" size={12} className="opacity-60" />
              {formatRelativeTime(ticket.createdAt)}
            </span>
            <span className="text-[9px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border/40">
              Initial Report
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="p-4 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
          {ticket.description || "No description provided."}
        </div>

        {/* Attachments */}
        {ticket.attachments && ticket.attachments.length > 0 && (
          <div className="px-4 pb-4 border-t border-border/40 pt-3">
            <TicketAttachmentList
              attachments={ticket.attachments}
              onPreviewMedia={onPreviewMedia}
            />
          </div>
        )}
      </div>

      {/* Follow-up conversation messages */}
      {followUpMessages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1">
            <AppIcon name="messageSquare" size={14} className="text-primary" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Conversation & Internal Notes ({followUpMessages.length})
            </span>
          </div>

          {followUpMessages.map((msg) => (
            <TicketMessageItem
              key={msg.id}
              message={msg}
              isSuperAdminView={true}
              currentUserName="Super Admin"
            />
          ))}
        </div>
      )}

      {/* Reply / Internal Note Composer */}
      <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsInternalNote(false)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                !isInternalNote
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground bg-muted/40"
              )}
            >
              Reply to Customer
            </button>
            <button
              type="button"
              onClick={() => setIsInternalNote(true)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer",
                isInternalNote
                  ? "bg-amber-500 text-amber-950 dark:text-black shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground bg-muted/40"
              )}
            >
              <AppIcon name="lock" size={12} />
              Internal Note (Staff only)
            </button>
          </div>
          <span className="text-[10px] text-muted-foreground hidden sm:inline">
            Ctrl+Enter to send
          </span>
        </div>

        <Textarea
          placeholder={
            isInternalNote
              ? "Write an internal diagnostic note (visible ONLY to support staff)..."
              : "Write a message to the customer..."
          }
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              if (!sendingReply && replyText.trim()) {
                onSendReply();
              }
            }
          }}
          rows={3}
          className="text-xs resize-none rounded-xl bg-background border-border"
        />

        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-muted-foreground">
            {isInternalNote ? "Note visible to staff only" : "Customer will receive an email notification"}
          </span>
          <Button
            size="sm"
            onClick={onSendReply}
            disabled={sendingReply || !replyText.trim()}
            className={cn(
              "text-xs font-semibold h-8 gap-1.5 px-4 cursor-pointer rounded-lg shadow-sm",
              isInternalNote ? "bg-amber-500 hover:bg-amber-600 text-amber-950 dark:text-black" : ""
            )}
          >
            {sendingReply ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...
              </>
            ) : (
              <>
                <AppIcon name="send" size={14} /> {isInternalNote ? "Save Note" : "Send Reply"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
