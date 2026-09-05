/**
 * @file shared/lib/api/tasks.api.ts
 * Tasks-related API endpoints.
 */
import client from "./client";
import { ApiResponseType } from "@/shared/types/api";
import {
  TasksDataType,
  TaskType,
  TaskTimelineEvent,
  TaskHistoryLog,
  TaskDashboardStats,
} from "@/shared/types/task";
import { MetricCardType } from "@/shared/types/common";

async function unwrapResponse<T>(request: Promise<{ data: ApiResponseType<T> }>) {
  try {
    const response = await request;
    if (!response.data?.success || response.data.data === undefined) {
      throw new Error(response.data?.message || "Invalid API response.");
    }
    return response.data.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: unknown } } };
    const msg = err?.response?.data?.message;
    if (msg) {
      if (typeof msg === 'string') throw new Error(msg);
      else if (typeof msg === 'object' && msg !== null) {
        throw new Error((msg as { message?: string }).message || JSON.stringify(msg));
      }
    }
    throw error;
  }
}

export function fetchTasksData(params?: Record<string, string | number | boolean>) {
  const query = params
    ? "?" +
      new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ).toString()
    : "";
  return unwrapResponse<TasksDataType>(client.get(`/crm/tasks${query}`));
}

export function fetchTaskDashboard() {
  return unwrapResponse<{ stats: MetricCardType[]; dashboardStats: TaskDashboardStats }>(
    client.get("/crm/tasks/dashboard")
  );
}

export function fetchTaskBoard(search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return unwrapResponse<Record<string, TaskType[]>>(client.get(`/crm/tasks/board${query}`));
}

export function fetchTaskCalendar(startDate?: string, endDate?: string) {
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const query = Object.keys(params).length > 0 ? "?" + new URLSearchParams(params).toString() : "";
  return unwrapResponse<TaskType[]>(client.get(`/crm/tasks/calendar${query}`));
}

export function fetchTaskHistory(id: string) {
  return unwrapResponse<TaskHistoryLog[]>(client.get(`/crm/tasks/${id}/history`));
}

export function createTask(data: Partial<TaskType>) {
  return unwrapResponse<TaskType>(client.post("/crm/tasks", data));
}

export function updateTask(id: string, data: Partial<TaskType>) {
  return unwrapResponse<TaskType>(client.put(`/crm/tasks/${id}`, data));
}

export function updateTaskStatus(id: string, status: string) {
  return unwrapResponse<TaskType>(client.put(`/crm/tasks/${id}`, { status }));
}

export function assignTask(id: string, assignedToId: string) {
  return unwrapResponse<TaskType>(client.put(`/crm/tasks/${id}`, { assignedToId }));
}

export function completeTask(id: string, note?: string) {
  return unwrapResponse<TaskType>(client.post(`/crm/tasks/${id}/complete`, { note }));
}

export function deleteTask(id: string) {
  return unwrapResponse<{ id: string }>(client.delete(`/crm/tasks/${id}`));
}

export function createTaskTimelineEvent(
  id: string,
  data: { action: string; description?: string; metadata?: Record<string, unknown> }
) {
  return unwrapResponse<TaskTimelineEvent>(client.post(`/crm/tasks/${id}/timeline`, data));
}

export function updateTaskProgressAPI(id: string, progress: number) {
  return unwrapResponse<TaskType>(client.patch(`/crm/tasks/${id}/progress`, { progress }));
}

export function resolveTaskBlocker(id: string) {
  return unwrapResponse<TaskType>(client.post(`/crm/tasks/${id}/blockers/resolve`));
}
