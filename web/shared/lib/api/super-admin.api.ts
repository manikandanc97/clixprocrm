import client from "./client";

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
    details: any;
    createdAt: string;
  }>;
}

export interface PlatformOrganization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: "ACTIVE" | "SUSPENDED";
  currency: string;
  timezone: string;
  userCount: number;
  leadCount: number;
  customerCount: number;
  dealCount: number;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  isSuperAdmin: boolean;
  createdAt: string;
  organizations: Array<{
    tenantId: string;
    name: string;
    slug: string;
    status: "ACTIVE" | "SUSPENDED";
    role: string;
    membershipStatus: string;
  }>;
}

export interface PlatformAnalyticsData {
  totals: {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    totalLeads: number;
    totalDeals: number;
    totalCustomers: number;
    totalQuotations: number;
    estimatedMRR: number;
    estimatedARR: number;
  };
  monthlyTrends: Array<{
    month: string;
    organizations: number;
    users: number;
  }>;
  planBreakdown: Array<{
    plan: string;
    count: number;
    price: number;
    monthlyRevenue: number;
  }>;
}

export interface PlatformAuditLog {
  id: string;
  action: string;
  module: string;
  tenantId: string | null;
  organizationName: string;
  actor: string;
  actorEmail: string | null;
  targetUser: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export const fetchPlatformOverview = async (): Promise<PlatformOverviewData> => {
  const response = await client.get<{ success: boolean; data: PlatformOverviewData }>(
    "/super-admin/dashboard"
  );
  return response.data.data;
};

export const fetchPlatformOrganizations = async (params?: {
  search?: string;
  status?: "ACTIVE" | "SUSPENDED";
  plan?: string;
  page?: number;
  limit?: number;
}): Promise<{
  organizations: PlatformOrganization[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> => {
  const response = await client.get<{
    success: boolean;
    data: {
      organizations: PlatformOrganization[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  }>("/super-admin/organizations", { params });
  return response.data.data;
};

export const fetchPlatformOrganizationDetails = async (id: string) => {
  const response = await client.get<{ success: boolean; data: any }>(
    `/super-admin/organizations/${id}`
  );
  return response.data.data;
};

export const createPlatformOrganization = async (data: {
  name: string;
  slug?: string;
  plan?: string;
  currency?: string;
  timezone?: string;
}) => {
  const response = await client.post<{ success: boolean; data: any; message: string }>(
    "/super-admin/organizations",
    data
  );
  return response.data;
};

export const updatePlatformOrganization = async (
  id: string,
  data: Partial<PlatformOrganization>
) => {
  const response = await client.put<{ success: boolean; data: any; message: string }>(
    `/super-admin/organizations/${id}`,
    data
  );
  return response.data;
};

export const updateOrganizationStatus = async (
  id: string,
  status: "ACTIVE" | "SUSPENDED",
  reason?: string
) => {
  const response = await client.patch<{ success: boolean; data: any; message: string }>(
    `/super-admin/organizations/${id}/status`,
    { status, reason }
  );
  return response.data;
};

export const deletePlatformOrganization = async (id: string) => {
  const response = await client.delete<{ success: boolean; data: any; message: string }>(
    `/super-admin/organizations/${id}`
  );
  return response.data;
};

export const fetchPlatformUsers = async (params?: {
  search?: string;
  status?: string;
  isSuperAdmin?: boolean;
  page?: number;
  limit?: number;
}): Promise<{
  users: PlatformUser[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> => {
  const response = await client.get<{
    success: boolean;
    data: {
      users: PlatformUser[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  }>("/super-admin/users", { params });
  return response.data.data;
};

export const updatePlatformUserStatus = async (
  id: string,
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED"
) => {
  const response = await client.patch<{ success: boolean; data: any; message: string }>(
    `/super-admin/users/${id}/status`,
    { status }
  );
  return response.data;
};

export const toggleSuperAdminRole = async (id: string, isSuperAdmin: boolean) => {
  const response = await client.patch<{ success: boolean; data: any; message: string }>(
    `/super-admin/users/${id}/super-admin`,
    { isSuperAdmin }
  );
  return response.data;
};

export const transferSuperAdminRole = async (targetUserId: string) => {
  const response = await client.post<{ success: boolean; data: any; message: string }>(
    "/super-admin/users/transfer-super-admin",
    { targetUserId }
  );
  return response.data;
};

export const deletePlatformUser = async (id: string) => {
  const response = await client.delete<{ success: boolean; data: any; message: string }>(
    `/super-admin/users/${id}`
  );
  return response.data;
};

export const fetchPlatformAnalytics = async (): Promise<PlatformAnalyticsData> => {
  const response = await client.get<{ success: boolean; data: PlatformAnalyticsData }>(
    "/super-admin/analytics"
  );
  return response.data.data;
};

export const fetchPlatformAuditLogs = async (params?: {
  tenantId?: string;
  action?: string;
  module?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  logs: PlatformAuditLog[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> => {
  const response = await client.get<{
    success: boolean;
    data: {
      logs: PlatformAuditLog[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  }>("/super-admin/audit-logs", { params });
  return response.data.data;
};

export interface AuditIntegrityReport {
  status: "HEALTHY" | "WARNING" | "CRITICAL";
  scope: string;
  checkedRecords: number;
  brokenLinks: number;
  missingArchives: number;
  hashMismatches: number;
  missingHashes: number;
  timestampAnomalies: number;
  failedArchives: number;
  staleOutboxRecords: number;
  archiveCoveragePercent: number;
  firstFailureId: string | null;
  lastCheckAt: string;
  reason: string | null;
}

export const fetchAuditIntegrityStatus = async (): Promise<AuditIntegrityReport> => {
  const response = await client.get<{ success: boolean; data: AuditIntegrityReport }>(
    "/super-admin/audit-integrity/status"
  );
  return response.data.data;
};

export const triggerAuditIntegrityVerify = async (
  tenantId?: string
): Promise<AuditIntegrityReport> => {
  const response = await client.post<{ success: boolean; data: AuditIntegrityReport }>(
    "/super-admin/audit-integrity/verify",
    undefined,
    { params: tenantId ? { tenantId } : undefined }
  );
  return response.data.data;
};

export const triggerAuditDrVerify = async (
  recordId: string
): Promise<{ restorable: boolean; reason: string | null }> => {
  const response = await client.post<{
    success: boolean;
    data: { restorable: boolean; reason: string | null };
  }>(`/super-admin/audit-integrity/dr-verify/${recordId}`);
  return response.data.data;
};

export interface SecurityIncidentItem {
  id: string;
  incidentNumber: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "INVESTIGATING" | "CONTAINED" | "RESOLVED" | "FALSE_POSITIVE";
  title: string;
  description: string;
  incidentType: string;
  detectedAt: string;
  detectedBy: string;
  tenantId: string | null;
  affectedUserId: string | null;
  createdBy: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityCenterStatus {
  emergencyMode: boolean;
  emergencyReason: string | null;
  openIncidents: number;
  criticalIncidents: number;
  lockedUsers: number;
  lockedTenants: number;
  auditIntegrityStatus: "HEALTHY" | "WARNING" | "CRITICAL";
  archiveCoveragePercent: number;
  checkedRecords: number;
  brokenChains: number;
  failedArchives: number;
  lastCheckAt: string;
}

export const fetchSecurityCenterStatus = async (): Promise<SecurityCenterStatus> => {
  const response = await client.get<{ success: boolean; data: SecurityCenterStatus }>(
    "/super-admin/security/center/status"
  );
  return response.data.data;
};

export const fetchSecurityIncidents = async (params?: {
  severity?: string;
  status?: string;
  tenantId?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  incidents: SecurityIncidentItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> => {
  const response = await client.get<{
    success: boolean;
    data: {
      incidents: SecurityIncidentItem[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  }>("/super-admin/security/incidents", { params });
  return response.data.data;
};

export const createSecurityIncident = async (data: {
  title: string;
  description: string;
  severity: string;
  incidentType?: string;
  tenantId?: string;
  affectedUserId?: string;
}): Promise<SecurityIncidentItem> => {
  const response = await client.post<{ success: boolean; data: SecurityIncidentItem }>(
    "/super-admin/security/incidents",
    data
  );
  return response.data.data;
};

export const resolveSecurityIncident = async (
  id: string,
  resolutionNotes: string
): Promise<SecurityIncidentItem> => {
  const response = await client.post<{ success: boolean; data: SecurityIncidentItem }>(
    `/super-admin/security/incidents/${id}/resolve`,
    { resolutionNotes }
  );
  return response.data.data;
};

export const emergencyLockUser = async (
  userId: string,
  reason: string,
  confirmation: string
) => {
  const response = await client.post<{ success: boolean; message: string }>(
    `/super-admin/security/emergency/lock-user/${userId}`,
    { reason, confirmation }
  );
  return response.data;
};

export const emergencyUnlockUser = async (userId: string, reason: string) => {
  const response = await client.post<{ success: boolean; message: string }>(
    `/super-admin/security/emergency/unlock-user/${userId}`,
    { reason }
  );
  return response.data;
};

export const emergencyLockTenant = async (
  tenantId: string,
  reason: string,
  confirmation: string
) => {
  const response = await client.post<{ success: boolean; message: string }>(
    `/super-admin/security/emergency/lock-tenant/${tenantId}`,
    { reason, confirmation }
  );
  return response.data;
};

export const emergencyUnlockTenant = async (tenantId: string, reason: string) => {
  const response = await client.post<{ success: boolean; message: string }>(
    `/super-admin/security/emergency/unlock-tenant/${tenantId}`,
    { reason }
  );
  return response.data;
};

export const generateBreakGlassCode = async (): Promise<string> => {
  const response = await client.post<{
    success: boolean;
    data: { confirmationCode: string };
  }>("/super-admin/security/emergency/generate-break-glass-code");
  return response.data.data.confirmationCode;
};

export const enablePlatformEmergency = async (
  reason: string,
  confirmation: string,
  confirmationCode: string
) => {
  const response = await client.post<{ success: boolean; message: string }>(
    "/super-admin/security/emergency/platform-lockdown",
    { reason, confirmation, confirmationCode }
  );
  return response.data;
};

export const disablePlatformEmergency = async (reason: string) => {
  const response = await client.post<{ success: boolean; message: string }>(
    "/super-admin/security/emergency/platform-unlock",
    { reason }
  );
  return response.data;
};

export interface ComponentHealthInfo {
  status: "HEALTHY" | "DEGRADED" | "CRITICAL" | "UNKNOWN";
  latencyMs?: number;
  message?: string;
  details?: Record<string, any>;
}

export interface SecurityHealthData {
  overallStatus: "HEALTHY" | "DEGRADED" | "CRITICAL" | "UNKNOWN";
  database: ComponentHealthInfo;
  redis: ComponentHealthInfo;
  auditIntegrity: ComponentHealthInfo;
  wormArchive: ComponentHealthInfo;
  incidentSystem: ComponentHealthInfo;
  sessions: ComponentHealthInfo;
  mfa: ComponentHealthInfo;
  hardening: {
    cors: "HEALTHY" | "DEGRADED" | "CRITICAL";
    csp: "HEALTHY" | "DEGRADED" | "CRITICAL";
    ssrf: "HEALTHY" | "DEGRADED" | "CRITICAL";
    uploadSecurity: "HEALTHY" | "DEGRADED" | "CRITICAL";
    rateLimiting: "HEALTHY" | "DEGRADED" | "CRITICAL";
  };
  lastCheckedAt: string;
}

export interface SecurityMetricsData {
  period: "24h" | "7d" | "30d";
  metrics: {
    loginSuccessCount: number;
    loginFailureCount: number;
    newDeviceCount: number;
    mfaFailureCount: number;
    sessionRevocationCount: number;
    lockedUsersCount: number;
    lockedTenantsCount: number;
    openIncidentsCount: number;
    criticalIncidentsCount: number;
    auditIntegrityFailures: number;
    wormArchiveFailures: number;
    staleOutboxItems: number;
    emergencyMode: boolean;
  };
  anomaliesDetected: {
    metric: string;
    value: number;
    threshold: number;
    severity: "MEDIUM" | "HIGH" | "CRITICAL";
    message: string;
  }[];
  generatedAt: string;
}

export const fetchSecOpsHealth = async (): Promise<SecurityHealthData> => {
  const response = await client.get<{ success: boolean; data: SecurityHealthData }>(
    "/super-admin/security/operations/health"
  );
  return response.data.data;
};

export const fetchSecOpsMetrics = async (
  period: "24h" | "7d" | "30d" = "24h"
): Promise<SecurityMetricsData> => {
  const response = await client.get<{ success: boolean; data: SecurityMetricsData }>(
    "/super-admin/security/operations/metrics",
    { params: { period } }
  );
  return response.data.data;
};

export const fetchSecOpsTimeline = async (limit: number = 25): Promise<any[]> => {
  const response = await client.get<{ success: boolean; data: any[] }>(
    "/super-admin/security/operations/timeline",
    { params: { limit } }
  );
  return response.data.data;
};

export const fetchSecOpsConfig = async (): Promise<any> => {
  const response = await client.get<{ success: boolean; data: any }>(
    "/super-admin/security/operations/config"
  );
  return response.data.data;
};

export interface SecurityPostureData {
  overallStatus: "HEALTHY" | "DEGRADED" | "CRITICAL" | "UNKNOWN";
  securityReadinessScore: number;
  controlsSummary: {
    total: number;
    verified: number;
    configured: number;
    degraded: number;
    notConfigured: number;
  };
  complianceReadiness: {
    framework: string;
    readinessStatus: "HIGH" | "MEDIUM" | "LOW";
    verifiedControlsCount: number;
  }[];
  configurationReadiness: {
    ready: boolean;
    validCount: number;
    totalCount: number;
    issues: string[];
  };
  backupReadiness: {
    wormConfigured: boolean;
    complianceRetentionDays: number;
    archiveStatus: string;
  };
  incidentReadiness: {
    openIncidents: number;
    criticalIncidents: number;
    emergencyLockdownActive: boolean;
  };
  lastEvaluatedAt: string;
}

export interface GovernanceControlData {
  controlId: string;
  category: string;
  name: string;
  status: "VERIFIED" | "CONFIGURED" | "DEGRADED" | "NOT_CONFIGURED";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evidence: string;
  lastVerifiedAt: string;
}

export const fetchGovernancePosture = async (): Promise<SecurityPostureData> => {
  const response = await client.get<{ success: boolean; data: SecurityPostureData }>(
    "/super-admin/security/governance/posture"
  );
  return response.data.data;
};

export const fetchGovernanceControls = async (): Promise<GovernanceControlData[]> => {
  const response = await client.get<{ success: boolean; data: GovernanceControlData[] }>(
    "/super-admin/security/governance/controls"
  );
  return response.data.data;
};

export const fetchGovernanceRls = async (): Promise<any> => {
  const response = await client.get<{ success: boolean; data: any }>(
    "/super-admin/security/governance/rls"
  );
  return response.data.data;
};

export const generateGovernanceEvidence = async (
  format: "json" | "csv" = "json"
): Promise<{ format: string; filename: string; content: string; checksum: string }> => {
  const response = await client.post<{
    success: boolean;
    data: { format: string; filename: string; content: string; checksum: string };
  }>("/super-admin/security/governance/evidence", { format });
  return response.data.data;
};

export const fetchPlatformSettings = async () => {
  const response = await client.get<{ success: boolean; data: any }>(
    "/super-admin/settings"
  );
  return response.data.data;
};

export const updatePlatformSettings = async (data: any) => {
  const response = await client.post<{ success: boolean; data: any }>(
    "/super-admin/settings",
    data
  );
  return response.data;
};

export interface PlatformModule {
  id: string;
  key: string;
  label: string;
  icon: string;
  route: string;
  group: string;
  navigationScope: string;
  parentId: string | null;
  sortOrder: number;
  isEnabled: boolean;
  isVisible: boolean;
  isSystem: boolean;
  permission: string | null;
  badge: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  children?: PlatformModule[];
}

export interface CreatePlatformModuleDto {
  key?: string;
  label: string;
  icon?: string;
  route: string;
  group?: string;
  navigationScope?: string;
  parentId?: string | null;
  sortOrder?: number;
  isEnabled?: boolean;
  isVisible?: boolean;
  isSystem?: boolean;
  permission?: string | null;
  badge?: string | null;
  description?: string | null;
}

export interface UpdatePlatformModuleDto {
  key?: string;
  label?: string;
  icon?: string;
  route?: string;
  group?: string;
  navigationScope?: string;
  parentId?: string | null;
  sortOrder?: number;
  isEnabled?: boolean;
  isVisible?: boolean;
  isSystem?: boolean;
  permission?: string | null;
  badge?: string | null;
  description?: string | null;
}

export const fetchPlatformModules = async (params?: {
  search?: string;
  group?: string;
  navigationScope?: string;
  isEnabled?: boolean;
  isVisible?: boolean;
}): Promise<{
  modules: PlatformModule[];
  stats: {
    total: number;
    enabled: number;
    disabled: number;
    system: number;
  };
}> => {
  const response = await client.get<{
    success: boolean;
    data: {
      modules: PlatformModule[];
      stats: {
        total: number;
        enabled: number;
        disabled: number;
        system: number;
      };
    };
  }>("/super-admin/modules", { params });
  return response.data.data;
};

/**
 * Fetches enabled & visible TENANT_CRM navigation items.
 * Used by: usePlatformNavigation() → tenant workspace sidebar.
 */
export const fetchPlatformNavigation = async (): Promise<PlatformModule[]> => {
  const response = await client.get<{
    success: boolean;
    data: PlatformModule[];
  }>("/super-admin/modules/navigation");
  return response.data.data;
};

/**
 * Fetches enabled & visible SUPER_ADMIN navigation items.
 * Used by: useSuperAdminNavigation() → super admin platform sidebar.
 * Requires Super Admin session.
 */
export const fetchSuperAdminNavigation = async (): Promise<PlatformModule[]> => {
  const response = await client.get<{
    success: boolean;
    data: PlatformModule[];
  }>("/super-admin/modules/super-admin-navigation");
  return response.data.data;
};

export const createPlatformModule = async (data: CreatePlatformModuleDto) => {
  const response = await client.post<{
    success: boolean;
    data: PlatformModule;
    message: string;
  }>("/super-admin/modules", data);
  return response.data;
};

export const updatePlatformModule = async (
  id: string,
  data: UpdatePlatformModuleDto
) => {
  const response = await client.put<{
    success: boolean;
    data: PlatformModule;
    message: string;
  }>(`/super-admin/modules/${id}`, data);
  return response.data;
};

export const togglePlatformModuleStatus = async (
  id: string,
  params: { isEnabled?: boolean; isVisible?: boolean }
) => {
  const response = await client.patch<{
    success: boolean;
    data: PlatformModule;
    message: string;
  }>(`/super-admin/modules/${id}/toggle`, params);
  return response.data;
};

export const reorderPlatformModules = async (
  items: Array<{ id: string; sortOrder: number }>
) => {
  const response = await client.patch<{
    success: boolean;
    message: string;
  }>("/super-admin/modules/reorder", { items });
  return response.data;
};

export const deletePlatformModule = async (id: string) => {
  const response = await client.delete<{
    success: boolean;
    message: string;
  }>(`/super-admin/modules/${id}`);
  return response.data;
};

// ==========================================
// 8. PLATFORM PLANS & BILLING APIS
// ==========================================

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

export const formatPlanPrice = (amount: number, currency: string = "INR"): string => {
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₹";
  return `${symbol}${amount.toLocaleString()}`;
};

export const fetchPlatformPlans = async (): Promise<PlatformPlansResponse> => {
  const response = await client.get<{
    success: boolean;
  } & PlatformPlansResponse>("/super-admin/plans");
  return {
    plans: response.data.plans || [],
    distribution: response.data.distribution || {},
    featureCatalog: response.data.featureCatalog || [],
    aiModels: response.data.aiModels || [],
    metrics: response.data.metrics || {
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
    defaultModel: any;
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

export interface PlatformBillingOverviewData {
  kpis: {
    mrr: number;
    mrrFormatted: string;
    arr: number;
    arrFormatted: string;
    totalRevenue: number;
    totalRevenueFormatted: string;
    paidRevenue: number;
    paidRevenueFormatted: string;
    pendingRevenue: number;
    pendingRevenueFormatted: string;
    overdueRevenue: number;
    overdueRevenueFormatted: string;
    totalRefunds: number;
    totalRefundsFormatted: string;
    activeSubscriptions: number;
    totalSubscriptions: number;
    totalOrganizations: number;
  };
  planDistribution: Array<{ count: number; name: string; revenue: number; percentage?: number }>;
  monthlyTrend: Array<{ month: string; revenue: number; projected?: number; invoicesCount: number }>;
  config: any;
}

export interface PlatformSubscriptionItem {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantLogo?: string | null;
  planId: string;
  planName: string;
  billingCycle: string;
  seats: number;
  status: string;
  unitPrice: number;
  recurringAmount: number;
  recurringAmountFormatted: string;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialStart?: string | null;
  trialEnd?: string | null;
  cancelAtPeriodEnd: boolean;
  latestInvoice?: any;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformInvoiceItemData {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantLogo?: string | null;
  tenantGstin?: string | null;
  subscriptionId?: string | null;
  invoiceNumber: string;
  planName: string;
  billingCycle: string;
  seats: number;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  totalAmountFormatted: string;
  paidAmount: number;
  paidAmountFormatted: string;
  status: string;
  paymentStatus: string;
  paidAt?: string | null;
  createdAt: string;
}

export const fetchPlatformBillingOverview = async (): Promise<PlatformBillingOverviewData> => {
  const response = await client.get<{ success: boolean; data: PlatformBillingOverviewData }>(
    "/super-admin/billing/overview"
  );
  return response.data.data;
};

export const fetchPlatformSubscriptions = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  planId?: string;
  status?: string;
}) => {
  const response = await client.get<{
    success: boolean;
    subscriptions: PlatformSubscriptionItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>("/super-admin/billing/subscriptions", { params });
  return response.data;
};

export const createOrUpdatePlatformSubscription = async (data: {
  tenantId: string;
  planId: string;
  billingCycle?: "monthly" | "annual";
  seats?: number;
  status?: string;
}) => {
  const response = await client.post<{ success: boolean; data: any }>(
    "/super-admin/billing/subscriptions",
    data
  );
  return response.data;
};

export const fetchPlatformInvoices = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  paymentStatus?: string;
  tenantId?: string;
}) => {
  const response = await client.get<{
    success: boolean;
    invoices: PlatformInvoiceItemData[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>("/super-admin/billing/invoices", { params });
  return response.data;
};

export const fetchPlatformInvoiceById = async (id: string) => {
  const response = await client.get<{ success: boolean; data: any }>(
    `/super-admin/billing/invoices/${id}`
  );
  return response.data.data;
};

export const processPlatformRefund = async (
  invoiceId: string,
  data: { amount: number; reason: string; paymentId?: string }
) => {
  const response = await client.post<{ success: boolean; data: any }>(
    `/super-admin/billing/invoices/${invoiceId}/refund`,
    data
  );
  return response.data;
};

export const fetchPlatformBillingSettings = async () => {
  const response = await client.get<{ success: boolean; data: any }>(
    "/super-admin/billing/settings"
  );
  return response.data.data;
};

export const updatePlatformBillingSettings = async (data: any) => {
  const response = await client.put<{ success: boolean; data: any }>(
    "/super-admin/billing/settings",
    data
  );
  return response.data.data;
};

// ----------------------------------------------------
// Support Ticket Platform Operations
// ----------------------------------------------------

export interface PlatformSupportTicket {
  id: string;
  ticketNumber: string;
  tenantId: string;
  createdById: string;
  assignedToId: string | null;
  subject: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_PROGRESS" | "WAITING_FOR_USER" | "RESOLVED" | "CLOSED";
  description: string;
  diagnostics?: any;
  estimatedResponseTime?: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
  }>;
  messages?: Array<{
    id: string;
    senderId: string;
    message: string;
    isStaff: boolean;
    isInternal: boolean;
    createdAt: string;
    sender: {
      id: string;
      name: string;
      email: string;
      avatar?: string | null;
      isSuperAdmin?: boolean;
    };
  }>;
  _count?: {
    messages: number;
  };
}

export interface SupportTicketStats {
  total: number;
  open: number;
  inProgress: number;
  waitingForUser: number;
  resolved: number;
  closed: number;
  critical: number;
}

export const fetchPlatformSupportStats = async (): Promise<SupportTicketStats> => {
  const response = await client.get<{ success: boolean; data: SupportTicketStats }>(
    "/super-admin/support/stats"
  );
  return response.data.data;
};

export const fetchPlatformSupportTickets = async (params: {
  status?: string;
  priority?: string;
  category?: string;
  tenantId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) => {
  const response = await client.get<{
    success: boolean;
    data: {
      tickets: PlatformSupportTicket[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    };
  }>("/super-admin/support/tickets", { params });
  return response.data.data;
};

export const fetchPlatformSupportTicketDetails = async (ticketId: string): Promise<PlatformSupportTicket> => {
  const response = await client.get<{ success: boolean; data: PlatformSupportTicket }>(
    `/super-admin/support/tickets/${ticketId}`
  );
  return response.data.data;
};

export const replyPlatformSupportTicket = async (
  ticketId: string,
  message: string,
  isInternal = false
): Promise<PlatformSupportTicket> => {
  const response = await client.post<{ success: boolean; data: PlatformSupportTicket }>(
    `/super-admin/support/tickets/${ticketId}/reply`,
    { message, isInternal }
  );
  return response.data.data;
};

export const updatePlatformSupportTicketStatus = async (
  ticketId: string,
  status: string
): Promise<PlatformSupportTicket> => {
  const response = await client.patch<{ success: boolean; data: PlatformSupportTicket }>(
    `/super-admin/support/tickets/${ticketId}/status`,
    { status }
  );
  return response.data.data;
};

export const assignPlatformSupportTicket = async (
  ticketId: string,
  assignedToId: string | null
): Promise<PlatformSupportTicket> => {
  const response = await client.patch<{ success: boolean; data: PlatformSupportTicket }>(
    `/super-admin/support/tickets/${ticketId}/assign`,
    { assignedToId }
  );
  return response.data.data;
};

export const updatePlatformSupportTicket = async (
  ticketId: string,
  data: {
    subject?: string;
    description?: string;
    category?: string;
    priority?: string;
    status?: string;
  }
): Promise<PlatformSupportTicket> => {
  const response = await client.patch<{ success: boolean; data: PlatformSupportTicket }>(
    `/super-admin/support/tickets/${ticketId}`,
    data
  );
  return response.data.data;
};

export const deletePlatformSupportTicket = async (
  ticketId: string
): Promise<{ success: boolean; id: string; ticketNumber: string }> => {
  const response = await client.delete<{
    success: boolean;
    data: { success: boolean; id: string; ticketNumber: string };
  }>(`/super-admin/support/tickets/${ticketId}`);
  return response.data.data;
};





