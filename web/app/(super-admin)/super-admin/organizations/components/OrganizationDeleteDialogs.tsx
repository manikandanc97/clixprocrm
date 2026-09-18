"use client";

import React from "react";
import { PlatformOrganization } from "@/shared/lib/api/super-admin.api";
import { CRMDeleteDialog } from "@/shared/components/crm/CRMDeleteDialog";

interface OrganizationDeleteDialogsProps {
  orgToDelete: PlatformOrganization | null;
  setOrgToDelete: (org: PlatformOrganization | null) => void;
  deleting: boolean;
  handleDeleteOrg: (org: PlatformOrganization) => void;
  bulkDeleteModalOpen: boolean;
  setBulkDeleteModalOpen: (open: boolean) => void;
  selectedOrgCount: number;
  bulkDeleting: boolean;
  handleBulkDelete: () => void;
}

export function OrganizationDeleteDialogs({
  orgToDelete,
  setOrgToDelete,
  deleting,
  handleDeleteOrg,
  bulkDeleteModalOpen,
  setBulkDeleteModalOpen,
  selectedOrgCount,
  bulkDeleting,
  handleBulkDelete,
}: OrganizationDeleteDialogsProps) {
  return (
    <>
      {/* 1. Single Workspace Delete Confirmation Modal */}
      <CRMDeleteDialog
        mode="single"
        isOpen={Boolean(orgToDelete)}
        onOpenChange={(open) => {
          if (!open) setOrgToDelete(null);
        }}
        itemName="Workspace"
        description={
          orgToDelete ? (
            <>
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground">{orgToDelete.name}</strong>{" "}
              (<span className="font-mono text-[11px]">/{orgToDelete.slug}</span>)? All associated users, CRM leads, deals, quotations, invoices, and activity history will be completely removed.
            </>
          ) : null
        }
        onConfirm={() => {
          if (orgToDelete) {
            handleDeleteOrg(orgToDelete);
          }
        }}
        isDeleting={deleting}
      />

      {/* 2. Bulk Delete Workspaces Confirmation Modal */}
      <CRMDeleteDialog
        mode="bulk"
        isOpen={bulkDeleteModalOpen && selectedOrgCount > 0}
        onOpenChange={setBulkDeleteModalOpen}
        itemName="Workspace"
        selectedCount={selectedOrgCount}
        description={
          <>
            Are you sure you want to permanently delete{" "}
            <strong className="text-foreground">{selectedOrgCount} workspace(s)</strong>? All associated users, CRM leads, deals, quotations, invoices, and activity history across these workspaces will be completely removed.
          </>
        }
        onConfirm={handleBulkDelete}
        isDeleting={bulkDeleting}
      />
    </>
  );
}
