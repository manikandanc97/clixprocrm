"use client";

import React from "react";
import { CRMDeleteDialog } from "@/shared/components/crm/CRMDeleteDialog";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Role } from "@/shared/types/role";

interface RoleDeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  deletingRole: Role | null;
  replacementRoleId: string;
  setReplacementRoleId: (id: string) => void;
  availableReplacementRoles: Role[];
  isPending: boolean;
  onConfirmDelete: () => void;
}

export function RoleDeleteDialog({
  isOpen,
  onOpenChange,
  deletingRole,
  replacementRoleId,
  setReplacementRoleId,
  availableReplacementRoles,
  isPending,
  onConfirmDelete,
}: RoleDeleteDialogProps) {
  const assignedCount = deletingRole?._count?.users || 0;

  return (
    <CRMDeleteDialog
      mode="single"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={`Delete Role: ${deletingRole?.name}`}
      description="This action will permanently delete the custom role from the workspace."
      itemName="Role"
      onConfirm={onConfirmDelete}
      isDeleting={isPending}
      disabled={assignedCount > 0 && !replacementRoleId}
      confirmLabel={assignedCount > 0 ? "Reassign & Delete" : "Delete Role"}
    >
      <div className="space-y-4 py-2">
        {assignedCount > 0 ? (
          <div className="space-y-3">
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
              <p className="font-bold text-sm mb-1">
                ⚠️ {assignedCount} Active User(s) Assigned
              </p>
              This role cannot be deleted immediately because users are currently
              assigned to it. Select a replacement role to reassign all
              affected members atomically.
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Reassign Users To Replacement Role{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Select
                value={replacementRoleId}
                onValueChange={setReplacementRoleId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select target role..." />
                </SelectTrigger>
                <SelectContent>
                  {availableReplacementRoles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} {r.isSystem ? "(System)" : "(Custom)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              {deletingRole?.name}
            </span>
            ? No users are currently assigned to this role.
          </p>
        )}
      </div>
    </CRMDeleteDialog>
  );
}
