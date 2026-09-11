"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { CRMDeleteDialog } from "@/shared/components/crm/CRMDeleteDialog";
import type { ContactItem } from "../hooks/use-contacts-data";

export interface ContactsDeleteDialogProps {
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
      <CRMDeleteDialog
        mode="single"
        isOpen={Boolean(contactToDelete)}
        onOpenChange={(open) => {
          if (!open && !isDeletingSingle) onCloseSingle();
        }}
        title={`Delete ${contactToDelete?.type || "Contact"}?`}
        itemName={contactToDelete?.type || "Contact"}
        description={
          <>
            Are you sure you want to delete{" "}
            <strong className="text-foreground">
              {contactToDelete?.name || "this contact"}
            </strong>
            ?
          </>
        }
        warningText="This action will permanently delete this record and its associated history."
        confirmLabel="Delete Record"
        onConfirm={onConfirmSingle}
        isDeleting={isDeletingSingle}
        icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
      />

      {/* ── Bulk Delete Contacts Confirmation Dialog ── */}
      <CRMDeleteDialog
        mode="bulk"
        isOpen={isBulkOpen}
        onOpenChange={(open) => {
          if (!open && !isDeletingBulk) onCloseBulk();
        }}
        title="Delete Selected Contacts?"
        itemName="Contact"
        selectedCount={bulkCount}
        description={
          <>
            You are about to delete{" "}
            <strong className="text-foreground">{bulkCount}</strong> selected contact records.
          </>
        }
        warningText="This action cannot be undone. All selected leads and customers will be removed."
        confirmLabel={`Delete ${bulkCount} Records`}
        onConfirm={onConfirmBulk}
        isDeleting={isDeletingBulk}
        icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
      />
    </>
  );
};
