import client from './client';

export interface MfaFactor {
  id: string;
  friendlyName: string;
  factorType: string;
  status: 'verified' | 'unverified';
  createdAt: string;
  updatedAt: string;
}

export interface MfaStatusResponse {
  hasVerifiedFactor: boolean;
  factors: MfaFactor[];
  isEnforcedByOrg: boolean;
  orgMfaPolicy: 'OPTIONAL' | 'REQUIRED';
  recoveryCodesRemaining: number;
  currentAal: 'aal1' | 'aal2';
}

export interface RecoveryCodesResponse {
  recoveryCodes: string[];
  count: number;
  warning: string;
}

export const getMfaStatus = async (): Promise<MfaStatusResponse> => {
  const response = await client.get<{ success: boolean; data: MfaStatusResponse }>('/auth/mfa/status');
  return response.data.data;
};

export const generateRecoveryCodes = async (): Promise<RecoveryCodesResponse> => {
  const response = await client.post<{ success: boolean; data: RecoveryCodesResponse }>('/auth/mfa/recovery-codes');
  return response.data.data;
};

export const verifyRecoveryCode = async (code: string): Promise<{ success: boolean; remainingRecoveryCodes: number }> => {
  const response = await client.post<{ success: boolean; data: { success: boolean; remainingRecoveryCodes: number } }>(
    '/auth/mfa/recovery-verify',
    { code }
  );
  return response.data.data;
};

export const disableMfa = async (factorId?: string): Promise<{ success: boolean; message: string }> => {
  const response = await client.post<{ success: boolean; data: { success: boolean; message: string } }>(
    '/auth/mfa/disable',
    { factorId }
  );
  return response.data.data;
};

export const recordMfaAuditEvent = async (
  event: 'MFA_ENROLLED' | 'MFA_VERIFIED' | 'MFA_CHALLENGE_FAILED',
  details: Record<string, unknown> = {}
): Promise<{ success: boolean }> => {
  const response = await client.post<{ success: boolean; data: { success: boolean } }>(
    '/auth/mfa/audit-event',
    { event, details }
  );
  return response.data.data;
};

export const updateTenantMfaPolicy = async (
  mfaPolicy: 'OPTIONAL' | 'REQUIRED'
): Promise<{ success: boolean; mfaPolicy: string; message: string }> => {
  const response = await client.patch<{ success: boolean; data: { success: boolean; mfaPolicy: string; message: string } }>(
    '/crm/settings/mfa-policy',
    { mfaPolicy }
  );
  return response.data.data;
};
