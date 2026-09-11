"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl shadow-elevated border-border bg-popover/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Role: {deletingRole?.name}
          </DialogTitle>
          <DialogDescription>
            This action will permanently delete the custom role from the workspace.
          </DialogDescription>
        </DialogHeader>

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

        <DialogFooter className="flex flex-row items-center justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirmDelete}
            disabled={
              isPending || (assignedCount > 0 && !replacementRoleId)
            }
          >
            {isPending
              ? "Deleting..."
              : assignedCount > 0
                ? "Reassign & Delete"
                : "Delete Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
