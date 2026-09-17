"use client";

import React from "react";
import {
  Building2,
  Users,
  MoreVertical,
  Eye,
  Trash2,
  RotateCcw,
  Plus,
} from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { PlatformOrganization } from "@/shared/lib/api/super-admin.api";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { PlanBadge } from "@/shared/components/PlanBadge";
import { EmptyState } from "@/shared/components/EmptyState";
import { cn } from "@/shared/lib/utils";
import { getOrgAvatarColor } from "@/shared/utils/avatar-colors";

interface OrganizationsTableProps {
  loading: boolean;
  paginatedOrganizations: PlatformOrganization[];
  selectedOrgIds: string[];
  setSelectedOrgIds: React.Dispatch<React.SetStateAction<string[]>>;
  sortConfig: { key: string; direction: "asc" | "desc" } | null;
  setSort: (key: string, dir: "asc" | "desc" | null) => void;
  handleOpenDetails: (orgId: string) => void;
  setOrgToDelete: (org: PlatformOrganization) => void;
  hasActiveFilters: boolean;
  handleClearFilters: () => void;
  onCreateClick: () => void;
}

export function OrganizationsTable({
  loading,
  paginatedOrganizations,
  selectedOrgIds,
  setSelectedOrgIds,
  sortConfig,
  setSort,
  handleOpenDetails,
  setOrgToDelete,
  hasActiveFilters,
  handleClearFilters,
  onCreateClick,
}: OrganizationsTableProps) {
  const getOrgColor = (name: string) => {
    return getOrgAvatarColor(name);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: dateStr, time: "" };
    const date = d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return { date, time };
  };

  return (
    <div className="overflow-auto flex-1 min-h-0 relative flex flex-col">
      <table className="w-full text-left text-xs border-collapse min-w-[1100px] table-fixed">
        <colgroup>
          <col style={{ width: "48px" }} />
          <col style={{ width: "280px" }} />
          <col style={{ width: "130px" }} />
          <col style={{ width: "130px" }} />
          <col style={{ width: "220px" }} />
          <col style={{ width: "130px" }} />
          <col style={{ width: "160px" }} />
          <col style={{ width: "64px" }} />
        </colgroup>
        <thead className="sticky top-0 z-20 bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-500/20 shadow-xs backdrop-blur-xs">
          <tr className="text-xs font-bold text-foreground">
            <th className="w-12 px-4 py-3.5 text-center bg-emerald-50/80 dark:bg-emerald-950/40 border-r border-emerald-500/15">
              <input
                type="checkbox"
                checked={
                  paginatedOrganizations.length > 0 &&
                  paginatedOrganizations.every((o) => selectedOrgIds.includes(o.id))
                }
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedOrgIds(Array.from(new Set([...selectedOrgIds, ...paginatedOrganizations.map((o) => o.id)])));
                  } else {
                    const pageIds = new Set(paginatedOrganizations.map((o) => o.id));
                    setSelectedOrgIds(selectedOrgIds.filter((id) => !pageIds.has(id)));
                  }
                }}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
              />
            </th>
            <th
              className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
              onClick={() => setSort("name", sortConfig?.key === "name" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc")}
            >
              <div className="flex items-center gap-1.5">
                <span>Organization</span>
                {sortConfig?.key === "name" && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                )}
              </div>
            </th>
            <th
              className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
              onClick={() => setSort("plan", sortConfig?.key === "plan" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc")}
            >
              <div className="flex items-center gap-1.5">
                <span>Plan</span>
                {sortConfig?.key === "plan" && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                )}
              </div>
            </th>
            <th
              className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
              onClick={() => setSort("userCount", sortConfig?.key === "userCount" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc")}
            >
              <div className="flex items-center gap-1.5">
                <span>Users</span>
                {sortConfig?.key === "userCount" && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                )}
              </div>
            </th>
            <th className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40">
              <span>CRM Activity</span>
            </th>
            <th className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40">
              <span>Status</span>
            </th>
            <th
              className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
              onClick={() => setSort("createdAt", sortConfig?.key === "createdAt" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc")}
            >
              <div className="flex items-center gap-1.5">
                <span>Created Date</span>
                {sortConfig?.key === "createdAt" && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                )}
              </div>
            </th>
            <th className="w-16 px-4 py-3.5 text-right bg-emerald-50/80 dark:bg-emerald-950/40">
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
                <td className="px-4 py-4"><div className="h-6 w-16 bg-muted rounded-md" /></td>
                <td className="px-4 py-4"><div className="h-4 w-12 bg-muted rounded" /></td>
                <td className="px-4 py-4"><div className="h-3.5 w-28 bg-muted rounded" /></td>
                <td className="px-4 py-4"><div className="h-6 w-16 bg-muted rounded-md" /></td>
                <td className="px-4 py-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                <td className="px-4 py-4 text-right"><div className="h-6 w-6 bg-muted rounded ml-auto" /></td>
              </tr>
            ))
          ) : paginatedOrganizations.length > 0 ? (
            paginatedOrganizations.map((org) => {
              const color = getOrgColor(org.name);
              const { date, time } = formatDate(org.createdAt);
              const isSelected = selectedOrgIds.includes(org.id);

              return (
                <tr
                  key={org.id}
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
                      onChange={() => {
                        setSelectedOrgIds((prev) =>
                          prev.includes(org.id) ? prev.filter((id) => id !== org.id) : [...prev, org.id]
                        );
                      }}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                    />
                  </td>

                  {/* Organization Name & Avatar */}
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
                        {org.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          onClick={() => handleOpenDetails(org.id)}
                          className="font-bold text-sm text-foreground hover:text-emerald-600 transition-colors cursor-pointer truncate"
                        >
                          {org.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          /{org.slug}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Plan */}
                  <td className="px-4 py-3.5">
                    <PlanBadge plan={org.plan} size="sm" className="rounded-md font-bold text-[10.5px] px-2 py-0.5" />
                  </td>

                  {/* Users */}
                  <td className="px-4 py-3.5 font-semibold text-foreground">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-foreground font-bold">{org.userCount}</span>
                      <span className="text-[11px] font-normal text-muted-foreground">
                        {org.userCount === 1 ? "user" : "users"}
                      </span>
                    </div>
                  </td>

                  {/* CRM Activity */}
                  <td className="px-4 py-3.5 text-muted-foreground">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{org.leadCount} leads</span>
                        <span>•</span>
                        <span className="font-semibold text-foreground">{org.dealCount} deals</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono">{org.customerCount} customers</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <StatusBadge
                      status={org.status || "ACTIVE"}
                      variant={org.status === "ACTIVE" ? "emerald" : "neutral"}
                    />
                  </td>

                  {/* Created Date */}
                  <td className="px-4 py-3.5">
                    <p className="text-xs font-semibold text-foreground">{date}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{time}</p>
                  </td>

                  {/* Actions Dropdown */}
                  <td className="px-4 py-3.5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-44 rounded-xl p-1.5 shadow-lg border-border bg-popover text-popover-foreground"
                      >
                        <DropdownMenuItem
                          onClick={() => handleOpenDetails(org.id)}
                          className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 hover:bg-muted focus:bg-muted"
                        >
                          <AppIcon name="eye" icon={Eye} size={14} className="text-muted-foreground group-hover:text-foreground shrink-0" />
                          <span>View Overview</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="my-1" />

                        <DropdownMenuItem
                          onClick={() => setOrgToDelete(org)}
                          className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
                        >
                          <AppIcon name="trash" icon={Trash2} size={14} className="text-destructive shrink-0" />
                          <span>Delete Workspace</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={8} className="p-6 text-center text-muted-foreground align-middle border-0">
                <div className="flex flex-col items-center justify-center py-6">
                  <EmptyState
                    icon={Building2}
                    title="No organizations found"
                    description={
                      hasActiveFilters
                        ? "No organizations match your current search or filter criteria."
                        : "There are currently no workspace organizations registered on the platform."
                    }
                    className="border-none bg-transparent shadow-none p-0 min-h-0"
                    action={
                      hasActiveFilters
                        ? {
                            label: "Clear Filters",
                            onClick: handleClearFilters,
                            icon: RotateCcw,
                          }
                        : {
                            label: "Create Organization",
                            onClick: onCreateClick,
                            icon: Plus,
                          }
                    }
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
