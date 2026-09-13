import client from "../client";

export interface PlatformSettingsGeneral {
  name?: string;
  defaultTenantPlan?: string;
  defaultCurrency?: string;
  defaultTimezone?: string;
}

export interface PlatformSettingsRegistration {
  allowPublicRegistrations?: boolean;
  requireEmailVerification?: boolean;
  allowWorkspaceSelfRegistration?: boolean;
  maintenanceMode?: boolean;
}

export interface PlatformSettingsPlanItem {
  id: string;
  name: string;
  price?: string;
  priceNum?: number;
  status?: string;
}

export interface PlatformSystemInfo {
  platformVersion?: string;
  apiVersion?: string;
  platformStatus?: string;
  databaseStatus?: string;
  environment?: string;
}

export interface PlatformSettingsResponse {
  general?: PlatformSettingsGeneral;
  workspaceRegistration?: PlatformSettingsRegistration;
  platform?: PlatformSettingsGeneral & PlatformSettingsRegistration;
  activePlans?: PlatformSettingsPlanItem[];
  availablePlans?: PlatformSettingsPlanItem[];
  systemInfo?: PlatformSystemInfo;
  dbStatus?: string;
  [key: string]: unknown;
}

export interface UpdatePlatformSettingsPayload {
  name?: string;
  defaultTenantPlan?: string;
  defaultCurrency?: string;
  defaultTimezone?: string;
  allowPublicRegistrations?: boolean;
  requireEmailVerification?: boolean;
  allowWorkspaceSelfRegistration?: boolean;
  maintenanceMode?: boolean;
  general?: Record<string, unknown>;
  workspaceRegistration?: Record<string, unknown>;
  platform?: Record<string, unknown>;
  [key: string]: unknown;
}

export const fetchPlatformSettings = async (): Promise<PlatformSettingsResponse> => {
  const response = await client.get<{ success: boolean; data: PlatformSettingsResponse }>(
    "/super-admin/settings"
  );
  return response.data.data;
};

export const updatePlatformSettings = async (
  data: UpdatePlatformSettingsPayload
): Promise<{ success: boolean; data: PlatformSettingsResponse; message?: string }> => {
  const response = await client.post<{ success: boolean; data: PlatformSettingsResponse; message?: string }>(
    "/super-admin/settings",
    data
  );
  return response.data;
};

