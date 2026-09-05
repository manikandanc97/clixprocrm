"use client";

import React, { useMemo } from "react";
import { Users, Shield, Calendar, RotateCcw, UserPlus } from "lucide-react";
import { CRMDataTable, CRMDataTableColumn } from "@/shared/components/crm/CRMDataTable";
import { CRMActionMenu } from "@/shared/components/crm/CRMActionMenu";
import { StatusBadge, StatusVariant } from "@/shared/components/StatusBadge";
import { EmptyState } from "@/shared/components/EmptyState";
import { Checkbox } from "@/shared/ui/checkbox";
import { getOrgAvatarColor } from "@/shared/utils/avatar-colors";
import { cn } from "@/shared/lib/utils";
import { EmployeeType } from "@/shared/types/employee";
import type { SortDirection } from "@/shared/components/DataTableColumnHeader";
import { getSafeEmployeeStr, EmployeeSortConfig } from "../hooks/use-employees-data";

export interface EmployeesDataTableProps {
  employees: EmployeeType[];
  selectedEmployeeIds: string[];
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelect: (id: string, checked: boolean) => void;
  sortConfig: EmployeeSortConfig | null;
  onSort: (key: string, direction: SortDirection) => void;
  isLoading: boolean;
  onViewEmployee: (employee: EmployeeType) => void;
  onEditEmployee: (employee: EmployeeType) => void;
  onToggleStatus: (employee: EmployeeType) => void;
  onDeleteEmployee: (employee: EmployeeType) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  onAddEmployee: () => void;
}

const statusVariantMap: Record<string, StatusVariant> = {
  ACTIVE: "success",
  INACTIVE: "warning",
  SUSPENDED: "destructive",
};

export const EmployeesDataTable: React.FC<EmployeesDataTableProps> = ({
  employees,
  selectedEmployeeIds,
  onToggleSelectAll,
  onToggleSelect,
  sortConfig,
  onSort,
  isLoading,
  onViewEmployee,
  onEditEmployee,
  onToggleStatus,
  onDeleteEmployee,
  onClearFilters,
  hasActiveFilters,
  onAddEmployee,
}) => {
  const isAllSelected =
    employees.length > 0 && employees.every((emp) => selectedEmployeeIds.includes(emp.id));

  const columns = useMemo<CRMDataTableColumn<EmployeeType>[]>(() => {
    return [
      // 1. Row Selection Checkbox
      {
        header: (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={(checked) => onToggleSelectAll(Boolean(checked))}
              aria-label="Select all employees on this page"
            />
          </div>
        ),
        cell: (emp) => {
          const isSelected = selectedEmployeeIds.includes(emp.id);
          return (
            <div
              className="flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onToggleSelect(emp.id, Boolean(checked))}
                aria-label={`Select employee ${getSafeEmployeeStr(emp.name) || "unnamed"}`}
              />
            </div>
          );
        },
        className: "w-[48px]",
        headerClassName: "w-[48px] text-center",
      },

      // 2. Employee Name & Avatar
      {
        header: "Employee",
        sortable: true,
        sortDirection: sortConfig?.key === "name" ? sortConfig.direction : null,
        onSort: (dir) => onSort("name", dir),
        cell: (emp) => {
          const name = getSafeEmployeeStr(emp.name);
          const email = getSafeEmployeeStr(emp.email);
          const color = getOrgAvatarColor(name || email || "Employee");
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
                {name ? name.charAt(0).toUpperCase() : "E"}
              </div>
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewEmployee(emp);
                  }}
                  className="font-bold text-sm text-foreground hover:text-primary transition-colors cursor-pointer truncate block text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xs"
                >
                  {name || "Unnamed Employee"}
                </button>
                <p className="text-xs text-muted-foreground truncate">{email || "No email"}</p>
              </div>
            </div>
          );
        },
        className: "min-w-[260px]",
      },

      // 3. Role / Department
      {
        header: "Role / Department",
        sortable: true,
        sortDirection: sortConfig?.key === "role" ? sortConfig.direction : null,
        onSort: (dir) => onSort("role", dir),
        cell: (emp) => {
          const role = getSafeEmployeeStr(emp.role);
          return (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/60 bg-muted/40 text-foreground font-semibold text-xs max-w-[200px] truncate">
              <Shield className="h-3 w-3 text-primary shrink-0" />
              <span className="truncate">{role || "Employee"}</span>
            </div>
          );
        },
        className: "w-[200px]",
      },

      // 4. Status
      {
        header: "Status",
        sortable: true,
        sortDirection: sortConfig?.key === "status" ? sortConfig.direction : null,
        onSort: (dir) => onSort("status", dir),
        cell: (emp) => {
          const rawStatus = (emp.status || "ACTIVE").toUpperCase();
          const variant = statusVariantMap[rawStatus] || "neutral";
          return <StatusBadge status={rawStatus} variant={variant} />;
        },
        className: "w-[140px]",
      },

      // 5. Joined Date
      {
        header: "Joined Date",
        sortable: true,
        sortDirection: sortConfig?.key === "createdAt" ? sortConfig.direction : null,
        onSort: (dir) => onSort("createdAt", dir),
        cell: (emp) => {
          return (
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
              <span>
                {emp.createdAt
                  ? new Date(emp.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </span>
            </div>
          );
        },
        className: "w-[150px]",
      },

      // 6. Actions Menu
      {
        header: <span className="sr-only">Actions</span>,
        align: "right",
        headerClassName: "w-16 text-right",
        cell: (emp) => {
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
                    onClick: () => onViewEmployee(emp),
                  },
                  {
                    label: "Edit Employee",
                    icon: "edit",
                    onClick: () => onEditEmployee(emp),
                  },
                  {
                    label: emp.status === "ACTIVE" ? "Deactivate" : "Activate",
                    icon: "power",
                    onClick: () => onToggleStatus(emp),
                  },
                  {
                    label: "Delete Employee",
                    icon: "trash",
                    variant: "destructive",
                    separatorBefore: true,
                    onClick: () => onDeleteEmployee(emp),
                  },
                ]}
                aria-label={`Actions for ${getSafeEmployeeStr(emp.name) || "employee"}`}
              />
            </div>
          );
        },
        className: "w-16 text-right",
      },
    ];
  }, [
    isAllSelected,
    selectedEmployeeIds,
    sortConfig,
    onToggleSelectAll,
    onToggleSelect,
    onSort,
    onViewEmployee,
    onEditEmployee,
    onToggleStatus,
    onDeleteEmployee,
  ]);

  return (
    <CRMDataTable
      data={employees}
      columns={columns}
      isLoading={isLoading}
      onRowClick={(emp) => onViewEmployee(emp)}
      hasPagination={false}
      rowClassName={(emp) =>
        cn(
          "transition-colors",
          selectedEmployeeIds.includes(emp.id) && "bg-primary/[0.04]"
        )
      }
      emptyMessage={
        <div className="flex flex-col items-center justify-center py-10">
          <EmptyState
            icon={Users}
            title={hasActiveFilters ? "No employees found" : "No staff members yet"}
            description={
              hasActiveFilters
                ? "No staff records match your current search or filter criteria."
                : "Add your first employee to start managing your team and permissions."
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
                    label: "Add Employee",
                    onClick: onAddEmployee,
                    icon: UserPlus,
                  }
            }
          />
        </div>
      }
    />
  );
};
