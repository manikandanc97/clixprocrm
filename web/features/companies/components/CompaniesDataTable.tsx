"use client";

import React, { useMemo } from "react";
import { Building2, Users, Briefcase, RotateCcw, Plus } from "lucide-react";
import { CRMDataTable, CRMDataTableColumn } from "@/shared/components/crm/CRMDataTable";
import { CRMActionMenu } from "@/shared/components/crm/CRMActionMenu";
import { StatusBadge, StatusVariant } from "@/shared/components/StatusBadge";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageErrorState } from "@/shared/components/crm/PageFeedbackStates";
import { Checkbox } from "@/shared/ui/checkbox";
import { getOrgAvatarColor } from "@/shared/utils/avatar-colors";
import { cn } from "@/shared/lib/utils";
import type { CompanyItem } from "../hooks/use-companies-data";
import type { SortDirection } from "@/shared/components/DataTableColumnHeader";

interface CompaniesDataTableProps {
  companies: CompanyItem[];
  selectedCompanyIds: string[];
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelect: (id: string, checked: boolean) => void;
  sortConfig: { key: string; direction: "asc" | "desc" } | null;
  onSort: (key: string, direction: SortDirection) => void;
  isLoading: boolean;
  isError: boolean;
  error?: Error | unknown | null;
  onRetry?: () => void;
  onEditCompany: (company: CompanyItem) => void;
  onDeleteCompany: (company: CompanyItem) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  onAddCompany: () => void;
}

const statusVariantMap: Record<string, StatusVariant> = {
  ACTIVE: "success",
  INACTIVE: "neutral",
  LEAD: "info",
};

