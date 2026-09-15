"use client";

import React from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { PlatformOrganization } from "@/shared/lib/api/super-admin.api";
import { Button } from "@/shared/ui/button";

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
      {orgToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Delete Workspace
                </h3>
                <p className="text-xs text-muted-foreground">
                  This action is permanent and irreversible.
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground">{orgToDelete.name}</strong>{" "}
              (<span className="font-mono text-[11px]">/{orgToDelete.slug}</span>)? All associated users, CRM leads, deals, quotations, invoices, and activity history will be completely removed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOrgToDelete(null)}
                disabled={deleting}
                className="rounded-xl text-xs font-semibold h-9 px-4 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteOrg(orgToDelete)}
                disabled={deleting}
                className="rounded-xl text-xs font-bold h-9 px-4 gap-1.5 cursor-pointer"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Workspace</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Bulk Delete Workspaces Confirmation Modal */}
      {bulkDeleteModalOpen && selectedOrgCount > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Delete {selectedOrgCount} Selected Workspaces
                </h3>
                <p className="text-xs text-muted-foreground">
                  This action is permanent and irreversible.
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground">{selectedOrgCount} workspace(s)</strong>? All associated users, CRM leads, deals, quotations, invoices, and activity history across these workspaces will be completely removed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBulkDeleteModalOpen(false)}
                disabled={bulkDeleting}
                className="rounded-xl text-xs font-semibold h-9 px-4 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="rounded-xl text-xs font-bold h-9 px-4 gap-1.5 cursor-pointer"
              >
                {bulkDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting {selectedOrgCount}...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete {selectedOrgCount} Workspaces</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
