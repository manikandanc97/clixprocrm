/**
 * AuditLog Payload Sanitization Utility
 * Ensures no sensitive credentials, secrets, hashes, or oversized payloads enter the audit trail.
 */

const SENSITIVE_KEY_PATTERNS = [
  'password',
  'pass',
  'secret',
  'token',
  'jwt',
  'hash',
  'otp',
  'code',
  'recovery',
  'smtp',
  'redis',
  'credential',
  'auth',
  'cookie',
  'authorization',
  'apikey',
  'api_key',
  'private',
];

const SAFE_EXEMPTION_KEYS = new Set([
  'factorid',
  'sessionrecordid',
  'sessionid',
  'isnewdevice',
  'firstlogin',
  'revokedcount',
  'iscurrentsession',
  'remainingrecoverycodes',
  'action',
  'module',
  'status',
  'rolename',
  'roleid',
  'orgid',
  'orgname',
  'deletedbyuserid',
  'deleteduserid',
  'cascadefromtenantdeletion',
  'selfdeleted',
]);

/**
 * Sanitizes arbitrary JSON payload for AuditLog details.
 * - Strips sensitive credentials and tokens
 * - Recursively processes nested objects
 * - Limits string lengths and total payload size to prevent flooding
 */
export function sanitizeAuditDetails(
  details: any,
  maxSizeBytes = 2048,
): Record<string, any> {
  if (!details || typeof details !== 'object' || Array.isArray(details)) {
    return {};
  }

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(details)) {
    const lowerKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Check if key is exempted
    const isExempt = SAFE_EXEMPTION_KEYS.has(lowerKey);

    // Check if key matches sensitive patterns
    const isSensitive =
      !isExempt && SENSITIVE_KEY_PATTERNS.some((pat) => lowerKey.includes(pat));

    if (isSensitive) {
      continue; // Drop sensitive field
    }

    if (value === null || value === undefined) {
      sanitized[key] = null;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeAuditDetails(value, maxSizeBytes);
    } else if (Array.isArray(value)) {
      sanitized[key] = value
        .slice(0, 50)
        .map((item) =>
          typeof item === 'object' && item !== null
            ? sanitizeAuditDetails(item, maxSizeBytes)
            : typeof item === 'string'
              ? item.slice(0, 200)
              : item,
        );
    } else if (typeof value === 'string') {
      sanitized[key] = value.length > 500 ? value.slice(0, 500) : value;
    } else if (
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint'
    ) {
      sanitized[key] = value;
    }
  }

  try {
    const serialized = JSON.stringify(sanitized);
    if (serialized.length > maxSizeBytes) {
      return {
        _truncated: true,
        _warning: 'Payload size exceeded safe limit',
        _preservedKeys: Object.keys(sanitized).slice(0, 10),
      };
    }
  } catch {
    return { _error: 'Failed to serialize audit details' };
  }

  return sanitized;
}
