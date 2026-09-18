
interface CachedTenantMetadata {
  currency: string;
  expiresAt: number;
}

const tenantMetadataCache = new Map<string, CachedTenantMetadata>();

/**
 * Get tenant currency with a 5-minute in-memory cache.
 * Avoids repeated database roundtrips on every controller method.
 */
export async function getCachedTenantCurrency(
  prisma: any,
  tenantId: string,
): Promise<string> {
  const now = Date.now();
  const cached = tenantMetadataCache.get(tenantId);
  if (cached && cached.expiresAt > now) {
    return cached.currency;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { currency: true },
  });

  const currency = tenant?.currency || 'INR';
  tenantMetadataCache.set(tenantId, {
    currency,
    expiresAt: now + 5 * 60 * 1000, // 5 minutes TTL
  });

  return currency;
}

/**
 * Invalidate cached tenant metadata when tenant/workspace settings are updated
 */
export function invalidateTenantCache(tenantId?: string) {
  if (tenantId) {
    tenantMetadataCache.delete(tenantId);
  } else {
    tenantMetadataCache.clear();
  }
}
