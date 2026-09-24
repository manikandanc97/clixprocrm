"use client";

import React, { useMemo } from "react";
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
import { CRMActionMenu } from "@/shared/components/crm";
import {
  CRMDataTable,
  CRMDataTableColumn,
} from "@/shared/components/crm/CRMDataTable";
import { getDynamicIcon } from "@/shared/lib/icons/dynamic-icon";
import { cn } from "@/shared/lib/utils";
import { PlatformModule } from "@/shared/lib/api/super-admin.api";
import { SortDirection } from "@/shared/components/DataTableColumnHeader";
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
  
  const columns = useMemo<CRMDataTableColumn<PlatformModule>[]>(() => {
    return [
      // 1. Order
      {
        header: "Order",
        align: "center",
        sortable: true,
        sortDirection: sortConfig.key === "order" ? sortConfig.direction : null,
        onSort: (dir) => handleSort("order", dir),
        cell: (mod) => {
          const globalIndex = sortedModules.findIndex((m) => m.id === mod.id);
          const isFirst = globalIndex === 0;
          const isLast = globalIndex === sortedModules.length - 1;

          return (
            <div className="flex items-center justify-center gap-1">
              <button
                type="button"
                disabled={isFirst || reordering || loading}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMoveOrder(globalIndex, "up");
                }}
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
                disabled={isLast || reordering || loading}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMoveOrder(globalIndex, "down");
                }}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                title="Move Down"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        },
        className: "w-[90px] px-3",
        headerClassName: "w-[90px] px-3",
      },

      // 2. Menu
      {
        header: "Menu",
        sortable: true,
        sortDirection: sortConfig.key === "label" ? sortConfig.direction : null,
        onSort: (dir) => handleSort("label", dir),
        cell: (mod) => {
          const Icon = getDynamicIcon(mod.icon);
          return (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-xs">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit(mod);
                    }}
                    className="font-bold text-sm text-foreground hover:text-emerald-600 transition-colors cursor-pointer truncate text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xs"
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
          );
        },
        className: "min-w-[200px] max-w-[280px]",
      },

      // 3. Group
      {
        header: "Group",
        sortable: true,
        sortDirection: sortConfig.key === "group" ? sortConfig.direction : null,
        onSort: (dir) => handleSort("group", dir),
        cell: (mod) => (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-muted text-foreground border border-border/60">
            <FolderTree className="w-3 h-3 text-muted-foreground shrink-0" />
            {mod.group}
          </span>
        ),
        className: "w-[160px]",
      },

      // 4. Access
      {
        header: "Access",
        align: "center",
        cell: (mod) => renderAccessBadge(mod, activeScope),
        className: "w-[160px]",
      },

      // 5. Status
      {
        header: "Status",
        align: "center",
        sortable: true,
        sortDirection: sortConfig.key === "isEnabled" ? sortConfig.direction : null,
        onSort: (dir) => handleSort("isEnabled", dir),
        cell: (mod) => (
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
        ),
        className: "w-[140px]",
      },

      // 6. Actions
      {
        header: <span className="sr-only">Actions</span>,
        align: "right",
        cell: (mod) => (
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
        ),
        className: "w-20 text-right",
        headerClassName: "w-20 text-right",
      },
    ];
  }, [
    activeScope,
    sortConfig,
    sortedModules,
    reordering,
    loading,
    handleSort,
    handleMoveOrder,
    handleOpenEdit,
    handleToggleStatus,
    setModuleToDelete,
  ]);

  return (
    <CRMDataTable<PlatformModule>
      data={paginatedModules}
      columns={columns}
      isLoading={loading}
      isError={false}
      emptyIcon={activeScope === "tenant" ? Boxes : Shield}
      emptyTitle={
        search || groupFilter !== "ALL" || statusFilter !== "ALL"
          ? "No menus match your filters"
          : "No navigation menus registered"
      }
      emptyDescription={
        search || groupFilter !== "ALL" || statusFilter !== "ALL"
          ? "Try clearing your search query or group filter to view all navigation menus."
          : "Click '+ Add Menu' to register your first navigation item."
      }
      hasPagination={false}
    />
  );
}
