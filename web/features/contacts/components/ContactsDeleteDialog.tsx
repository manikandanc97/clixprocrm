"use client";

import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import type { ContactItem } from "../hooks/use-contacts-data";

interface ContactsDeleteDialogProps {
  // Single contact delete
  contactToDelete: ContactItem | null;
  onCloseSingle: () => void;
  onConfirmSingle: () => void;
  isDeletingSingle: boolean;

  // Bulk delete
  isBulkOpen: boolean;
  bulkCount: number;
  onCloseBulk: () => void;
  onConfirmBulk: () => void;
  isDeletingBulk: boolean;
}

export const ContactsDeleteDialog: React.FC<ContactsDeleteDialogProps> = ({
  contactToDelete,
  onCloseSingle,
  onConfirmSingle,
  isDeletingSingle,
  isBulkOpen,
  bulkCount,
  onCloseBulk,
  onConfirmBulk,
  isDeletingBulk,
}) => {
  return (
    <>
      {/* ── Single Contact Delete Confirmation Dialog ── */}
      <AlertDialog
        open={Boolean(contactToDelete)}
        onOpenChange={(open) => {
          if (!open && !isDeletingSingle) onCloseSingle();
        }}
      >
        <AlertDialogContent className="max-w-md p-6">
          <AlertDialogHeader className="sm:place-items-start text-left gap-3">
            <div className="flex items-center gap-3 w-full">
              <div className="h-10 w-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="min-w-0 flex-1">
                <AlertDialogTitle className="text-base font-bold text-foreground">
                  Delete {contactToDelete?.type || "Contact"}?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Are you sure you want to delete{" "}
                  <strong className="text-foreground">{contactToDelete?.name || "this contact"}</strong>?
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          <p className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border/40 my-2">
            This action will permanently delete this record and its associated history.
          </p>

          <AlertDialogFooter className="flex-row justify-end gap-2.5 pt-2">
            <AlertDialogCancel
              disabled={isDeletingSingle}
              onClick={onCloseSingle}
              className="text-xs font-semibold h-9 px-4 cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={onConfirmSingle}
              disabled={isDeletingSingle}
              className="text-xs font-semibold h-9 px-4 cursor-pointer gap-2"
            >
              {isDeletingSingle ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Delete Record</span>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Bulk Delete Contacts Confirmation Dialog ── */}
      <AlertDialog
        open={isBulkOpen}
        onOpenChange={(open) => {
          if (!open && !isDeletingBulk) onCloseBulk();
        }}
      >
        <AlertDialogContent className="max-w-md p-6">
          <AlertDialogHeader className="sm:place-items-start text-left gap-3">
            <div className="flex items-center gap-3 w-full">
              <div className="h-10 w-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="min-w-0 flex-1">
                <AlertDialogTitle className="text-base font-bold text-foreground">
                  Delete Selected Contacts?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-muted-foreground mt-0.5">
                  You are about to delete{" "}
                  <strong className="text-foreground">{bulkCount}</strong> selected contact records.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          <p className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border/40 my-2">
            This action cannot be undone. All selected leads and customers will be removed.
          </p>

          <AlertDialogFooter className="flex-row justify-end gap-2.5 pt-2">
            <AlertDialogCancel
              disabled={isDeletingBulk}
              onClick={onCloseBulk}
              className="text-xs font-semibold h-9 px-4 cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={onConfirmBulk}
              disabled={isDeletingBulk}
              className="text-xs font-semibold h-9 px-4 cursor-pointer gap-2"
            >
              {isDeletingBulk ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Delete {bulkCount} Records</span>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
