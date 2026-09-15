"use client";

import React from "react";
import { PlatformSupportTicket } from "@/shared/lib/api/super-admin.api";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Button } from "@/shared/ui/button";
import { Loader2 } from "lucide-react";

interface TicketDeleteDialogProps {
  ticket: PlatformSupportTicket;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
  deleting: boolean;
}

export function TicketDeleteDialog({
  ticket,
  isOpen,
  onClose,
  onConfirmDelete,
  deleting,
}: TicketDeleteDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-6">
      <div className="max-w-md w-full p-6 rounded-2xl bg-card border border-destructive/30 shadow-2xl space-y-4">
        <div className="flex items-center gap-2.5 text-destructive">
          <AppIcon name="alert" size={20} className="text-destructive shrink-0" />
          <h3 className="font-bold text-base text-foreground">
            Delete Ticket #{ticket.ticketNumber}?
          </h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Are you sure you want to permanently delete this support ticket? All messages, internal
          notes, and uploaded attachments will be permanently removed. This action cannot be undone.
        </p>

        <div className="p-3 bg-destructive/5 rounded-xl border border-destructive/20 text-xs text-foreground/80 space-y-1 my-1">
          <p className="font-semibold text-foreground truncate">{ticket.subject}</p>
          <p className="text-[11px] text-muted-foreground">
            Submitted by {ticket.createdBy?.name || "Customer"} ({ticket.tenant?.name})
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={deleting}
            className="text-xs h-8 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onConfirmDelete}
            disabled={deleting}
            className="text-xs h-8 gap-1.5 font-semibold cursor-pointer group"
          >
            {deleting ? (
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
      </div>
    </div>
  );
}
