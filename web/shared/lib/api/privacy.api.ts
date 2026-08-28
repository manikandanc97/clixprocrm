import client from './client';

export interface PrivacyExportData {
  exportMetadata: {
    exportedAt: string;
    exportId: string;
    system: string;
    compliance: string;
  };
  userProfile: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    status: string;
    securityStatus: string;
    createdAt: string;
    updatedAt: string;
  };
  workspaceMembership: {
    workspaceId: string;
    workspaceName: string;
    workspaceSlug: string;
    role: string;
    department?: string | null;
    isOrgOwner: boolean;
    joinedAt: string;
  } | null;
  securityOverview: {
    twoFactorAuthEnabled: boolean;
    factorCount: number;
    recoveryCodesConfigured: boolean;
    remainingRecoveryCodes: number;
    orgMfaPolicy: 'OPTIONAL' | 'REQUIRED';
  };
  notificationPreferences: Record<string, any>;
  workspaceActivitySummary: {
    tasksCreated: number;
    tasksAssigned: number;
    leadsCreated: number;
    notesAuthored: number;
    meetingsAssigned: number;
    recentTimelineEvents: Array<{
      id: string;
      action: string;
      description?: string;
      createdAt: string;
    }>;
  };
}

export const exportUserData = async (): Promise<PrivacyExportData> => {
  const response = await client.get<{ success: boolean; data: PrivacyExportData }>('/auth/privacy/export-data');
  return response.data.data;
};
