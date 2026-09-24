"use client";

import React, { useMemo } from "react";
import {
  Building2,
  Users,
  Eye,
  Trash2,
  RotateCcw,
  Plus,
} from "lucide-react";
import { PlatformOrganization } from "@/shared/lib/api/super-admin.api";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { PlanBadge } from "@/shared/components/PlanBadge";
import { getOrgAvatarColor } from "@/shared/utils/avatar-colors";
import {
  CRMDataTable,
  CRMDataTableColumn,
} from "@/shared/components/crm/CRMDataTable";
import { CRMActionMenu, CRMActionMenuItemConfig } from "@/shared/components/crm/CRMActionMenu";
import { Checkbox } from "@/shared/ui/checkbox";
import { cn } from "@/shared/lib/utils";
import type { SortDirection } from "@/shared/components/DataTableColumnHeader";

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
  const isAllSelected =
    paginatedOrganizations.length > 0 &&
    paginatedOrganizations.every((o) => selectedOrgIds.includes(o.id));

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrgIds(Array.from(new Set([...selectedOrgIds, ...paginatedOrganizations.map((o) => o.id)])));
    } else {
      const pageIds = new Set(paginatedOrganizations.map((o) => o.id));
      setSelectedOrgIds(selectedOrgIds.filter((id) => !pageIds.has(id)));
    }
  };

  const handleToggleSelect = (id: string, checked: boolean) => {
    setSelectedOrgIds((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id)
    );
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

  const columns = useMemo<CRMDataTableColumn<PlatformOrganization>[]>(() => {
    return [
      // 1. Checkbox
      {
        header: (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={(checked) => handleToggleSelectAll(Boolean(checked))}
              aria-label="Select all organizations on this page"
            />
          </div>
        ),
        cell: (org) => {
          const isSelected = selectedOrgIds.includes(org.id);
          return (
            <div
              className="flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => handleToggleSelect(org.id, Boolean(checked))}
                aria-label={`Select organization ${org.name}`}
              />
            </div>
          );
        },
        className: "w-12 px-3 text-center",
        headerClassName: "w-12 px-3 text-center",
        align: "center",
      },

      // 2. Organization Name
      {
        header: "Organization",
        sortable: true,
        sortDirection: sortConfig?.key === "name" ? sortConfig.direction : null,
        onSort: (dir) => setSort("name", dir),
        cell: (org) => {
          const color = getOrgAvatarColor(org.name);
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
                {org.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => handleOpenDetails(org.id)}
                  className="font-bold text-sm text-foreground hover:text-emerald-600 transition-colors cursor-pointer truncate block text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xs"
                >
                  {org.name}
                </button>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  /{org.slug}
                </p>
              </div>
            </div>
          );
        },
        className: "min-w-[200px] max-w-[280px]",
      },

      // 3. Plan
      {
        header: "Plan",
        sortable: true,
        sortDirection: sortConfig?.key === "plan" ? sortConfig.direction : null,
        onSort: (dir) => setSort("plan", dir),
        cell: (org) => (
          <PlanBadge plan={org.plan} size="sm" className="rounded-md font-bold text-[10.5px] px-2 py-0.5" />
        ),
        className: "w-[130px]",
      },

      // 4. Users
      {
        header: "Users",
        sortable: true,
        sortDirection: sortConfig?.key === "userCount" ? sortConfig.direction : null,
        onSort: (dir) => setSort("userCount", dir),
        cell: (org) => (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-foreground font-bold">{org.userCount}</span>
            <span className="text-[11px] font-normal text-muted-foreground">
              {org.userCount === 1 ? "user" : "users"}
            </span>
          </div>
        ),
        className: "w-[130px]",
      },

      // 5. CRM Activity
      {
        header: "CRM Activity",
        cell: (org) => (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{org.leadCount} leads</span>
              <span>•</span>
              <span className="font-semibold text-foreground">{org.dealCount} deals</span>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">{org.customerCount} customers</span>
          </div>
        ),
        className: "w-[180px]",
      },

      // 6. Status
      {
        header: "Status",
        cell: (org) => (
          <StatusBadge
            status={org.status || "ACTIVE"}
            variant={org.status === "ACTIVE" ? "emerald" : "neutral"}
          />
        ),
        className: "w-[130px]",
      },

      // 7. Created Date
      {
        header: "Created Date",
        sortable: true,
        sortDirection: sortConfig?.key === "createdAt" ? sortConfig.direction : null,
        onSort: (dir) => setSort("createdAt", dir),
        cell: (org) => {
          const { date, time } = formatDate(org.createdAt);
          return (
            <div>
              <p className="text-xs font-semibold text-foreground">{date}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{time}</p>
            </div>
          );
        },
        className: "w-[160px]",
      },

      // 8. Actions
      {
        header: <span className="sr-only">Actions</span>,
        cell: (org) => {
          const actionItems: CRMActionMenuItemConfig[] = [
            {
              label: "View Overview",
              icon: Eye,
              onClick: () => handleOpenDetails(org.id),
            },
            {
              label: "Delete Workspace",
              icon: Trash2,
              variant: "destructive" as const,
              separatorBefore: true,
              onClick: () => setOrgToDelete(org),
            },
          ];

          return (
            <CRMActionMenu
              items={actionItems}
              aria-label={`Actions for ${org.name}`}
              triggerTooltip="Organization actions"
            />
          );
        },
        className: "w-16 text-right",
        headerClassName: "w-16 text-right",
        align: "right",
      },
    ];
  }, [
    isAllSelected,
    selectedOrgIds,
    sortConfig,
    setSort,
    handleOpenDetails,
    setOrgToDelete,
  ]);

  return (
    <CRMDataTable<PlatformOrganization>
      data={paginatedOrganizations}
      columns={columns}
      isLoading={loading}
      isError={false}
      emptyIcon={Building2}
      emptyTitle="No organizations found"
      emptyDescription={
        hasActiveFilters
          ? "No organizations match your current search or filter criteria."
          : "There are currently no workspace organizations registered on the platform."
      }
      hasPagination={false}
      rowClassName={(org) =>
        cn(
          "transition-colors",
          selectedOrgIds.includes(org.id) && "bg-primary/[0.03]"
        )
      }
    />
  );
}
