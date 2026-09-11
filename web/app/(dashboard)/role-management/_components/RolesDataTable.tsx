"use client";

import React, { useMemo } from "react";
import { Shield, Users, RotateCcw, Plus } from "lucide-react";
import { CRMDataTable, CRMDataTableColumn } from "@/shared/components/crm/CRMDataTable";
import { CRMActionMenu } from "@/shared/components/crm/CRMActionMenu";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { EmptyState } from "@/shared/components/EmptyState";
import { Badge } from "@/shared/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { normalizeToModuleTitle } from "@/shared/lib/auth/rbac";
import { Role, RoleSortConfig } from "@/shared/types/role";
import type { SortDirection } from "@/shared/components/DataTableColumnHeader";
import { getRoleColor } from "./role-utils";

export interface RolesDataTableProps {
  roles: Role[];
  isLoading: boolean;
  sortConfig: RoleSortConfig | null;
  onSort: (key: string, direction: "asc" | "desc" | null) => void;
  canManageRoles: boolean;
  canEditRole: (role: Role) => boolean;
  onViewRole: (role: Role) => void;
  onEditRole: (role: Role) => void;
  onDeleteRole: (role: Role) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  onAddRole: () => void;
}

export const RolesDataTable: React.FC<RolesDataTableProps> = ({
  roles,
  isLoading,
  sortConfig,
  onSort,
  canManageRoles,
  canEditRole,
  onViewRole,
  onEditRole,
  onDeleteRole,
  onClearFilters,
  hasActiveFilters,
  onAddRole,
}) => {
  const columns = useMemo<CRMDataTableColumn<Role>[]>(() => {
    return [
      // 1. Role Name
      {
        header: "Role Name",
        sortable: true,
        sortDirection: sortConfig?.key === "name" ? sortConfig.direction : null,
        onSort: (dir: SortDirection) => onSort("name", dir),
        cell: (role) => {
          const color = getRoleColor(role);
          return (
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs border shrink-0"
                style={{
                  backgroundColor: `${color}15`,
                  borderColor: `${color}30`,
                  color: color,
                }}
              >
                <Shield className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewRole(role);
                  }}
                  className="font-bold text-sm text-foreground hover:text-primary transition-colors cursor-pointer truncate block text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xs"
                >
                  {role.name}
                </button>
                <p className="text-[11px] text-muted-foreground truncate">
                  {role.description || (role.isSystem ? "Built-in system role" : "Custom role")}
                </p>
              </div>
            </div>
          );
        },
        className: "min-w-[240px]",
      },

      // 2. Type Badge
      {
        header: "Type",
        cell: (role) => {
          return (
            <StatusBadge
              status={role.isSystem ? "System" : "Custom"}
              variant={role.isSystem ? "indigo" : "emerald"}
              className="gap-1 font-semibold"
            />
          );
        },
        className: "w-[130px]",
      },

      // 3. Assigned Users
      {
        header: "Assigned Users",
        sortable: true,
        sortDirection: sortConfig?.key === "users" ? sortConfig.direction : null,
        onSort: (dir: SortDirection) => onSort("users", dir),
        cell: (role) => {
          return (
            <div className="flex items-center gap-1.5 font-medium text-xs text-foreground">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-bold">{role._count?.users || 0}</span>
              <span className="text-muted-foreground">users</span>
            </div>
          );
        },
        className: "w-[150px]",
      },

      // 4. Permission Modules
      {
        header: "Permission Modules",
        cell: (role) => {
          const isSuperAdmin = role.name.toUpperCase() === "SUPER ADMIN";
          const isAdmin = role.name.toUpperCase() === "ADMIN";
          const rawPermissions = role.permissions || [];
          const activePermModules: string[] =
            isAdmin || isSuperAdmin
              ? ["Full Workspace Access"]
              : Array.from(
                  new Set(
                    rawPermissions
                      .filter((p) => p.hasAccess)
                      .map(
                        (p) => (normalizeToModuleTitle(p.module) || p.module) as string
                      )
                  )
                );

          if (activePermModules.length === 0) {
            return (
              <span className="text-xs text-muted-foreground italic">
                No permissions assigned
              </span>
            );
          }

          return (
            <div className="flex flex-wrap items-center gap-1.5">
              {activePermModules.slice(0, 3).map((mod) => (
                <Badge
                  key={mod}
                  variant="secondary"
                  className="font-normal text-[11px] bg-muted/60 text-muted-foreground hover:bg-muted"
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
                        className="font-normal text-[11px] border-dashed text-muted-foreground cursor-help"
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
            </div>
          );
        },
        className: "min-w-[280px]",
      },

      // 5. Actions
      {
        header: <span className="sr-only">Actions</span>,
        align: "right",
        headerClassName: "w-16 text-right",
        cell: (role) => {
          const canEditThis = canEditRole(role);
          const canDeleteThis = canManageRoles && !role.isSystem;

          return (
            <div
              className="flex justify-end"
              onClick={(e) => e.stopPropagation()}
            >
              <CRMActionMenu
                items={[
                  {
                    label: "View Details",
                    icon: "eye",
                    onClick: () => onViewRole(role),
                  },
                  ...(canEditThis
                    ? [
                        {
                          label: "Edit Permissions",
                          icon: "edit",
                          onClick: () => onEditRole(role),
                        },
                      ]
                    : []),
                  ...(canDeleteThis
                    ? [
                        {
                          label: "Delete Role",
                          icon: "trash",
                          variant: "destructive" as const,
                          separatorBefore: true,
                          onClick: () => onDeleteRole(role),
                        },
                      ]
                    : []),
                ]}
                aria-label={`Actions for ${role.name} role`}
              />
            </div>
          );
        },
        className: "w-16 text-right",
      },
    ];
  }, [sortConfig, onSort, canManageRoles, canEditRole, onViewRole, onEditRole, onDeleteRole]);

  return (
    <CRMDataTable
      data={roles}
      columns={columns}
      isLoading={isLoading}
      onRowClick={(role) => onViewRole(role)}
      hasPagination={false}
      rowClassName="transition-colors"
      emptyMessage={
        <div className="flex flex-col items-center justify-center py-10">
          <EmptyState
            icon={Shield}
            title={hasActiveFilters ? "No roles found" : "No roles configured"}
            description={
              hasActiveFilters
                ? "No roles match your current search or filter criteria."
                : "Create custom roles to manage granular permissions for your organization."
            }
            className="border-none bg-transparent shadow-none p-0 min-h-0"
            action={
              hasActiveFilters
                ? {
                    label: "Clear Filters",
                    onClick: onClearFilters,
                    icon: RotateCcw,
                  }
                : canManageRoles
                ? {
                    label: "Add Role",
                    onClick: onAddRole,
                    icon: Plus,
                  }
                : undefined
            }
          />
        </div>
      }
    />
  );
};
