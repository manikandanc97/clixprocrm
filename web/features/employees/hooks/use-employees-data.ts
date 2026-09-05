"use client";

import { useState, useMemo, useCallback } from "react";
import { useEmployees, useToggleEmployeeStatus } from "@/shared/hooks/use-hrm";
import { useAuth } from "@/features/auth/components/auth-provider";
import { getOrgAvatarColor } from "@/shared/utils/avatar-colors";
import { EmployeeType } from "@/shared/types/employee";
import { toast } from "sonner";
import type { SortDirection } from "@/shared/components/DataTableColumnHeader";

export interface EmployeeSortConfig {
  key: string;
  direction: "asc" | "desc";
}

export const getSafeEmployeeStr = (val: unknown): string =>
  typeof val === "string"
    ? val
    : typeof val === "object" && val !== null
    ? ((val as Record<string, unknown>).name as string) || ""
    : String(val || "");

export interface UseEmployeesDataReturn {
  // Query state
  rawEmployees: EmployeeType[];
  isLoading: boolean;
  isInitialLoading: boolean;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;

  // Search
  search: string;
  setSearch: (value: string) => void;

  // Role Filter
  roleFilter: string;
  setRoleFilter: (value: string) => void;
  uniqueRoles: string[];

  // Status Filter
  statusFilter: string;
  setStatusFilter: (value: string) => void;

  // Clear & Active Filters
  hasActiveFilters: boolean;
  handleClearFilters: () => void;

  // Sorting
  sortConfig: EmployeeSortConfig | null;
  setSort: (key: string, dir: SortDirection) => void;

  // Pagination
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  rowsPerPage: number;
  setRowsPerPage: (value: number) => void;
  totalPages: number;
  totalEmployees: number;

  // Selection
  selectedEmployeeIds: string[];
  setSelectedEmployeeIds: React.Dispatch<React.SetStateAction<string[]>>;
  isAllCurrentPageSelected: boolean;
  toggleSelectAllCurrentPage: (checked?: boolean) => void;
  toggleSelectEmployee: (id: string, checked?: boolean) => void;

  // Derived lists
  filteredEmployees: EmployeeType[];
  paginatedEmployees: EmployeeType[];

  // Actions
  exportCSV: () => void;
  handleToggleStatus: (emp: EmployeeType) => void;
  getEmployeeColor: (name: string) => ReturnType<typeof getOrgAvatarColor>;
}

