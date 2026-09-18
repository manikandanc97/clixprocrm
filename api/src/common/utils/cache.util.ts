import { getSharedRedisClient } from './rate-limit.util';

interface LocalCacheEntry<T> {
  value: T;
  expiresAt: number;
}

const MAX_LOCAL_CACHE_ENTRIES = 500;
const L1_BURST_TTL_SECONDS = 2; // Short micro-window to deduplicate burst traffic across sibling instances
const localCache = new Map<string, LocalCacheEntry<any>>();

/**
 * Safely insert an entry into local memory with LRU + TTL eviction and strict size capping.
 */
function setLocalCacheEntry<T>(key: string, value: T, ttlSeconds: number): void {
  const now = Date.now();

  // If at capacity, sweep expired entries first
  if (localCache.size >= MAX_LOCAL_CACHE_ENTRIES) {
    for (const [k, v] of localCache.entries()) {
      if (v.expiresAt <= now) {
        localCache.delete(k);
      }
    }
    // If still at capacity, evict the oldest entry (LRU)
    if (localCache.size >= MAX_LOCAL_CACHE_ENTRIES) {
      const oldestKey = localCache.keys().next().value;
      if (oldestKey) {
        localCache.delete(oldestKey);
      }
    }
  }

  // Delete first to refresh insertion order for Map iteration (LRU behavior)
  localCache.delete(key);
  localCache.set(key, {
    value,
    expiresAt: now + ttlSeconds * 1000,
  });
}

/**
 * Get or set a cached value using Redis as the shared source of truth,
 * with a short L1 in-memory burst-deduplication window and graceful DB fallback.
 *
 * @param key Tenant-isolated cache key (e.g. `dashboard:kpi:${tenantId}:${timeframe}`)
 * @param ttlSeconds Time-to-live in seconds
 * @param fetchFn Factory function to compute/fetch fresh data on cache miss
 */
export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>,
): Promise<T> {
  const now = Date.now();

  // 1. Check local in-memory L1 cache (sub-millisecond burst deduplication)
  const localEntry = localCache.get(key);
  if (localEntry) {
    if (localEntry.expiresAt > now) {
      // Refresh LRU ordering
      localCache.delete(key);
      localCache.set(key, localEntry);
      return localEntry.value as T;
    } else {
      localCache.delete(key);
    }
  }

  // 2. Try Redis as shared L2 source of truth
  const redis = getSharedRedisClient();
  if (redis) {
    try {
      const cached = await redis.get<T>(key);
      if (cached !== null && cached !== undefined) {
        // Populate local L1 cache with micro-window (2s) to absorb micro-bursts without cross-instance staleness
        const l1Ttl = Math.min(ttlSeconds, L1_BURST_TTL_SECONDS);
        setLocalCacheEntry(key, cached, l1Ttl);
        return cached;
      }
    } catch {
      // Redis error/offline - gracefully proceed to fetchFn
    }
  }

  // 3. Cache miss: execute fetchFn
  const freshData = await fetchFn();

  // 4. Populate caches
  // When Redis is active, local L1 TTL is 2s to guarantee sibling Render instances never lag beyond 2s.
  // If Redis is offline/absent, local L1 uses the full ttlSeconds.
  const l1Ttl = redis ? Math.min(ttlSeconds, L1_BURST_TTL_SECONDS) : ttlSeconds;
  setLocalCacheEntry(key, freshData, l1Ttl);

  if (redis) {
    try {
      await redis.set(key, freshData, { ex: ttlSeconds });
    } catch {
      // Redis write failure is non-fatal
    }
  }

  return freshData;
}

/**
 * Invalidate a single cache key across local in-memory cache and Redis.
 */
export async function invalidateCacheKey(key: string): Promise<void> {
  localCache.delete(key);
  const redis = getSharedRedisClient();
  if (redis) {
    try {
      await redis.del(key);
    } catch {
      // Non-fatal
    }
  }
}

/**
 * Invalidate multiple deterministic cache keys atomically across local in-memory cache and Redis.
 * Avoids O(N) keyspace scanning.
 */
export async function invalidateCacheKeys(keys: string[]): Promise<void> {
  if (!keys || keys.length === 0) return;

  for (const k of keys) {
    localCache.delete(k);
  }

  const redis = getSharedRedisClient();
  if (redis) {
    try {
      await redis.del(...keys);
    } catch {
      // Non-fatal
    }
  }
}

/**
 * Invalidate multiple cache keys matching a prefix in local in-memory cache.
 * Note: Does NOT scan Redis keyspace to prevent O(N) blocking.
 */
export async function invalidateCachePrefix(prefix: string): Promise<void> {
  for (const k of localCache.keys()) {
    if (k.startsWith(prefix)) {
      localCache.delete(k);
    }
  }
}

/**
 * Clear all local cache entries (useful for test teardown)
 */
export function clearAllLocalCache(): void {
  localCache.clear();
}

/**
 * Get current local cache size (useful for test assertions)
 */
export function getLocalCacheSize(): number {
  return localCache.size;
}
