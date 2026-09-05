"use client";

import type { ComponentType } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { TaskType, TaskHistoryLog, TaskTimelineEvent } from "@/shared/types/task";
import { EmployeeType } from "@/shared/types/employee";
import { Badge } from "@/shared/ui/badge";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import {
  AlertCircle,
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
} from "lucide-react";
import { useState } from "react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Progress } from "@/shared/ui/progress";
import { ActivityTimeline } from "@/shared/components/crm";
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
  useResolveTaskBlocker
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
  const [composerType, setComposerType] = useState<"UPDATE" | "NOTE" | "QUESTION" | "BLOCKER">("UPDATE");
  const [composerContent, setComposerContent] = useState("");
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionNote, setCompletionNote] = useState("");
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);

  if (!task) return null;

  const canEditTask = hasPermission(PERMISSIONS.TASKS_UPDATE) || 
                      (hasPermission(PERMISSIONS.TASKS_UPDATE_ASSIGNED) && task.assignedToId === user?.id) ||
                      (hasPermission(PERMISSIONS.TASKS_UPDATE_ASSIGNED) && task.createdById === user?.id);
  const canReassign = hasPermission(PERMISSIONS.TASKS_UPDATE);

  const isCompleted = task?.status === "COMPLETED";
  const statusTone = isCompleted
    ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
    : task.status === "IN_PROGRESS"
      ? "text-blue-600 bg-blue-500/10 border-blue-500/20"
      : "text-amber-600 bg-amber-500/10 border-amber-500/20";

  const activityItems = [];
  
  if (historyData && historyData.length > 0) {
    (historyData as TaskHistoryLog[]).forEach((log: TaskHistoryLog) => {
      if (log.action === "TASK_CREATED") {
        activityItems.push({
          id: log.id,
          title: "Task created",
          description: `Created by ${log.actor}.`,
          time: new Date(log.createdAt).toLocaleString(),
          icon: Sparkles,
          iconBg: "bg-primary/10",
          iconColor: "text-primary",
        });
      } else if (log.action === "TASK_ASSIGNED") {
        activityItems.push({
          id: log.id,
          title: "Task assigned",
          description: `Assigned to ${log.assignedTo || 'Unknown'} by ${log.actor}.`,
          time: new Date(log.createdAt).toLocaleString(),
          icon: UserPlus,
          iconBg: "bg-blue-500/10",
          iconColor: "text-blue-600",
        });
      } else if (log.action === "TASK_REASSIGNED") {
        activityItems.push({
          id: log.id,
          title: "Task reassigned",
          description: `Reassigned from ${log.previousAssignee || 'Unknown'} to ${log.assignedTo || 'Unknown'} by ${log.actor}.`,
          time: new Date(log.createdAt).toLocaleString(),
          icon: UserCog,
          iconBg: "bg-amber-500/10",
          iconColor: "text-amber-600",
        });
      } else if (log.action === "TASK_UNASSIGNED") {
        activityItems.push({
          id: log.id,
          title: "Task unassigned",
          description: `Unassigned from ${log.previousAssignee || 'Unknown'} by ${log.actor}.`,
          time: new Date(log.createdAt).toLocaleString(),
          icon: UserMinus,
          iconBg: "bg-destructive/10",
          iconColor: "text-destructive",
        });
      }
    });
  } else if (task.createdAt) {
    activityItems.push({
      id: `${task.id}-created`,
      title: "Task created",
      description: `Task was created.`,
      time: new Date(task.createdAt).toLocaleString(),
      icon: Sparkles,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    });
  }

  if (task.updatedAt && task.updatedAt !== task.createdAt) {
    activityItems.push({
      id: `${task.id}-updated`,
      title: "Task updated",
      description: `Task was recently modified.`,
      time: new Date(task.updatedAt).toLocaleString(),
      icon: Clock,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-600",
    });
  }

  // Include new timelineEvents from Task
  if (task.timelineEvents && task.timelineEvents.length > 0) {
    task.timelineEvents.forEach((event: TaskTimelineEvent) => {
      let icon = MessageSquare;
      let title = "Update";
      let iconColor = "text-primary";
      let iconBg = "bg-primary/10";

      if (event.action === "NOTE") {
        icon = FileText;
        title = "Note";
        iconColor = "text-muted-foreground";
        iconBg = "bg-muted";
      } else if (event.action === "QUESTION") {
        icon = HelpCircle;
        title = "Question";
        iconColor = "text-amber-600";
        iconBg = "bg-amber-500/10";
      } else if (event.action === "BLOCKER_REPORTED") {
        icon = ShieldAlert;
        title = "Blocker Reported";
        iconColor = "text-destructive";
        iconBg = "bg-destructive/10";
      } else if (event.action === "BLOCKER_RESOLVED") {
        icon = CheckCircle2;
        title = "Blocker Resolved";
        iconColor = "text-emerald-600";
        iconBg = "bg-emerald-500/10";
      } else if (event.action === "PROGRESS_UPDATED") {
        icon = CheckCircle2;
        title = "Progress Updated";
        iconColor = "text-blue-600";
        iconBg = "bg-blue-500/10";
      } else if (event.action === "TASK_COMPLETED") {
        icon = Sparkles;
        title = "Completed";
        iconColor = "text-emerald-600";
        iconBg = "bg-emerald-500/10";
      }

      activityItems.push({
        id: event.id,
        title,
        description: event.description,
        time: new Date(event.createdAt).toLocaleString(),
        icon,
        iconBg,
        iconColor,
      });
    });
  }

  // Sort activity items by time descending (newest first)
  activityItems.sort((a, b) => {
    if (a.time === "Now") return -1;
    if (b.time === "Now") return 1;
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  });

  // Removed fake "Next milestone" and fallback "Task completed" events as per requirements
  // The backend now generates actual TASK_COMPLETED timeline events.

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="flex flex-col gap-0 overflow-hidden bg-background p-0 sm:max-w-2xl max-h-[90vh]"
      >
        <header className="shrink-0 border-b border-border/60 bg-card/40 px-6 py-5 backdrop-blur-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-border/70 bg-background/60 text-[10px] font-semibold uppercase tracking-wide"
              >
                {task.category ?? "General"}
              </Badge>
              <Badge
                className={cn(
                  "border text-[10px] font-semibold uppercase tracking-wide",
                  statusTone,
                )}
              >
                {task.status}
              </Badge>
              {task.isUrgent && (
                <Badge variant="destructive" className="text-[10px] font-semibold uppercase tracking-wide">
                  Urgent
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
              aria-label="Close task details"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <DialogTitle className="text-2xl font-bold leading-tight text-foreground">
            {task.title}
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-muted-foreground">
            Managed by {task.assignedTo?.name || "Unassigned"} • Last updated{" "}
            {task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : "recently"}
          </DialogDescription>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={!canReassign}>
                <div className={cn(
                  "flex items-center gap-2 rounded-lg border border-border/60 bg-background/80 px-3 py-2 transition-colors",
                  canReassign ? "cursor-pointer hover:bg-muted/50" : "opacity-80"
                )}>
                  <Avatar className="h-7 w-7 border border-border/60">
                    <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary uppercase">
                      {task.assignedTo?.name ? task.assignedTo.name.charAt(0) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col leading-tight">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                      {task.assignedTo?.name || "Unassigned"}
                      {isAssigning && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Owner
                    </span>
                  </div>
                </div>
              </DropdownMenuTrigger>
              {canReassign && (
                <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem 
                  onClick={() => {
                    setIsAssigning(true);
                    updateTask(
                      { id: task.id, data: { assignedToId: null } },
                      { onSettled: () => setIsAssigning(false) }
                    );
                  }}
                  className="text-muted-foreground"
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
                  >
                    {emp.name}
                  </DropdownMenuItem>
                ))}
                </DropdownMenuContent>
              )}
            </DropdownMenu>
            <div className="rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-xs font-medium text-muted-foreground">
              Priority:{" "}
              <span className="font-semibold text-foreground">
                {task.priority}
              </span>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-xs font-medium text-muted-foreground">
              Due:{" "}
              <span className="font-semibold text-foreground">
                {task.dueDate}
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-6 px-6 py-6 pb-24">
              <section className="rounded-xl border border-border/60 bg-card p-4">
                <div className="mb-4 grid grid-cols-2 gap-3">
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

                <div className="space-y-2">
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
                          onChange={(e) => updateTaskProgress({ id: task.id, progress: parseInt(e.target.value, 10) })}
                          className="w-24 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      )}
                    </span>
                  </div>
                  <Progress
                    value={task.progress}
                    className="h-2 bg-muted"
                    indicatorClassName={
                      isCompleted ? "bg-emerald-500" : "bg-primary"
                    }
                  />
                </div>
              </section>

              <section className="rounded-xl border border-border/60 bg-card p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Description
                </h3>
                <p className="text-sm leading-relaxed text-foreground/85">
                  {task.description}
                </p>
                {task.aiSummary && (
                  <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                      AI Summary
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-foreground/80">
                      {task.aiSummary}
                    </p>
                  </div>
                )}
                {(task.tags?.length ?? 0) > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {task.tags?.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="border-border/70 bg-background text-[10px] font-medium"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-border/60 bg-card p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Collaboration Workspace
                  </h3>
                </div>

                {!isCompleted && canEditTask && (
                  <div className="mb-6 rounded-lg border border-border/50 bg-background/50 p-3">
                    <div className="mb-3 flex items-center gap-2">
                      <Button
                        variant={composerType === "UPDATE" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 px-3 text-xs"
                        onClick={() => setComposerType("UPDATE")}
                      >
                        <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                        Update
                      </Button>
                      <Button
                        variant={composerType === "NOTE" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 px-3 text-xs"
                        onClick={() => setComposerType("NOTE")}
                      >
                        <FileText className="mr-1.5 h-3.5 w-3.5" />
                        Note
                      </Button>
                      <Button
                        variant={composerType === "QUESTION" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 px-3 text-xs"
                        onClick={() => setComposerType("QUESTION")}
                      >
                        <HelpCircle className="mr-1.5 h-3.5 w-3.5" />
                        Question
                      </Button>
                      <Button
                        variant={composerType === "BLOCKER" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 px-3 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setComposerType("BLOCKER")}
                      >
                        <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
                        Blocker
                      </Button>
                    </div>
                    
                    <Textarea
                      placeholder={
                        composerType === "UPDATE" ? "What's the status?" :
                        composerType === "NOTE" ? "Add an internal note..." :
                        composerType === "QUESTION" ? "Ask a question..." :
                        "Describe what is blocking you..."
                      }
                      value={composerContent}
                      onChange={(e) => setComposerContent(e.target.value)}
                      className="min-h-[80px] resize-none text-sm"
                    />
                    
                    <div className="mt-3 flex justify-end">
                      <Button
                        size="sm"
                        disabled={!composerContent.trim() || isSubmittingEvent}
                        onClick={() => {
                          setIsSubmittingEvent(true);
                          const action = composerType === "BLOCKER" ? "BLOCKER_REPORTED" : composerType;
                          addTaskTimelineEvent(
                            { id: task.id, data: { action, description: composerContent } },
                            { 
                              onSettled: () => setIsSubmittingEvent(false),
                              onSuccess: () => setComposerContent("")
                            }
                          );
                        }}
                      >
                        {isSubmittingEvent && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        Post {composerType.toLowerCase()}
                      </Button>
                    </div>
                  </div>
                )}

                <ActivityTimeline items={activityItems} className="space-y-6" />
              </section>

              {task.status === "BLOCKED" && canEditTask && (
                <section className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
                      <div>
                        <h4 className="text-sm font-semibold text-destructive">
                          Task is blocked
                        </h4>
                        <p className="mt-1 text-xs text-destructive/80">
                          Work cannot continue until the blocker is resolved.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => resolveBlocker(task.id)}
                    >
                      Resolve Blocker
                    </Button>
                  </div>
                </section>
              )}

              {task.isOverdue && task.status !== "BLOCKED" && (
                <section className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
                    <div>
                      <h4 className="text-sm font-semibold text-destructive">
                        Task is overdue
                      </h4>
                      <p className="mt-1 text-xs text-destructive/80">
                        Due date has passed. Reprioritize this task or update
                        the schedule.
                      </p>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </ScrollArea>
        </div>

        <footer className="shrink-0 border-t border-border/60 bg-card px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
            <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:min-w-0 sm:items-center">
              <Button
                variant="ghost"
                onClick={() => onScheduleMeeting?.(task)}
                className="h-10 w-full min-w-0 px-2 text-xs font-semibold sm:w-auto sm:px-4"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span className="truncate">Schedule Meeting</span>
              </Button>
              <Button
                variant={isCompleted ? "outline" : "default"}
                className="h-10 w-full min-w-0 px-2 text-xs font-semibold sm:w-auto sm:px-5"
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
                {isUpdating ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                <span className="truncate">
                  {isCompleted ? "Reopen Task" : "Mark Complete"}
                </span>
              </Button>
            </div>
          </div>
        </footer>
        
        {showCompletionDialog && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-xl border border-border/60 bg-card p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
              <h3 className="text-lg font-semibold text-foreground mb-2">Complete Task</h3>
              <p className="text-sm text-muted-foreground mb-4">Add an optional note about what was accomplished.</p>
              <Textarea
                placeholder="What was done? (Optional)"
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                className="mb-4 min-h-[80px] resize-none text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowCompletionDialog(false)} className="cursor-pointer">
                  <AppIcon name="close" size={14} className="mr-1.5" />
                  Cancel
                </Button>
                <Button size="sm" disabled={isCompleting} onClick={() => {
                  setIsCompleting(true);
                  completeTask({ id: task.id, note: completionNote }, {
                    onSettled: () => setIsCompleting(false),
                    onSuccess: () => {
                      setShowCompletionDialog(false);
                      setCompletionNote("");
                    }
                  });
                }}>
                  {isCompleting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
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
  <div className="rounded-lg border border-border/60 bg-background/60 p-3">
    <div className="mb-2 flex items-center justify-between">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
    </div>
    <p className="text-sm font-semibold text-foreground">{value}</p>
  </div>
);

export default TaskDetailsModal;












