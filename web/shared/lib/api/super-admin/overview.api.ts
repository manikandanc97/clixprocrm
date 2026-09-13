import client from "../client";

export interface AttentionRequiredItem {
  id: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  description: string;
  entityName?: string;
  entityType?: string;
  targetUrl: string;
  createdAt: string;
}

export interface GrowthDataPoint {
  label: string;
  organizations: number;
  total: number;
  active: number;
}

export interface OrganizationGrowthOverview {
  newOrganizations: number;
  activatedOrganizations: number;
  churnedOrganizations: number;
  growthPercent: number;
  timeframes: {
    "7D": GrowthDataPoint[];
    "30D": GrowthDataPoint[];
    "90D": GrowthDataPoint[];
    "1Y": GrowthDataPoint[];
  };
}

export interface PlatformUsageData {
  dau: number;
  wau: number;
  mau: number;
  loginSuccessRate: number;
  activeOrganizationRate: number;
  dailyTrend: Array<{
    date: string;
    dau: number;
    logins: number;
  }>;
}

export interface ModuleAdoptionItem {
  module: string;
  key: string;
  rate: number;
  recordCount: number;
}

export interface ServiceHealthItem {
  name: string;
  status: "OPERATIONAL" | "DEGRADED" | "DOWN";
  latencyMs: number;
  details?: string;
}

export interface PlatformHealthOverview {
  uptimePercent: number;
  avgLatencyMs: number;
  overallStatus: "OPERATIONAL" | "DEGRADED" | "DOWN";
  services: ServiceHealthItem[];
}

export interface BillingSnapshotData {
  mrr: number;
  arr: number;
  paidOrganizations: number;
  trialOrganizations: number;
  pastDueCount: number;
  pastDueAmount: number;
  currency: string;
}

export interface TenantHealthOverview {
  healthyCount: number;
  atRiskCount: number;
  inactiveCount: number;
  healthyPercent: number;
}

export interface EnrichedRecentOrg {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: "ACTIVE" | "SUSPENDED";
  healthStatus: "HEALTHY" | "AT_RISK" | "INACTIVE";
  userCount: number;
  recordsCount?: number;
  leadCount: number;
  customerCount: number;
  dealCount?: number;
  taskCount?: number;
  createdAt: string;
}

export interface PlatformOverviewData {
  metrics: {
    totalOrganizations: number;
    activeOrganizations: number;
    suspendedOrganizations: number;
    totalUsers: number;
    activeUsers: number;
    totalLeads: number;
    totalCustomers: number;
    totalDeals: number;
    totalTasks?: number;
    estimatedMRR?: number;
    estimatedARR?: number;
    activeAdoptionRate?: number;
    platformHealthPercent?: number;
    openIssuesCount?: number;
    criticalIssuesCount?: number;
    mrrGrowthPercent?: number;
    userGrowthPercent?: number;
    orgGrowthPercent?: number;
  };
  organizationGrowth?: OrganizationGrowthOverview;
  attentionRequired?: AttentionRequiredItem[];
  platformUsage?: PlatformUsageData;
  moduleAdoption?: ModuleAdoptionItem[];
  platformHealth?: PlatformHealthOverview;
  billingSnapshot?: BillingSnapshotData;
  tenantHealth?: TenantHealthOverview;
  planDistribution: Array<{ plan: string; count: number }>;
  recentOrganizations: EnrichedRecentOrg[];
  recentAuditLogs: Array<{
    id: string;
    action: string;
    module: string;
    actor: string;
    actorEmail: string | null;
    tenantId: string | null;
    details: Record<string, unknown>;
    createdAt: string;
  }>;
}


export const fetchPlatformOverview = async (): Promise<PlatformOverviewData> => {
  const response = await client.get<{ success: boolean; data: PlatformOverviewData }>(
    "/super-admin/dashboard"
  );
  return response.data.data;
};