export const CompaniesDataTable: React.FC<CompaniesDataTableProps> = ({
  companies,
  selectedCompanyIds,
  onToggleSelectAll,
  onToggleSelect,
  sortConfig,
  onSort,
  isLoading,
  isError,
  error,
  onRetry,
  onEditCompany,
  onDeleteCompany,
  onClearFilters,
  hasActiveFilters,
  onAddCompany,
}) => {
  const isAllSelected =
    companies.length > 0 && companies.every((c) => selectedCompanyIds.includes(c.id));

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return { date: "—", time: "" };
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

  const columns = useMemo<CRMDataTableColumn<CompanyItem>[]>(() => {
    return [
      // 1. Row Selection Checkbox
      {
        header: (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={(checked) => onToggleSelectAll(Boolean(checked))}
              aria-label="Select all companies on this page"
            />
          </div>
        ),
        cell: (company) => {
          const isSelected = selectedCompanyIds.includes(company.id);
          return (
            <div
              className="flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onToggleSelect(company.id, Boolean(checked))}
                aria-label={`Select company ${company.name || "unnamed"}`}
              />
            </div>
          );
        },
        className: "w-[48px]",
        headerClassName: "w-[48px] text-center",
      },

      // 2. Company Name & Avatar
      {
        header: "Company",
        sortable: true,
        sortDirection: sortConfig?.key === "name" ? sortConfig.direction : null,
        onSort: (dir) => onSort("name", dir),
        cell: (company) => {
          const color = getOrgAvatarColor(company.name || "Company");
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
                {company.name ? company.name.charAt(0).toUpperCase() : "C"}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditCompany(company);
                  }}
                  className="font-bold text-sm text-foreground hover:text-primary transition-colors cursor-pointer truncate"
                >
                  {company.name || "Unnamed Company"}
                </p>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {company.industry || "No Industry"}
                </p>
              </div>
            </div>
          );
        },
        className: "min-w-[240px]",
      },

      // 3. Status
      {
        header: "Status",
        sortable: true,
        sortDirection: sortConfig?.key === "status" ? sortConfig.direction : null,
        onSort: (dir) => onSort("status", dir),
        cell: (company) => {
          const rawStatus = (company.status || "ACTIVE").toUpperCase();
          const variant = statusVariantMap[rawStatus] || "neutral";
          return <StatusBadge status={rawStatus} variant={variant} />;
        },
        className: "w-[130px]",
      },

      // 4. Customers Count
      {
        header: "Customers",
        sortable: true,
        sortDirection: sortConfig?.key === "customers" ? sortConfig.direction : null,
        onSort: (dir) => onSort("customers", dir),
        cell: (company) => {
          const customersCount = company._count?.customers || 0;
          return (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-foreground font-bold">{customersCount}</span>
              <span className="text-[11px] font-normal text-muted-foreground">
                {customersCount === 1 ? "customer" : "customers"}
              </span>
            </div>
          );
        },
        className: "w-[150px]",
      },

      // 5. Deals Count
      {
        header: "Deals",
        sortable: true,
        sortDirection: sortConfig?.key === "deals" ? sortConfig.direction : null,
        onSort: (dir) => onSort("deals", dir),
        cell: (company) => {
          const dealsCount = company._count?.deals || 0;
          return (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-foreground font-bold">{dealsCount}</span>
              <span className="text-[11px] font-normal text-muted-foreground">
                {dealsCount === 1 ? "deal" : "deals"}
              </span>
            </div>
          );
        },
        className: "w-[140px]",
      },

      // 6. Created Date
      {
        header: "Created Date",
        sortable: true,
        sortDirection: sortConfig?.key === "createdAt" ? sortConfig.direction : null,
        onSort: (dir) => onSort("createdAt", dir),
        cell: (company) => {
          const { date, time } = formatDate(company.createdAt);
          return (
            <div>
              <p className="text-xs font-semibold text-foreground">{date}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{time}</p>
            </div>
          );
        },
        className: "w-[160px]",
      },

      // 7. Actions Menu
      {
        header: "Actions",
        align: "right",
        headerClassName: "text-right w-[64px]",
        cell: (company) => {
          return (
            <div
              className="flex justify-end"
              onClick={(e) => e.stopPropagation()}
            >
              <CRMActionMenu
                items={[
                  {
                    label: "Edit Company",
                    icon: "edit",
                    onClick: () => onEditCompany(company),
                  },
                  {
                    label: "Delete Company",
                    icon: "trash",
                    variant: "destructive",
                    separatorBefore: true,
                    onClick: () => onDeleteCompany(company),
                  },
                ]}
                aria-label={`Actions for ${company.name || "company"}`}
              />
            </div>
          );
        },
        className: "w-[64px] text-right",
      },
    ];
  }, [
    isAllSelected,
    selectedCompanyIds,
    sortConfig,
    onToggleSelectAll,
    onToggleSelect,
    onSort,
    onEditCompany,
    onDeleteCompany,
  ]);

  if (isError) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Failed to load companies.";
    return (
      <div className="p-6 flex-1 flex items-center justify-center">
        <PageErrorState
          title="Failed to load companies"
          message={errorMsg}
          onRetry={onRetry}
        />
      </div>
    );
  }

  return (
    <CRMDataTable
      data={companies}
      columns={columns}
      isLoading={isLoading}
      onRowClick={(company) => onEditCompany(company)}
      emptyMessage={
        <div className="flex flex-col items-center justify-center py-10">
          <EmptyState
            icon={Building2}
            title={hasActiveFilters ? "No companies found" : "No companies yet"}
            description={
              hasActiveFilters
                ? "No companies match your current search or filter criteria."
                : "Add your first B2B company account to start organizing your client relationships."
            }
            className="border-none bg-transparent shadow-none p-0 min-h-0"
            action={
              hasActiveFilters
                ? {
                    label: "Clear Filters",
                    onClick: onClearFilters,
                    icon: RotateCcw,
                  }
                : {
                    label: "Create Company",
                    onClick: onAddCompany,
                    icon: Plus,
                  }
            }
          />
        </div>
      }
    />
  );
};
