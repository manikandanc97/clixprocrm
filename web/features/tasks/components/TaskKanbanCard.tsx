"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskType } from "@/shared/types/task";
import { Badge } from "@/shared/ui/badge";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { 
  MoreHorizontal, 
  MessageSquare,
  Paperclip,
  Trash2,
  Eye,
  Pencil,
  CheckCircle2,
  Calendar,
  Link2,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useDeleteTask, useUpdateTask } from "@/shared/hooks/use-crm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useState } from "react";
import { useAuth } from "@/features/auth/components/auth-provider";
import { PERMISSIONS } from "@/shared/lib/auth/rbac/permissions";

interface TaskKanbanCardProps {
  task: TaskType;
  onClick: (task: TaskType) => void;
  isOverlay?: boolean;
  onScheduleMeeting?: (task: TaskType) => void;
  onEditTask?: (task: TaskType) => void;
}

export const TaskKanbanCard = ({ task, onClick, isOverlay, onScheduleMeeting, onEditTask }: TaskKanbanCardProps) => {
  const { mutate: deleteTask } = useDeleteTask();
  const { mutate: updateTask } = useUpdateTask();
  const { hasPermission, user } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canEditTask = hasPermission(PERMISSIONS.TASKS_UPDATE) || 
    (hasPermission(PERMISSIONS.TASKS_UPDATE_ASSIGNED) && task.assignedToId === user?.id) ||
    (hasPermission(PERMISSIONS.TASKS_UPDATE_ASSIGNED) && task.createdById === user?.id);
  
  const canDeleteTask = hasPermission(PERMISSIONS.TASKS_DELETE);
  
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 bg-muted/40 p-4 rounded-xl border border-dashed border-primary/20 h-[180px]"
      />
    );
  }

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className={cn(
        "bg-card p-4 rounded-xl border border-border/50 shadow-card hover:shadow-card-hover hover:border-primary/20 transition-all cursor-grab active:cursor-grabbing group relative",
        isOverlay && "shadow-elevated border-primary/50 rotate-1 scale-[1.02]"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <Badge className={cn(
          "px-2 py-0.5 rounded-md font-bold text-[8px] uppercase tracking-widest border-none",
          task.priority === "HIGH" ? "bg-rose-500/10 text-rose-500" : 
          task.priority === "MEDIUM" ? "bg-amber-500/10 text-amber-500" : 
          "bg-blue-500/10 text-blue-500"
        )}>
          {task.priority}
        </Badge>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={(e) => e.stopPropagation()}
              className="opacity-0 group-hover:opacity-100 h-7 w-7 rounded-lg"
            >
              <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl p-2 shadow-premium">
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onClick(task); }}
              className="rounded-lg gap-2 font-semibold text-xs cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" /> View
            </DropdownMenuItem>
            {canEditTask && (
              <>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditTask?.(task);
                  }}
                  className="rounded-lg gap-2 font-semibold text-xs cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsUpdating(true);
                    updateTask(
                      { id: task.id, data: { status: task.status === "COMPLETED" ? "PENDING" : "COMPLETED" } },
                      { onSettled: () => setIsUpdating(false) }
                    );
                  }}
                  className="rounded-lg gap-2 font-semibold text-xs cursor-pointer"
                  disabled={isUpdating}
                >
                  {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {task.status === "COMPLETED" ? "Reopen Task" : "Mark Complete"}
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onScheduleMeeting?.(task);
              }}
              className="rounded-lg gap-2 font-semibold text-xs cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" /> Schedule Meeting
            </DropdownMenuItem>
            {canDeleteTask && (
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                className="rounded-lg gap-2 font-semibold text-xs cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent onClick={e => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the task &quot;{task.title}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              variant="destructive"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                setIsDeleting(true);
                deleteTask(task.id, {
                  onSuccess: () => setShowDeleteConfirm(false),
                  onSettled: () => setIsDeleting(false)
                });
              }}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <h4 className="font-bold text-foreground group-hover:text-primary transition-colors mb-3 leading-tight tracking-tight text-sm">
        {task.title}
      </h4>
      
      {(task.relatedLead || task.relatedCustomer) && (
        <div className="mb-4">
          <Badge variant="outline" className="gap-1.5 border-border/70 bg-background/60 text-[10px] text-muted-foreground hover:bg-muted/50 cursor-pointer px-2 py-1 transition-colors">
            <Link2 className="w-3 h-3" />
            <span className="font-semibold text-foreground">
              {task.relatedLead ? "Lead" : "Customer"}
            </span>
            <span>•</span>
            <span className="truncate max-w-[120px]">
              {task.relatedLead?.name || task.relatedCustomer?.name}
            </span>
          </Badge>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center -space-x-1.5">
          <Avatar className="w-6 h-6 border-2 border-card shadow-sm rounded-lg">
            <AvatarFallback className="text-[8px] font-bold bg-muted text-muted-foreground uppercase">
              {task.assignedTo?.name ? task.assignedTo.name.charAt(0) : "U"}
            </AvatarFallback>
          </Avatar>
          {task.collaborators?.slice(0, 2).map((c: { id: string; name: string }) => (
            <Avatar key={c.id} className="w-6 h-6 border-2 border-card shadow-sm rounded-lg">
              <AvatarFallback className="text-[8px] font-bold bg-primary/15 text-primary">
                {c.name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            <span className="text-[9px] font-bold uppercase tracking-widest">{task.notesCount || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Paperclip className="w-3 h-3" />
            <span className="text-[9px] font-bold uppercase tracking-widest">{task.attachmentsCount || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};












