"use client";

import React from "react";
import { PlatformSupportTicket } from "@/shared/lib/api/super-admin.api";
import { formatTicketCode } from "@/shared/lib/ticket-utils";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { DialogTitle } from "@/shared/ui/dialog";
import { Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { formatRelativeTime } from "@/shared/utils/formatters";
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
} from "@/features/help-center/components/ticket-shared";

interface TicketModalHeaderProps {
  ticket: PlatformSupportTicket;
  loading: boolean;
  copiedId: string | null;
  onCopyId: (id: string, e?: React.MouseEvent) => void;
  onRefresh: () => void;
  onOpenDelete: () => void;
  onClose: () => void;
  isEditingSubject: boolean;
  setIsEditingSubject: (editing: boolean) => void;
  subjectDraft: string;
  setSubjectDraft: (val: string) => void;
  savingSubject: boolean;
  onSaveSubject: () => void;
}

export function TicketModalHeader({
  ticket,
  loading,
  copiedId,
  onCopyId,
  onRefresh,
  onOpenDelete,
  onClose,
  isEditingSubject,
  setIsEditingSubject,
  subjectDraft,
  setSubjectDraft,
  savingSubject,
  onSaveSubject,
}: TicketModalHeaderProps) {
  return (
    <div className="shrink-0 bg-card/95 backdrop-blur-md border-b border-border/80 p-5 sm:px-6 sm:py-4 space-y-3 relative z-10">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Reference, Workspace, Category */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Ticket Reference Code with Copy button */}
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => onCopyId(ticket.ticketNumber, e)}
            className="font-mono text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors border border-primary/20 whitespace-nowrap shrink-0 select-none"
            title={`Click to copy ticket reference (${ticket.ticketNumber})`}
          >
            <span className="whitespace-nowrap font-mono">{formatTicketCode(ticket)}</span>
            {ticket.ticketNumber !== formatTicketCode(ticket) && (
              <span className="opacity-60 text-[10px] hidden sm:inline">({ticket.ticketNumber})</span>
            )}
            {copiedId === ticket.ticketNumber ? (
              <AppIcon name="check" size={13} className="text-emerald-500 shrink-0" />
            ) : (
              <AppIcon name="copy" size={13} className="text-primary/70 shrink-0" />
            )}
          </div>

          {/* Workspace Pill */}
          {ticket.tenant && (
            <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-lg border border-border/40 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
              <AppIcon name="companies" size={12} className="text-muted-foreground shrink-0" />
              <span className="font-semibold text-foreground">{ticket.tenant.name}</span>
              {ticket.tenant.plan && (
                <span className="text-[10px] uppercase font-bold text-muted-foreground/90">
                  ({ticket.tenant.plan})
                </span>
              )}
            </span>
          )}

          {/* Status Pill */}
          <span
            className={cn(
              "text-[11px] font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1.5",
              STATUS_CONFIG[ticket.status]?.badgeClass || STATUS_CONFIG.OPEN.badgeClass
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full animate-pulse",
                STATUS_CONFIG[ticket.status]?.dotClass || "bg-blue-500"
              )}
            />
            {STATUS_CONFIG[ticket.status]?.label || ticket.status}
          </span>

          {/* Priority Pill */}
          <span
            className={cn(
              "text-[11px] font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1",
              PRIORITY_CONFIG[ticket.priority]?.badgeClass || PRIORITY_CONFIG.MEDIUM.badgeClass
            )}
          >
            {ticket.priority === "CRITICAL" && (
              <AppIcon name="alert" size={13} className="text-rose-500" />
            )}
            {ticket.priority} Priority
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={onRefresh}
            className="h-8 w-8 p-0 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            title="Refresh ticket"
          >
            <AppIcon name="refresh" size={14} className={loading ? "animate-spin" : ""} />
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs px-2.5 gap-1.5 text-destructive hover:bg-destructive/10 hover:border-destructive/40 cursor-pointer rounded-lg font-medium transition-colors"
            onClick={onOpenDelete}
            title="Delete this ticket"
          >
            <AppIcon name="trash" size={14} className="text-destructive" />
            <span className="hidden sm:inline">Delete</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            title="Close modal"
          >
            <AppIcon name="close" size={16} />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </div>

      {/* Subject Header with Inline Edit */}
      <div>
        {isEditingSubject ? (
          <div className="flex items-center gap-2 max-w-xl">
            <Input
              value={subjectDraft}
              onChange={(e) => setSubjectDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveSubject();
                if (e.key === "Escape") {
                  setSubjectDraft(ticket.subject);
                  setIsEditingSubject(false);
                }
              }}
              autoFocus
              className="h-8 text-sm font-bold text-foreground"
            />
            <Button
              size="sm"
              onClick={onSaveSubject}
              disabled={savingSubject || !subjectDraft.trim()}
              className="h-8 px-2.5 text-xs font-semibold cursor-pointer shrink-0"
            >
              {savingSubject ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSubjectDraft(ticket.subject);
                setIsEditingSubject(false);
              }}
              className="h-8 px-2.5 text-xs cursor-pointer shrink-0"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <DialogTitle className="text-base sm:text-lg font-bold text-foreground tracking-tight leading-snug text-left">
              {ticket.subject}
            </DialogTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditingSubject(true)}
              className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer rounded transition-colors"
              title="Edit subject"
            >
              <AppIcon name="edit" size={12} className="mr-1" />
              Edit
            </Button>
          </div>
        )}
      </div>

      {/* Subtitle / Metadata Row */}
      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <AppIcon name="user" size={12} className="text-primary/70" />
          Requester: <strong className="text-foreground font-semibold">{ticket.createdBy?.name || "Customer"}</strong>
          {ticket.createdBy?.email && (
            <span className="text-[10px] text-muted-foreground font-mono">
              ({ticket.createdBy.email})
            </span>
          )}
        </span>
        <span className="text-border">•</span>
        <span>Submitted {formatRelativeTime(ticket.createdAt)}</span>
        <span className="text-border hidden sm:inline">•</span>
        <span className="hidden sm:inline">Updated {formatRelativeTime(ticket.updatedAt)}</span>
      </div>
    </div>
  );
}
