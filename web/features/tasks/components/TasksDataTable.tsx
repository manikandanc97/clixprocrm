"use client";

import React, { useMemo } from "react";
import {
  Calendar,
  CheckCircle2,
  CheckSquare,
  Edit,
  Eye,
  Link2,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import {
  CRMDataTable,
  CRMTableHeader,
  CRMTableBody,
  CRMTableRow,
  CRMTableCell,
  CRMTableHeaderCell,
  EmptyState,
} from "@/shared/components/crm";
import {
  DataTableColumnHeader,
  SortDirection,
} from "@/shared/components/DataTableColumnHeader";
import { StatusBadge, StatusVariant } from "@/shared/components/StatusBadge";
import { CRMActionMenu } from "@/shared/components/crm/CRMActionMenu";
import { Checkbox } from "@/shared/ui/checkbox";
import { cn } from "@/shared/lib/utils";
import { TaskType } from "@/shared/types/task";
import { TaskSortConfig } from "@/features/tasks/hooks/use-tasks-data";

// ─── Status Variant Mapping ──────────────────────────────────────────────────
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
  onSelectTask: (task: TaskType) => void;
  onEditTask: (task: TaskType) => void;
  onToggleComplete: (task: TaskType) => void;
  onScheduleMeeting: (task: TaskType) => void;
  onDeleteTask: (task: TaskType) => void;
  onCreateTask: () => void;
}

// ─── Skeleton Rows ───────────────────────────────────────────────────────────
function TasksTableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <CRMTableRow key={i} className="animate-pulse h-16 hover:bg-transparent">
          <CRMTableCell className="w-12 px-4 py-4 text-center">
            <div className="h-4 w-4 bg-muted rounded mx-auto" />
          </CRMTableCell>
          <CRMTableCell className="min-w-[240px] px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-muted rounded-lg shrink-0" />
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="h-3.5 w-36 bg-muted rounded" />
                <div className="h-2.5 w-24 bg-muted/60 rounded" />
              </div>
            </div>
          </CRMTableCell>
          <CRMTableCell className="w-32 px-4 py-4">
            <div className="h-6 w-20 bg-muted rounded-md" />
          </CRMTableCell>
          <CRMTableCell className="w-28 px-4 py-4">
            <div className="h-6 w-16 bg-muted rounded-md" />
          </CRMTableCell>
          <CRMTableCell className="w-36 px-4 py-4">
            <div className="h-4 w-24 bg-muted rounded" />
          </CRMTableCell>
          <CRMTableCell className="min-w-[160px] px-4 py-4">
            <div className="h-6 w-24 bg-muted rounded-md" />
          </CRMTableCell>
          <CRMTableCell className="w-36 px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-muted shrink-0" />
              <div className="h-3.5 w-20 bg-muted rounded" />
            </div>
          </CRMTableCell>
          <CRMTableCell className="w-16 px-4 py-4 text-right">
            <div className="h-6 w-6 bg-muted rounded ml-auto" />
          </CRMTableCell>
        </CRMTableRow>
      ))}
    </>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
