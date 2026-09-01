"use client";

import { useState, useMemo, useEffect } from "react";
import {
  CheckSquare,
  Plus,
  Target,
  AlertCircle,
  List,
  Kanban,
  Calendar as CalendarIcon,
  GanttChart,
  CheckCircle2,
  Settings,
} from "lucide-react";

import { Grid } from "lucide-react";

import dynamic from "next/dynamic";
const TasksTable = dynamic(() => import("@/features/tasks/components/TasksTable"));
const TasksGrid = dynamic(() => import("@/features/tasks/components/TasksGrid").then(mod => ({ default: mod.TasksGrid })));
const KanbanView = dynamic(() => import("@/features/tasks/components/KanbanView").then(mod => ({ default: mod.KanbanView })));
const CalendarView = dynamic(() => import("@/features/tasks/components/CalendarView").then(mod => ({ default: mod.CalendarView })));
const TimelineView = dynamic(() => import("@/features/tasks/components/TimelineView").then(mod => ({ default: mod.TimelineView })));
const TaskDetailsModal = dynamic(() => import("@/features/tasks/components/TaskDetailsModal"));
import { EmptyState } from "@/shared/components/EmptyState";
import { PageErrorState } from "@/shared/components/page-states";
import { TasksSkeleton } from "@/features/tasks/components/TasksSkeleton";
import { useTasks } from "@/shared/hooks/use-crm";
import { useViewMode } from "@/shared/hooks/useViewMode";
import { TaskType } from "@/shared/types/task";
import { Button } from "@/shared/ui/button";
import {
  CRMPageHeader,
  CRMMetricCard,
  CRMToolbar,
  CRMPageContainer,
  CRMMetricsGrid,
} from "@/shared/components/crm";
import { motion, AnimatePresence } from "framer-motion";
import { useCRMStore } from "@/shared/store/useCRMStore";
import { toast } from "sonner";
import { FormModal } from "@/shared/components/form-modal";
import { MeetingForm } from "@/features/forms/MeetingForm";
import { CreateTaskModal } from "@/features/tasks/components/CreateTaskModal";
import { EditTaskModal } from "@/features/tasks/components/EditTaskModal";
import { useSearchParams } from "next/navigation";
import { TaskContextualSettings } from "@/features/tasks/components/TaskContextualSettings";

const VIEW_MODES = [
  { id: "list", icon: List, label: "List" },
  { id: "grid", icon: Grid, label: "Grid" },
  { id: "kanban", icon: Kanban, label: "Board" },
  { id: "calendar", icon: CalendarIcon, label: "Calendar" },
  { id: "timeline", icon: GanttChart, label: "Timeline" },
] as const;

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "PENDING", label: "Pending" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "BLOCKED", label: "Blocked" },
  { id: "COMPLETED", label: "Completed" },
  { id: "OVERDUE", label: "Overdue" },
  { id: "CANCELLED", label: "Cancelled" },
];

