"use client";

import React from "react";
import { PlatformSupportTicket } from "@/shared/lib/api/super-admin.api";
import { CRMDeleteDialog } from "@/shared/components/crm/CRMDeleteDialog";

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
    <CRMDeleteDialog
      mode="single"
      isOpen={open}
      onOpenChange={onOpenChange}
      title={`Delete Ticket #${ticket?.ticketNumber || ticket?.id}?`}
      itemName="Ticket"
      description="Are you sure you want to permanently delete this support ticket? All messages, internal notes, and uploaded attachments will be permanently removed. This action cannot be undone."
      warningText={
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-foreground truncate">{ticket?.subject}</span>
          <span className="text-[11px] text-muted-foreground">
            Submitted by {ticket?.createdBy?.name || "Customer"} ({ticket?.tenant?.name || "Workspace"})
          </span>
        </div>
      }
      onConfirm={onConfirmDelete}
      isDeleting={deleting}
      confirmLabel="Delete Permanently"
    />
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
    <CRMDeleteDialog
      mode="bulk"
      isOpen={open}
      onOpenChange={onOpenChange}
      title={`Delete ${selectedCount} Support Ticket(s)?`}
      itemName="Support Ticket"
      selectedCount={selectedCount}
      description="Are you sure you want to permanently delete these selected support tickets? All corresponding replies, messages, and attachments will be permanently removed from the system."
      onConfirm={onConfirmBulkDelete}
      isDeleting={bulkDeleting}
      confirmLabel={`Delete Selected (${selectedCount})`}
    />
  );
}