export function TasksDataTable({
  paginatedTasks,
  isInitialLoading,
  selectedTaskIds,
  setSelectedTaskIds,
  sortConfig,
  setSort,
  hasActiveFilters,
  handleClearFilters,
  isTaskOverdue,
  formatDate,
  getTaskColor,
  togglingTaskId,
  onSelectTask,
  onEditTask,
  onToggleComplete,
  onScheduleMeeting,
  onDeleteTask,
  onCreateTask,
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
  const makeSortHandler = (key: string) => (dir: SortDirection) => {
    setSort(key, dir);
  };

  const sortDirection = useMemo(
    () => (key: string) =>
      sortConfig?.key === key ? (sortConfig.direction as SortDirection) : null,
    [sortConfig]
  );

  return (
    <CRMDataTable
      hasPagination
      containerClassName="border-0 shadow-none rounded-none flex-1 min-h-0"
      className="w-full text-left text-xs border-collapse"
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <CRMTableHeader className="sticky top-0 z-20 bg-muted/60 dark:bg-muted/40 border-b border-border shadow-xs backdrop-blur-xs">
        <CRMTableRow className="text-xs font-bold text-foreground hover:bg-transparent">
          {/* Master checkbox */}
          <CRMTableHeaderCell className="w-12 px-4 py-3.5 text-center border-r border-border/40 bg-muted/60 dark:bg-muted/40">
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
          </CRMTableHeaderCell>

          {/* Task */}
          <CRMTableHeaderCell className="min-w-[240px] px-4 py-3.5 text-left border-r border-border/40 bg-muted/60 dark:bg-muted/40 select-none">
            <DataTableColumnHeader
              title="Task"
              sortable
              sortDirection={sortDirection("title")}
              onSort={makeSortHandler("title")}
            />
          </CRMTableHeaderCell>

          {/* Status */}
          <CRMTableHeaderCell className="w-32 px-4 py-3.5 text-left border-r border-border/40 bg-muted/60 dark:bg-muted/40 select-none">
            <DataTableColumnHeader
              title="Status"
              sortable
              sortDirection={sortDirection("status")}
              onSort={makeSortHandler("status")}
            />
          </CRMTableHeaderCell>

          {/* Priority */}
          <CRMTableHeaderCell className="w-28 px-4 py-3.5 text-left border-r border-border/40 bg-muted/60 dark:bg-muted/40 select-none">
            <DataTableColumnHeader
              title="Priority"
              sortable
              sortDirection={sortDirection("priority")}
              onSort={makeSortHandler("priority")}
            />
          </CRMTableHeaderCell>

          {/* Due Date */}
          <CRMTableHeaderCell className="w-36 px-4 py-3.5 text-left border-r border-border/40 bg-muted/60 dark:bg-muted/40 select-none">
            <DataTableColumnHeader
              title="Due Date"
              sortable
              sortDirection={sortDirection("dueDate")}
              onSort={makeSortHandler("dueDate")}
            />
          </CRMTableHeaderCell>

          {/* Related Record */}
          <CRMTableHeaderCell className="min-w-[160px] px-4 py-3.5 text-left border-r border-border/40 bg-muted/60 dark:bg-muted/40 select-none">
            <DataTableColumnHeader title="Related Record" />
          </CRMTableHeaderCell>

          {/* Assignee */}
          <CRMTableHeaderCell className="w-36 px-4 py-3.5 text-left border-r border-border/40 bg-muted/60 dark:bg-muted/40 select-none">
            <DataTableColumnHeader
              title="Assignee"
              sortable
              sortDirection={sortDirection("assignedTo")}
              onSort={makeSortHandler("assignedTo")}
            />
          </CRMTableHeaderCell>

          {/* Actions */}
          <CRMTableHeaderCell className="w-16 px-4 py-3.5 text-right bg-muted/60 dark:bg-muted/40">
            <span className="sr-only">Actions</span>
          </CRMTableHeaderCell>
        </CRMTableRow>
      </CRMTableHeader>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <CRMTableBody className="divide-y divide-border/40 text-xs">
        {isInitialLoading ? (
          <TasksTableSkeleton />
        ) : paginatedTasks.length > 0 ? (
          paginatedTasks.map((task: TaskType) => {
            const color = getTaskColor(task.title || "Task");
            const { date } = formatDate(task.dueDate);
            const isSelected = selectedTaskIds.includes(task.id);
            const overdue = isTaskOverdue(task);

            const relatedName =
              task.relatedLead?.name ||
              task.relatedCustomer?.name ||
              task.relatedQuotation?.title ||
              null;

            return (
              <CRMTableRow
                key={task.id}
                className={cn(
                  "group h-16 hover:bg-muted/30 transition-colors",
                  isSelected && "bg-primary/[0.03]"
                )}
              >
                {/* Checkbox */}
                <CRMTableCell className="w-12 px-4 py-3.5 text-center">
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
                </CRMTableCell>

                {/* Task Name & Avatar */}
                <CRMTableCell className="min-w-[240px] px-4 py-3.5 font-medium overflow-hidden">
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
                        onClick={() => onSelectTask(task)}
                        className={cn(
                          "font-bold text-sm text-foreground hover:text-primary transition-colors cursor-pointer truncate",
                          task.status === "COMPLETED" && "line-through text-muted-foreground"
                        )}
                      >
                        {task.title || "Untitled Task"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {task.description ||
                          (task.tags && task.tags.length > 0
                            ? task.tags.join(", ")
                            : "No description")}
                      </p>
                    </div>
                  </div>
                </CRMTableCell>

                {/* Status — canonical StatusBadge */}
                <CRMTableCell className="w-32 px-4 py-3.5">
                  <StatusBadge
                    status={task.status || "PENDING"}
                    variant={getTaskStatusVariant(task.status)}
                  />
                </CRMTableCell>

                {/* Priority — semantic design tokens */}
                <CRMTableCell className="w-28 px-4 py-3.5">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-xs",
                      task.priority === "HIGH" &&
                        "bg-destructive/15 text-destructive border-destructive/25",
                      (task.priority === "MEDIUM" || !task.priority) &&
                        "bg-warning/15 text-warning border-warning/25",
                      task.priority === "LOW" &&
                        "bg-info/15 text-info border-info/25"
                    )}
                  >
                    {task.priority || "MEDIUM"}
                  </span>
                </CRMTableCell>

                {/* Due Date & Overdue */}
                <CRMTableCell className="w-36 px-4 py-3.5">
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
                </CRMTableCell>

                {/* Related Record */}
                <CRMTableCell className="min-w-[160px] px-4 py-3.5">
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
                </CRMTableCell>

                {/* Assignee */}
                <CRMTableCell className="w-36 px-4 py-3.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 uppercase">
                      {task.assignedTo?.name ? task.assignedTo.name.charAt(0) : "U"}
                    </div>
                    <span className="text-xs font-semibold text-foreground truncate">
                      {task.assignedTo?.name || "Unassigned"}
                    </span>
                  </div>
                </CRMTableCell>

                {/* Actions — canonical CRMActionMenu */}
                <CRMTableCell className="w-16 px-4 py-3.5 text-right">
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
                </CRMTableCell>
              </CRMTableRow>
            );
          })
        ) : (
          /* Empty state */
          <CRMTableRow className="hover:bg-transparent border-0">
            <CRMTableCell
              colSpan={8}
              className="p-6 text-center text-muted-foreground align-middle border-0"
            >
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
                          onClick: onCreateTask,
                          icon: Plus,
                        }
                  }
                />
              </div>
            </CRMTableCell>
          </CRMTableRow>
        )}
      </CRMTableBody>
    </CRMDataTable>
  );
}
