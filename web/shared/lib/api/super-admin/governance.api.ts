import client from "../client";

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

export interface GovernanceRlsPolicy {
  tableName: string;
  rlsEnabled: boolean;
  policiesCount: number;
  status: "SECURED" | "WARNING" | "UNSECURED";
  issues?: string[];
}

export interface GovernanceRlsData {
  tables?: GovernanceRlsPolicy[];
  summary?: Record<string, unknown>;
  [key: string]: unknown;
}

export const fetchGovernanceRls = async (): Promise<GovernanceRlsData> => {
  const response = await client.get<{ success: boolean; data: GovernanceRlsData }>(
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

