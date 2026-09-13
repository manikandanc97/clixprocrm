"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/components/auth-provider";
import {
  fetchTasksData,
  fetchTaskDashboard,
  fetchTaskBoard,
  fetchTaskHistory,
  fetchTaskCalendar,
  createTask,
  updateTask,
  updateTaskStatus,
  assignTask,
  completeTask,
  deleteTask,
  createTaskTimelineEvent,
  updateTaskProgressAPI,
  resolveTaskBlocker,
} from "@/shared/lib/api/crm";

export function useTasks(params?: Record<string, ReturnType<typeof JSON.parse>>) {
  const { isAuthenticated, isHydrated } = useAuth();
  return useQuery({
    queryKey: params && Object.keys(params).length > 0 ? ["tasks", params] : ["tasks"],
    queryFn: () => fetchTasksData(params),
    enabled: isHydrated && isAuthenticated,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useTaskDashboard() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["tasks-dashboard"],
    queryFn: fetchTaskDashboard,
    enabled: isAuthenticated,
    staleTime: 3 * 60 * 1000,
  });
}

export function useTaskBoard(search?: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["tasks-board", search],
    queryFn: () => fetchTaskBoard(search),
    enabled: isAuthenticated,
    staleTime: 3 * 60 * 1000,
  });
}

export function useTaskHistory(taskId: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["tasks-history", taskId],
    queryFn: () => fetchTaskHistory(taskId),
    enabled: isAuthenticated && !!taskId,
    staleTime: 1 * 60 * 1000,
  });
}

export function useTaskCalendar(startDate?: string, endDate?: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["tasks-calendar", startDate, endDate],
    queryFn: () => fetchTaskCalendar(startDate, endDate),
    enabled: isAuthenticated,
    staleTime: 3 * 60 * 1000,
  });
}


export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-board"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Task created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create task");
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<import('@/shared/types/task').TaskType> }) => updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-board"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Task updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update task");
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-board"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Task deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete task");
    },
  });
}

export function useBulkDeleteTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => deleteTask(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-board"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete tasks");
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-board"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Task status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update task status");
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => completeTask(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-board"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      toast.success("Task marked as completed");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to complete task");
    },
  });
}

export function useAddTaskTimelineEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { action: string; description?: string; metadata?: Record<string, unknown> } }) => createTaskTimelineEvent(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Event added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add event");
    },
  });
}

export function useUpdateTaskProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, progress }: { id: string; progress: number }) => updateTaskProgressAPI(id, progress),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update progress");
    },
  });
}

export function useResolveTaskBlocker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resolveTaskBlocker(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", id] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Blocker resolved successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to resolve blocker");
    },
  });
}

export function useAssignTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assignedToId }: { id: string; assignedToId: string }) => assignTask(id, assignedToId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-board"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      toast.success("Task reassigned successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reassign task");
    },
  });
}



