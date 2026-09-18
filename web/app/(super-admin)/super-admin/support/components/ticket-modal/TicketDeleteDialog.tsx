"use client";

import React from "react";
import { PlatformSupportTicket } from "@/shared/lib/api/super-admin.api";
import { CRMDeleteDialog } from "@/shared/components/crm/CRMDeleteDialog";

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
  return (
    <CRMDeleteDialog
      mode="single"
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={`Delete Ticket #${ticket.ticketNumber}?`}
      itemName="Ticket"
      description="Are you sure you want to permanently delete this support ticket? All messages, internal notes, and uploaded attachments will be permanently removed. This action cannot be undone."
      warningText={
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-foreground truncate">{ticket.subject}</p>
          <p className="text-[11px] text-muted-foreground">
            Submitted by {ticket.createdBy?.name || "Customer"} ({ticket.tenant?.name})
          </p>
        </div>
      }
      onConfirm={onConfirmDelete}
      isDeleting={deleting}
      confirmLabel="Delete Permanently"
    />
  );
}
