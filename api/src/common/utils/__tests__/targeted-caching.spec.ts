import {
    invalidateDashboardCache,
    invalidateEmployeeDashboardCache
} from '../../../insights/services/dashboard.service';
import { NotificationsService } from '../../../notifications/services/notifications.service';
import {
    clearAllLocalCache,
    getLocalCacheSize,
    getOrSetCache,
    invalidateCacheKey
} from '../cache.util';
import * as rateLimitUtil from '../rate-limit.util';

describe('Phase 5: Targeted Redis & In-Memory Fallback Caching Tests', () => {
  beforeEach(() => {
    clearAllLocalCache();
    jest.restoreAllMocks();
  });

  describe('1. Cache Hit, Miss, and Fallback Behavior', () => {
    it('should compute on cache miss and return cached value on subsequent hits', async () => {
      const mockFetch = jest.fn().mockResolvedValue({ kpi: 100 });

      // First call -> Cache miss -> calls mockFetch
      const result1 = await getOrSetCache('test:kpi:t1', 30, mockFetch);
      expect(result1).toEqual({ kpi: 100 });
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call -> Cache hit -> returns cached, does NOT call mockFetch
      const result2 = await getOrSetCache('test:kpi:t1', 30, mockFetch);
      expect(result2).toEqual({ kpi: 100 });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should gracefully fall back to fresh fetch when Redis client throws an error', async () => {
      const mockRedis = {
        get: jest.fn().mockRejectedValue(new Error('Redis connection timeout')),
        set: jest.fn().mockRejectedValue(new Error('Redis connection timeout')),
      };
      jest.spyOn(rateLimitUtil, 'getSharedRedisClient').mockReturnValue(mockRedis as any);

      const mockFetch = jest.fn().mockResolvedValue({ revenue: 50000 });

      // Must NOT throw; must return fresh data from fetchFn
      const result = await getOrSetCache('test:error:t1', 30, mockFetch);
      expect(result).toEqual({ revenue: 50000 });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('2. Memory Safety & Strict LRU Eviction', () => {
    it('should bound in-memory cache to maximum capacity (500 entries) without leaking memory', async () => {
      // Insert 550 unique items into local cache
      for (let i = 0; i < 550; i++) {
        await getOrSetCache(`test:bounded:key-${i}`, 30, async () => ({ index: i }));
      }

      // Memory size must never exceed 500
      expect(getLocalCacheSize()).toBeLessThanOrEqual(500);
    });
  });

  describe('3. Multi-Tenant Isolation Verification', () => {
    it('should strictly isolate cached data between tenants (no cross-tenant leakage)', async () => {
      const fetchTenantA = jest.fn().mockResolvedValue({ tenant: 'Tenant-A', data: [1, 2, 3] });
      const fetchTenantB = jest.fn().mockResolvedValue({ tenant: 'Tenant-B', data: [99, 100] });

      interface TenantMockData {
        tenant: string;
        data: number[];
      }

      const resA = await getOrSetCache<TenantMockData>(
        'dashboard:kpi:tenant-a:month',
        30,
        fetchTenantA,
      );
      const resB = await getOrSetCache<TenantMockData>(
        'dashboard:kpi:tenant-b:month',
        30,
        fetchTenantB,
      );

      expect(resA.tenant).toBe('Tenant-A');
      expect(resB.tenant).toBe('Tenant-B');
      expect(resA.data).toEqual([1, 2, 3]);
      expect(resB.data).toEqual([99, 100]);

      // Cache hit on Tenant A must not return Tenant B
      const cachedA = await getOrSetCache<TenantMockData>(
        'dashboard:kpi:tenant-a:month',
        30,
        fetchTenantA,
      );
      expect(cachedA.tenant).toBe('Tenant-A');
      expect(fetchTenantA).toHaveBeenCalledTimes(1);
    });
  });

  describe('4. Deterministic Invalidation Verification (No Redis KEYS)', () => {
    it('should invalidate specific key and trigger re-fetch on next call', async () => {
      const mockFetch = jest.fn()
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 2 });

      await getOrSetCache('notifications:unread:t1:u1', 10, mockFetch);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Invalidate
      await invalidateCacheKey('notifications:unread:t1:u1');

      // Next call must be a miss and fetch fresh count
      const fresh = await getOrSetCache('notifications:unread:t1:u1', 10, mockFetch);
      expect(fresh).toEqual({ count: 2 });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should invalidate deterministic dashboard timeframe and employee keys without keyspace scan', async () => {
      const fetchMonth = jest.fn().mockResolvedValue({ timeframe: 'month' });
      const fetchWeek = jest.fn().mockResolvedValue({ timeframe: 'week' });
      const fetchEmp = jest.fn().mockResolvedValue({ myTasks: 3 });

      await getOrSetCache('dashboard:kpi:tenant-99:month', 30, fetchMonth);
      await getOrSetCache('dashboard:kpi:tenant-99:week', 30, fetchWeek);
      await getOrSetCache('dashboard:emp:tenant-99:user-1', 30, fetchEmp);

      // Invalidate all tenant-99 dashboard keys + employee user-1
      await invalidateDashboardCache('tenant-99', ['user-1']);

      // All should now trigger fresh fetches
      await getOrSetCache('dashboard:kpi:tenant-99:month', 30, fetchMonth);
      await getOrSetCache('dashboard:kpi:tenant-99:week', 30, fetchWeek);
      await getOrSetCache('dashboard:emp:tenant-99:user-1', 30, fetchEmp);

      expect(fetchMonth).toHaveBeenCalledTimes(2);
      expect(fetchWeek).toHaveBeenCalledTimes(2);
      expect(fetchEmp).toHaveBeenCalledTimes(2);
    });

    it('should support targeted single employee dashboard invalidation', async () => {
      const fetchEmp1 = jest.fn().mockResolvedValue({ user: 'u1' });
      const fetchEmp2 = jest.fn().mockResolvedValue({ user: 'u2' });

      await getOrSetCache('dashboard:emp:t1:u1', 30, fetchEmp1);
      await getOrSetCache('dashboard:emp:t1:u2', 30, fetchEmp2);

      // Invalidate ONLY u1
      await invalidateEmployeeDashboardCache('t1', 'u1');

      await getOrSetCache('dashboard:emp:t1:u1', 30, fetchEmp1);
      await getOrSetCache('dashboard:emp:t1:u2', 30, fetchEmp2);

      // u1 re-fetched, u2 stayed cached
      expect(fetchEmp1).toHaveBeenCalledTimes(2);
      expect(fetchEmp2).toHaveBeenCalledTimes(1);
    });
  });

  describe('5. NotificationsService Unread Count Caching & Invalidation', () => {
    it('should cache unread count and invalidate on markAsRead', async () => {
      let unreadCount = 5;
      const mockPrisma: any = {
        withTenantContext: jest.fn(async (_ctx, cb) => {
          return cb({
            notification: {
              count: jest.fn(async () => unreadCount),
              findUnique: jest.fn(async () => ({
                id: 'notif-1',
                tenantId: 'tenant-1',
                userId: 'user-1',
                isRead: false,
              })),
              update: jest.fn(async () => {
                unreadCount--;
                return { id: 'notif-1', isRead: true };
              }),
            },
          });
        }),
      };

      const service = new NotificationsService(mockPrisma);

      // 1. Initial count -> 5
      const count1 = await service.getUnreadCount('tenant-1', 'user-1');
      expect(count1).toBe(5);

      // 2. Cached count -> still 5 without DB query
      const count2 = await service.getUnreadCount('tenant-1', 'user-1');
      expect(count2).toBe(5);

      // 3. Mark as read -> invalidates cache
      await service.markAsRead('tenant-1', 'user-1', 'notif-1');

      // 4. Fresh count -> 4
      const count3 = await service.getUnreadCount('tenant-1', 'user-1');
      expect(count3).toBe(4);
    });
  });
});
