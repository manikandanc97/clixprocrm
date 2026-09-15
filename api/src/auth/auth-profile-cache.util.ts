export interface CachedUserProfile {
  data: any;
  expiresAt: number;
}

const meProfileCache = new Map<string, CachedUserProfile>();

export function invalidateGetMeCache(userId?: string) {
  if (userId) {
    for (const key of meProfileCache.keys()) {
      if (key.startsWith(userId)) {
        meProfileCache.delete(key);
      }
    }
  } else {
    meProfileCache.clear();
  }
}

export function getCachedUserProfile(cacheKey: string): any | null {
  const now = Date.now();
  const cached = meProfileCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }
  return null;
}

export function setCachedUserProfile(
  cacheKey: string,
  data: any,
  ttlMs = 30000,
) {
  meProfileCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

export function buildSuperAdminProfile(user: any) {
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: (user as any).avatar || null,
      status: user.status,
      mustResetPassword: Boolean((user as any).mustResetPassword),
      tenantId: null,
      companyName: 'ClixProCRM Platform',
      role: 'SUPER_ADMIN',
      isSuperAdmin: true,
      permissions: ['*'],
    },
  };
}

export function buildTenantUserProfile(user: any, membership: any) {
  const roleName = membership.role?.name || 'MEMBER';
  const permissions = (membership.role?.permissions || [])
    .filter((rp: any) => rp.hasAccess)
    .map((rp: any) => rp.module);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: (user as any).avatar || null,
      status: user.status,
      mustResetPassword: Boolean((user as any).mustResetPassword),
      tenantId: membership.tenantId,
      companyName: membership.tenant?.name || 'My Workspace',
      companyLogo: membership.tenant?.logo || null,
      brandPrimaryColor:
        (membership.tenant as any)?.brandPrimaryColor || null,
      role: roleName,
      isSuperAdmin: false,
      permissions,
    },
  };
}
