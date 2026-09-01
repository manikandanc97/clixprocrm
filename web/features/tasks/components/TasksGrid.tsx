"use client";

import React, { useState } from "react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { 
  Calendar, 
  CheckCircle2, 
  CircleDashed, 
  Eye, 
  MoreHorizontal, 
  Play, 
  Trash2, 
  UserPlus, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Checkbox } from "@/shared/ui/checkbox";
import { TaskType } from "@/shared/types/task";
import { Progress } from "@/shared/ui/progress";
import { CRMCard, CRMPagination } from "@/shared/components/crm";
import { cn } from "@/shared/lib/utils";
import { useUpdateTask, useDeleteTask } from "@/shared/hooks/use-crm";

interface TasksGridProps {
  tasks: TaskType[];
  onTaskClick: (task: TaskType) => void;
}

export const TasksGrid: React.FC<TasksGridProps> = ({ tasks, onTaskClick }) => {
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: deleteTask } = useDeleteTask();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  const totalPages = Math.ceil(tasks.length / rowsPerPage);
  const paginatedTasks = tasks.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-6">
        {paginatedTasks.map((task, idx) => (
          <CRMCard
            key={task.id}
            delay={idx * 0.04}
            className="group relative flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    checked={task.status === "COMPLETED"} 
                    onCheckedChange={(checked) => updateTask({ id: task.id, data: { status: checked ? "COMPLETED" : "PENDING" } })}
                    className="rounded-md border-muted-foreground/20 w-5 h-5"
                  />
                  <Badge variant="outline" className={cn(
                    "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5",
                    task.priority === "HIGH" && "border-rose-500/25 bg-rose-500/10 text-rose-700",
                    task.priority === "MEDIUM" && "border-amber-500/25 bg-amber-500/10 text-amber-700",
                    task.priority === "LOW" && "border-blue-500/25 bg-blue-500/10 text-blue-700"
                  )}>
                    {task.priority}
                  </Badge>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 rounded-xl">
                    <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Quick actions
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onTaskClick(task)} className="gap-2 text-xs font-medium cursor-pointer">
                      <Eye className="h-4 w-4 text-primary" /> View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-xs font-medium cursor-pointer">
                      <Play className="h-4 w-4 text-emerald-600" /> Start Timer
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-xs font-medium cursor-pointer">
                      <UserPlus className="h-4 w-4 text-primary" /> Reassign
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="gap-2 text-xs font-medium text-destructive focus:text-destructive cursor-pointer"
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4" /> Delete Task
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2 mb-4">
                <h3 
                  onClick={() => onTaskClick(task)}
                  className={cn(
                    "font-bold text-foreground group-hover:text-primary transition-colors text-base tracking-tight cursor-pointer line-clamp-2",
                    task.status === "COMPLETED" && "line-through text-muted-foreground"
                  )}
                >
                  {task.title}
                </h3>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {task.category || "General Workspace"}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-3 mb-4">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    {task.status === "COMPLETED" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <CircleDashed className="h-4 w-4 text-primary" />
                    )}
                    {task.status}
                  </span>
                  <span className="text-foreground">{task.progress}%</span>
                </div>
                <Progress
                  value={task.progress}
                  className="h-1.5 bg-muted"
                  indicatorClassName={task.status === "COMPLETED" ? "bg-emerald-500" : "bg-primary"}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{task.dueDate}</span>
              </div>
            </div>
          </CRMCard>
        ))}
      </div>

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
        pageSizeOptions={[12, 24, 48, 96]}
      />
    </div>
  );
};
