"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
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
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) onCancel();
        }}
      >
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Ticket #{activeTicket?.ticketId}?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
              Are you sure you want to permanently delete this support ticket? All associated
              conversation messages and uploaded attachments will be permanently removed. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-destructive/5 rounded-xl border border-destructive/20 text-xs text-foreground/80 space-y-1 my-1">
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

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isDeleting}
              className="text-xs h-8 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onConfirmDelete}
              disabled={isDeleting}
              className="text-xs h-8 gap-1.5 font-semibold cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete Permanently"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Multiple Tickets Confirmation Modal */}
      <Dialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
      >
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete {selectedTicketCount} Support Tickets?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
              Are you sure you want to permanently delete {selectedTicketCount} selected support
              ticket(s)? All replies, notes, and attachments will be deleted permanently.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsBulkDeleteDialogOpen(false)}
              disabled={isBulkDeleting}
              className="text-xs h-8 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onConfirmBulkDelete}
              disabled={isBulkDeleting}
              className="text-xs h-8 gap-1.5 font-semibold cursor-pointer"
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
                </>
              ) : (
                `Delete (${selectedTicketCount}) Tickets`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
