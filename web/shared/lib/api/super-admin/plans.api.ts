import client from "../client";

export interface FeatureCatalogItem {
  key: string;
  name: string;
  category: string;
  description: string;
}

export interface PlatformPlanItem {
  id: string;
  name: string;
  description: string;
  price: string;
  priceNum: number;
  annualPriceNum: number;
  currency: string;
  billing: string;
  pricingMode: "FIXED" | "CUSTOM";
  features: string[];
  maxUsers: number;
  maxLeads: number;
  maxContacts: number;
  storageGb: number;
  maxApiRequests: number;
  trialDays: number;
  billingCycleMonthly: boolean;
  billingCycleAnnual: boolean;
  highlight: boolean;
  isActive: boolean;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  sortOrder: number;
  tenantCount: number;
  aiEnabled: boolean;
  aiLevel: string;
  dailyTokenLimit: number;
  defaultModelId: string | null;
  defaultModel: {
    id: string;
    modelKey: string;
    displayName: string;
    provider: string;
  } | null;
  allowedModelIds: string[];
  allowedModels: Array<{
    id: string;
    modelKey: string;
    displayName: string;
    provider: string;
    status: string;
  }>;
}

export interface PlatformPlansResponse {
  plans: PlatformPlanItem[];
  distribution: Record<string, number>;
  featureCatalog: FeatureCatalogItem[];
  aiModels: Array<{
    id: string;
    modelKey: string;
    displayName: string;
    provider: string;
    contextWindow: number;
  }>;
  metrics: {
    activePlans: number;
    totalOrganizations: number;
    monthlyMRR: number;
    projectedARR: number;
    hasBillingData: boolean;
  };
}

export const formatPlanPrice = (amount: number | null | undefined, currency: string = "INR"): string => {
  const num = typeof amount === "number" && !isNaN(amount) ? amount : Number(amount) || 0;
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₹";
  return `${symbol}${num.toLocaleString()}`;
};

export const fetchPlatformPlans = async (): Promise<PlatformPlansResponse> => {
  const response = await client.get<{
    success: boolean;
    data?: PlatformPlansResponse;
  } & PlatformPlansResponse>("/super-admin/plans");
  const payload = (response?.data as { data?: PlatformPlansResponse })?.data || response?.data || {};
  return {
    plans: Array.isArray(payload.plans) ? payload.plans : [],
    distribution: payload.distribution || {},
    featureCatalog: Array.isArray(payload.featureCatalog) ? payload.featureCatalog : [],
    aiModels: Array.isArray(payload.aiModels) ? payload.aiModels : [],
    metrics: payload.metrics || {
      activePlans: 0,
      totalOrganizations: 0,
      monthlyMRR: 0,
      projectedARR: 0,
      hasBillingData: false,
    },
  };
};

export const createPlatformPlan = async (data: Partial<PlatformPlanItem>) => {
  const response = await client.post<{
    success: boolean;
    plan: PlatformPlanItem;
    message: string;
  }>("/super-admin/plans", data);
  return response.data;
};

export const updatePlatformPlan = async (
  id: string,
  data: Partial<PlatformPlanItem>
) => {
  const response = await client.put<{
    success: boolean;
    plan: PlatformPlanItem;
    message: string;
  }>(`/super-admin/plans/${id}`, data);
  return response.data;
};

export const archivePlatformPlan = async (id: string) => {
  const response = await client.patch<{
    success: boolean;
    plan: PlatformPlanItem;
    message: string;
  }>(`/super-admin/plans/${id}/archive`);
  return response.data;
};

export const deletePlatformPlan = async (id: string) => {
  const response = await client.delete<{
    success: boolean;
    id: string;
    name: string;
    message: string;
  }>(`/super-admin/plans/${id}`);
  return response.data;
};

// ==========================================
// 9. PLATFORM AI CATALOG & ENTITLEMENTS APIS
// ==========================================

