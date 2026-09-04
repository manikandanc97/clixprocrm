"use client";

import { useState, useMemo, useCallback } from "react";
import { useTasks } from "@/shared/hooks/use-crm";
import { useAuth } from "@/features/auth/components/auth-provider";
import { TaskType } from "@/shared/types/task";
import { getOrgAvatarColor } from "@/shared/utils/avatar-colors";
import { toast } from "sonner";

export type TaskStatusFilter =
  | "ALL"
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "BLOCKED"
  | "OVERDUE"
  | "CANCELLED";

export type TaskPriorityFilter = "ALL" | "HIGH" | "MEDIUM" | "LOW";

export interface TaskSortConfig {
  key: string;
  direction: "asc" | "desc";
}

export function isTaskOverdue(task: TaskType): boolean {
  if (task.status === "COMPLETED" || task.status === "CANCELLED") return false;
  if (task.isOverdue) return true;
  if (!task.dueDate) return false;
  const due = new Date(task.dueDate).getTime();
  return !isNaN(due) && due < Date.now();
}

export function formatDate(dateStr?: string | null): { date: string; time: string } {
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
}

export function getTaskColor(title: string) {
  return getOrgAvatarColor(title);
}

export interface UseTasksDataReturn {
  // Raw and query states
  data: ReturnType<typeof useTasks>["data"];
  safeTasks: TaskType[];
  isLoading: boolean;
  isInitialLoading: boolean;
  isPending: boolean;
  refetch: () => void;

  // Search
  search: string;
  setSearch: (value: string) => void;

  // Filters
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  priorityFilter: string;
  setPriorityFilter: (value: string) => void;
  hasActiveFilters: boolean;
  handleClearFilters: () => void;

  // Sorting
  sortConfig: TaskSortConfig | null;
  setSort: (key: string, dir: "asc" | "desc" | null) => void;

  // Pagination
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  rowsPerPage: number;
  setRowsPerPage: (value: number) => void;
  totalPages: number;
  goToFirstPage: () => void;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
  goToLastPage: () => void;

  // Selection
  selectedTaskIds: string[];
  setSelectedTaskIds: React.Dispatch<React.SetStateAction<string[]>>;
  isAllCurrentPageSelected: boolean;
  toggleSelectAllCurrentPage: () => void;
  toggleSelectTask: (taskId: string) => void;

  // Datasets
  filteredTasks: TaskType[];
  paginatedTasks: TaskType[];
  totalTasks: number;

  // Actions & Helpers
  exportCSV: () => void;
  isTaskOverdue: (task: TaskType) => boolean;
  formatDate: (dateStr?: string | null) => { date: string; time: string };
  getTaskColor: (title: string) => ReturnType<typeof getOrgAvatarColor>;
}

/**
 * Hook to manage task list data, filtering, sorting, pagination, selection, and CSV export.
 */
