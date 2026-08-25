import { Injectable, Logger } from '@nestjs/common';
import { DataScope } from './authorization-types';

interface CachedPermissions {
  permissions: Map<string, DataScope>;
  isOrgOwner: boolean;
  isSuperAdmin: boolean;
  expiresAt: number;
}

interface CachedTeams {
  teamIds: string[];
  expiresAt: number;
}

interface CachedHierarchy {
  subordinateIds: string[];
  expiresAt: number;
}

@Injectable()
export class AuthorizationCacheService {
  private readonly logger = new Logger(AuthorizationCacheService.name);
  private readonly DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

  private readonly permissionCache = new Map<string, CachedPermissions>();
  private readonly teamCache = new Map<string, CachedTeams>();
  private readonly hierarchyCache = new Map<string, CachedHierarchy>();

  constructor() {
    // Periodic cache cleanup
    setInterval(() => {
      const now = Date.now();
      for (const [key, val] of this.permissionCache.entries()) {
        if (val.expiresAt <= now) this.permissionCache.delete(key);
      }
      for (const [key, val] of this.teamCache.entries()) {
        if (val.expiresAt <= now) this.teamCache.delete(key);
      }
      for (const [key, val] of this.hierarchyCache.entries()) {
        if (val.expiresAt <= now) this.hierarchyCache.delete(key);
      }
    }, 60000).unref?.();
  }

  private userKey(tenantId: string, userId: string): string {
    return `tenant:${tenantId}:user:${userId}`;
  }

  // --- Permissions Cache ---

  getPermissions(
    tenantId: string,
    userId: string,
  ): { permissions: Map<string, DataScope>; isOrgOwner: boolean; isSuperAdmin: boolean } | null {
    const key = this.userKey(tenantId, userId);
    const cached = this.permissionCache.get(key);
    if (!cached || cached.expiresAt <= Date.now()) {
      return null;
    }
    return {
      permissions: cached.permissions,
      isOrgOwner: cached.isOrgOwner,
      isSuperAdmin: cached.isSuperAdmin,
    };
  }

  setPermissions(
    tenantId: string,
    userId: string,
    permissions: Map<string, DataScope>,
    isOrgOwner: boolean,
    isSuperAdmin: boolean,
    ttlMs: number = this.DEFAULT_TTL_MS,
  ): void {
    const key = this.userKey(tenantId, userId);
    this.permissionCache.set(key, {
      permissions,
      isOrgOwner,
      isSuperAdmin,
      expiresAt: Date.now() + ttlMs,
    });
  }

  // --- Teams Cache ---

  getTeams(tenantId: string, userId: string): string[] | null {
    const key = this.userKey(tenantId, userId);
    const cached = this.teamCache.get(key);
    if (!cached || cached.expiresAt <= Date.now()) {
      return null;
    }
    return cached.teamIds;
  }

  setTeams(
    tenantId: string,
    userId: string,
    teamIds: string[],
    ttlMs: number = this.DEFAULT_TTL_MS,
  ): void {
    const key = this.userKey(tenantId, userId);
    this.teamCache.set(key, {
      teamIds,
      expiresAt: Date.now() + ttlMs,
    });
  }

  // --- Hierarchy Cache ---

  getHierarchy(tenantId: string, userId: string): string[] | null {
    const key = this.userKey(tenantId, userId);
    const cached = this.hierarchyCache.get(key);
    if (!cached || cached.expiresAt <= Date.now()) {
      return null;
    }
    return cached.subordinateIds;
  }

  setHierarchy(
    tenantId: string,
    userId: string,
    subordinateIds: string[],
    ttlMs: number = this.DEFAULT_TTL_MS,
  ): void {
    const key = this.userKey(tenantId, userId);
    this.hierarchyCache.set(key, {
      subordinateIds,
      expiresAt: Date.now() + ttlMs,
    });
  }

  // --- Invalidation ---

  invalidateUser(tenantId: string, userId: string): void {
    const key = this.userKey(tenantId, userId);
    this.permissionCache.delete(key);
    this.teamCache.delete(key);
    this.hierarchyCache.delete(key);
    this.logger.debug(`Invalidated auth cache for user ${userId} in tenant ${tenantId}`);
  }

  invalidateTenant(tenantId: string): void {
    const prefix = `tenant:${tenantId}:`;
    for (const key of this.permissionCache.keys()) {
      if (key.startsWith(prefix)) this.permissionCache.delete(key);
    }
    for (const key of this.teamCache.keys()) {
      if (key.startsWith(prefix)) this.teamCache.delete(key);
    }
    for (const key of this.hierarchyCache.keys()) {
      if (key.startsWith(prefix)) this.hierarchyCache.delete(key);
    }
    this.logger.debug(`Invalidated auth cache for tenant ${tenantId}`);
  }

  invalidateAll(): void {
    this.permissionCache.clear();
    this.teamCache.clear();
    this.hierarchyCache.clear();
  }
}
