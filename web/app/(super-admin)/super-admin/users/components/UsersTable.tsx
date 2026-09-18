"use client";

import React from "react";
import { Users, Building2, Crown } from "lucide-react";
import { PlatformUser } from "@/shared/lib/api/super-admin.api";
import {
  CRMRoleBadge,
  CRMActionMenu,
} from "@/shared/components/crm";
import { EmptyState } from "@/shared/components/EmptyState";
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

  const getSortIndicator = (key: string) => {
    if (sortConfig.key !== key) return null;
    return (
      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
        {sortConfig.direction === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  const handleSortKey = (key: string) => {
    const nextDir: SortDirection =
      sortConfig.key === key
        ? sortConfig.direction === "asc"
          ? "desc"
          : null
        : "asc";
    onSort(key, nextDir);
  };

  return (
    <div className="overflow-auto flex-1 min-h-0 relative flex flex-col">
      <table className="w-full text-left text-xs border-collapse min-w-[950px] table-fixed">
        <colgroup>
          <col style={{ width: "48px" }} />
          <col style={{ width: "280px" }} />
          <col style={{ width: "160px" }} />
          <col style={{ width: "240px" }} />
          <col style={{ width: "130px" }} />
          <col style={{ width: "160px" }} />
          <col style={{ width: "64px" }} />
        </colgroup>
        <thead className="sticky top-0 z-20 bg-muted border-b border-border shadow-xs">
          <tr className="text-xs font-bold text-foreground">
            <th className="w-12 px-4 py-3.5 text-center bg-muted border-r border-border/60">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(e) => onToggleSelectAll(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
              />
            </th>
            <th
              className="px-4 py-3.5 text-left border-r border-border/60 bg-muted cursor-pointer select-none"
              onClick={() => handleSortKey("name")}
            >
              <div className="flex items-center gap-1.5">
                <span>User</span>
                {getSortIndicator("name")}
              </div>
            </th>
            <th
              className="px-4 py-3.5 text-left border-r border-border/60 bg-muted cursor-pointer select-none"
              onClick={() => handleSortKey("role")}
            >
              <div className="flex items-center gap-1.5">
                <span>Platform Role</span>
                {getSortIndicator("role")}
              </div>
            </th>
            <th className="px-4 py-3.5 text-left border-r border-border/60 bg-muted">
              <span>Organizations &amp; Role</span>
            </th>
            <th
              className="px-4 py-3.5 text-left border-r border-border/60 bg-muted cursor-pointer select-none"
              onClick={() => handleSortKey("status")}
            >
              <div className="flex items-center gap-1.5">
                <span>Status</span>
                {getSortIndicator("status")}
              </div>
            </th>
            <th
              className="px-4 py-3.5 text-left border-r border-border/60 bg-muted cursor-pointer select-none"
              onClick={() => handleSortKey("createdAt")}
            >
              <div className="flex items-center gap-1.5">
                <span>Created Date</span>
                {getSortIndicator("createdAt")}
              </div>
            </th>
            <th className="w-16 px-4 py-3.5 text-right bg-muted">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40 text-xs">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse h-16">
                <td className="px-4 py-4 text-center">
                  <div className="h-4 w-4 bg-muted rounded mx-auto" />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-muted rounded-lg shrink-0" />
                    <div className="space-y-1.5 min-w-0">
                      <div className="h-3.5 w-32 bg-muted rounded" />
                      <div className="h-2.5 w-20 bg-muted/60 rounded" />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4"><div className="h-6 w-24 bg-muted rounded-md" /></td>
                <td className="px-4 py-4"><div className="h-4 w-28 bg-muted rounded" /></td>
                <td className="px-4 py-4"><div className="h-6 w-16 bg-muted rounded-md" /></td>
                <td className="px-4 py-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                <td className="px-4 py-4 text-right"><div className="h-6 w-6 bg-muted rounded ml-auto" /></td>
              </tr>
            ))
          ) : users.length > 0 ? (
            users.map((u) => {
              const color = getOrgAvatarColor(u.name || u.email);
              const isSelected = selectedUserIds.includes(u.id);


              return (
                <tr
                  key={u.id}
                  className={cn(
                    "group h-16 hover:bg-muted/30 transition-colors",
                    isSelected && "bg-primary/[0.03]"
                  )}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectUser(u.id)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                    />
                  </td>

                  {/* User Name & Avatar */}
                  <td className="px-4 py-3.5 font-medium overflow-hidden">
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
                        <p
                          onClick={() => onViewUser(u)}
                          className="font-bold text-sm text-foreground hover:text-emerald-600 transition-colors cursor-pointer truncate"
                        >
                          {u.name || "No name registered"}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Platform Role */}
                  <td className="px-4 py-3.5">
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
                  </td>

                  {/* Organizations */}
                  <td className="px-4 py-3.5">
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
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
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
                  </td>

                  {/* Created Date */}
                  <td className="px-4 py-3.5">
                    <p className="text-xs font-semibold text-foreground">
                      {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(u.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                    </p>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right">
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
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={7} className="p-6 text-center text-muted-foreground align-middle border-0">
                <div className="flex flex-col items-center justify-center py-6">
                  <EmptyState
                    icon={Users}
                    title="No users found"
                    description="No platform users match your search query or filter criteria."
                    className="border-none bg-transparent shadow-none p-0 min-h-0"
                  />
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
