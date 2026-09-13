import client from "../client";
import type { SecurityIncidentItem } from "./security.api";

export interface SecurityAlertItem {
  id: string;
  alertType: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  description: string;
  userId: string | null;
  organizationId: string | null;
  sourceEventId: string | null;
  detectedAt: string;
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  resolvedAt: string | null;
  resolvedBy: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformHealthRow {
  service: string;
  status: "Healthy" | "Warning" | "Unavailable";
  lastChecked: string;
  detail: string;
  latencyMs?: number;
}

export interface SecOpsSummaryReport {
  overallStatus: "HEALTHY" | "DEGRADED";
  overallStatusBadge: "System Healthy" | "Attention Required";
  metrics: {
    systemHealth: "HEALTHY" | "DEGRADED";
    securityServices: string;
    operationalServicesCount: number;
    totalServicesCount: number;
    securityAlertsCount: number;
    openIncidentsCount: number;
  };
  servicesHealth: PlatformHealthRow[];
  lastCheckedAt: string;
}

export const fetchSecOpsSummary = async (): Promise<SecOpsSummaryReport> => {
  const response = await client.get<{ success: boolean; data: SecOpsSummaryReport }>(
    "/super-admin/security/operations/summary"
  );
  return response.data.data;
};

export const fetchPlatformSecurityHealthRows = async (): Promise<PlatformHealthRow[]> => {
  const response = await client.get<{ success: boolean; data: PlatformHealthRow[] }>(
    "/super-admin/security/operations/health"
  );
  return response.data.data;
};

export const fetchSecurityAlerts = async (params?: {
  status?: string;
  severity?: string;
  alertType?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  alerts: SecurityAlertItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> => {
  const response = await client.get<{
    success: boolean;
    data: {
      alerts: SecurityAlertItem[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  }>("/super-admin/security/operations/alerts", { params });
  return response.data.data;
};

export const triggerSecurityDetection = async (): Promise<{
  success: boolean;
  evaluatedAt: string;
  alertsCreated: number;
  alerts: SecurityAlertItem[];
}> => {
  const response = await client.post<{
    success: boolean;
    data: {
      success: boolean;
      evaluatedAt: string;
      alertsCreated: number;
      alerts: SecurityAlertItem[];
    };
  }>("/super-admin/security/operations/alerts/detect");
  return response.data.data;
};

export const acknowledgeSecurityAlert = async (id: string): Promise<SecurityAlertItem> => {
  const response = await client.patch<{ success: boolean; data: SecurityAlertItem }>(
    `/super-admin/security/operations/alerts/${id}/acknowledge`
  );
  return response.data.data;
};

export const resolveSecurityAlert = async (
  id: string,
  notes?: string
): Promise<SecurityAlertItem> => {
  const response = await client.post<{ success: boolean; data: SecurityAlertItem }>(
    `/super-admin/security/operations/alerts/${id}/resolve`,
    { notes }
  );
  return response.data.data;
};

export const escalateAlertToIncident = async (
  id: string
): Promise<{ success: boolean; incident: SecurityIncidentItem; alertId: string }> => {
  const response = await client.post<{
    success: boolean;
    data: { success: boolean; incident: SecurityIncidentItem; alertId: string };
  }>(`/super-admin/security/operations/alerts/${id}/escalate`);
  return response.data.data;
};

export const forcePasswordResetUser = async (userId: string, reason: string) => {
  const response = await client.post<{ success: boolean; message: string }>(
    `/super-admin/security/operations/emergency/force-password-reset/${userId}`,
    { reason }
  );
  return response.data;
};

export const emergencyRevokeUser = async (userId: string, reason: string) => {
  const response = await client.post<{ success: boolean; message: string; data?: unknown }>(
    `/super-admin/security/emergency/revoke-user/${userId}`,
    { reason }
  );
  return response.data;
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
  details?: Record<string, unknown>;
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

export interface SecOpsTimelineEvent {
  id: string;
  timestamp: string;
  type: string;
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  description: string;
  actor?: string;
  ipAddress?: string;
  [key: string]: unknown;
}

export interface SecOpsConfigData {
  threatDetectionEnabled: boolean;
  rateLimitThreshold: number;
  ipAllowlist: string[];
  ipBlocklist: string[];
  mfaEnforcement: string;
  sessionTimeoutMinutes: number;
  [key: string]: unknown;
}

export const fetchSecOpsTimeline = async (limit: number = 25): Promise<SecOpsTimelineEvent[]> => {
  const response = await client.get<{ success: boolean; data: SecOpsTimelineEvent[] }>(
    "/super-admin/security/operations/timeline",
    { params: { limit } }
  );
  return response.data.data;
};

export const fetchSecOpsConfig = async (): Promise<SecOpsConfigData> => {
  const response = await client.get<{ success: boolean; data: SecOpsConfigData }>(
    "/super-admin/security/operations/config"
  );
  return response.data.data;
};

