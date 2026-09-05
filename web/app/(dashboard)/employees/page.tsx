"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Users,
  UserPlus,
  Search,
  X,
  Download,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  AlertTriangle,
  RotateCcw,
  User,
  Edit2,
  Power,
  Calendar,
  Shield,
} from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { CRMPageContainer } from "@/shared/components/crm";
import { EmptyState } from "@/shared/components/EmptyState";
import { cn } from "@/shared/lib/utils";
import { getOrgAvatarColor } from "@/shared/utils/avatar-colors";
import { useEmployees, useToggleEmployeeStatus, useDeleteEmployee } from "@/shared/hooks/use-hrm";
import { FormModal } from "@/shared/components/crm/FormModal";
import { EmployeeForm } from "@/features/forms/EmployeeForm";
import { useAuth } from "@/features/auth/components/auth-provider";
import { EmployeeType } from "@/shared/types/employee";

export default function EmployeesPage() {
  const { isHydrated, isAuthenticated, isInitializing } = useAuth();

  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const setSort = (key: string, dir: "asc" | "desc" | null) => {
    setSortConfig(dir === null ? null : { key, direction: dir });
  };

  const { data: hrmData, isLoading: loading, isPending, refetch } = useEmployees();
  const rawEmployees = useMemo<EmployeeType[]>(
    () => (Array.isArray(hrmData?.employees) ? (hrmData.employees as unknown as EmployeeType[]) : []),
    [hrmData]
  );

  const toggleStatusMutation = useToggleEmployeeStatus();
  const deleteMutation = useDeleteEmployee();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeType | null>(null);

  // Delete modal state
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeType | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "true") {
      const timer = setTimeout(() => {
        setIsAddModalOpen(true);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, statusFilter]);

  const getEmployeeColor = (name: string) => {
    return getOrgAvatarColor(name || "Employee");
  };

  const getSafeStr = (val: unknown) =>
    typeof val === "string"
      ? val
      : typeof val === "object" && val !== null
      ? ((val as Record<string, unknown>).name as string) || ""
      : String(val || "");

  const hasActiveFilters =
    roleFilter !== "ALL" || statusFilter !== "ALL" || search.trim().length > 0;

  const handleClearFilters = () => {
    setRoleFilter("ALL");
    setStatusFilter("ALL");
    setSearch("");
    setCurrentPage(1);
  };

  const handleToggleStatus = (emp: EmployeeType) => {
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
  };

  const handleDeleteSingle = async () => {
    if (!employeeToDelete) return;
    try {
      setDeleting(true);
      await deleteMutation.mutateAsync(employeeToDelete.id);
      setSelectedEmployeeIds((prev) => prev.filter((id) => id !== employeeToDelete.id));
      setEmployeeToDelete(null);
      refetch();
    } catch {
      // Handled by toast
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEmployeeIds.length === 0) return;
    try {
      setBulkDeleting(true);
      for (const id of selectedEmployeeIds) {
        await deleteMutation.mutateAsync(id);
      }
      setSelectedEmployeeIds([]);
      setBulkDeleteModalOpen(false);
      refetch();
    } catch {
      toast.error("An error occurred during bulk deletion");
    } finally {
      setBulkDeleting(false);
    }
  };

  const exportCSV = () => {
    if (rawEmployees.length === 0) {
      toast.error("No employees available to export.");
      return;
    }
    const headers = ["Employee ID", "Name", "Email", "Role", "Status", "Joined Date"];
    const rows = rawEmployees.map((emp: EmployeeType) => [
      emp.id || "",
      `"${getSafeStr(emp.name).replace(/"/g, '""')}"`,
      `"${getSafeStr(emp.email).replace(/"/g, '""')}"`,
      `"${getSafeStr(emp.role).replace(/"/g, '""')}"`,
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
  };

  // Available unique roles for filter dropdown
  const uniqueRoles = useMemo(() => {
    const rolesSet = new Set<string>();
    rawEmployees.forEach((emp: EmployeeType) => {
      const r = getSafeStr(emp.role).trim();
      if (r) rolesSet.add(r);
    });
    return Array.from(rolesSet);
  }, [rawEmployees]);

  // Filter and sort logic
  const filteredEmployees = useMemo(() => {
    return rawEmployees.filter((emp: EmployeeType) => {
      const name = getSafeStr(emp.name).toLowerCase();
      const email = getSafeStr(emp.email).toLowerCase();
      const role = getSafeStr(emp.role).toLowerCase();
      const query = search.trim().toLowerCase();

      const matchSearch = query === "" || name.includes(query) || email.includes(query) || role.includes(query);

      const matchRole =
        roleFilter === "ALL" || role === roleFilter.toLowerCase();

      const matchStatus =
        statusFilter === "ALL" || (emp.status || "").toUpperCase() === statusFilter.toUpperCase();

      return matchSearch && matchRole && matchStatus;
    }).sort((a: EmployeeType, b: EmployeeType) => {
      if (!sortConfig) return 0;
      const dir = sortConfig.direction === "asc" ? 1 : -1;

      if (sortConfig.key === "name") {
        return getSafeStr(a.name).localeCompare(getSafeStr(b.name)) * dir;
      }
      if (sortConfig.key === "role") {
        return getSafeStr(a.role).localeCompare(getSafeStr(b.role)) * dir;
      }
      if (sortConfig.key === "status") {
        return getSafeStr(a.status).localeCompare(getSafeStr(b.status)) * dir;
      }
      if (sortConfig.key === "createdAt") {
        return (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()) * dir;
      }
      return 0;
    });
  }, [rawEmployees, search, roleFilter, statusFilter, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / rowsPerPage));
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const isInitialLoading =
    !hrmData && (loading || isPending || !isHydrated || !isAuthenticated || isInitializing);

  return (
    <CRMPageContainer twoStageScroll>
      {/* 1. Header Layout */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div
            data-animate-target="true"
            className="group h-10 w-10 rounded-xl bg-card border border-border/80 flex items-center justify-center text-muted-foreground shadow-xs shrink-0 hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer select-none"
          >
            <AppIcon
              name="employees"
              icon={Users}
              size={18}
              className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors"
            />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              Employees
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your workforce, assign roles, monitor activity, and track staff performance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setSelectedEmployee(null);
              setIsAddModalOpen(true);
            }}
            className="group bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-3.5 rounded-lg shadow-xs gap-1.5 cursor-pointer transition-colors"
          >
            <AppIcon
              name="plus"
              icon={UserPlus}
              size={14}
              className="w-3.5 h-3.5 text-white shrink-0"
            />
            <span>Add Employee</span>
          </Button>
        </div>
      </div>

      {/* 2. Main Card Container */}
      <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Top Controls Toolbar */}
        <div className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border/50 shrink-0">
          {/* Left: Filter Selects & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              {uniqueRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 group">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                <AppIcon
                  name="search"
                  icon={Search}
                  size={14}
                  className="w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors"
                />
              </div>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employees by name, email..."
                className="h-9 pl-8 pr-8 rounded-lg bg-background border-border/70 text-xs shadow-xs focus-visible:ring-2 focus-visible:ring-primary/20"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground self-end lg:self-auto flex-wrap">
            {/* Multi-Select Delete Button */}
            {selectedEmployeeIds.length > 0 && (
              <button
                onClick={() => setBulkDeleteModalOpen(true)}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-all shadow-xs cursor-pointer animate-in fade-in zoom-in-95 duration-150"
              >
                <AppIcon
                  name="trash"
                  icon={Trash2}
                  size={14}
                  className="w-3.5 h-3.5 text-rose-500 shrink-0"
                />
                <span>Delete ({selectedEmployeeIds.length})</span>
              </button>
            )}

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-background hover:bg-muted/60 text-muted-foreground hover:text-foreground text-xs font-semibold transition-all shadow-xs cursor-pointer animate-in fade-in zoom-in-95 duration-150"
              >
                <AppIcon
                  name="reset"
                  icon={RotateCcw}
                  size={14}
                  className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                />
                <span>Reset Filters</span>
              </button>
            )}

            {/* Export Button */}
            <button
              onClick={exportCSV}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-background hover:bg-muted/50 text-foreground text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <AppIcon
                name="export"
                icon={Download}
                size={14}
                className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
              />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-auto flex-1 min-h-0 relative flex flex-col kanban-board-scroll">
          <table className="w-full text-left text-xs border-collapse min-w-[950px] table-fixed">
            <colgroup>
              <col style={{ width: "48px" }} />
              <col style={{ width: "280px" }} />
              <col style={{ width: "220px" }} />
              <col style={{ width: "160px" }} />
              <col style={{ width: "140px" }} />
              <col style={{ width: "64px" }} />
            </colgroup>
            <thead className="sticky top-0 z-20 bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-500/20 shadow-xs backdrop-blur-xs">
              <tr className="text-xs font-bold text-foreground">
                <th className="w-12 px-4 py-3.5 text-center bg-emerald-50/80 dark:bg-emerald-950/40 border-r border-emerald-500/15">
                  <input
                    type="checkbox"
                    checked={
                      paginatedEmployees.length > 0 &&
                      paginatedEmployees.every((emp: EmployeeType) => selectedEmployeeIds.includes(emp.id))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEmployeeIds(
                          Array.from(new Set([...selectedEmployeeIds, ...paginatedEmployees.map((emp: EmployeeType) => emp.id)]))
                        );
                      } else {
                        const pageIds = new Set(paginatedEmployees.map((emp: EmployeeType) => emp.id));
                        setSelectedEmployeeIds(selectedEmployeeIds.filter((id) => !pageIds.has(id)));
                      }
                    }}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                  />
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() =>
                    setSort(
                      "name",
                      sortConfig?.key === "name" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc"
                    )
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span>Employee</span>
                    {sortConfig?.key === "name" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() =>
                    setSort(
                      "role",
                      sortConfig?.key === "role" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc"
                    )
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span>Role / Department</span>
                    {sortConfig?.key === "role" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() =>
                    setSort(
                      "status",
                      sortConfig?.key === "status" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc"
                    )
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    {sortConfig?.key === "status" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() =>
                    setSort(
                      "createdAt",
                      sortConfig?.key === "createdAt" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc"
                    )
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span>Joined Date</span>
                    {sortConfig?.key === "createdAt" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="w-16 px-4 py-3.5 text-right bg-emerald-50/80 dark:bg-emerald-950/40">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-xs">
              {isInitialLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse h-16">
                    <td className="px-4 py-4 text-center">
                      <div className="h-4 w-4 bg-muted rounded mx-auto" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-muted rounded-lg shrink-0" />
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="h-3.5 w-32 bg-muted rounded" />
                          <div className="h-2.5 w-24 bg-muted/60 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 w-24 bg-muted rounded-md" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 w-16 bg-muted rounded-md" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-24 bg-muted rounded" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="h-6 w-6 bg-muted rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((emp: EmployeeType) => {
                  const name = getSafeStr(emp.name);
                  const email = getSafeStr(emp.email);
                  const role = getSafeStr(emp.role);
                  const color = getEmployeeColor(name || email);
                  const isSelected = selectedEmployeeIds.includes(emp.id);

                  return (
                    <tr
                      key={emp.id}
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
                            setSelectedEmployeeIds((prev) =>
                              prev.includes(emp.id)
                                ? prev.filter((id) => id !== emp.id)
                                : [...prev, emp.id]
                            );
                          }}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                        />
                      </td>

                      {/* Name & Avatar */}
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
                            {name ? name.charAt(0).toUpperCase() : "E"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              onClick={() => {
                                setSelectedEmployee(emp);
                                setIsViewModalOpen(true);
                              }}
                              className="font-bold text-sm text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer truncate"
                            >
                              {name || "Unnamed Employee"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{email || "No email"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/60 bg-muted/40 text-foreground font-semibold text-xs max-w-[200px] truncate">
                          <Shield className="h-3 w-3 text-primary shrink-0" />
                          <span className="truncate">{role || "Employee"}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border",
                            emp.status === "ACTIVE" &&
                              "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
                            emp.status === "INACTIVE" &&
                              "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
                            emp.status === "SUSPENDED" &&
                              "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400"
                          )}
                        >
                          {emp.status || "ACTIVE"}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="px-4 py-3.5">
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
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Row actions menu"
                              className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 rounded-xl p-1.5 shadow-lg border-border bg-popover text-popover-foreground"
                          >
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedEmployee(emp);
                                setIsViewModalOpen(true);
                              }}
                              className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 hover:bg-muted focus:bg-muted"
                            >
                              <AppIcon
                                name="eye"
                                icon={User}
                                size={14}
                                className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                              />
                              <span>View Details</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedEmployee(emp);
                                setIsEditModalOpen(true);
                              }}
                              className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 hover:bg-muted focus:bg-muted"
                            >
                              <AppIcon
                                name="edit"
                                icon={Edit2}
                                size={14}
                                className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                              />
                              <span>Edit Employee</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(emp)}
                              className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 hover:bg-muted focus:bg-muted"
                            >
                              <AppIcon
                                name="power"
                                icon={Power}
                                size={14}
                                className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                              />
                              <span>{emp.status === "ACTIVE" ? "Deactivate" : "Activate"}</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="my-1" />

                            <DropdownMenuItem
                              onClick={() => setEmployeeToDelete(emp)}
                              className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
                            >
                              <AppIcon
                                name="trash"
                                icon={Trash2}
                                size={14}
                                className="w-3.5 h-3.5 text-destructive shrink-0"
                              />
                              <span>Delete Employee</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground align-middle border-0">
                    <div className="flex flex-col items-center justify-center py-6">
                      <EmptyState
                        icon={Users}
                        title="No employees found"
                        description="No staff records match your current search or filter criteria."
                        className="border-none bg-transparent shadow-none p-0 min-h-0"
                        action={
                          hasActiveFilters
                            ? {
                                label: "Clear Filters",
                                onClick: handleClearFilters,
                                icon: RotateCcw,
                              }
                            : {
                                label: "Add Employee",
                                onClick: () => {
                                  setSelectedEmployee(null);
                                  setIsAddModalOpen(true);
                                },
                                icon: UserPlus,
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

        {/* Bottom Pagination */}
        <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/50 text-xs font-medium text-muted-foreground bg-card shrink-0 mt-auto">
          <div>
            Showing{" "}
            <span className="font-semibold text-foreground">
              {filteredEmployees.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-foreground">
              {Math.min(currentPage * rowsPerPage, filteredEmployees.length)}
            </span>{" "}
            of <span className="font-semibold text-foreground">{filteredEmployees.length}</span> Employees
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span>
                Page <span className="font-semibold text-foreground">{currentPage}</span> of{" "}
                <span className="font-semibold text-foreground">{totalPages}</span>
              </span>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 rounded-lg shadow-xs cursor-pointer disabled:opacity-40"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 rounded-lg shadow-xs cursor-pointer disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 rounded-lg shadow-xs cursor-pointer disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 rounded-lg shadow-xs cursor-pointer disabled:opacity-40"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      <FormModal
        title="Add New Employee"
        description="Fill in employee details to create their CRM staff profile."
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        size="md"
      >
        <EmployeeForm
          onSuccess={() => {
            setIsAddModalOpen(false);
            refetch();
          }}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </FormModal>

      {/* Edit Employee Modal */}
      <FormModal
        title="Edit Employee"
        description="Update role, email, status, and permissions for this staff member."
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        size="md"
      >
        <EmployeeForm
          initialData={
            selectedEmployee
              ? {
                  id: selectedEmployee.id,
                  name: selectedEmployee.name,
                  email: selectedEmployee.email,
                  role: selectedEmployee.role,
                  status: (["ACTIVE", "INACTIVE", "SUSPENDED"].includes(selectedEmployee.status)
                    ? selectedEmployee.status
                    : "ACTIVE") as "ACTIVE" | "INACTIVE" | "SUSPENDED",
                }
              : undefined
          }
          onSuccess={() => {
            setIsEditModalOpen(false);
            setSelectedEmployee(null);
            refetch();
          }}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedEmployee(null);
          }}
        />
      </FormModal>

      {/* View Employee Details Dialog */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border bg-card">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div
                className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-xs border shrink-0",
                  selectedEmployee ? getEmployeeColor(getSafeStr(selectedEmployee.name)).bg : "",
                  selectedEmployee ? getEmployeeColor(getSafeStr(selectedEmployee.name)).text : "",
                  selectedEmployee ? getEmployeeColor(getSafeStr(selectedEmployee.name)).border : ""
                )}
              >
                {selectedEmployee ? getSafeStr(selectedEmployee.name).charAt(0).toUpperCase() : "E"}
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {selectedEmployee ? getSafeStr(selectedEmployee.name) : "Employee Details"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {selectedEmployee ? getSafeStr(selectedEmployee.email) : ""}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
                <div>
                  <span className="text-muted-foreground text-[11px]">Role</span>
                  <p className="font-semibold text-foreground mt-0.5">{getSafeStr(selectedEmployee.role)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px]">Status</span>
                  <p className="font-semibold text-foreground mt-0.5">{selectedEmployee.status || "ACTIVE"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px]">Joined Date</span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {selectedEmployee.createdAt
                      ? new Date(selectedEmployee.createdAt).toLocaleDateString("en-IN")
                      : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px]">Staff ID</span>
                  <p className="font-semibold text-foreground mt-0.5 font-mono truncate">{selectedEmployee.id}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Single Delete Dialog */}
      <AlertDialog
        open={Boolean(employeeToDelete)}
        onOpenChange={(open) => !open && setEmployeeToDelete(null)}
      >
        <AlertDialogContent className="rounded-2xl border-border bg-card">
          <AlertDialogHeader>
            <div className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Delete Employee?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to remove{" "}
              <strong className="text-foreground">{employeeToDelete ? getSafeStr(employeeToDelete.name) : ""}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              disabled={deleting}
              className="text-xs h-9 rounded-xl font-semibold border-border hover:bg-muted"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSingle}
              disabled={deleting}
              className="text-xs h-9 rounded-xl font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
            >
              {deleting ? "Deleting..." : "Delete Employee"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteModalOpen} onOpenChange={setBulkDeleteModalOpen}>
        <AlertDialogContent className="rounded-2xl border-border bg-card">
          <AlertDialogHeader>
            <div className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Delete {selectedEmployeeIds.length} Selected Employees?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              This will permanently delete all selected staff profiles. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              disabled={bulkDeleting}
              className="text-xs h-9 rounded-xl font-semibold border-border hover:bg-muted"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="text-xs h-9 rounded-xl font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
            >
              {bulkDeleting ? "Deleting..." : "Delete Selected"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CRMPageContainer>
  );
}
