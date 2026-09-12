"use client";

import { useState } from "react";
import {
  CheckSquare,
  Plus,
  Download,
  Trash2,
  RotateCcw,
  Settings,
} from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { toast } from "sonner";
import {
  CRMPageContainer,
  CRMPageHeader,
  CRMToolbar,
  CRMPagination,
  CRMDeleteDialog,
} from "@/shared/components/crm";
import { PageErrorState } from "@/shared/components/crm/PageFeedbackStates";
import {
  useDeleteTask,
  useBulkDeleteTasks,
  useUpdateTask,
} from "@/shared/hooks/use-crm";
import { FormModal } from "@/shared/components/crm/FormModal";
import { MeetingForm } from "@/features/forms/MeetingForm";
import { TaskModal } from "@/features/tasks/components/TaskModal";
import { TasksDataTable } from "@/features/tasks/components/TasksDataTable";
import { useTasksUrlState } from "@/features/tasks/hooks/use-tasks-url-state";
import { useTasksData } from "@/features/tasks/hooks/use-tasks-data";
import { TaskType } from "@/shared/types/task";

// Lazy-loaded: TaskDetailsModal is only needed when a row is opened
const TaskDetailsModal = dynamic(
  () => import("@/features/tasks/components/TaskDetailsModal"),
  { ssr: false }
);

// Lazy-loaded: TaskContextualSettings (~66 KB) is only needed when "Customize" is opened
const TaskContextualSettings = dynamic(
  () =>
    import("@/features/tasks/components/TaskContextualSettings").then(
      (m) => ({ default: m.TaskContextualSettings })
    ),
  { ssr: false }
);

