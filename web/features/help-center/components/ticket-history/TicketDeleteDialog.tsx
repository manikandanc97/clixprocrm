"use client";

import React from "react";
import { CRMDeleteDialog } from "@/shared/components/crm/CRMDeleteDialog";
import { TicketItem } from "./ticket-history.types";

interface TicketDeleteDialogProps {
  isDeleteDialogOpen: boolean;
  setIsDeleteDialogOpen: (open: boolean) => void;
  targetTicket: TicketItem | null;
  selectedTicket: TicketItem | null;
  onCancel: () => void;
  onConfirmDelete: () => void;
  isDeleting: boolean;

  // Bulk delete props
  isBulkDeleteDialogOpen: boolean;
  setIsBulkDeleteDialogOpen: (open: boolean) => void;
  selectedTicketCount: number;
  onConfirmBulkDelete: () => void;
  isBulkDeleting: boolean;
}

export function TicketDeleteDialog({
  isDeleteDialogOpen,
  setIsDeleteDialogOpen,
  targetTicket,
  selectedTicket,
  onCancel,
  onConfirmDelete,
  isDeleting,
  isBulkDeleteDialogOpen,
  setIsBulkDeleteDialogOpen,
  selectedTicketCount,
  onConfirmBulkDelete,
  isBulkDeleting,
}: TicketDeleteDialogProps) {
  const activeTicket = targetTicket || selectedTicket;

  return (
    <>
      {/* Delete Single Ticket Confirmation Dialog */}
      <CRMDeleteDialog
        mode="single"
        isOpen={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) onCancel();
        }}
        title={`Delete Ticket #${activeTicket?.ticketId}?`}
        itemName="Ticket"
        description="Are you sure you want to permanently delete this support ticket? All associated conversation messages and uploaded attachments will be permanently removed. This action cannot be undone."
        warningText={
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-foreground truncate">
              {activeTicket?.subject}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Submitted on{" "}
              {activeTicket
                ? new Date(activeTicket.createdAt).toLocaleDateString()
                : ""}
            </p>
          </div>
        }
        onConfirm={onConfirmDelete}
        isDeleting={isDeleting}
        confirmLabel="Delete Permanently"
      />

      {/* Delete Multiple Tickets Confirmation Modal */}
      <CRMDeleteDialog
        mode="bulk"
        isOpen={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
        title={`Delete ${selectedTicketCount} Support Tickets?`}
        itemName="Ticket"
        selectedCount={selectedTicketCount}
        description={`Are you sure you want to permanently delete ${selectedTicketCount} selected support ticket(s)? All replies, notes, and attachments will be deleted permanently.`}
        onConfirm={onConfirmBulkDelete}
        isDeleting={isBulkDeleting}
        confirmLabel={`Delete (${selectedTicketCount}) Tickets`}
      />
    </>
  );
}
