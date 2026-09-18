"use client";

import React, { useMemo } from "react";
import {
  Calendar,
  CheckCircle2,
  CheckSquare,
  Edit,
  Eye,
  Link2,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { CRMDataTable, CRMDataTableColumn, TableDensity } from "@/shared/components/crm/CRMDataTable";
import {
  SortDirection,
} from "@/shared/components/DataTableColumnHeader";
import { StatusBadge, StatusVariant } from "@/shared/components/StatusBadge";
import { CRMActionMenu } from "@/shared/components/crm/CRMActionMenu";
import { Checkbox } from "@/shared/ui/checkbox";
import { cn } from "@/shared/lib/utils";
import { TaskType } from "@/shared/types/task";
import { TaskSortConfig } from "@/features/tasks/hooks/use-tasks-data";

// ─── Status & Priority Variant Mapping ───────────────────────────────────────
export function getTaskStatusVariant(status?: string): StatusVariant {
  switch (status?.toUpperCase()) {
    case "COMPLETED":
      return "emerald";
    case "IN_PROGRESS":
      return "blue";
    case "PENDING":
      return "amber";
    case "BLOCKED":
    case "OVERDUE":
      return "rose";
    case "CANCELLED":
      return "neutral";
    default:
      return "neutral";
  }
}

export function getPriorityVariant(priority?: string): StatusVariant {
  switch (priority?.toUpperCase()) {
    case "URGENT":
      return "purple";
    case "HIGH":
      return "rose";
    case "MEDIUM":
      return "amber";
    case "LOW":
      return "blue";
    default:
      return "neutral";
  }
}

// ─── Props Interface ─────────────────────────────────────────────────────────
export interface TasksDataTableProps {
  paginatedTasks: TaskType[];
  isInitialLoading: boolean;
  selectedTaskIds: string[];
  setSelectedTaskIds: React.Dispatch<React.SetStateAction<string[]>>;
  sortConfig: TaskSortConfig | null;
  setSort: (key: string, dir: "asc" | "desc" | null) => void;
  hasActiveFilters: boolean;
  handleClearFilters: () => void;
  isTaskOverdue: (task: TaskType) => boolean;
  formatDate: (dateStr?: string | null) => { date: string; time: string };
  getTaskColor: (title: string) => { bg: string; text: string; border: string };
  togglingTaskId: string | null;
  density?: TableDensity;
  onSelectTask: (task: TaskType) => void;
  onEditTask: (task: TaskType) => void;
  onToggleComplete: (task: TaskType) => void;
  onScheduleMeeting: (task: TaskType) => void;
  onDeleteTask: (task: TaskType) => void;
  onCreateTask: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function TasksDataTable({
  paginatedTasks,
  isInitialLoading,
  selectedTaskIds,
  setSelectedTaskIds,
  sortConfig,
  setSort,
  isTaskOverdue,
  formatDate,
  getTaskColor,
  togglingTaskId,
  density = "default",
  onSelectTask,
  onEditTask,
  onToggleComplete,
  onScheduleMeeting,
  onDeleteTask,
}: TasksDataTableProps) {
  // Current page selection state
  const allPageSelected =
    paginatedTasks.length > 0 &&
    paginatedTasks.every((t) => selectedTaskIds.includes(t.id));

  const somePageSelected =
    !allPageSelected &&
    paginatedTasks.some((t) => selectedTaskIds.includes(t.id));

  const masterChecked: boolean | "indeterminate" = allPageSelected
    ? true
    : somePageSelected
    ? "indeterminate"
    : false;

  // Sorting helpers
  const sortDirection = useMemo(
    () => (key: string) =>
      sortConfig?.key === key ? (sortConfig.direction as SortDirection) : null,
    [sortConfig]
  );

  const cellPy =
    density === "compact"
      ? "py-2"
      : density === "comfortable"
      ? "py-3.5"
      : "py-2.5";

  const avatarDimensions =
    density === "compact"
      ? "h-8 w-8 text-xs rounded-md"
      : density === "comfortable"
      ? "h-10 w-10 text-sm rounded-lg"
      : "h-9 w-9 text-xs rounded-lg";

  const columns = useMemo<CRMDataTableColumn<TaskType>[]>(() => {
    return [
      // 1. Master Checkbox
      {
        header: (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={masterChecked}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedTaskIds((prev) =>
                    Array.from(new Set([...prev, ...paginatedTasks.map((t) => t.id)]))
                  );
                } else {
                  const pageIds = new Set(paginatedTasks.map((t) => t.id));
                  setSelectedTaskIds((prev) => prev.filter((id) => !pageIds.has(id)));
                }
              }}
              aria-label="Select all tasks on this page"
              className="mx-auto"
            />
          </div>
        ),
        cell: (task) => {
          const isSelected = selectedTaskIds.includes(task.id);
          return (
            <div
              className="flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => {
                  setSelectedTaskIds((prev) =>
                    prev.includes(task.id)
                      ? prev.filter((id) => id !== task.id)
                      : [...prev, task.id]
                  );
                }}
                aria-label={`Select task ${task.title || "Untitled Task"}`}
                className="mx-auto"
              />
            </div>
          );
        },
        className: cn("w-12 px-4 text-center", cellPy),
        headerClassName: "w-12 px-4 py-2.5 text-center",
        align: "center",
      },

      // 2. Task Name & Avatar
      {
        header: "Task",
        sortable: true,
        sortDirection: sortDirection("title"),
        onSort: (dir) => setSort("title", dir),
        cell: (task) => {
          const color = getTaskColor(task.title || "Task");
          return (
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "flex items-center justify-center font-bold shadow-xs border shrink-0",
                  avatarDimensions,
                  color.bg,
                  color.text,
                  color.border
                )}
              >
                {task.title ? task.title.charAt(0).toUpperCase() : "T"}
              </div>
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTask(task);
                  }}
                  className={cn(
                    "font-bold text-sm text-foreground hover:text-primary transition-colors cursor-pointer truncate block text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xs",
                    task.status === "COMPLETED" && "line-through text-muted-foreground"
                  )}
                >
                  {task.title || "Untitled Task"}
                </button>
                <p className="text-xs text-muted-foreground truncate">
                  {task.description ||
                    (task.tags && task.tags.length > 0
                      ? task.tags.join(", ")
                      : "No description")}
                </p>
              </div>
            </div>
          );
        },
        className: cn("min-w-[240px] px-4 font-medium overflow-hidden", cellPy),
      },

      // 3. Status
      {
        header: "Status",
        sortable: true,
        sortDirection: sortDirection("status"),
        onSort: (dir) => setSort("status", dir),
        cell: (task) => (
          <StatusBadge
            status={task.status || "PENDING"}
            variant={getTaskStatusVariant(task.status)}
          />
        ),
        className: cn("w-32 px-4", cellPy),
      },

      // 4. Priority
      {
        header: "Priority",
        sortable: true,
        sortDirection: sortDirection("priority"),
        onSort: (dir) => setSort("priority", dir),
        cell: (task) => (
          <StatusBadge
            status={task.priority || "MEDIUM"}
            variant={getPriorityVariant(task.priority)}
          />
        ),
        className: cn("w-28 px-4", cellPy),
      },

      // 5. Due Date
      {
        header: "Due Date",
        sortable: true,
        sortDirection: sortDirection("dueDate"),
        onSort: (dir) => setSort("dueDate", dir),
        cell: (task) => {
          const { date } = formatDate(task.dueDate);
          const overdue = isTaskOverdue(task);
          return (
            <div className="flex items-center gap-1.5 text-foreground">
              <Calendar
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  overdue ? "text-destructive" : "text-muted-foreground"
                )}
              />
              <div>
                <p
                  className={cn(
                    "text-xs font-semibold",
                    overdue && "text-destructive font-bold"
                  )}
                >
                  {date}
                </p>
                {overdue && (
                  <span className="text-[10px] font-bold text-destructive uppercase tracking-tight">
                    Overdue
                  </span>
                )}
              </div>
            </div>
          );
        },
        className: cn("w-36 px-4", cellPy),
      },

      // 6. Related Record
      {
        header: "Related Record",
        cell: (task) => {
          const relatedName =
            task.relatedLead?.name ||
            task.relatedCustomer?.name ||
            task.relatedQuotation?.title ||
            null;
          return relatedName ? (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-border/60 bg-muted/40 text-muted-foreground max-w-[150px] truncate">
              <Link2 className="h-3 w-3 text-primary shrink-0" />
              <span className="text-xs font-semibold text-foreground truncate">
                {relatedName}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground/50">—</span>
          );
        },
        className: cn("min-w-[160px] px-4", cellPy),
      },

      // 7. Assignee
      {
        header: "Assignee",
        sortable: true,
        sortDirection: sortDirection("assignedTo"),
        onSort: (dir) => setSort("assignedTo", dir),
        cell: (task) => (
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 uppercase">
              {task.assignedTo?.name ? task.assignedTo.name.charAt(0) : "U"}
            </div>
            <span className="text-xs font-semibold text-foreground truncate">
              {task.assignedTo?.name || "Unassigned"}
            </span>
          </div>
        ),
        className: cn("w-36 px-4", cellPy),
      },

      // 8. Actions
      {
        header: <span className="sr-only">Actions</span>,
        align: "right",
        cell: (task) => (
          <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-end">
            <CRMActionMenu
              triggerOrientation="vertical"
              aria-label={`Actions for ${task.title || "task"}`}
              items={[
                {
                  label: "View Details",
                  icon: Eye,
                  onClick: () => onSelectTask(task),
                },
                {
                  label: "Edit Task",
                  icon: Edit,
                  onClick: () => onEditTask(task),
                },
                {
                  label:
                    task.status === "COMPLETED"
                      ? "Reopen Task"
                      : "Mark Complete",
                  icon:
                    task.status === "COMPLETED" ? RotateCcw : CheckCircle2,
                  disabled: togglingTaskId === task.id,
                  onClick: () => onToggleComplete(task),
                },
                {
                  label: "Schedule Meeting",
                  icon: Calendar,
                  onClick: () => onScheduleMeeting(task),
                },
                {
                  label: "Delete Task",
                  icon: Trash2,
                  variant: "destructive",
                  separatorBefore: true,
                  onClick: () => onDeleteTask(task),
                },
              ]}
            />
          </div>
        ),
        className: cn("w-16 px-4 text-right", cellPy),
        headerClassName: "w-16 px-4 py-2.5 text-right",
      },
    ];
  }, [
    masterChecked,
    paginatedTasks,
    selectedTaskIds,
    setSelectedTaskIds,
    sortDirection,
    setSort,
    getTaskColor,
    formatDate,
    isTaskOverdue,
    onSelectTask,
    onEditTask,
    togglingTaskId,
    onToggleComplete,
    onScheduleMeeting,
    onDeleteTask,
    cellPy,
    avatarDimensions,
  ]);

  return (
    <CRMDataTable
      data={paginatedTasks}
      columns={columns}
      density={density}
      isLoading={isInitialLoading}
      onRowClick={(task) => onSelectTask(task)}
      hasPagination={false}
      rowClassName={(task) =>
        cn(
          "group hover:bg-muted/30 transition-colors",
          selectedTaskIds.includes(task.id) && "bg-primary/[0.04]"
        )
      }
      emptyIcon={CheckSquare}
      emptyTitle="No tasks found"
      emptyDescription="No tasks match your current search or filter criteria."
    />
  );
}
