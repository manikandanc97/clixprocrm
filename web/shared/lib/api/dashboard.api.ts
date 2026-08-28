/**
 * @file shared/lib/api/dashboard.api.ts
 * Dashboard-related API endpoints.
 */
import client from "./client";
import { ApiResponseType } from "@/shared/types/api";
import { DashboardDataType } from "@/shared/types/dashboard";
import {
  HotLeadsDataType,
  NotificationsDataType,
  AiInsightsDataType,
} from "@/shared/types/dashboard-widgets";
import { MeetingsDataType } from "@/shared/types/meeting";

async function unwrapResponse<T>(request: Promise<{ data: ApiResponseType<T> }>) {
  try {
    const response = await request;
    if (!response.data?.success || response.data.data === undefined) {
      throw new Error(response.data?.message || "Invalid API response.");
    }
    return response.data.data;
  } catch (error: any) {
    const msg = error.response?.data?.message;
    if (msg) {
      if (typeof msg === 'string') throw new Error(msg);
      else if (typeof msg === 'object') throw new Error(msg.message || JSON.stringify(msg));
    }
    throw error;
  }
}

function ensureArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function normalizeDashboardData(data: DashboardDataType): DashboardDataType {
  return {
    ...data,
    stats: ensureArray(data?.stats),
    recentActivities: ensureArray(data?.recentActivities),
    salesChartData: ensureArray(data?.salesChartData),
  };
}

export async function fetchDashboardData(timeframe: string = "month") {
  return normalizeDashboardData(
    await unwrapResponse<DashboardDataType>(client.get(`/crm/dashboard?timeframe=${timeframe}`))
  );
}

export function fetchRevenueGrowth(filter: string = "Year") {
  return unwrapResponse<ReturnType<typeof JSON.parse>>(
    client.get(`/crm/dashboard/revenue-growth?filter=${encodeURIComponent(filter)}`)
  );
}

export function fetchEmployeeDashboardData() {
  return unwrapResponse<{
    myTasks: number;
    myTodayMeetings: number;
    myUpcomingMeetings: number;
    myLeads: number;
    myDeals: number;
    myActivities: number;
    recentActivities: { id: string; title: string; time: string; type: string }[];
  }>(client.get("/crm/dashboard/employee"));
}

export function fetchHotLeads() {
  return unwrapResponse<HotLeadsDataType>(client.get("/crm/hot-leads"));
}

export function fetchMeetings() {
  return unwrapResponse<MeetingsDataType>(client.get("/crm/meetings"));
}

export function fetchNotifications() {
  return unwrapResponse<NotificationsDataType>(client.get("/crm/notifications"));
}

export function markNotificationAsRead(id: string) {
  return unwrapResponse<void>(client.patch(`/crm/notifications/${id}`));
}

export function markAllNotificationsAsRead() {
  return unwrapResponse<void>(client.patch("/crm/notifications/mark-all"));
}

export function deleteNotification(id: string) {
  return unwrapResponse<void>(client.delete(`/crm/notifications/${id}`));
}

export function clearAllReadNotifications() {
  return unwrapResponse<void>(client.delete("/crm/notifications/clear-read"));
}

export function createTestNotification() {
  return unwrapResponse<any>(client.post("/crm/notifications/test"));
}

export function fetchAiInsights() {
  return unwrapResponse<AiInsightsDataType>(client.get("/crm/ai-insights"));
}

export type GlobalSearchResult = {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  url: string;
};

export const SearchService = {
  fetchGlobalSearch: (query: string) =>
    unwrapResponse<GlobalSearchResult[]>(client.get(`/crm/search?q=${encodeURIComponent(query)}`)),
};

