import client from "../client";

export interface PlatformAuditLog {
  id: string;
  action: string;
  module: string;
  tenantId: string | null;
  organizationName: string;
  actor: string;
  actorEmail: string | null;
  targetUser: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}


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

