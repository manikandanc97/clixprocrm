"use client";

import React, { useMemo } from "react";
import { Users, Building2, Crown } from "lucide-react";
import { PlatformUser } from "@/shared/lib/api/super-admin.api";
import {
  CRMRoleBadge,
  CRMActionMenu,
} from "@/shared/components/crm";
import {
  CRMDataTable,
  CRMDataTableColumn,
} from "@/shared/components/crm/CRMDataTable";
import { Checkbox } from "@/shared/ui/checkbox";
import { getOrgAvatarColor } from "@/shared/utils/avatar-colors";
import { SortDirection } from "@/shared/components/DataTableColumnHeader";
import { cn } from "@/shared/lib/utils";

interface UsersTableProps {
  users: PlatformUser[];
  loading: boolean;
  selectedUserIds: string[];
  onToggleSelectUser: (id: string) => void;
  onToggleSelectAll: (checked: boolean) => void;
  sortConfig: { key: string; direction: SortDirection };
  onSort: (key: string, direction: SortDirection) => void;
  onViewUser: (user: PlatformUser) => void;
  onTransferUser: (user: PlatformUser) => void;
  onDeleteUser: (user: PlatformUser) => void;
  onToggleStatus: (user: PlatformUser) => void;
}

export function UsersTable({
  users,
  loading,
  selectedUserIds,
  onToggleSelectUser,
  onToggleSelectAll,
  sortConfig,
  onSort,
  onViewUser,
  onTransferUser,
  onDeleteUser,
  onToggleStatus,
}: UsersTableProps) {
  const isAllSelected =
    users.length > 0 && users.every((u) => selectedUserIds.includes(u.id));

  const columns = useMemo<CRMDataTableColumn<PlatformUser>[]>(() => {
    return [
      // 1. Row Selection
      {
        header: (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={(checked) => onToggleSelectAll(Boolean(checked))}
              aria-label="Select all users on this page"
            />
          </div>
        ),
        cell: (u) => {
          const isSelected = selectedUserIds.includes(u.id);
          return (
            <div
              className="flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelectUser(u.id)}
                aria-label={`Select user ${u.name || u.email}`}
              />
            </div>
          );
        },
        className: "w-12 px-3 text-center",
        headerClassName: "w-12 px-3 text-center",
        align: "center",
      },

      // 2. User Name & Avatar
      {
        header: "User",
        sortable: true,
        sortDirection: sortConfig.key === "name" ? sortConfig.direction : null,
        onSort: (dir) => onSort("name", dir),
        cell: (u) => {
          const color = getOrgAvatarColor(u.name || u.email);
          return (
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-xs border shrink-0",
                  color.bg,
                  color.text,
                  color.border
                )}
              >
                {u.name?.charAt(0).toUpperCase() || u.email.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onViewUser(u)}
                  className="font-bold text-sm text-foreground hover:text-emerald-600 transition-colors cursor-pointer truncate block text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xs"
                >
                  {u.name || "No name registered"}
                </button>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {u.email}
                </p>
              </div>
            </div>
          );
        },
        className: "min-w-[200px] max-w-[280px]",
      },

      // 3. Platform Role
      {
        header: "Platform Role",
        sortable: true,
        sortDirection: sortConfig.key === "role" ? sortConfig.direction : null,
        onSort: (dir) => onSort("role", dir),
        cell: (u) => (
          <>
            {u.isSuperAdmin ? (
              <span className="inline-flex items-center gap-1.5 text-[10.5px] px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold shadow-xs whitespace-nowrap uppercase tracking-wider">
                <Crown className="h-3 w-3 shrink-0" />
                SUPER ADMIN
              </span>
            ) : (
              <span className="text-xs text-muted-foreground font-medium">
                Standard User
              </span>
            )}
          </>
        ),
        className: "w-[160px]",
      },

      // 4. Organizations
      {
        header: "Organizations & Role",
        cell: (u) => (
          <>
            {u.organizations && u.organizations.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 max-w-[240px]">
                {u.organizations.map((org) => (
                  <div
                    key={org.tenantId}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60 border border-border/70 text-[11px] max-w-[200px]"
                  >
                    <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="font-semibold text-foreground truncate">{org.name}</span>
                    <CRMRoleBadge role={org.role} size="xs" />
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic">
                Platform Only (No Tenant)
              </span>
            )}
          </>
        ),
        className: "w-[240px]",
      },

      // 5. Status
      {
        header: "Status",
        sortable: true,
        sortDirection: sortConfig.key === "status" ? sortConfig.direction : null,
        onSort: (dir) => onSort("status", dir),
        cell: (u) => (
          <span
            className={cn(
              "inline-flex items-center px-2.5 py-0.5 rounded-md text-[10.5px] font-bold tracking-wider uppercase border shadow-xs",
              u.status === "ACTIVE"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : u.status === "SUSPENDED"
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                : "bg-muted text-muted-foreground border-border"
            )}
          >
            {u.status === "ACTIVE" ? "Active" : u.status === "SUSPENDED" ? "Suspended" : "Inactive"}
          </span>
        ),
        className: "w-[130px]",
      },

      // 6. Created Date
      {
        header: "Created Date",
        sortable: true,
        sortDirection: sortConfig.key === "createdAt" ? sortConfig.direction : null,
        onSort: (dir) => onSort("createdAt", dir),
        cell: (u) => (
          <div>
            <p className="text-xs font-semibold text-foreground">
              {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {new Date(u.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
            </p>
          </div>
        ),
        className: "w-[160px]",
      },

      // 7. Actions
      {
        header: <span className="sr-only">Actions</span>,
        cell: (u) => {
          return (
            <div className="flex items-center justify-end">
              <CRMActionMenu
                triggerOrientation="vertical"
                width="w-56"
                items={[
                  {
                    label: "View User Profile",
                    icon: "quotations",
                    variant: "primary" as const,
                    onClick: () => onViewUser(u),
                  },
                  ...(!u.isSuperAdmin
                    ? [
                        {
                          label: "Transfer Super Admin",
                          icon: "security",
                          separatorBefore: true,
                          className:
                            "text-amber-600 dark:text-amber-400 font-medium hover:bg-amber-500/10 hover:text-amber-600",
                          iconColor: "text-amber-500",
                          onClick: () => onTransferUser(u),
                        },
                        {
                          label:
                            u.status === "ACTIVE"
                              ? "Suspend Account"
                              : "Re-activate Account",
                          icon:
                            u.status === "ACTIVE"
                              ? "security"
                              : "checkCircle",
                          variant:
                            u.status === "ACTIVE"
                              ? ("destructive" as const)
                              : ("default" as const),
                          separatorBefore: true,
                          className:
                            u.status !== "ACTIVE"
                              ? "text-emerald-600 dark:text-emerald-400 font-medium hover:bg-emerald-500/10 hover:text-emerald-600"
                              : undefined,
                          iconColor:
                            u.status !== "ACTIVE"
                              ? "text-emerald-500"
                              : undefined,
                          onClick: () => onToggleStatus(u),
                        },
                        {
                          label: "Delete User",
                          icon: "trash",
                          variant: "destructive" as const,
                          separatorBefore: true,
                          onClick: () => onDeleteUser(u),
                        },
                      ]
                    : []),
                ]}
              />
            </div>
          );
        },
        className: "w-16 text-right",
        headerClassName: "w-16 text-right",
        align: "right",
      },
    ];
  }, [
    isAllSelected,
    selectedUserIds,
    sortConfig,
    onSort,
    onToggleSelectAll,
    onToggleSelectUser,
    onViewUser,
    onTransferUser,
    onToggleStatus,
    onDeleteUser,
  ]);

  return (
    <CRMDataTable<PlatformUser>
      data={users}
      columns={columns}
      isLoading={loading}
      isError={false}
      emptyIcon={Users}
      emptyTitle="No users found"
      emptyDescription="No platform users match your search query or filter criteria."
      hasPagination={false}
      rowClassName={(u) =>
        cn(
          "transition-colors",
          selectedUserIds.includes(u.id) && "bg-primary/[0.03]"
        )
      }
    />
  );
}