const TasksPage = () => {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useViewMode("tasks", "list");
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [meetingTask, setMeetingTask] = useState<TaskType | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<TaskType | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(searchParams.get("new") === "true");
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [customizeDefaultSection, setCustomizeDefaultSection] = useState<string | undefined>();

  useEffect(() => {
    const cust = searchParams.get("customize");
    if (cust) {
      if (cust !== "true") {
        setCustomizeDefaultSection(cust);
      }
      setIsCustomizeOpen(true);
    }
  }, [searchParams]);

  const { tasks, setTasks } = useCRMStore();
  const safeTasks = useMemo(() => (Array.isArray(tasks) ? tasks : []), [tasks]);

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (searchQuery) params.search = searchQuery;
    if (statusFilter !== "all") params.status = statusFilter;
    return params;
  }, [searchQuery, statusFilter]);

  const { data, isLoading: loading, error, refetch } = useTasks(queryParams);

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (data?.tasks) {
      setTasks(data.tasks);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTask((prev) => {
        if (!prev) return null;
        return data.tasks.find((t: TaskType) => t.id === prev.id) || prev;
      });
    }
  }, [data?.tasks, setTasks]);

  const handleScheduleMeeting = (task: TaskType) => {
    if (!task.relatedLead && !task.relatedCustomer && !task.relatedQuotation) {
      toast.error("This task is not linked to a Lead, Customer, or Deal. Link a CRM record before scheduling a meeting.");
      return;
    }
    setMeetingTask(task);
  };

  const filteredTasks = useMemo(() => {
    return safeTasks.filter((task: TaskType) => {
      const normalizedQuery = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        task.title.toLowerCase().includes(normalizedQuery) ||
        (task.description && task.description.toLowerCase().includes(normalizedQuery)) ||
        (task.tags && task.tags.some((t) => t.toLowerCase().includes(normalizedQuery))) ||
        (task.assignedTo?.name && task.assignedTo.name.toLowerCase().includes(normalizedQuery));

      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [safeTasks, searchQuery, statusFilter]);

  const stats = data?.dashboardStats || {
    total: safeTasks.length,
    pending: safeTasks.filter((t) => t.status === "PENDING").length,
    inProgress: safeTasks.filter((t) => t.status === "IN_PROGRESS").length,
    completed: safeTasks.filter((t) => t.status === "COMPLETED").length,
    overdue: safeTasks.filter((t) => t.isOverdue || t.status === "OVERDUE").length,
    completionRate: safeTasks.length > 0 ? Math.round((safeTasks.filter((t) => t.status === "COMPLETED").length / safeTasks.length) * 100) : 0,
  };

  const handleNewTask = () => {
    setIsAddModalOpen(true);
  };
  if (loading && safeTasks.length === 0) {
    return <TasksSkeleton viewMode={viewMode} />;
  }

  if (error && safeTasks.length === 0) {
    return (
      <PageErrorState title="Tasks unavailable" message={(error as Error).message || "An error occurred"} onRetry={() => { refetch(); }} />
    );
  }

  return (
    <CRMPageContainer>
      {/* Page Header */}
      <CRMPageHeader
        title="Tasks"
        subtitle="Organize your workflow, track productivity, and collaborate with your team."
        icon={CheckSquare}
        badge="Productivity"
        actions={[
          {
            label: "Customize",
            icon: Settings,
            onClick: () => setIsCustomizeOpen(true),
            variant: "outline",
          },
          { label: "New Task", icon: Plus, onClick: handleNewTask, variant: "default" },
        ]}
      />

      {safeTasks.length === 0 ? (
        <div className="flex-1 min-h-0 flex flex-col">
          <EmptyState
            module="tasks"
            action={{
              label: "Create Task",
              onClick: handleNewTask,
              icon: Plus,
            }}
          />
        </div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="shrink-0">
            <CRMMetricsGrid>
              <CRMMetricCard
                title="Total Tasks"
                value={stats.total}
                change={`${stats.completionRate}% Done`}
                trend="up"
                icon={CheckSquare}
                color="blue"
                delay={0.05}
              />
              <CRMMetricCard
                title="Completed"
                value={stats.completed}
                change={`${stats.completionRate}%`}
                trend="up"
                icon={CheckCircle2}
                color="emerald"
                delay={0.1}
              />
              <CRMMetricCard
                title="In Progress"
                value={stats.inProgress}
                change={`${stats.pending} Pending`}
                trend="up"
                icon={Target}
                color="orange"
                delay={0.15}
              />
              <CRMMetricCard
                title="Overdue"
                value={stats.overdue}
                change={stats.overdue > 0 ? "Requires Action" : "Clean"}
                trend={stats.overdue > 0 ? "down" : "up"}
                icon={AlertCircle}
                color="pink"
                delay={0.2}
              />
            </CRMMetricsGrid>
          </div>

          <div className="flex-1 flex flex-col gap-3.5 sm:gap-4 min-h-0">
            {/* Toolbar */}
            <CRMToolbar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              viewMode={viewMode}
              setViewMode={setViewMode}
              viewOptions={VIEW_MODES}
              placeholder="Search tasks, assignees, tags..."
            >
              {/* Status filters */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide max-w-full">
                {STATUS_FILTERS.map((s) => {
                  const isActive = statusFilter === s.id;
                  return (
                    <Button
                      key={s.id}
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setStatusFilter(s.id)}
                      className="h-9 px-3 text-xs font-semibold"
                    >
                      {s.label}
                    </Button>
                  );
                })}
              </div>
            </CRMToolbar>

            {/* Main content */}
            <div className="flex-1 min-h-0 flex flex-col">
              <AnimatePresence mode="wait">
                {filteredTasks.length > 0 ? (
                  <motion.div
                    key={viewMode}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 flex flex-col min-h-0"
                  >
                    {(viewMode === "list" || viewMode === "table") && (
                      <TasksTable tasks={filteredTasks} onTaskClick={setSelectedTask} onScheduleMeeting={handleScheduleMeeting} onEditTask={setTaskToEdit} />
                    )}
                    {(viewMode === "grid" || viewMode === "cards") && (
                      <TasksGrid tasks={filteredTasks} onTaskClick={setSelectedTask} />
                    )}
                    {viewMode === "kanban" && (
                      <KanbanView tasks={filteredTasks} onTaskClick={setSelectedTask} onAddTask={() => setIsAddModalOpen(true)} onScheduleMeeting={handleScheduleMeeting} onEditTask={setTaskToEdit} />
                    )}
                    {viewMode === "calendar" && (
                      <CalendarView tasks={filteredTasks} onTaskClick={setSelectedTask} />
                    )}
                    {viewMode === "timeline" && (
                      <TimelineView tasks={filteredTasks} onTaskClick={setSelectedTask} />
                    )}
                  </motion.div>
                ) : (
                  <EmptyState
                    icon={CheckSquare}
                    title="No tasks found"
                    description="No tasks match the current search or status filter."
                    action={{
                      label: "Clear Filters",
                      onClick: () => {
                        setSearchQuery("");
                        setStatusFilter("all");
                      },
                      variant: "outline",
                    }}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </>
      )}

      <TaskDetailsModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onScheduleMeeting={handleScheduleMeeting}
      />
      <CreateTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => refetch()}
      />
      <EditTaskModal
        task={taskToEdit}
        isOpen={!!taskToEdit}
        onClose={() => setTaskToEdit(null)}
        onSuccess={() => refetch()}
      />
      <FormModal
        isOpen={!!meetingTask}
        onOpenChange={(open) => !open && setMeetingTask(null)}
        title="Meeting"
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
};

export default TasksPage;
