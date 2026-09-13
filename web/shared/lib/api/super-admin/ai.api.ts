import client from "../client";

export interface PlatformAiModelItem {
  id: string;
  modelKey: string;
  displayName: string;
  provider: string;
  description?: string | null;
  contextWindow: number;
  inputCostPer1k: number;
  outputCostPer1k: number;
  capabilities: string[];
  isAvailable: boolean;
  isDefault: boolean;
  isFallback: boolean;
  isChatModel?: boolean;
  status?: string;
  sortOrder: number;
}

export interface PlanAiEntitlementsMatrix {
  plans: Array<{ id: string; name: string; price: string }>;
  models: PlatformAiModelItem[];
  entitlements: Array<{
    id: string;
    planId: string;
    modelId: string;
    capability: string;
    maxTokensPerDay?: number | null;
    isEnabled: boolean;
  }>;
}

export interface AiUsageTelemetryData {
  summary: {
    totalRequests: number;
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    avgLatencyMs: number;
    estimatedCostUsd: number;
    estimatedCostInr: number;
  };
  topTenantsUsage: Array<{
    tenantId: string;
    requestsCount: number;
    totalTokens: number;
  }>;
  recentLogs: Array<{
    id: string;
    tenantId: string;
    userId: string;
    modelKey: string;
    modelName: string;
    capability: string;
    totalTokens: number;
    latencyMs: number;
    status: string;
    createdAt: string;
  }>;
}

export const fetchPlatformAiModels = async (): Promise<PlatformAiModelItem[]> => {
  const response = await client.get<{ success: boolean; models: PlatformAiModelItem[] }>(
    "/super-admin/ai/models"
  );
  return response.data.models;
};

export const togglePlatformAiModelAvailability = async (
  id: string,
  isAvailable: boolean
) => {
  const response = await client.patch<{ success: boolean; model: PlatformAiModelItem }>(
    `/super-admin/ai/models/${id}/availability`,
    { isAvailable }
  );
  return response.data;
};

export const setDefaultPlatformAiModel = async (id: string) => {
  const response = await client.post<{ success: boolean; message: string }>(
    `/super-admin/ai/models/${id}/set-default`
  );
  return response.data;
};

export const setFallbackPlatformAiModel = async (id: string) => {
  const response = await client.post<{ success: boolean; message: string }>(
    `/super-admin/ai/models/${id}/set-fallback`
  );
  return response.data;
};

export const fetchPlanAiEntitlementsMatrix = async (): Promise<PlanAiEntitlementsMatrix> => {
  const response = await client.get<{ success: boolean } & PlanAiEntitlementsMatrix>(
    "/super-admin/ai/entitlements"
  );
  return response.data;
};

export const updatePlanAiEntitlements = async (
  planId: string,
  entitlements: Array<{
    modelId: string;
    capability?: string;
    isEnabled: boolean;
    maxTokensPerDay?: number | null;
  }>
) => {
  const response = await client.put<{ success: boolean; message: string }>(
    `/super-admin/ai/entitlements/${planId}`,
    { entitlements }
  );
  return response.data;
};

export interface PlanAiConfigItem {
  id: string;
  name: string;
  price: string;
  priceNum: number;
  aiLevel: string;
  aiEnabled: boolean;
  dailyTokenLimit: number;
  defaultModel: {
    id: string;
    modelKey: string;
    displayName: string;
    provider: string;
    status: string;
  } | null;
  allowedModels: Array<{
    id: string;
    modelKey: string;
    displayName: string;
    provider: string;
    status: string;
    maxTokensPerDay?: number | null;
  }>;
}

export interface PlanAiOverviewData {
  globalAiEnabled: boolean;
  plans: PlanAiConfigItem[];
  activeChatModels: PlatformAiModelItem[];
  allModels: PlatformAiModelItem[];
}

export const fetchPlanAiOverview = async (): Promise<PlanAiOverviewData> => {
  const response = await client.get<{ success: boolean } & PlanAiOverviewData>(
    "/super-admin/ai/plans"
  );
  return {
    globalAiEnabled: response.data.globalAiEnabled !== false,
    plans: response.data.plans || [],
    activeChatModels: response.data.activeChatModels || [],
    allModels: response.data.allModels || [],
  };
};

export const setPlanDefaultAiModel = async (planId: string, modelId: string) => {
  const response = await client.patch<{
    success: boolean;
    message: string;
    planId: string;
    defaultModel: Record<string, unknown> | string;
  }>(`/super-admin/ai/plans/${planId}/default-model`, { modelId });
  return response.data;
};

export const updatePlanAiConfiguration = async (
  planId: string,
  data: {
    aiEnabled?: boolean;
    aiLevel?: string;
    dailyTokenLimit?: number;
    allowedModelIds?: string[];
  }
) => {
  const response = await client.put<{ success: boolean; message: string }>(
    `/super-admin/ai/plans/${planId}`,
    data
  );
  return response.data;
};

export const updatePlatformAiModelStatus = async (id: string, status: string) => {
  const response = await client.patch<{ success: boolean; model: PlatformAiModelItem }>(
    `/super-admin/ai/models/${id}/status`,
    { status }
  );
  return response.data;
};

export const toggleGlobalAiKillswitch = async (enabled: boolean) => {
  const response = await client.patch<{
    success: boolean;
    message: string;
    globalAiEnabled: boolean;
  }>("/super-admin/ai/global", { enabled });
  return response.data;
};

export const fetchAiUsageTelemetry = async (
  limit = 50
): Promise<AiUsageTelemetryData> => {
  const response = await client.get<{ success: boolean } & AiUsageTelemetryData>(
    "/super-admin/ai/usage",
    { params: { limit } }
  );
  return response.data;
};

// ==========================================
// Super Admin Platform SaaS Billing API
// ==========================================

