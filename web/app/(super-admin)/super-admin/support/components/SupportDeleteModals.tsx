"use client";

import React from "react";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { PlatformSupportTicket } from "@/shared/lib/api/super-admin.api";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";

interface DeleteTicketDialogProps {
  ticket: PlatformSupportTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void;
  deleting: boolean;
}

export function DeleteTicketDialog({
  ticket,
  open,
  onOpenChange,
  onConfirmDelete,
  deleting,
}: DeleteTicketDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-2xl">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
            <AppIcon name="alert" icon={AlertTriangle} size={18} className="text-destructive" />
            Delete Ticket #{ticket?.ticketNumber || ticket?.id}?
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
            Are you sure you want to permanently delete this support ticket? All messages, internal
            notes, and uploaded attachments will be permanently removed. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 bg-destructive/5 rounded-xl border border-destructive/20 text-xs text-foreground/80 space-y-1 my-1">
          <p className="font-semibold text-foreground truncate">{ticket?.subject}</p>
          <p className="text-[11px] text-muted-foreground">
            Submitted by {ticket?.createdBy?.name || "Customer"} ({ticket?.tenant?.name || "Workspace"})
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
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
            className="text-xs h-8 gap-1.5 font-semibold cursor-pointer"
          >
            {deleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
              </>
            ) : (
              <>
                <AppIcon name="trash" icon={Trash2} size={14} className="text-destructive-foreground" /> Delete Permanently
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirmBulkDelete: () => void;
  bulkDeleting: boolean;
}

export function BulkDeleteDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirmBulkDelete,
  bulkDeleting,
}: BulkDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-2xl">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
            <AppIcon name="alert" icon={AlertTriangle} size={18} className="text-destructive" />
            Delete {selectedCount} Support Ticket(s)?
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
            Are you sure you want to permanently delete these selected support tickets? All corresponding replies, messages, and attachments will be permanently removed from the system.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={bulkDeleting}
            className="text-xs h-8 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onConfirmBulkDelete}
            disabled={bulkDeleting}
            className="text-xs h-8 gap-1.5 font-semibold cursor-pointer"
          >
            {bulkDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
              </>
            ) : (
              <>
                <AppIcon name="trash" icon={Trash2} size={14} className="text-destructive-foreground" /> Delete Selected ({selectedCount})
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
