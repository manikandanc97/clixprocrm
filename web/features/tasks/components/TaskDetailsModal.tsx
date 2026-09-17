"use client";

import type { ComponentType } from "react";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { TaskType, TaskHistoryLog, TaskTimelineEvent } from "@/shared/types/task";
import { EmployeeType } from "@/shared/types/employee";
import { Badge } from "@/shared/ui/badge";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { getPriorityVariant, getTaskStatusVariant } from "./TasksDataTable";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  Tag,
  X,
  UserPlus,
  UserMinus,
  UserCog,
  MessageSquare,
  FileText,
  HelpCircle,
  ShieldAlert,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Progress } from "@/shared/ui/progress";
import {
  ActivityTimeline,
  ActivityComposer,
  EntityHeader,
  CRMAlert,
  TimelineItem,
} from "@/shared/components/crm";
import { cn } from "@/shared/lib/utils";
import { Textarea } from "@/shared/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  useUpdateTask,
  useEmployees,
  useTaskHistory,
  useAddTaskTimelineEvent,
  useUpdateTaskProgress,
  useCompleteTask,
  useResolveTaskBlocker,
} from "@/shared/hooks/use-crm";
import { useAuth } from "@/features/auth/components/auth-provider";
import { PERMISSIONS } from "@/shared/lib/auth/rbac/permissions";

interface TaskDetailsModalProps {
  task: TaskType | null;
  isOpen: boolean;
  onClose: () => void;
  onScheduleMeeting?: (task: TaskType) => void;
}