export function useEmployeesData(): UseEmployeesDataReturn {
  const { isHydrated, isAuthenticated, isInitializing } = useAuth();
  const { data: hrmData, isLoading: loading, isPending, isError, error, refetch } = useEmployees();

  const toggleStatusMutation = useToggleEmployeeStatus();

  const rawEmployees = useMemo<EmployeeType[]>(
    () => (Array.isArray(hrmData?.employees) ? (hrmData.employees as unknown as EmployeeType[]) : []),
    [hrmData]
  );

  const isInitialLoading =
    !hrmData && (loading || isPending || !isHydrated || !isAuthenticated || isInitializing);

  // Filter & Pagination States
  const [roleFilter, setRoleFilterState] = useState("ALL");
  const [statusFilter, setStatusFilterState] = useState("ALL");
  const [search, setSearchState] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPageState] = useState(10);
  const [sortConfig, setSortConfig] = useState<EmployeeSortConfig | null>(null);

  const setSearch = useCallback((val: string) => {
    setSearchState(val);
    setCurrentPage(1);
  }, []);

  const setRoleFilter = useCallback((val: string) => {
    setRoleFilterState(val);
    setCurrentPage(1);
  }, []);

  const setStatusFilter = useCallback((val: string) => {
    setStatusFilterState(val);
    setCurrentPage(1);
  }, []);

  const setSort = useCallback((key: string, dir: SortDirection) => {
    setSortConfig(dir === null ? null : { key, direction: dir });
  }, []);

  const setRowsPerPage = useCallback((rows: number) => {
    setRowsPerPageState(rows);
    setCurrentPage(1);
  }, []);

  // Available unique roles for filter dropdown
  const uniqueRoles = useMemo(() => {
    const rolesSet = new Set<string>();
    rawEmployees.forEach((emp: EmployeeType) => {
      const r = getSafeEmployeeStr(emp.role).trim();
      if (r) rolesSet.add(r);
    });
    return Array.from(rolesSet).sort();
  }, [rawEmployees]);

  // Filter and sort logic
  const filteredEmployees = useMemo(() => {
    return rawEmployees
      .filter((emp: EmployeeType) => {
        const name = getSafeEmployeeStr(emp.name).toLowerCase();
        const email = getSafeEmployeeStr(emp.email).toLowerCase();
        const role = getSafeEmployeeStr(emp.role).toLowerCase();
        const query = search.trim().toLowerCase();

        const matchSearch =
          query === "" || name.includes(query) || email.includes(query) || role.includes(query);

        const matchRole =
          roleFilter === "ALL" || role === roleFilter.toLowerCase();

        const matchStatus =
          statusFilter === "ALL" || (emp.status || "").toUpperCase() === statusFilter.toUpperCase();

        return matchSearch && matchRole && matchStatus;
      })
      .sort((a: EmployeeType, b: EmployeeType) => {
        if (!sortConfig) return 0;
        const dir = sortConfig.direction === "asc" ? 1 : -1;

        if (sortConfig.key === "name") {
          return getSafeEmployeeStr(a.name).localeCompare(getSafeEmployeeStr(b.name)) * dir;
        }
        if (sortConfig.key === "role") {
          return getSafeEmployeeStr(a.role).localeCompare(getSafeEmployeeStr(b.role)) * dir;
        }
        if (sortConfig.key === "status") {
          return getSafeEmployeeStr(a.status).localeCompare(getSafeEmployeeStr(b.status)) * dir;
        }
        if (sortConfig.key === "createdAt") {
          return (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()) * dir;
        }
        return 0;
      });
  }, [rawEmployees, search, roleFilter, statusFilter, sortConfig]);

  const totalEmployees = filteredEmployees.length;
  const totalPages = Math.max(1, Math.ceil(totalEmployees / rowsPerPage));

  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredEmployees.slice(start, start + rowsPerPage);
  }, [filteredEmployees, currentPage, rowsPerPage]);

  // Selection
  const isAllCurrentPageSelected = useMemo(() => {
    return (
      paginatedEmployees.length > 0 &&
      paginatedEmployees.every((emp: EmployeeType) => selectedEmployeeIds.includes(emp.id))
    );
  }, [paginatedEmployees, selectedEmployeeIds]);

  const toggleSelectAllCurrentPage = useCallback(
    (checked?: boolean) => {
      const shouldSelect = checked !== undefined ? checked : !isAllCurrentPageSelected;
      if (shouldSelect) {
        setSelectedEmployeeIds(
          Array.from(new Set([...selectedEmployeeIds, ...paginatedEmployees.map((emp: EmployeeType) => emp.id)]))
        );
      } else {
        const pageIds = new Set(paginatedEmployees.map((emp: EmployeeType) => emp.id));
        setSelectedEmployeeIds(selectedEmployeeIds.filter((id) => !pageIds.has(id)));
      }
    },
    [isAllCurrentPageSelected, paginatedEmployees, selectedEmployeeIds]
  );

  const toggleSelectEmployee = useCallback((id: string, checked?: boolean) => {
    setSelectedEmployeeIds((prev) => {
      const isCurrentlySelected = prev.includes(id);
      const shouldSelect = checked !== undefined ? checked : !isCurrentlySelected;
      if (shouldSelect) {
        return isCurrentlySelected ? prev : [...prev, id];
      } else {
        return prev.filter((item) => item !== id);
      }
    });
  }, []);

  const hasActiveFilters =
    roleFilter !== "ALL" || statusFilter !== "ALL" || search.trim().length > 0;

  const handleClearFilters = useCallback(() => {
    setRoleFilterState("ALL");
    setStatusFilterState("ALL");
    setSearchState("");
    setCurrentPage(1);
  }, []);

  const handleToggleStatus = useCallback(
    (emp: EmployeeType) => {
      const newStatus = emp.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      toggleStatusMutation.mutate(
        { id: emp.id, status: newStatus },
        {
          onSuccess: () => {
            toast.success(`Employee ${newStatus.toLowerCase()}d`);
            refetch();
          },
        }
      );
    },
    [toggleStatusMutation, refetch]
  );

  const exportCSV = useCallback(() => {
    if (rawEmployees.length === 0) {
      toast.error("No employees available to export.");
      return;
    }
    const headers = ["Employee ID", "Name", "Email", "Role", "Status", "Joined Date"];
    const rows = rawEmployees.map((emp: EmployeeType) => [
      emp.id || "",
      `"${getSafeEmployeeStr(emp.name).replace(/"/g, '""')}"`,
      `"${getSafeEmployeeStr(emp.email).replace(/"/g, '""')}"`,
      `"${getSafeEmployeeStr(emp.role).replace(/"/g, '""')}"`,
      emp.status || "ACTIVE",
      emp.createdAt ? new Date(emp.createdAt).toISOString().slice(0, 10) : "",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row: (string | number)[]) => row.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clixpro_employees_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Employees exported successfully.");
  }, [rawEmployees]);

  const getEmployeeColor = useCallback((name: string) => {
    return getOrgAvatarColor(name || "Employee");
  }, []);

  return {
    rawEmployees,
    isLoading: loading,
    isInitialLoading,
    isPending,
    isError,
    error,
    refetch,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    uniqueRoles,
    statusFilter,
    setStatusFilter,
    hasActiveFilters,
    handleClearFilters,
    sortConfig,
    setSort,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    totalPages,
    totalEmployees,
    selectedEmployeeIds,
    setSelectedEmployeeIds,
    isAllCurrentPageSelected,
    toggleSelectAllCurrentPage,
    toggleSelectEmployee,
    filteredEmployees,
    paginatedEmployees,
    exportCSV,
    handleToggleStatus,
    getEmployeeColor,
  };
}
