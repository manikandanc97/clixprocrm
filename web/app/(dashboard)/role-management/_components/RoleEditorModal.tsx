"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { cn } from "@/shared/lib/utils";
import { RolePermissionMatrix } from "./RolePermissionMatrix";

export const PRESET_COLORS = [
  { label: "Blue", value: "#3b82f6" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Emerald", value: "#10b981" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Cyan", value: "#06b6d4" },
  { label: "Indigo", value: "#6366f1" },
  { label: "Slate", value: "#64748b" },
];

interface RoleEditorModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingRole: any | null;
  formData: {
    name: string;
    description: string;
    color: string;
    permissions: string[];
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      description: string;
      color: string;
      permissions: string[];
    }>
  >;
  isFormDirty: boolean;
  isPending: boolean;
  onSave: () => void;
}

export function RoleEditorModal({
  isOpen,
  onOpenChange,
  editingRole,
  formData,
  setFormData,
  isFormDirty,
  isPending,
  onSave,
}: RoleEditorModalProps) {
  const isSystemAdminRole =
    editingRole?.name?.toUpperCase() === "ADMIN" ||
    editingRole?.name?.toUpperCase() === "SUPER ADMIN";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl shadow-elevated border-border bg-popover/95 backdrop-blur-xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2.5 text-lg font-bold">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {editingRole
              ? `Edit Role: ${editingRole.name}`
              : "Add New Role"}
          </DialogTitle>
          <DialogDescription>
            {editingRole
              ? "Configure role metadata and fine-tune module access permissions."
              : "Define a new organizational role and assign granular module permissions."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-5 overflow-y-auto max-h-[calc(85vh-160px)]">
          <div className="space-y-6 pt-1">
            {/* Basic Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
              <div className="space-y-2">
                <Label
                  htmlFor="role-name"
                  className="text-xs font-semibold text-foreground inline-flex items-center gap-1 leading-normal py-0.5"
                >
                  Role Name <span className="text-destructive font-bold">*</span>
                </Label>
                <Input
                  id="role-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter role title"
                  disabled={editingRole?.isSystem}
                  className="h-10"
                />
                {editingRole?.isSystem && (
                  <p className="text-[11px] text-muted-foreground">
                    System role names cannot be renamed.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground inline-flex items-center leading-normal py-0.5">
                  Role Badge Color
                </Label>
                <div className="flex items-center gap-2.5 h-10 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, color: c.value })
                      }
                      className={cn(
                        "h-6 w-6 shrink-0 aspect-square rounded-full border-2 transition-all cursor-pointer",
                        formData.color === c.value
                          ? "scale-115 ring-2 ring-primary/40 ring-offset-2 border-background"
                          : "border-transparent hover:scale-105 opacity-80 hover:opacity-100",
                      )}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Permission Matrix */}
            <RolePermissionMatrix
              permissions={formData.permissions}
              onChange={(permissions) =>
                setFormData({ ...formData, permissions })
              }
              isSystemAdminRole={isSystemAdminRole}
              roleName={editingRole?.name}
            />
          </div>
        </ScrollArea>

        <DialogFooter className="m-0 flex flex-row items-center justify-end gap-3 px-6 py-4 pb-5 border-t bg-muted/20">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={
              isPending ||
              !formData.name.trim() ||
              (editingRole !== null && !isFormDirty)
            }
          >
            {isPending
              ? "Saving..."
              : editingRole
                ? "Save Changes"
                : "Add Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
