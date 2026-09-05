/**
 * @file shared/lib/api/settings.api.ts
 * Settings-related API endpoints.
 */
import client from "./client";
import { ApiResponseType } from "@/shared/types/api";
import {
  AiSettingsDataType,
  BillingSettingsDataType,
  IntegrationSettingsDataType,
  NotificationSettingsDataType,
  SecuritySettingsDataType,
  WorkspaceDataType,
} from "@/shared/types/settings";
import { MeetingType } from "@/shared/types/meeting";

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

export interface RevenueTargetType {
  id: string;
  name?: string;
  periodType?: string;
  goalType?: string;
  startDate: string;
  endDate: string;
  currentRevenue?: number;
  value?: number;
  isActive?: boolean;
  status?: string;
}

export function fetchWorkspaceData() {
  return unwrapResponse<WorkspaceDataType>(client.get("/crm/workspace"));
}

export function fetchSecuritySettings() {
  return unwrapResponse<SecuritySettingsDataType>(client.get("/crm/settings/security"));
}

export function fetchBillingSettings() {
  return unwrapResponse<BillingSettingsDataType>(client.get("/crm/settings/billing"));
}

export function fetchIntegrationSettings() {
  return unwrapResponse<IntegrationSettingsDataType>(client.get("/crm/settings/integrations"));
}

export function fetchAiSettings() {
  return unwrapResponse<AiSettingsDataType>(client.get("/crm/settings/ai"));
}

export function fetchNotificationSettings() {
  return unwrapResponse<NotificationSettingsDataType>(client.get("/crm/settings/notifications"));
}

export function updateWorkspaceData(data: Partial<WorkspaceDataType>) {
  return unwrapResponse<WorkspaceDataType>(client.patch("/crm/workspace", data));
}

export async function uploadWorkspaceLogo(
  file: File | { fileData: string; fileName?: string }
) {
  if (file instanceof File) {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

    return unwrapResponse<{
      success: boolean;
      logo: string;
      brandPrimaryColor: string;
      workspace: WorkspaceDataType;
    }>(
      client.post("/crm/workspace/logo", {
        fileData: base64Data,
        fileName: file.name,
      })
    );
  }

  return unwrapResponse<{
    success: boolean;
    logo: string;
    brandPrimaryColor: string;
    workspace: WorkspaceDataType;
  }>(client.post("/crm/workspace/logo", file));
}

export function updateSecuritySettings(data: Partial<SecuritySettingsDataType>) {
  return unwrapResponse<SecuritySettingsDataType>(client.patch("/crm/settings/security", data));
}

export function updateIntegrationSettings(id: string, connected: boolean) {
  return unwrapResponse<{ success: boolean; id: string; connected: boolean }>(
    client.patch(`/crm/settings/integrations/${id}`, { connected })
  );
}

export function updateAiSettings(data: Partial<AiSettingsDataType>) {
  return unwrapResponse<AiSettingsDataType>(client.patch("/crm/settings/ai", data));
}

export function updateNotificationSettings(data: Partial<NotificationSettingsDataType>) {
  return unwrapResponse<NotificationSettingsDataType>(client.patch("/crm/settings/notifications", data));
}

export function fetchRevenueTargets() {
  return unwrapResponse<RevenueTargetType[]>(client.get("/crm/settings/revenue-targets"));
}

export function fetchRevenueTargetAnalytics(filters: Record<string, string | number | boolean> = {}) {
  const searchParams = new URLSearchParams(
    Object.entries(filters).map(([k, v]) => [k, String(v)])
  );
  return unwrapResponse<Record<string, unknown>>(
    client.get(`/crm/analytics/revenue-target?${searchParams.toString()}`)
  );
}

export function createMeeting(data: Partial<MeetingType>) {
  return unwrapResponse<MeetingType>(client.post("/crm/meetings", data));
}
