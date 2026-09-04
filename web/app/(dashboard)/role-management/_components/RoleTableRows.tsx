"use client";

import React from "react";
import { Users, MoreVertical, User, Edit2, Trash2, Shield } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import {
  CRMTableRow,
  CRMTableCell,
  TruncatedText,
  CRMActionMenu,
} from "@/shared/components/crm";
import { EmptyState } from "@/shared/components/EmptyState";
import { normalizeToModuleTitle } from "@/shared/lib/auth/rbac";
import { toast } from "sonner";

interface RoleTableRowsProps {
  roles: any[];
  canManageRoles: boolean;
  currentUserRole: string;
  getRoleColor: (role: any) => string;
  onViewRole: (role: any) => void;
  onEditRole: (role: any) => void;
  onDeleteRole: (role: any) => void;
}

export function RoleTableRows({
  roles,
  canManageRoles,
  currentUserRole,
  getRoleColor,
  onViewRole,
  onEditRole,
  onDeleteRole,
}: RoleTableRowsProps) {
  if (roles.length === 0) {
    return (
      <CRMTableRow className="hover:bg-transparent border-0">
        <CRMTableCell colSpan={4} className="py-12 border-0 text-center">
          <EmptyState
            icon={Shield}
            title="No roles found"
            description="No roles match the current search query."
            className="border-0 bg-transparent shadow-none rounded-none py-6 min-h-[180px]"
          />
        </CRMTableCell>
      </CRMTableRow>
    );
  }

  return (
    <>
      {roles.map((role) => {
        const isSuperAdmin = role.name.toUpperCase() === "SUPER ADMIN";
        const isAdmin = role.name.toUpperCase() === "ADMIN";
        const canEditThis =
          canManageRoles && !(currentUserRole === "ADMIN" && isSuperAdmin);

        const rawPermissions = role.permissions || [];
        const activePermModules: string[] =
          isAdmin || isSuperAdmin
            ? ["Full Workspace Access"]
            : Array.from(
                new Set(
                  rawPermissions
                    .filter((p: any) => p.hasAccess)
                    .map(
                      (p: any) =>
                        (normalizeToModuleTitle(p.module) || p.module) as string,
                    ),
                ),
              );

        return (
          <CRMTableRow key={role.id} className="cursor-default">
            {/* Role Name */}
            <CRMTableCell>
              <div className="flex items-center gap-3 min-w-0 max-w-[220px]">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 shadow-xs ring-2 ring-background"
                  style={{ backgroundColor: getRoleColor(role) }}
                />
                <TruncatedText
                  text={role.name}
                  lines={1}
                  onClick={() => onViewRole(role)}
                  className="font-bold text-sm tracking-tight text-foreground hover:text-primary cursor-pointer transition-colors"
                />
              </div>
            </CRMTableCell>

            {/* Assigned Users */}
            <CRMTableCell>
              <div className="flex items-center gap-2 font-medium text-sm text-foreground">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{role._count?.users || 0}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  users
                </span>
              </div>
            </CRMTableCell>

            {/* Permission Modules */}
            <CRMTableCell>
              <div className="flex flex-wrap items-center gap-1.5">
                {activePermModules.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic">
                    No permissions assigned
                  </span>
                ) : (
                  <>
                    {activePermModules.slice(0, 3).map((mod) => (
                      <Badge
                        key={mod}
                        variant="secondary"
                        className="font-normal text-xs bg-muted/60 text-muted-foreground hover:bg-muted"
                      >
                        {mod}
                      </Badge>
                    ))}
                    {activePermModules.length > 3 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className="font-normal text-xs border-dashed text-muted-foreground cursor-help"
                            >
                              +{activePermModules.length - 3} More
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="p-3 max-w-xs rounded-xl shadow-2xl">
                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">
                              Additional Modules ({activePermModules.length - 3})
                            </p>
                            <p className="text-xs font-medium leading-relaxed">
                              {activePermModules.slice(3).join(", ")}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </>
                )}
              </div>
            </CRMTableCell>

            {/* Actions */}
            <CRMTableCell className="text-right">
              <CRMActionMenu
                items={[
                  {
                    label: "View Details",
                    icon: User,
                    onClick: () => onViewRole(role),
                  },
                  ...(canEditThis
                    ? [
                        {
                          label: "Edit Permissions",
                          icon: Edit2,
                          onClick: () => onEditRole(role),
                        },
                      ]
                    : []),
                  ...(canManageRoles
                    ? [
                        {
                          label: "Delete Role",
                          icon: Trash2,
                          variant: "destructive" as const,
                          separatorBefore: true,
                          onClick: () => {
                            if (role.isSystem) {
                              toast.error(
                                `System default role "${role.name}" cannot be deleted.`,
                              );
                              return;
                            }
                            onDeleteRole(role);
                          },
                        },
                      ]
                    : []),
                ]}
              />
            </CRMTableCell>
          </CRMTableRow>
        );
      })}
    </>
  );
}