export default function TasksPage() {
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<TaskType | null>(null);
  const [meetingTask, setMeetingTask] = useState<TaskType | null>(null);

  // Delete modal state
  const [taskToDelete, setTaskToDelete] = useState<TaskType | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);

  // URL state synchronization
  const {
    isCustomizeOpen,
    setIsCustomizeOpen,
    customizeDefaultSection,
  } = useTasksUrlState({
    setIsAddModalOpen,
  });

  // Data, filtering, sorting, pagination, and export
  const {
    isInitialLoading,
    isError,
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
    selectedTaskIds,
    setSelectedTaskIds,
    filteredTasks,
    paginatedTasks,
    exportCSV,
    isTaskOverdue,
    formatDate,
    getTaskColor,
  } = useTasksData();

  const { mutateAsync: deleteTaskMutate } = useDeleteTask();
  const { mutateAsync: bulkDeleteTasksMutate } = useBulkDeleteTasks();
  const { mutate: updateTaskMutate } = useUpdateTask();

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      setDeleting(true);
      await deleteTaskMutate(taskToDelete.id);
      setSelectedTaskIds((prev) => prev.filter((id) => id !== taskToDelete.id));
      setTaskToDelete(null);
      refetch();
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Failed to delete task.");
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
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Failed to delete selected tasks.");
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

  if (isError) {
    return (
      <CRMPageContainer twoStageScroll>
        <PageErrorState
          title="Failed to load tasks"
          description="An error occurred while loading your tasks list. Please check your connection and try again."
          onRetry={() => { refetch(); }}
        />
      </CRMPageContainer>
    );
  }

  return (
    <CRMPageContainer twoStageScroll>
      {/* 1. Page Header */}
      <CRMPageHeader
        title="Tasks"
        description="Organize your workflow, track productivity, and collaborate with your team."
        icon={CheckSquare}
        secondaryActions={[
          {
            label: "Customize",
            icon: Settings,
            onClick: () => setIsCustomizeOpen(true),
            variant: "outline",
          },
        ]}
        primaryAction={{
          label: "Create Task",
          icon: Plus,
          onClick: () => setIsAddModalOpen(true),
        }}
      />

      {/* 2. Main Card Container */}
      <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Toolbar — search, filters, bulk actions, toolbar actions */}
        <CRMToolbar
          searchQuery={search}
          setSearchQuery={setSearch}
          placeholder="Search tasks..."
          selectedCount={selectedTaskIds.length}
          bulkActions={
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteModalOpen(true)}
              className="h-7 text-xs font-semibold px-2.5 gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>Delete ({selectedTaskIds.length})</span>
            </Button>
          }
          filters={
            <div className="flex items-center gap-2">
              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger
                  aria-label="Filter by status"
                  className="h-9 w-[140px] text-xs font-semibold bg-background"
                >
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* Priority Filter */}
              <Select
                value={priorityFilter}
                onValueChange={(val) => {
                  setPriorityFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger
                  aria-label="Filter by priority"
                  className="h-9 w-[150px] text-xs font-semibold bg-background"
                >
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Priorities</SelectItem>
                  <SelectItem value="HIGH">High Priority</SelectItem>
                  <SelectItem value="MEDIUM">Medium Priority</SelectItem>
                  <SelectItem value="LOW">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
          actions={
            <div className="flex items-center gap-2">
              {/* Reset Filters — conditionally shown */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-9 gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Reset Filters</span>
                </Button>
              )}

              {/* Export Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={exportCSV}
                className="h-9 gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Export</span>
              </Button>
            </div>
          }
        />

        {/* Table Content — TasksDataTable (canonical CRM table system) */}
        <TasksDataTable
          paginatedTasks={paginatedTasks}
          isInitialLoading={isInitialLoading}
          selectedTaskIds={selectedTaskIds}
          setSelectedTaskIds={setSelectedTaskIds}
          sortConfig={sortConfig}
          setSort={setSort}
          hasActiveFilters={hasActiveFilters}
          handleClearFilters={handleClearFilters}
          isTaskOverdue={isTaskOverdue}
          formatDate={formatDate}
          getTaskColor={getTaskColor}
          togglingTaskId={togglingTaskId}
          onSelectTask={setSelectedTask}
          onEditTask={(task) => setTaskToEdit(task)}
          onToggleComplete={handleToggleComplete}
          onScheduleMeeting={handleScheduleMeeting}
          onDeleteTask={(task) => setTaskToDelete(task)}
          onCreateTask={() => setIsAddModalOpen(true)}
        />

        {/* Pagination */}
        <CRMPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredTasks.length}
          rowsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(rows) => {
            setRowsPerPage(rows);
            setCurrentPage(1);
          }}
          itemName="Tasks"
          pageSizeOptions={[10, 20, 50, 100]}
        />
      </div>

      {/* Delete Confirmation — single task */}
      <CRMDeleteDialog
        isOpen={!!taskToDelete}
        onOpenChange={(open) => !open && setTaskToDelete(null)}
        mode="single"
        title="Delete Task?"
        itemName="Task"
        description={`Are you sure you want to delete "${taskToDelete?.title}"?`}
        warningText="This action will permanently delete the task and its history. This action cannot be undone."
        confirmLabel="Delete Task"
        onConfirm={handleDeleteTask}
        isDeleting={deleting}
      />

      {/* Delete Confirmation — bulk tasks */}
      <CRMDeleteDialog
        isOpen={bulkDeleteModalOpen}
        onOpenChange={setBulkDeleteModalOpen}
        mode="bulk"
        title="Delete Selected Tasks?"
        itemName="Task"
        selectedCount={selectedTaskIds.length}
        description={`You are about to delete ${selectedTaskIds.length} selected task${selectedTaskIds.length !== 1 ? "s" : ""}.`}
        warningText="This action cannot be undone. All selected tasks will be permanently removed."
        confirmLabel={`Delete ${selectedTaskIds.length} Task${selectedTaskIds.length !== 1 ? "s" : ""}`}
        onConfirm={handleBulkDelete}
        isDeleting={bulkDeleting}
      />

      {/* Task Modal (Create & Edit) */}
      <TaskModal
        task={taskToEdit}
        isOpen={isAddModalOpen || !!taskToEdit}
        onClose={() => {
          setIsAddModalOpen(false);
          setTaskToEdit(null);
        }}
        onSuccess={() => {
          setIsAddModalOpen(false);
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