export function useTasksData(): UseTasksDataReturn {
  const { isHydrated, isAuthenticated, isInitializing } = useAuth();
  const { data, isLoading: loading, isPending, refetch } = useTasks();

  const safeTasks = useMemo(
    () => (Array.isArray(data?.tasks) ? (data.tasks as TaskType[]) : []),
    [data]
  );

  const isInitialLoading =
    !data && (loading || isPending || !isHydrated || !isAuthenticated || isInitializing);

  // Filter & search state
  const [statusFilter, setStatusFilterState] = useState("ALL");
  const [priorityFilter, setPriorityFilterState] = useState("ALL");
  const [search, setSearchState] = useState("");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPageState] = useState(10);
  const [sortConfig, setSortConfig] = useState<TaskSortConfig | null>(null);

  const setSearch = useCallback((val: string) => {
    setSearchState(val);
    setCurrentPage(1);
  }, []);

  const setStatusFilter = useCallback((val: string) => {
    setStatusFilterState(val);
    setCurrentPage(1);
  }, []);

  const setPriorityFilter = useCallback((val: string) => {
    setPriorityFilterState(val);
    setCurrentPage(1);
  }, []);

  const setSort = useCallback((key: string, dir: "asc" | "desc" | null) => {
    setSortConfig(dir === null ? null : { key, direction: dir });
  }, []);

  const setRowsPerPage = useCallback((v: number) => {
    setRowsPerPageState(v);
    setCurrentPage(1);
  }, []);

  // Filtered and sorted tasks
  const filteredTasks = useMemo(() => {
    const filtered = safeTasks.filter((task: TaskType) => {
      if (statusFilter !== "ALL") {
        if (statusFilter === "OVERDUE") {
          if (!isTaskOverdue(task)) return false;
        } else if ((task.status || "PENDING").toUpperCase() !== statusFilter.toUpperCase()) {
          return false;
        }
      }

      if (
        priorityFilter !== "ALL" &&
        (task.priority || "MEDIUM").toUpperCase() !== priorityFilter.toUpperCase()
      ) {
        return false;
      }

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (task.title && task.title.toLowerCase().includes(q)) ||
        (task.description && task.description.toLowerCase().includes(q)) ||
        (task.assignedTo?.name && task.assignedTo.name.toLowerCase().includes(q)) ||
        (task.relatedLead?.name && task.relatedLead.name.toLowerCase().includes(q)) ||
        (task.relatedCustomer?.name && task.relatedCustomer.name.toLowerCase().includes(q)) ||
        (task.tags && task.tags.some((t) => t.toLowerCase().includes(q)))
      );
    });

    if (!sortConfig) return filtered;
    return [...filtered].sort((a: TaskType, b: TaskType) => {
      let aVal: string | number = "";
      let bVal: string | number = "";
      if (sortConfig.key === "priority") {
        const priorityWeight: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        aVal = priorityWeight[a.priority] || 0;
        bVal = priorityWeight[b.priority] || 0;
      } else if (sortConfig.key === "dueDate") {
        aVal = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        bVal = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      } else if (sortConfig.key === "assignedTo") {
        aVal = a.assignedTo?.name || "";
        bVal = b.assignedTo?.name || "";
      } else if (sortConfig.key === "createdAt") {
        aVal = new Date(a.createdAt || 0).getTime();
        bVal = new Date(b.createdAt || 0).getTime();
      } else {
        const rawA = a[sortConfig.key as keyof TaskType];
        const rawB = b[sortConfig.key as keyof TaskType];
        aVal = typeof rawA === "string" || typeof rawA === "number" ? rawA : (rawA ? String(rawA) : "");
        bVal = typeof rawB === "string" || typeof rawB === "number" ? rawB : (rawB ? String(rawB) : "");
      }
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [safeTasks, search, statusFilter, priorityFilter, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / rowsPerPage));
  const paginatedTasks = useMemo(() => {
    return filteredTasks.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );
  }, [filteredTasks, currentPage, rowsPerPage]);

  // Pagination navigation helpers
  const goToFirstPage = useCallback(() => setCurrentPage(1), []);
  const goToPreviousPage = useCallback(
    () => setCurrentPage((p) => Math.max(1, p - 1)),
    []
  );
  const goToNextPage = useCallback(
    () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
    [totalPages]
  );
  const goToLastPage = useCallback(
    () => setCurrentPage(totalPages),
    [totalPages]
  );

  // Selection helpers
  const isAllCurrentPageSelected = useMemo(() => {
    return (
      paginatedTasks.length > 0 &&
      paginatedTasks.every((t) => selectedTaskIds.includes(t.id))
    );
  }, [paginatedTasks, selectedTaskIds]);

  const toggleSelectAllCurrentPage = useCallback(() => {
    if (isAllCurrentPageSelected) {
      const pageIds = new Set(paginatedTasks.map((t) => t.id));
      setSelectedTaskIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      setSelectedTaskIds((prev) =>
        Array.from(new Set([...prev, ...paginatedTasks.map((t) => t.id)]))
      );
    }
  }, [isAllCurrentPageSelected, paginatedTasks]);

  const toggleSelectTask = useCallback((taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  }, []);

  // Filter actions
  const hasActiveFilters =
    statusFilter !== "ALL" || priorityFilter !== "ALL" || search.trim().length > 0;

  const handleClearFilters = useCallback(() => {
    setStatusFilterState("ALL");
    setPriorityFilterState("ALL");
    setSearchState("");
    setCurrentPage(1);
  }, []);

  // CSV Export
  const exportCSV = useCallback(() => {
    if (safeTasks.length === 0) {
      toast.error("No tasks available to export.");
      return;
    }
    const headers = [
      "ID",
      "Title",
      "Status",
      "Priority",
      "Due Date",
      "Assignee",
      "Related Record",
      "Created At",
    ];
    const rows = safeTasks.map((t: TaskType) => {
      const relatedName =
        t.relatedLead?.name ||
        t.relatedCustomer?.name ||
        t.relatedQuotation?.title ||
        "";
      return [
        t.id,
        `"${(t.title || "").replace(/"/g, '""')}"`,
        t.status || "PENDING",
        t.priority || "MEDIUM",
        t.dueDate || "",
        `"${(t.assignedTo?.name || "").replace(/"/g, '""')}"`,
        `"${relatedName.replace(/"/g, '""')}"`,
        t.createdAt || "",
      ];
    });
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `clixpro_tasks_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Tasks exported successfully.");
  }, [safeTasks]);

  return {
    data,
    safeTasks,
    isLoading: loading,
    isInitialLoading,
    isPending,
    refetch,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    hasActiveFilters,
    handleClearFilters,
    sortConfig,
    setSort,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    totalPages,
    goToFirstPage,
    goToPreviousPage,
    goToNextPage,
    goToLastPage,
    selectedTaskIds,
    setSelectedTaskIds,
    isAllCurrentPageSelected,
    toggleSelectAllCurrentPage,
    toggleSelectTask,
    filteredTasks,
    paginatedTasks,
    totalTasks: filteredTasks.length,
    exportCSV,
    isTaskOverdue,
    formatDate,
    getTaskColor,
  };
}
