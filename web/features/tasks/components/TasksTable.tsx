"use client";

import { useState } from "react";
import { Badge } from "@/shared/ui/badge";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { 
  Calendar, CheckCircle2, Eye, MoreHorizontal, 
  Trash2, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Pencil, Link2, UserPlus, Loader2
} from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
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
import { Checkbox } from "@/shared/ui/checkbox";
import { TaskType } from "@/shared/types/task";
import {
  CRMDataTable,
  CRMTableBody,
  CRMTableCell,
  CRMTableHeader,
  CRMTableHeaderCell,
  CRMTableRow,
  CRMPagination,
} from "@/shared/components/crm";
import { cn } from "@/shared/lib/utils";
import { useUpdateTask, useDeleteTask } from "@/shared/hooks/use-crm";
import { useAuth } from "@/features/auth/components/auth-provider";
import { PERMISSIONS } from "@/shared/lib/auth/rbac/permissions";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface TasksTableProps {
  tasks: TaskType[];
  onTaskClick: (task: TaskType) => void;
  onScheduleMeeting?: (task: TaskType) => void;
  onEditTask?: (task: TaskType) => void;
}

const TasksTable = ({ tasks, onTaskClick, onScheduleMeeting, onEditTask }: TasksTableProps) => {
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: deleteTask } = useDeleteTask();
  const { hasPermission, user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canEditTask = (task: TaskType) => 
    hasPermission(PERMISSIONS.TASKS_UPDATE) || 
    (hasPermission(PERMISSIONS.TASKS_UPDATE_ASSIGNED) && task.assignedToId === user?.id) ||
    (hasPermission(PERMISSIONS.TASKS_UPDATE_ASSIGNED) && task.createdById === user?.id);
  
  const canDeleteTask = hasPermission(PERMISSIONS.TASKS_DELETE);

  const totalPages = Math.ceil(tasks.length / rowsPerPage);
  const paginatedTasks = tasks.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(new Set(paginatedTasks.map(t => t.id)));
    } else {
      setSelectedTasks(new Set());
    }
  };

  const handleSelectTask = (taskId: string, checked: boolean) => {
    const next = new Set(selectedTasks);
    if (checked) next.add(taskId);
    else next.delete(taskId);
    setSelectedTasks(next);
  };

  const handleBulkComplete = () => {
    selectedTasks.forEach(id => updateTask({ id, data: { status: "COMPLETED" } }));
    setSelectedTasks(new Set());
  };

  const handleBulkDelete = () => {
    if (confirm("Are you sure you want to delete the selected tasks?")) {
      selectedTasks.forEach(id => deleteTask(id));
      setSelectedTasks(new Set());
    }
  };

  return (
    <div className="flex-auto flex flex-col min-h-0 relative">
      <AnimatePresence>
        {selectedTasks.size > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-full border border-border bg-background/95 px-6 py-3 shadow-xl backdrop-blur-md"
          >
            <span className="text-sm font-semibold text-foreground">
              {selectedTasks.size} selected
            </span>
            <div className="h-4 w-px bg-border/60" />
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="h-8 gap-2 rounded-full px-4 text-xs font-semibold hover:bg-emerald-500/10 hover:text-emerald-600" onClick={handleBulkComplete}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Complete
              </Button>
              <Button size="sm" variant="ghost" className="h-8 gap-2 rounded-full px-4 text-xs font-semibold hover:bg-blue-500/10 hover:text-blue-600" onClick={() => toast.info("Assign feature coming soon")}>
                <UserPlus className="h-3.5 w-3.5" /> Assign
              </Button>
              <Button size="sm" variant="ghost" className="h-8 gap-2 rounded-full px-4 text-xs font-semibold hover:bg-rose-500/10 hover:text-rose-600" onClick={handleBulkDelete}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <CRMDataTable containerClassName="border-0 shadow-none rounded-none w-full" className="w-full">
          <CRMTableHeader className="sticky top-0 z-20 bg-card border-b border-border/60">
            <CRMTableRow className="h-10 sm:h-11">
              <CRMTableHeaderCell className="w-[52px] px-5">
                <Checkbox 
                  checked={paginatedTasks.length > 0 && selectedTasks.size === paginatedTasks.length}
                  onCheckedChange={handleSelectAll}
                  className="rounded-md border-muted-foreground/20" 
                />
              </CRMTableHeaderCell>
              <CRMTableHeaderCell className="px-4">
                Task
              </CRMTableHeaderCell>
              <CRMTableHeaderCell className="w-[130px] px-4">
                Status
              </CRMTableHeaderCell>
              <CRMTableHeaderCell className="w-[120px] px-4 text-center">
                Priority
              </CRMTableHeaderCell>
              <CRMTableHeaderCell className="w-[150px] px-4 text-center">
                Due Date
              </CRMTableHeaderCell>
              <CRMTableHeaderCell className="w-[160px] px-4">
                Related Record
              </CRMTableHeaderCell>
              <CRMTableHeaderCell className="w-[140px] px-4">
                Owner
              </CRMTableHeaderCell>
              <CRMTableHeaderCell className="w-[120px] px-4 text-center">
                Last Updated
              </CRMTableHeaderCell>
              <CRMTableHeaderCell className="w-[80px] px-5 text-right">
                Actions
              </CRMTableHeaderCell>
            </CRMTableRow>
          </CRMTableHeader>

          <CRMTableBody className="divide-y divide-border/15">
            {paginatedTasks.map((task) => (
              <CRMTableRow key={task.id} className="group h-[72px]">
                <CRMTableCell className="px-5">
                  <Checkbox
                    checked={selectedTasks.has(task.id)} 
                    onCheckedChange={(checked: boolean) => handleSelectTask(task.id, checked)}
                    className="rounded-md border-muted-foreground/20"
                  />
                </CRMTableCell>

                <CRMTableCell className="min-w-[280px] px-4">
                  <button
                    type="button"
                    className="flex w-full flex-col gap-1 text-left"
                    onClick={() => onTaskClick(task)}
                  >
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "line-clamp-1 text-[13px] font-semibold leading-tight tracking-tight text-foreground transition-colors",
                        task.status === "COMPLETED" && "text-muted-foreground line-through"
                      )}>
                        {task.title}
                      </p>
                    </div>
                  </button>
                </CRMTableCell>

                <CRMTableCell className="px-4">
                  <Badge variant="outline" className={cn(
                    "border-border/70 bg-background/60 text-[10px] font-semibold uppercase tracking-wide",
                    task.status === "COMPLETED" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                    task.status === "PENDING" && "bg-amber-500/10 text-amber-600 border-amber-500/20",
                    task.status === "IN_PROGRESS" && "bg-blue-500/10 text-blue-600 border-blue-500/20"
                  )}>
                    {task.status}
                  </Badge>
                </CRMTableCell>

                <CRMTableCell className="text-center px-4">
                  <span className={cn(
                    "inline-flex min-w-[70px] items-center justify-center rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest",
                    task.priority === "HIGH" && "border-rose-500/25 bg-rose-500/10 text-rose-700",
                    task.priority === "MEDIUM" && "border-amber-500/25 bg-amber-500/10 text-amber-700",
                    task.priority === "LOW" && "border-blue-500/25 bg-blue-500/10 text-blue-700"
                  )}>
                    {task.priority}
                  </span>
                </CRMTableCell>

                <CRMTableCell className="px-4 text-center">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {task.dueDate}
                  </div>
                </CRMTableCell>

                <CRMTableCell className="px-4">
                  {(task.relatedLead || task.relatedCustomer) ? (
                    <Badge variant="outline" className="gap-1.5 border-border/70 bg-background/60 text-[10px] text-muted-foreground px-2 py-1 transition-colors hover:bg-muted/50 cursor-pointer">
                      <Link2 className="w-3 h-3" />
                      <span className="font-semibold text-foreground truncate max-w-[80px]">
                        {task.relatedLead ? task.relatedLead.name : task.relatedCustomer?.name}
                      </span>
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground/40 text-xs">-</span>
                  )}
                </CRMTableCell>

                <CRMTableCell className="px-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 border border-border/60">
                      <AvatarFallback className="bg-primary/10 text-[9px] font-bold text-primary uppercase">
                        {task.assignedTo?.name ? task.assignedTo.name.charAt(0) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[11px] font-semibold text-foreground">
                      {task.assignedTo?.name || "Unassigned"}
                    </span>
                  </div>
                </CRMTableCell>
                
                <CRMTableCell className="px-4 text-center">
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {task.lastActivity ?? (task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : "Today")}
                  </span>
                </CRMTableCell>

                <CRMTableCell className="px-5 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" className="text-muted-foreground/70 hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl border-border/70 p-1.5 shadow-premium">
                      <DropdownMenuItem onClick={() => onTaskClick(task)} className="gap-2 rounded-lg py-2 text-xs font-medium cursor-pointer">
                        <AppIcon name="eye" size={15} /> <span>View</span>
                      </DropdownMenuItem>
                      {canEditTask(task) && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => onEditTask?.(task)}
                            className="gap-2 rounded-lg py-2 text-xs font-medium cursor-pointer"
                          >
                            <AppIcon name="edit" size={15} /> <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.preventDefault();
                              setUpdatingTaskId(task.id);
                              updateTask(
                                { id: task.id, data: { status: task.status === "COMPLETED" ? "PENDING" : "COMPLETED" } },
                                { onSettled: () => setUpdatingTaskId(null) }
                              );
                            }} 
                            className="gap-2 rounded-lg py-2 text-xs font-medium cursor-pointer"
                            disabled={updatingTaskId === task.id}
                          >
                            {updatingTaskId === task.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : (
                              <AppIcon name="check" size={15} /> 
                            )}
                            <span>{task.status === "COMPLETED" ? "Reopen Task" : "Mark Complete"}</span>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem onClick={() => onScheduleMeeting?.(task)} className="gap-2 rounded-lg py-2 text-xs font-medium cursor-pointer">
                        <AppIcon name="calendar" size={15} /> <span>Schedule Meeting</span>
                      </DropdownMenuItem>
                      {canDeleteTask && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            variant="destructive" 
                            className="gap-2 rounded-lg py-2 text-xs font-medium cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => setTaskToDelete(task)}
                          >
                            <AppIcon name="trash" size={15} className="text-destructive" /> <span>Delete</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CRMTableCell>
              </CRMTableRow>
            ))}
          </CRMTableBody>
        </CRMDataTable>
      </div>

      {/* Pagination */}
      <CRMPagination
        currentPage={currentPage}
        totalPages={totalPages || 1}
        totalItems={tasks.length}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={(size) => {
          setRowsPerPage(size);
          setCurrentPage(1);
        }}
        itemName="Tasks"
        pageSizeOptions={[10, 25, 50, 100]}
      />
      <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the task &quot;{taskToDelete?.title}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              variant="destructive"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                if (!taskToDelete) return;
                setIsDeleting(true);
                deleteTask(taskToDelete.id, {
                  onSuccess: () => {
                    toast.success("Task deleted successfully");
                    setTaskToDelete(null);
                  },
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
    </div>
  );
};

export default TasksTable;












