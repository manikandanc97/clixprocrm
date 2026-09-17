"use client";

import React from "react";
import {
  Boxes,
  Shield,
  ArrowUp,
  ArrowDown,
  Lock,
  Link as LinkIcon,
  FolderTree,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";
import { EmptyState } from "@/shared/components/EmptyState";
import { CRMActionMenu } from "@/shared/components/crm";
import { DataTableColumnHeader, SortDirection } from "@/shared/components/DataTableColumnHeader";
import { getDynamicIcon } from "@/shared/lib/icons/dynamic-icon";
import { cn } from "@/shared/lib/utils";
import { PlatformModule } from "@/shared/lib/api/super-admin.api";
import { ModulesTableSkeleton } from "./ModulesTableSkeleton";
import { renderAccessBadge } from "../utils/modules-badge.util";

interface ModulesDataTableProps {
  loading: boolean;
  activeScope: "tenant" | "platform";
  search: string;
  groupFilter: string;
  statusFilter: string;
  filteredModules: PlatformModule[];
  sortedModules: PlatformModule[];
  paginatedModules: PlatformModule[];
  sortConfig: { key: string; direction: SortDirection };
  handleSort: (key: string, dir: SortDirection) => void;
  currentPage: number;
  rowsPerPage: number;
  reordering: boolean;
  handleMoveOrder: (index: number, direction: "up" | "down") => void;
  handleOpenEdit: (mod: PlatformModule) => void;
  handleToggleStatus: (mod: PlatformModule, nextVal: boolean) => void;
  setModuleToDelete: (mod: PlatformModule) => void;
}

export function ModulesDataTable({
  loading,
  activeScope,
  search,
  groupFilter,
  statusFilter,
  filteredModules,
  sortedModules,
  paginatedModules,
  sortConfig,
  handleSort,
  currentPage,
  rowsPerPage,
  reordering,
  handleMoveOrder,
  handleOpenEdit,
  handleToggleStatus,
  setModuleToDelete,
}: ModulesDataTableProps) {
  if (loading) {
    return <ModulesTableSkeleton />;
  }

  if (filteredModules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <EmptyState
          icon={activeScope === "tenant" ? Boxes : Shield}
          title={
            search || groupFilter !== "ALL" || statusFilter !== "ALL"
              ? "No menus match your filters"
              : "No navigation menus registered"
          }
          description={
            search || groupFilter !== "ALL" || statusFilter !== "ALL"
              ? "Try clearing your search query or group filter to view all navigation menus."
              : "Click '+ Add Menu' to register your first navigation item."
          }
          className="border-none bg-transparent shadow-none p-0 min-h-0"
        />
      </div>
    );
  }

  return (
    <table className="w-full text-left text-xs border-collapse min-w-[950px] table-fixed">
      <colgroup>
        <col style={{ width: "90px" }} />
        <col style={{ width: "280px" }} />
        <col style={{ width: "160px" }} />
        <col style={{ width: "160px" }} />
        <col style={{ width: "140px" }} />
        <col style={{ width: "80px" }} />
      </colgroup>
      <thead className="sticky top-0 z-20 bg-muted border-b border-border shadow-xs">
        <tr className="text-xs font-bold text-foreground">
          <th className="px-3 py-3.5 text-center border-r border-border/60 bg-muted">
            <DataTableColumnHeader
              title="Order"
              align="center"
              sortable
              sortDirection={sortConfig.key === "order" ? sortConfig.direction : null}
              onSort={(dir) => handleSort("order", dir)}
            />
          </th>
          <th className="px-4 py-3.5 text-left border-r border-border/60 bg-muted">
            <DataTableColumnHeader
              title="Menu"
              sortable
              sortDirection={sortConfig.key === "label" ? sortConfig.direction : null}
              onSort={(dir) => handleSort("label", dir)}
            />
          </th>
          <th className="px-4 py-3.5 text-left border-r border-border/60 bg-muted">
            <DataTableColumnHeader
              title="Group"
              sortable
              sortDirection={sortConfig.key === "group" ? sortConfig.direction : null}
              onSort={(dir) => handleSort("group", dir)}
            />
          </th>
          <th className="px-4 py-3.5 text-center border-r border-border/60 bg-muted">
            <span>Access</span>
          </th>
          <th className="px-4 py-3.5 text-center border-r border-border/60 bg-muted">
            <DataTableColumnHeader
              title="Status"
              align="center"
              sortable
              sortDirection={sortConfig.key === "isEnabled" ? sortConfig.direction : null}
              onSort={(dir) => handleSort("isEnabled", dir)}
            />
          </th>
          <th className="w-20 px-4 py-3.5 text-right bg-muted">
            <span>Actions</span>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/40 text-xs">
        {paginatedModules.map((mod, pageIndex) => {
          const Icon = getDynamicIcon(mod.icon);
          const globalIndex = (currentPage - 1) * rowsPerPage + pageIndex;
          const isFirst = globalIndex === 0;
          const isLast = globalIndex === sortedModules.length - 1;

          return (
            <tr
              key={mod.id}
              className="group h-16 hover:bg-muted/30 transition-colors"
            >
              {/* ORDER */}
              <td className="px-3 py-3.5 text-center">
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    disabled={isFirst || reordering}
                    onClick={() => handleMoveOrder(globalIndex, "up")}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-xs font-bold text-foreground w-5 text-center">
                    {mod.sortOrder}
                  </span>
                  <button
                    type="button"
                    disabled={isLast || reordering}
                    onClick={() => handleMoveOrder(globalIndex, "down")}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>

              {/* MENU */}
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-xs">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(mod)}
                        className="font-bold text-sm text-foreground hover:text-emerald-600 transition-colors cursor-pointer truncate text-left"
                      >
                        {mod.label}
                      </button>
                      {mod.badge && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 font-semibold bg-primary/10 text-primary border-primary/20 shrink-0"
                        >
                          {mod.badge}
                        </Badge>
                      )}
                      {mod.isSystem && (
                        <span
                          title="Core system module (Protected)"
                          className="inline-flex items-center text-[10px] text-muted-foreground"
                        >
                          <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/60 font-mono text-[11px] text-muted-foreground border border-border/50">
                        <LinkIcon className="w-2.5 h-2.5" />
                        {mod.route}
                      </span>
                    </div>
                  </div>
                </div>
              </td>

              {/* GROUP */}
              <td className="px-4 py-3.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-muted text-foreground border border-border/60">
                  <FolderTree className="w-3 h-3 text-muted-foreground shrink-0" />
                  {mod.group}
                </span>
              </td>

              {/* ACCESS */}
              <td className="px-4 py-3.5 text-center">
                {renderAccessBadge(mod, activeScope)}
              </td>

              {/* STATUS */}
              <td className="px-4 py-3.5 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Switch
                    checked={mod.isEnabled}
                    onCheckedChange={(checked) =>
                      handleToggleStatus(mod, checked)
                    }
                    className="data-[state=checked]:bg-emerald-600 cursor-pointer"
                  />
                  <span
                    className={cn(
                      "text-xs font-bold w-14 text-left",
                      mod.isEnabled
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground"
                    )}
                  >
                    {mod.isEnabled ? "Active" : "Inactive"}
                  </span>
                </div>
              </td>

              {/* ACTIONS */}
              <td className="px-4 py-3.5 text-right">
                <CRMActionMenu
                  triggerOrientation="vertical"
                  items={[
                    {
                      label: "Edit Menu",
                      icon: Edit2,
                      variant: "primary" as const,
                      onClick: () => handleOpenEdit(mod),
                    },
                    {
                      label: mod.isEnabled ? "Disable Menu" : "Enable Menu",
                      icon: mod.isEnabled ? XCircle : CheckCircle2,
                      variant: mod.isEnabled ? ("destructive" as const) : ("default" as const),
                      className: !mod.isEnabled ? "text-emerald-600 dark:text-emerald-400 font-medium" : undefined,
                      onClick: () => handleToggleStatus(mod, !mod.isEnabled),
                    },
                    {
                      label: mod.isSystem ? "System Menu (Protected)" : "Delete Menu",
                      icon: Trash2,
                      variant: mod.isSystem ? ("default" as const) : ("destructive" as const),
                      disabled: mod.isSystem,
                      separatorBefore: true,
                      onClick: () => !mod.isSystem && setModuleToDelete(mod),
                    },
                  ]}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