const TaskDetailsModal = ({
  task,
  isOpen,
  onClose,
  onScheduleMeeting,
}: TaskDetailsModalProps) => {
  const { mutate: updateTask } = useUpdateTask();
  const { data: employeesData } = useEmployees();
  const { data: historyData } = useTaskHistory(task?.id || "");
  const { mutate: addTaskTimelineEvent } = useAddTaskTimelineEvent();
  const { mutate: updateTaskProgress } = useUpdateTaskProgress();
  const { mutate: completeTask } = useCompleteTask();
  const { mutate: resolveBlocker } = useResolveTaskBlocker();

  const { hasPermission, user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionNote, setCompletionNote] = useState("");
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);

  if (!task) return null;

  const canEditTask =
    hasPermission(PERMISSIONS.TASKS_UPDATE) ||
    (hasPermission(PERMISSIONS.TASKS_UPDATE_ASSIGNED) && task.assignedToId === user?.id) ||
    (hasPermission(PERMISSIONS.TASKS_UPDATE_ASSIGNED) && task.createdById === user?.id);
  const canReassign = hasPermission(PERMISSIONS.TASKS_UPDATE);

  const isCompleted = task?.status === "COMPLETED";

  const activityItems: TimelineItem[] = [];

  if (historyData && historyData.length > 0) {
    (historyData as TaskHistoryLog[]).forEach((log: TaskHistoryLog) => {
      if (log.action === "TASK_CREATED") {
        activityItems.push({
          id: log.id,
          title: "Task created",
          description: `Created by ${log.actor}.`,
          time: new Date(log.createdAt).toLocaleString(),
          type: "TASK",
          icon: Sparkles,
        });
      } else if (log.action === "TASK_ASSIGNED") {
        activityItems.push({
          id: log.id,
          title: "Task assigned",
          description: `Assigned to ${log.assignedTo || "Unknown"} by ${log.actor}.`,
          time: new Date(log.createdAt).toLocaleString(),
          type: "ASSIGNMENT",
          icon: UserPlus,
        });
      } else if (log.action === "TASK_REASSIGNED") {
        activityItems.push({
          id: log.id,
          title: "Task reassigned",
          description: `Reassigned from ${log.previousAssignee || "Unknown"} to ${log.assignedTo || "Unknown"} by ${log.actor}.`,
          time: new Date(log.createdAt).toLocaleString(),
          type: "ASSIGNMENT",
          icon: UserCog,
        });
      } else if (log.action === "TASK_UNASSIGNED") {
        activityItems.push({
          id: log.id,
          title: "Task unassigned",
          description: `Unassigned from ${log.previousAssignee || "Unknown"} by ${log.actor}.`,
          time: new Date(log.createdAt).toLocaleString(),
          type: "ASSIGNMENT",
          icon: UserMinus,
        });
      }
    });
  } else if (task.createdAt) {
    activityItems.push({
      id: `${task.id}-created`,
      title: "Task created",
      description: "Task was created.",
      time: new Date(task.createdAt).toLocaleString(),
      type: "TASK",
      icon: Sparkles,
    });
  }

  if (task.updatedAt && task.updatedAt !== task.createdAt) {
    activityItems.push({
      id: `${task.id}-updated`,
      title: "Task updated",
      description: "Task was recently modified.",
      time: new Date(task.updatedAt).toLocaleString(),
      type: "STATUS_CHANGE",
      icon: Clock,
    });
  }

  // Include timelineEvents from Task
  if (task.timelineEvents && task.timelineEvents.length > 0) {
    task.timelineEvents.forEach((event: TaskTimelineEvent) => {
      let icon = MessageSquare;
      let title = "Update";
      let eventType: TimelineItem["type"] = "NOTE";

      if (event.action === "NOTE") {
        icon = FileText;
        title = "Note";
        eventType = "NOTE";
      } else if (event.action === "QUESTION") {
        icon = HelpCircle;
        title = "Question";
        eventType = "CUSTOM";
      } else if (event.action === "BLOCKER_REPORTED") {
        icon = ShieldAlert;
        title = "Blocker Reported";
        eventType = "BLOCKER_REPORTED";
      } else if (event.action === "BLOCKER_RESOLVED") {
        icon = CheckCircle2;
        title = "Blocker Resolved";
        eventType = "BLOCKER_RESOLVED";
      } else if (event.action === "PROGRESS_UPDATED") {
        icon = CheckCircle2;
        title = "Progress Updated";
        eventType = "PROGRESS_UPDATED";
      } else if (event.action === "TASK_COMPLETED") {
        icon = Sparkles;
        title = "Completed";
        eventType = "TASK_COMPLETED";
      }

      activityItems.push({
        id: event.id,
        title,
        description: event.description,
        time: new Date(event.createdAt).toLocaleString(),
        type: eventType,
        icon,
      });
    });
  }

  // Sort activity items by time descending (newest first)
  activityItems.sort((a, b) => {
    if (a.time === "Now") return -1;
    if (b.time === "Now") return 1;
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="flex flex-col gap-0 overflow-hidden bg-background p-0 sm:max-w-2xl max-h-[90vh] shadow-elevated border-border"
      >
        <DialogTitle className="sr-only">{task.title}</DialogTitle>
        <DialogDescription className="sr-only">
          Task details and collaboration timeline for {task.title}
        </DialogDescription>

        {/* Canonical Entity Header */}
        <EntityHeader
          title={task.title}
          subtitle={`Managed by ${task.assignedTo?.name || "Unassigned"} • Last updated ${
            task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : "recently"
          }`}
          avatarInitials={task.title ? task.title.slice(0, 2).toUpperCase() : "TK"}
          status={
            <StatusBadge
              status={task.status || "PENDING"}
              variant={getTaskStatusVariant(task.status)}
            />
          }
          badges={[
            <Badge
              key="category"
              variant="outline"
              className="border-border/70 bg-background/60 text-[10px] font-semibold uppercase tracking-wide"
            >
              {task.category ?? "General"}
            </Badge>,
            task.isUrgent ? (
              <Badge
                key="urgent"
                variant="destructive"
                className="text-[10px] font-semibold uppercase tracking-wide"
              >
                Urgent
              </Badge>
            ) : null,
          ].filter(Boolean)}
          metadata={[
            {
              label: "Priority",
              value: (
                <StatusBadge
                  status={task.priority || "MEDIUM"}
                  variant={getPriorityVariant(task.priority)}
                />
              ),
              icon: Clock,
            },
            {
              label: "Due Date",
              value: task.dueDate || "No due date",
              icon: Calendar,
            },
            {
              label: "Owner",
              value: (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={!canReassign}>
                    <button
                      type="button"
                      className={cn(
                        "inline-flex items-center gap-1.5 font-semibold text-foreground underline-offset-2 hover:underline focus-visible:outline-none",
                        canReassign ? "cursor-pointer" : "cursor-default"
                      )}
                    >
                      <span>{task.assignedTo?.name || "Unassigned"}</span>
                      {isAssigning && (
                        <Loader2 className="size-3 animate-spin text-muted-foreground" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  {canReassign && (
                    <DropdownMenuContent align="start" className="w-48 p-1">
                      <DropdownMenuItem
                        onClick={() => {
                          setIsAssigning(true);
                          updateTask(
                            { id: task.id, data: { assignedToId: null } },
                            { onSettled: () => setIsAssigning(false) }
                          );
                        }}
                        className="text-xs text-muted-foreground"
                      >
                        Unassign
                      </DropdownMenuItem>
                      {employeesData?.employees?.map((emp: EmployeeType) => (
                        <DropdownMenuItem
                          key={emp.id}
                          onClick={() => {
                            setIsAssigning(true);
                            updateTask(
                              { id: task.id, data: { assignedToId: emp.id } },
                              { onSettled: () => setIsAssigning(false) }
                            );
                          }}
                          className="text-xs"
                        >
                          {emp.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  )}
                </DropdownMenu>
              ),
            },
          ]}
          primaryAction={
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
              aria-label="Close task details"
            >
              <X className="size-4" />
            </Button>
          }
        />

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-5 px-6 py-5 pb-20">
              {/* Progress & Stats Card */}
              <section className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <StatTile
                    label="Progress"
                    value={`${task.progress}%`}
                    icon={CheckCircle2}
                  />
                  <StatTile
                    label="Attachments"
                    value={String(task.attachmentsCount ?? 0)}
                    icon={Tag}
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>Completion</span>
                    <span className="font-semibold text-foreground flex items-center gap-3">
                      {task.progress}%
                      {!isCompleted && canEditTask && (
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={task.progress}
                          onChange={(e) =>
                            updateTaskProgress({
                              id: task.id,
                              progress: parseInt(e.target.value, 10),
                            })
                          }
                          aria-label="Task progress percentage"
                          className="w-24 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      )}
                    </span>
                  </div>
                  <Progress
                    value={task.progress}
                    className="h-2 bg-muted"
                    indicatorClassName={isCompleted ? "bg-success" : "bg-primary"}
                  />
                </div>
              </section>

              {/* Description & AI Summary Card */}
              <section className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Description
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-foreground/90">
                  {task.description || "No description provided."}
                </p>

                {task.aiSummary && (
                  <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
                      AI Summary
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-foreground/80">
                      {task.aiSummary}
                    </p>
                  </div>
                )}

                {(task.tags?.length ?? 0) > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {task.tags?.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="border-border/70 bg-muted/60 text-[10px] font-medium"
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </section>

              {/* Collaboration Workspace Card */}
              <section className="rounded-xl border border-border/70 bg-card p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Activity & Collaboration
                  </h3>
                </div>

                {!isCompleted && canEditTask && (
                  <ActivityComposer
                    allowedTypes={["UPDATE", "NOTE", "QUESTION", "BLOCKER"]}
                    onSubmit={async ({ type, content }) => {
                      setIsSubmittingEvent(true);
                      const action =
                        type === "BLOCKER" ? "BLOCKER_REPORTED" : type;
                      addTaskTimelineEvent(
                        {
                          id: task.id,
                          data: { action, description: content },
                        },
                        {
                          onSettled: () => setIsSubmittingEvent(false),
                        }
                      );
                    }}
                    isSubmitting={isSubmittingEvent}
                  />
                )}

                <ActivityTimeline items={activityItems} showFilters />
              </section>

              {/* Blocker Banner */}
              {task.status === "BLOCKED" && canEditTask && (
                <CRMAlert
                  variant="destructive"
                  title="Task is blocked"
                  description="Work cannot continue until the blocker is resolved."
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={() => resolveBlocker(task.id)}
                    >
                      Resolve Blocker
                    </Button>
                  }
                />
              )}

              {/* Overdue Banner */}
              {task.isOverdue && task.status !== "BLOCKED" && (
                <CRMAlert
                  variant="warning"
                  title="Task is overdue"
                  description="Due date has passed. Please update the schedule or complete the task."
                />
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Modal Footer Actions */}
        <footer className="shrink-0 border-t border-border/60 bg-card px-4 py-3 sm:px-6 sm:py-3.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onScheduleMeeting?.(task)}
                className="h-9 px-3.5 text-xs font-semibold gap-1.5"
              >
                <Calendar className="size-3.5" />
                <span>Schedule Meeting</span>
              </Button>

              <Button
                type="button"
                variant={isCompleted ? "outline" : "default"}
                size="sm"
                className="h-9 px-4 text-xs font-semibold gap-1.5"
                disabled={isUpdating || !canEditTask}
                onClick={() => {
                  if (isCompleted) {
                    setIsUpdating(true);
                    updateTask(
                      { id: task.id, data: { status: "PENDING" } },
                      { onSettled: () => setIsUpdating(false) }
                    );
                  } else {
                    setShowCompletionDialog(true);
                  }
                }}
              >
                {isUpdating ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : isCompleted ? (
                  <RotateCcw className="size-3.5" />
                ) : (
                  <CheckCircle2 className="size-3.5" />
                )}
                <span>{isCompleted ? "Reopen Task" : "Mark Complete"}</span>
              </Button>
            </div>
          </div>
        </footer>

        {/* Completion Dialog Overlay */}
        {showCompletionDialog && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-xl border border-border/80 bg-card p-5 shadow-elevated relative animate-in fade-in zoom-in-95 duration-200 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Complete Task</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add an optional note about what was accomplished.
                </p>
              </div>
              <Textarea
                placeholder="What was done? (Optional)"
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                className="min-h-[80px] text-xs resize-none"
              />
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCompletionDialog(false)}
                  className="h-8 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isCompleting}
                  onClick={() => {
                    setIsCompleting(true);
                    completeTask(
                      { id: task.id, note: completionNote },
                      {
                        onSettled: () => setIsCompleting(false),
                        onSuccess: () => {
                          setShowCompletionDialog(false);
                          setCompletionNote("");
                        },
                      }
                    );
                  }}
                  className="h-8 text-xs font-semibold gap-1.5"
                >
                  {isCompleting && (
                    <Loader2 className="size-3.5 animate-spin" />
                  )}
                  Confirm Completion
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface StatTileProps {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}

const StatTile = ({ label, value, icon: Icon }: StatTileProps) => (
  <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
    <div className="mb-1.5 flex items-center justify-between">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <Icon className="size-3.5 text-muted-foreground" />
    </div>
    <p className="text-xs sm:text-sm font-bold text-foreground">{value}</p>
  </div>
);

export default TaskDetailsModal;
