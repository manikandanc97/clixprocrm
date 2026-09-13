import client from "../client";

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

export const acknowledgeSecurityIncident = async (
  id: string
): Promise<SecurityIncidentItem> => {
  const response = await client.patch<{ success: boolean; data: SecurityIncidentItem }>(
    `/super-admin/security/incidents/${id}/acknowledge`
  );
  return response.data.data;
};

export const updateSecurityIncidentStatus = async (
  id: string,
  status: string,
  notes?: string
): Promise<SecurityIncidentItem> => {
  const response = await client.patch<{ success: boolean; data: SecurityIncidentItem }>(
    `/super-admin/security/incidents/${id}/status`,
    { status, notes }
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

