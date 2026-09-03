"use client";

import { useEffect, useState, useMemo } from "react";
import {
  CheckSquare,
  Plus,
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
  Settings,
  Calendar,
  Eye,
  Edit,
  CheckCircle2,
  Link2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
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
import { CRMPageContainer } from "@/shared/components/crm";
import { EmptyState } from "@/shared/components/EmptyState";
import { cn } from "@/shared/lib/utils";
import { getOrgAvatarColor } from "@/shared/utils/avatar-colors";
import {
  useTasks,
  useDeleteTask,
  useBulkDeleteTasks,
  useUpdateTask,
} from "@/shared/hooks/use-crm";
import { FormModal } from "@/shared/components/crm/FormModal";
import { MeetingForm } from "@/features/forms/MeetingForm";
import { CreateTaskModal } from "@/features/tasks/components/CreateTaskModal";
import { EditTaskModal } from "@/features/tasks/components/EditTaskModal";
import { TaskContextualSettings } from "@/features/tasks/components/TaskContextualSettings";
import { useAuth } from "@/features/auth/components/auth-provider";
import { TaskType } from "@/shared/types/task";

const TaskDetailsModal = dynamic(
  () => import("@/features/tasks/components/TaskDetailsModal"),
  { ssr: false }
);

export default function TasksPage() {
  const searchParams = useSearchParams();
  const { isHydrated, isAuthenticated, isInitializing } = useAuth();

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const setSort = (key: string, dir: "asc" | "desc" | null) => {
    setSortConfig(dir === null ? null : { key, direction: dir });
  };

  const { data, isLoading: loading, isPending, refetch } = useTasks();
  const safeTasks = useMemo(
    () => (Array.isArray(data?.tasks) ? (data.tasks as TaskType[]) : []),
    [data]
  );

  const { mutateAsync: deleteTaskMutate } = useDeleteTask();
  const { mutateAsync: bulkDeleteTasksMutate } = useBulkDeleteTasks();
  const { mutate: updateTaskMutate } = useUpdateTask();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<TaskType | null>(null);
  const [meetingTask, setMeetingTask] = useState<TaskType | null>(null);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [customizeDefaultSection, setCustomizeDefaultSection] = useState<string | undefined>();

  // Delete modal state
  const [taskToDelete, setTaskToDelete] = useState<TaskType | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);

  // Sync customize query param & new param
  useEffect(() => {
    const cust = searchParams.get("customize");
    if (cust) {
      if (cust !== "true") {
        setCustomizeDefaultSection(cust);
      }
      setIsCustomizeOpen(true);
    }
  }, [searchParams]);

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
  }, [search, statusFilter, priorityFilter]);

  const getTaskColor = (title: string) => {
    return getOrgAvatarColor(title);
  };

  const formatDate = (dateStr?: string | null) => {
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

  const isTaskOverdue = (task: TaskType) => {
    if (task.status === "COMPLETED" || task.status === "CANCELLED") return false;
    if (task.isOverdue) return true;
    if (!task.dueDate) return false;
    const due = new Date(task.dueDate).getTime();
    return !isNaN(due) && due < Date.now();
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      setDeleting(true);
      await deleteTaskMutate(taskToDelete.id);
      setSelectedTaskIds((prev) => prev.filter((id) => id !== taskToDelete.id));
      setTaskToDelete(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete task.");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTaskIds.length === 0) return;
    try {
      setBulkDeleting(true);
      await bulkDeleteTasksMutate(selectedTaskIds);
      toast.success(`${selectedTaskIds.length} task(s) deleted successfully.`);
      setSelectedTaskIds([]);
      setBulkDeleteModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete selected tasks.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleToggleComplete = (task: TaskType) => {
    setTogglingTaskId(task.id);
    const newStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    updateTaskMutate(
      { id: task.id, data: { status: newStatus } },
      {
        onSettled: () => {
          setTogglingTaskId(null);
          refetch();
        },
      }
    );
  };

  const handleScheduleMeeting = (task: TaskType) => {
    if (!task.relatedLead && !task.relatedCustomer && !task.relatedQuotation) {
      toast.error("This task is not linked to a Lead, Customer, or Quotation. Link a CRM record before scheduling a meeting.");
      return;
    }
    setMeetingTask(task);
  };

  const hasActiveFilters =
    statusFilter !== "ALL" || priorityFilter !== "ALL" || search.trim().length > 0;

  const handleClearFilters = () => {
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setSearch("");
    setCurrentPage(1);
  };

  const exportCSV = () => {
    if (safeTasks.length === 0) {
      toast.error("No tasks available to export.");
      return;
    }
    const headers = ["ID", "Title", "Status", "Priority", "Due Date", "Assignee", "Related Record", "Created At"];
    const rows = safeTasks.map((t: TaskType) => {
      const relatedName = t.relatedLead?.name || t.relatedCustomer?.name || t.relatedQuotation?.title || "";
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
    link.setAttribute("download", `clixpro_tasks_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Tasks exported successfully.");
  };

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
      let aVal: any = a[sortConfig.key as keyof TaskType];
      let bVal: any = b[sortConfig.key as keyof TaskType];
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
        aVal = aVal ?? "";
        bVal = bVal ?? "";
      }
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [safeTasks, search, statusFilter, priorityFilter, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / rowsPerPage));
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const isInitialLoading =
    !data && (loading || isPending || !isHydrated || !isAuthenticated || isInitializing);

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
              name="tasks"
              icon={CheckSquare}
              size={18}
              className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors"
            />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              Tasks
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Organize your workflow, track productivity, and collaborate with your team.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsCustomizeOpen(true)}
            className="group font-semibold text-xs h-9 px-3 rounded-lg shadow-xs gap-1.5 cursor-pointer border-border/70 bg-background hover:bg-muted/50 text-foreground"
          >
            <AppIcon
              name="settings"
              icon={Settings}
              size={14}
              className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
            />
            <span>Customize</span>
          </Button>

          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="group bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-3.5 rounded-lg shadow-xs gap-1.5 cursor-pointer transition-colors"
          >
            <AppIcon
              name="plus"
              icon={Plus}
              size={14}
              className="w-3.5 h-3.5 text-white shrink-0"
            />
            <span>Create Task</span>
          </Button>
        </div>
      </div>

      {/* 2. Main Card Container matching Contacts and Companies */}
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
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="BLOCKED">Blocked</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
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
                placeholder="Search tasks..."
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
            {/* Multi-Select Delete Button with count */}
            {selectedTaskIds.length > 0 && (
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
                <span>Delete ({selectedTaskIds.length})</span>
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

        {/* Table Content - Vertical & Horizontal Scroll Owner with Sticky Emerald Header */}
        <div className="overflow-auto flex-1 min-h-0 relative flex flex-col kanban-board-scroll">
          <table className="w-full text-left text-xs border-collapse min-w-[1100px] table-fixed">
            <colgroup>
              <col style={{ width: "48px" }} />
              <col style={{ width: "300px" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "150px" }} />
              <col style={{ width: "170px" }} />
              <col style={{ width: "160px" }} />
              <col style={{ width: "64px" }} />
            </colgroup>
            <thead className="sticky top-0 z-20 bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-500/20 shadow-xs backdrop-blur-xs">
              <tr className="text-xs font-bold text-foreground">
                <th className="w-12 px-4 py-3.5 text-center bg-emerald-50/80 dark:bg-emerald-950/40 border-r border-emerald-500/15">
                  <input
                    type="checkbox"
                    checked={
                      paginatedTasks.length > 0 &&
                      paginatedTasks.every((t) => selectedTaskIds.includes(t.id))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTaskIds(
                          Array.from(new Set([...selectedTaskIds, ...paginatedTasks.map((t) => t.id)]))
                        );
                      } else {
                        const pageIds = new Set(paginatedTasks.map((t) => t.id));
                        setSelectedTaskIds(selectedTaskIds.filter((id) => !pageIds.has(id)));
                      }
                    }}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                  />
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() =>
                    setSort(
                      "title",
                      sortConfig?.key === "title" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc"
                    )
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span>Task</span>
                    {sortConfig?.key === "title" && (
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
                      "priority",
                      sortConfig?.key === "priority" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc"
                    )
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span>Priority</span>
                    {sortConfig?.key === "priority" && (
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
                      "dueDate",
                      sortConfig?.key === "dueDate" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc"
                    )
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span>Due Date</span>
                    {sortConfig?.key === "dueDate" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40">
                  <span>Related Record</span>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() =>
                    setSort(
                      "assignedTo",
                      sortConfig?.key === "assignedTo" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc"
                    )
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span>Assignee</span>
                    {sortConfig?.key === "assignedTo" && (
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
                          <div className="h-3.5 w-36 bg-muted rounded" />
                          <div className="h-2.5 w-24 bg-muted/60 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 w-20 bg-muted rounded-md" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 w-16 bg-muted rounded-md" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-24 bg-muted rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 w-24 bg-muted rounded-md" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-muted shrink-0" />
                        <div className="h-3.5 w-20 bg-muted rounded" />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="h-6 w-6 bg-muted rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : paginatedTasks.length > 0 ? (
                paginatedTasks.map((task: TaskType) => {
                  const color = getTaskColor(task.title || "Task");
                  const { date, time } = formatDate(task.dueDate);
                  const isSelected = selectedTaskIds.includes(task.id);
                  const overdue = isTaskOverdue(task);

                  const relatedName =
                    task.relatedLead?.name ||
                    task.relatedCustomer?.name ||
                    task.relatedQuotation?.title ||
                    null;
                  const relatedType = task.relatedLead
                    ? "Lead"
                    : task.relatedCustomer
                    ? "Customer"
                    : task.relatedQuotation
                    ? "Deal"
                    : null;

                  return (
                    <tr
                      key={task.id}
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
                            setSelectedTaskIds((prev) =>
                              prev.includes(task.id)
                                ? prev.filter((id) => id !== task.id)
                                : [...prev, task.id]
                            );
                          }}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                        />
                      </td>

                      {/* Task Name & Avatar */}
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
                            {task.title ? task.title.charAt(0).toUpperCase() : "T"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              onClick={() => setSelectedTask(task)}
                              className={cn(
                                "font-bold text-sm text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer truncate",
                                task.status === "COMPLETED" && "line-through text-muted-foreground"
                              )}
                            >
                              {task.title || "Untitled Task"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {task.description || (task.tags && task.tags.length > 0 ? task.tags.join(", ") : "No description")}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border",
                            task.status === "COMPLETED" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
                            task.status === "IN_PROGRESS" && "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
                            task.status === "PENDING" && "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
                            task.status === "BLOCKED" && "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
                            task.status === "OVERDUE" && "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
                            task.status === "CANCELLED" && "bg-muted text-muted-foreground border-border/60"
                          )}
                        >
                          {task.status}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                            task.priority === "HIGH" && "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25",
                            task.priority === "MEDIUM" && "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
                            task.priority === "LOW" && "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25"
                          )}
                        >
                          {task.priority || "MEDIUM"}
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-foreground">
                          <Calendar className={cn("h-3.5 w-3.5 shrink-0", overdue ? "text-rose-500" : "text-muted-foreground")} />
                          <div>
                            <p className={cn("text-xs font-semibold", overdue && "text-rose-600 dark:text-rose-400 font-bold")}>
                              {date}
                            </p>
                            {overdue && (
                              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">
                                Overdue
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Related Record */}
                      <td className="px-4 py-3.5">
                        {relatedName ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-border/60 bg-muted/40 text-muted-foreground max-w-[150px] truncate">
                            <Link2 className="h-3 w-3 text-primary shrink-0" />
                            <span className="text-xs font-semibold text-foreground truncate">
                              {relatedName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </td>

                      {/* Assignee */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 uppercase">
                            {task.assignedTo?.name ? task.assignedTo.name.charAt(0) : "U"}
                          </div>
                          <span className="text-xs font-semibold text-foreground truncate">
                            {task.assignedTo?.name || "Unassigned"}
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
                              onClick={() => setSelectedTask(task)}
                              className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 hover:bg-muted focus:bg-muted"
                            >
                              <AppIcon
                                name="eye"
                                icon={Eye}
                                size={14}
                                className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                              />
                              <span>View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setTaskToEdit(task)}
                              className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 hover:bg-muted focus:bg-muted"
                            >
                              <AppIcon
                                name="edit"
                                icon={Edit}
                                size={14}
                                className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                              />
                              <span>Edit Task</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleComplete(task)}
                              disabled={togglingTaskId === task.id}
                              className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 hover:bg-muted focus:bg-muted"
                            >
                              <AppIcon
                                name="check"
                                icon={task.status === "COMPLETED" ? RotateCcw : CheckCircle2}
                                size={14}
                                className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                              />
                              <span>{task.status === "COMPLETED" ? "Reopen Task" : "Mark Complete"}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleScheduleMeeting(task)}
                              className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 hover:bg-muted focus:bg-muted"
                            >
                              <AppIcon
                                name="calendar"
                                icon={Calendar}
                                size={14}
                                className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                              />
                              <span>Schedule Meeting</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1" />
                            <DropdownMenuItem
                              onClick={() => setTaskToDelete(task)}
                              className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
                            >
                              <AppIcon
                                name="trash"
                                icon={Trash2}
                                size={14}
                                className="w-3.5 h-3.5 text-destructive shrink-0"
                              />
                              <span>Delete Task</span>
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
                        icon={CheckSquare}
                        title="No tasks found"
                        description="No tasks match your current search or filter criteria."
                        className="border-none bg-transparent shadow-none p-0 min-h-0"
                        action={
                          hasActiveFilters
                            ? {
                                label: "Clear Filters",
                                onClick: handleClearFilters,
                                icon: RotateCcw,
                              }
                            : {
                                label: "Create Task",
                                onClick: () => setIsAddModalOpen(true),
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

        {/* Bottom Pagination matching Contacts and Companies */}
        <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/50 text-xs font-medium text-muted-foreground bg-card shrink-0 mt-auto">
          <div>
            Showing{" "}
            <span className="font-semibold text-foreground">
              {filteredTasks.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
            </span>
            -
            <span className="font-semibold text-foreground">
              {Math.min(currentPage * rowsPerPage, filteredTasks.length)}
            </span>{" "}
            of <span className="font-semibold text-foreground">{filteredTasks.length}</span> Tasks
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2.5 rounded-lg border border-border/60 bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span>
                Page <strong className="text-foreground">{currentPage}</strong> of{" "}
                <strong className="text-foreground">{totalPages}</strong>
              </span>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(1)}
                  className="group h-8 w-8 rounded-lg border-border/60 cursor-pointer disabled:opacity-40"
                  title="First page"
                  aria-label="First page"
                >
                  <AppIcon name="chevronsLeft" icon={ChevronsLeft} size={14} className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="group h-8 w-8 rounded-lg border-border/60 cursor-pointer disabled:opacity-40"
                  title="Previous page"
                  aria-label="Previous page"
                >
                  <AppIcon name="chevronLeft" icon={ChevronLeft} size={14} className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="group h-8 w-8 rounded-lg border-border/60 cursor-pointer disabled:opacity-40"
                  title="Next page"
                  aria-label="Next page"
                >
                  <AppIcon name="chevronRight" icon={ChevronRight} size={14} className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="group h-8 w-8 rounded-lg border-border/60 cursor-pointer disabled:opacity-40"
                  title="Last page"
                  aria-label="Last page"
                >
                  <AppIcon name="chevronsRight" icon={ChevronsRight} size={14} className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Single Task Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Delete Task?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Are you sure you want to delete{" "}
                  <strong className="text-foreground">{taskToDelete.title}</strong>?
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border/40">
              This action will permanently delete the task and its history. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => setTaskToDelete(null)}
                disabled={deleting}
                className="rounded-xl text-xs font-semibold h-9 px-4 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteTask}
                disabled={deleting}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold rounded-xl text-xs h-9 px-4 shadow-sm cursor-pointer"
              >
                {deleting ? "Deleting..." : "Delete Task"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Multiple Tasks Confirmation Modal */}
      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Delete Selected Tasks?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You are about to delete{" "}
                  <strong className="text-foreground">{selectedTaskIds.length}</strong> selected
                  tasks.
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border/40">
              This action cannot be undone. All selected tasks will be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => setBulkDeleteModalOpen(false)}
                disabled={bulkDeleting}
                className="rounded-xl text-xs font-semibold h-9 px-4 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold rounded-xl text-xs h-9 px-4 shadow-sm cursor-pointer"
              >
                {bulkDeleting ? "Deleting..." : `Delete ${selectedTaskIds.length} Tasks`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Task Modals */}
      <CreateTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          refetch();
        }}
      />

      <EditTaskModal
        task={taskToEdit}
        isOpen={!!taskToEdit}
        onClose={() => setTaskToEdit(null)}
        onSuccess={() => {
          setTaskToEdit(null);
          refetch();
        }}
      />

      <TaskDetailsModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onScheduleMeeting={handleScheduleMeeting}
      />

      <FormModal
        isOpen={!!meetingTask}
        onOpenChange={(open) => !open && setMeetingTask(null)}
        title="Schedule Meeting"
      >
        <MeetingForm
          defaultTaskId={meetingTask?.id}
          defaultLeadId={meetingTask?.relatedLead?.id || undefined}
          defaultCustomerId={meetingTask?.relatedCustomer?.id || undefined}
          defaultQuotationId={meetingTask?.relatedQuotation?.id || undefined}
          onSuccess={() => {
            setMeetingTask(null);
            refetch();
          }}
          onCancel={() => setMeetingTask(null)}
        />
      </FormModal>

      <TaskContextualSettings
        open={isCustomizeOpen}
        onOpenChange={setIsCustomizeOpen}
        defaultSection={customizeDefaultSection || "types"}
      />
    </CRMPageContainer>
  );
}
