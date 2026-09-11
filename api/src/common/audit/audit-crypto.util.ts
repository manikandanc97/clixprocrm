import * as crypto from 'crypto';

export interface AuditLogSealInput {
  id: string;
  tenantId: string | null;
  userId: string | null;
  targetUserId: string | null;
  action: string;
  module: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date | string;
  previousHash: string | null;
}

const DEV_FALLBACK_SECRET =
  'clixpro_dev_test_audit_hmac_secret_2026_deterministic';

/**
 * Retrieves the cryptographic secret for AuditLog HMAC signing.
 * Strictly requires AUDIT_LOG_HMAC_SECRET in production.
 */
export function getAuditHmacSecret(): string {
  const secret = process.env.AUDIT_LOG_HMAC_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Critical security configuration error: AUDIT_LOG_HMAC_SECRET environment variable is required in production',
      );
    }
    return DEV_FALLBACK_SECRET;
  }
  return secret;
}

/**
 * Recursively sorts all keys in an object to produce deterministic JSON.
 */
export function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  const sorted: Record<string, any> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = sortObjectKeys(obj[key]);
  }
  return sorted;
}

/**
 * Computes the deterministic HMAC-SHA256 hash for an AuditLog record.
 */
export function computeAuditRecordHash(
  payload: AuditLogSealInput,
  secret?: string,
): string {
  const hmacSecret = secret || getAuditHmacSecret();

  const canonicalDetails = payload.details
    ? JSON.stringify(sortObjectKeys(payload.details))
    : '';

  const createdAtIso =
    payload.createdAt instanceof Date
      ? payload.createdAt.toISOString()
      : new Date(payload.createdAt).toISOString();

  const canonicalString = [
    payload.id,
    payload.tenantId || '',
    payload.userId || '',
    payload.targetUserId || '',
    payload.action,
    payload.module || '',
    canonicalDetails,
    payload.ipAddress || '',
    payload.userAgent || '',
    createdAtIso,
    payload.previousHash || 'GENESIS',
  ].join('|');

  return crypto
    .createHmac('sha256', hmacSecret)
    .update(canonicalString, 'utf8')
    .digest('hex');
}

/**
 * Verifies that a given record's computed HMAC matches its stored recordHash in constant time.
 */
export function verifyRecordHash(
  payload: AuditLogSealInput,
  storedHash: string | null | undefined,
  secret?: string,
): boolean {
  if (!storedHash || typeof storedHash !== 'string') {
    return false;
  }

  const expectedHash = computeAuditRecordHash(payload, secret);
  const expectedBuf = Buffer.from(expectedHash, 'hex');
  const storedBuf = Buffer.from(storedHash, 'hex');

  if (expectedBuf.length !== storedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, storedBuf);
}
