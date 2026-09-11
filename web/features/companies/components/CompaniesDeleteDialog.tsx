"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { CRMDeleteDialog } from "@/shared/components/crm/CRMDeleteDialog";
import type { CompanyItem } from "../hooks/use-companies-data";

export interface CompaniesDeleteDialogProps {
  // Single company delete
  companyToDelete: CompanyItem | null;
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

export const CompaniesDeleteDialog: React.FC<CompaniesDeleteDialogProps> = ({
  companyToDelete,
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
      {/* ── Single Company Delete Confirmation Dialog ── */}
      <CRMDeleteDialog
        mode="single"
        isOpen={Boolean(companyToDelete)}
        onOpenChange={(open) => {
          if (!open && !isDeletingSingle) onCloseSingle();
        }}
        title="Delete Company?"
        itemName="Company"
        description={
          <>
            Are you sure you want to delete{" "}
            <strong className="text-foreground">
              {companyToDelete?.name || "this company"}
            </strong>
            ?
          </>
        }
        warningText="This action will permanently delete the company account and unlink associated contacts."
        confirmLabel="Delete Company"
        onConfirm={onConfirmSingle}
        isDeleting={isDeletingSingle}
        icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
      />

      {/* ── Bulk Delete Companies Confirmation Dialog ── */}
      <CRMDeleteDialog
        mode="bulk"
        isOpen={isBulkOpen}
        onOpenChange={(open) => {
          if (!open && !isDeletingBulk) onCloseBulk();
        }}
        title="Delete Selected Companies?"
        itemName="Company"
        selectedCount={bulkCount}
        description={
          <>
            You are about to delete{" "}
            <strong className="text-foreground">{bulkCount}</strong> selected company account(s).
          </>
        }
        warningText="This action cannot be undone. All selected company accounts will be permanently removed."
        confirmLabel={`Delete ${bulkCount} Companies`}
        onConfirm={onConfirmBulk}
        isDeleting={isDeletingBulk}
        icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
      />
    </>
  );
};
