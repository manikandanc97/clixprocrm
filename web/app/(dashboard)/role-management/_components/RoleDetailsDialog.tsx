"use client";

import React from "react";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { normalizeToModuleTitle } from "@/shared/lib/auth/rbac";
import { Role, RolePermission } from "@/shared/types/role";

interface RoleDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
  roleColor: string;
}

export function RoleDetailsDialog({
  isOpen,
  onOpenChange,
  role,
  roleColor,
}: RoleDetailsDialogProps) {
  const isSystemAdminRole =
    role?.name?.toUpperCase() === "ADMIN" ||
    role?.name?.toUpperCase() === "SUPER ADMIN";

  const activePermissions = (role?.permissions || []).filter(
    (p: RolePermission) => p.hasAccess,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl rounded-2xl shadow-elevated border-border bg-popover/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full flex-shrink-0 shadow-xs ring-2 ring-background"
              style={{ backgroundColor: roleColor }}
            />
            <DialogTitle className="text-lg font-bold">{role?.name}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-3 bg-muted/20 border rounded-xl text-xs flex items-center justify-between">
            <span className="text-muted-foreground font-medium">
              Assigned Team Members:
            </span>
            <span className="font-bold text-foreground text-sm">
              {role?._count?.users || 0} Members
            </span>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Authorized Module Permissions
            </h5>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-3 border rounded-xl bg-card">
              {isSystemAdminRole ? (
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  Full Workspace Privileges
                </Badge>
              ) : activePermissions.length === 0 ? (
                <span className="text-xs text-muted-foreground italic">
                  No active module permissions.
                </span>
              ) : (
                activePermissions.map((p: RolePermission) => (
                  <Badge key={p.module} variant="secondary" className="text-xs">
                    <Check className="h-3 w-3 mr-1 text-emerald-500" />
                    {normalizeToModuleTitle(p.module) || p.module}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-row items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
