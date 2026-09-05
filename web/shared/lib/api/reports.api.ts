/**
 * @file shared/lib/api/reports.api.ts
 * Reports and analytics API endpoints.
 */
import client from "./client";
import { ApiResponseType } from "@/shared/types/api";
import { ReportsDataType } from "@/shared/types/report";
import { AnalyticsDataType } from "@/shared/types/analytics";

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

function ensureArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function normalizeReportsData(data: ReportsDataType): ReportsDataType {
  return {
    stats: ensureArray(data?.stats),
    revenueChart: ensureArray(data?.revenueChart),
    conversionChart: ensureArray(data?.conversionChart),
    performance: ensureArray(data?.performance),
    funnel: ensureArray(data?.funnel),
    activityHeatmap: ensureArray(data?.activityHeatmap),
    insights: ensureArray(data?.insights),
    revenueTarget: data?.revenueTarget ?? null,
    leadSources: ensureArray(data?.leadSources),
    topCustomers: ensureArray(data?.topCustomers),
    recentActivities: ensureArray(data?.recentActivities),
    upcomingFollowUps: ensureArray(data?.upcomingFollowUps),
    salesActivities: ensureArray(data?.salesActivities),
  };
}

export async function fetchReportsData(params?: Record<string, string | number | boolean>) {
  const query = params
    ? "?" +
      new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ).toString()
    : "";
  return normalizeReportsData(
    await unwrapResponse<ReportsDataType>(client.get(`/crm/reports${query}`))
  );
}

export function fetchAnalyticsData(filter?: string) {
  const query = filter ? `?filter=${encodeURIComponent(filter)}` : "";
  return unwrapResponse<AnalyticsDataType>(client.get(`/crm/analytics${query}`));
}
