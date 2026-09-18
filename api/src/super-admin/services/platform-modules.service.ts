import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    CreatePlatformModuleDto,
    DEFAULT_SUPER_ADMIN_NAV_MENUS,
    DEFAULT_TENANT_CRM_MODULES,
    UpdatePlatformModuleDto,
} from './platform-modules.defaults';

export {
    CreatePlatformModuleDto, DEFAULT_SUPER_ADMIN_NAV_MENUS, DEFAULT_TENANT_CRM_MODULES, NAVIGATION_SCOPE, UpdatePlatformModuleDto
} from './platform-modules.defaults';
export type { NavigationScope } from './platform-modules.defaults';

@Injectable()
export class PlatformModulesService {
  private isTenantCrmSeeded = false;
  private isSuperAdminSeeded = false;

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // SEEDING
  // ============================================================

  async seedDefaultModulesIfEmpty(): Promise<number> {
    if (this.isTenantCrmSeeded) {
      return DEFAULT_TENANT_CRM_MODULES.length;
    }

    try {
      // Backfill any records created before the navigationScope column existed
      await this.prisma.platformModule
        .updateMany({
          where: { navigationScope: '' as any },
          data: { navigationScope: 'TENANT_CRM' },
        })
        .catch(() => {
          /* ignore if column doesn't exist yet during migration */
        });

      const existingCount = await this.prisma.platformModule.count({
        where: { navigationScope: 'TENANT_CRM' },
      });

      if (existingCount >= DEFAULT_TENANT_CRM_MODULES.length) {
        this.isTenantCrmSeeded = true;
        return existingCount;
      }

      const existingModules = await this.prisma.platformModule.findMany({
        where: { navigationScope: 'TENANT_CRM' },
        select: { key: true },
      });
      const existingKeys = new Set(existingModules.map((m) => m.key));

      const missing = DEFAULT_TENANT_CRM_MODULES.filter(
        (m) => !existingKeys.has(m.key!),
      );
      if (missing.length > 0) {
        await this.prisma.platformModule.createMany({
          data: missing.map((mod) => ({
            key: mod.key!,
            label: mod.label,
            icon: mod.icon || 'Layers',
            route: mod.route,
            group: mod.group || 'Core',
            navigationScope: 'TENANT_CRM',
            sortOrder: mod.sortOrder ?? 0,
            isEnabled: mod.isEnabled ?? true,
            isVisible: mod.isVisible ?? true,
            isSystem: mod.isSystem ?? false,
            permission: mod.permission || null,
            badge: null,
            description: mod.description || null,
          })),
          skipDuplicates: true,
        });
      }

      this.isTenantCrmSeeded = true;
      return DEFAULT_TENANT_CRM_MODULES.length;
    } catch {
      return DEFAULT_TENANT_CRM_MODULES.length;
    }
  }

  async seedSuperAdminMenusIfEmpty(): Promise<number> {
    if (this.isSuperAdminSeeded) {
      return DEFAULT_SUPER_ADMIN_NAV_MENUS.length;
    }

    try {
      const existingCount = await this.prisma.platformModule.count({
        where: { navigationScope: 'SUPER_ADMIN' },
      });

      if (existingCount >= DEFAULT_SUPER_ADMIN_NAV_MENUS.length) {
        this.isSuperAdminSeeded = true;
        return existingCount;
      }

      const existingModules = await this.prisma.platformModule.findMany({
        where: { navigationScope: 'SUPER_ADMIN' },
        select: { key: true },
      });
      const existingKeys = new Set(existingModules.map((m) => m.key));

      const missing = DEFAULT_SUPER_ADMIN_NAV_MENUS.filter(
        (m) => !existingKeys.has(m.key),
      );
      if (missing.length > 0) {
        await this.prisma.platformModule.createMany({
          data: missing.map((mod) => ({
            key: mod.key,
            label: mod.label,
            icon: mod.icon || 'Layers',
            route: mod.route,
            group: mod.group || 'Platform',
            navigationScope: 'SUPER_ADMIN',
            sortOrder: mod.sortOrder ?? 0,
            isEnabled: true,
            isVisible: true,
            isSystem: mod.isSystem ?? false,
            permission: null,
            badge: null,
            description: mod.description || null,
          })),
          skipDuplicates: true,
        });
      }

      this.isSuperAdminSeeded = true;
      return DEFAULT_SUPER_ADMIN_NAV_MENUS.length;
    } catch {
      return DEFAULT_SUPER_ADMIN_NAV_MENUS.length;
    }
  }

  // ============================================================
  // LIST MODULES (scoped)
  // ============================================================

  async listModules(filters?: {
    search?: string;
    group?: string;
    navigationScope?: string;
    isEnabled?: boolean;
    isVisible?: boolean;
  }) {
    // Seed both scopes on first access
    await this.seedDefaultModulesIfEmpty();
    await this.seedSuperAdminMenusIfEmpty();

    const scope = filters?.navigationScope || 'TENANT_CRM';
    const where: any = { navigationScope: scope };

    if (filters?.group && filters.group !== 'ALL') {
      where.group = filters.group;
    }
    if (typeof filters?.isEnabled === 'boolean') {
      where.isEnabled = filters.isEnabled;
    }
    if (typeof filters?.isVisible === 'boolean') {
      where.isVisible = filters.isVisible;
    }
    if (filters?.search) {
      const q = filters.search.trim();
      where.OR = [
        { label: { contains: q, mode: 'insensitive' } },
        { key: { contains: q, mode: 'insensitive' } },
        { route: { contains: q, mode: 'insensitive' } },
        { group: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const scopeWhere = { navigationScope: scope };

    const [modules, totalCount, enabledCount, disabledCount, systemCount] =
      await Promise.all([
        this.prisma.platformModule.findMany({
          where,
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          include: {
            children: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        }),
        this.prisma.platformModule.count({ where: scopeWhere }),
        this.prisma.platformModule.count({
          where: { ...scopeWhere, isEnabled: true },
        }),
        this.prisma.platformModule.count({
          where: { ...scopeWhere, isEnabled: false },
        }),
        this.prisma.platformModule.count({
          where: { ...scopeWhere, isSystem: true },
        }),
      ]);

    return {
      modules,
      stats: {
        total: totalCount,
        enabled: enabledCount,
        disabled: disabledCount,
        system: systemCount,
      },
    };
  }

  // ============================================================
  // GET BY ID
  // ============================================================

  async getModuleById(id: string) {
    const module = await this.prisma.platformModule.findUnique({
      where: { id },
      include: {
        children: true,
        parent: true,
      },
    });
    if (!module) {
      throw new NotFoundException(`Platform module with ID ${id} not found`);
    }
    return module;
  }

  // ============================================================
  // CREATE
  // ============================================================

  async createModule(dto: CreatePlatformModuleDto, adminUserId: string) {
    // 1. Sanitize key
    const rawKey = dto.key || dto.label;
    const key = rawKey
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/__+/g, '_');

    if (!key) {
      throw new BadRequestException('Module key or valid label is required');
    }

    // 2. Check duplicates
    const existingKey = await this.prisma.platformModule.findUnique({
      where: { key },
    });
    if (existingKey) {
      throw new BadRequestException(`Module key '${key}' already exists`);
    }

    const existingRoute = await this.prisma.platformModule.findFirst({
      where: { route: dto.route.trim() },
    });
    if (existingRoute) {
      throw new BadRequestException(
        `Route '${dto.route}' is already used by module '${existingRoute.label}'`,
      );
    }

    // 3. Determine max sort order within same scope
    const scope = dto.navigationScope || 'TENANT_CRM';
    let sortOrder = dto.sortOrder;
    if (sortOrder === undefined || sortOrder === null) {
      const maxSort = await this.prisma.platformModule.aggregate({
        where: { navigationScope: scope },
        _max: { sortOrder: true },
      });
      sortOrder = (maxSort._max.sortOrder || 0) + 1;
    }

    // 4. Create module
    const created = await this.prisma.platformModule.create({
      data: {
        key,
        label: dto.label.trim(),
        icon: dto.icon || 'Layers',
        route: dto.route.trim(),
        group: dto.group?.trim() || 'Core',
        navigationScope: scope,
        parentId: dto.parentId || null,
        sortOrder,
        isEnabled: dto.isEnabled ?? true,
        isVisible: dto.isVisible ?? true,
        isSystem: dto.isSystem ?? false,
        permission: dto.permission?.trim() || dto.label.trim(),
        badge: dto.badge?.trim() || null,
        description: dto.description?.trim() || null,
      },
    });

    // 5. Audit Log
    await this.prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'PLATFORM_MODULE_CREATED',
        module: 'SuperAdmin',
        details: {
          moduleId: created.id,
          key: created.key,
          label: created.label,
          scope,
        },
      },
    });

    return created;
  }

  // ============================================================
  // UPDATE
  // ============================================================

  async updateModule(
    id: string,
    dto: UpdatePlatformModuleDto,
    adminUserId: string,
  ) {
    const existing = await this.getModuleById(id);

    // If key is being updated, check uniqueness
    let key = existing.key;
    if (dto.key && dto.key !== existing.key) {
      if (existing.isSystem) {
        throw new ForbiddenException(
          'Key cannot be modified for core system modules',
        );
      }
      key = dto.key
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/__+/g, '_');
      const duplicateKey = await this.prisma.platformModule.findFirst({
        where: { key, NOT: { id } },
      });
      if (duplicateKey) {
        throw new BadRequestException(`Module key '${key}' already in use`);
      }
    }

    // If route is updated, check uniqueness
    if (dto.route && dto.route !== existing.route) {
      const duplicateRoute = await this.prisma.platformModule.findFirst({
        where: { route: dto.route.trim(), NOT: { id } },
      });
      if (duplicateRoute) {
        throw new BadRequestException(
          `Route '${dto.route}' is already in use by module '${duplicateRoute.label}'`,
        );
      }
    }

    // Validate parent hierarchy
    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('A module cannot be its own parent');
      }
      const parentExists = await this.prisma.platformModule.findUnique({
        where: { id: dto.parentId },
      });
      if (!parentExists) {
        throw new BadRequestException('Specified parent module does not exist');
      }
    }

    const updated = await this.prisma.platformModule.update({
      where: { id },
      data: {
        key,
        label: dto.label !== undefined ? dto.label.trim() : existing.label,
        icon: dto.icon !== undefined ? dto.icon : existing.icon,
        route: dto.route !== undefined ? dto.route.trim() : existing.route,
        group: dto.group !== undefined ? dto.group.trim() : existing.group,
        parentId: dto.parentId !== undefined ? dto.parentId : existing.parentId,
        sortOrder:
          dto.sortOrder !== undefined ? dto.sortOrder : existing.sortOrder,
        isEnabled:
          dto.isEnabled !== undefined ? dto.isEnabled : existing.isEnabled,
        isVisible:
          dto.isVisible !== undefined ? dto.isVisible : existing.isVisible,
        permission:
          dto.permission !== undefined
            ? dto.permission
              ? dto.permission.trim()
              : null
            : existing.permission,
        badge:
          dto.badge !== undefined
            ? dto.badge
              ? dto.badge.trim()
              : null
            : existing.badge,
        description:
          dto.description !== undefined
            ? dto.description
              ? dto.description.trim()
              : null
            : existing.description,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'PLATFORM_MODULE_UPDATED',
        module: 'SuperAdmin',
        details: {
          moduleId: id,
          scope: existing.navigationScope,
          changes: dto as any,
        },
      },
    });

    return updated;
  }

  // ============================================================
  // TOGGLE STATUS
  // ============================================================

  async toggleModuleStatus(
    id: string,
    params: { isEnabled?: boolean; isVisible?: boolean },
    adminUserId: string,
  ) {
    const existing = await this.getModuleById(id);

    const updated = await this.prisma.platformModule.update({
      where: { id },
      data: {
        isEnabled:
          params.isEnabled !== undefined
            ? params.isEnabled
            : existing.isEnabled,
        isVisible:
          params.isVisible !== undefined
            ? params.isVisible
            : existing.isVisible,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'PLATFORM_MODULE_STATUS_TOGGLED',
        module: 'SuperAdmin',
        details: {
          moduleId: id,
          scope: existing.navigationScope,
          isEnabled: updated.isEnabled,
          isVisible: updated.isVisible,
        },
      },
    });

    return updated;
  }

  // ============================================================
  // REORDER
  // ============================================================

  async reorderModules(
    items: Array<{ id: string; sortOrder: number }>,
    adminUserId: string,
  ) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new BadRequestException(
        'Items array with id and sortOrder is required',
      );
    }

    const updates = items.map((item) =>
      this.prisma.platformModule.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      }),
    );

    await this.prisma.$transaction(updates);

    await this.prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'PLATFORM_MODULES_REORDERED',
        module: 'SuperAdmin',
        details: { reorderedCount: items.length },
      },
    });

    return {
      success: true,
      message: 'Platform modules reordered successfully',
    };
  }

  // ============================================================
  // DELETE
  // ============================================================

  async deleteModule(id: string, adminUserId: string) {
    const existing = await this.getModuleById(id);

    if (existing.isSystem) {
      throw new ForbiddenException(
        `'${existing.label}' is a core system module and cannot be deleted. You can disable or hide it instead.`,
      );
    }

    const childCount = await this.prisma.platformModule.count({
      where: { parentId: id },
    });
    if (childCount > 0) {
      throw new BadRequestException(
        `Cannot delete module because it has ${childCount} child sub-module(s). Reassign or delete child items first.`,
      );
    }

    await this.prisma.platformModule.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'PLATFORM_MODULE_DELETED',
        module: 'SuperAdmin',
        details: {
          moduleId: id,
          key: existing.key,
          label: existing.label,
          scope: existing.navigationScope,
        },
      },
    });

    return {
      success: true,
      message: `Platform module '${existing.label}' deleted successfully`,
    };
  }

  // ============================================================
  // TENANT CRM NAVIGATION
  // Returns only TENANT_CRM scope, enabled & visible, role-filtered
  // ============================================================

  async getNavigationMenu(userContext?: {
    isSuperAdmin?: boolean;
    role?: string;
    permissions?: string[];
  }) {
    await this.seedDefaultModulesIfEmpty();

    // CRITICAL: only TENANT_CRM scope — never return Super Admin nav items to the CRM sidebar
    const modules = await this.prisma.platformModule.findMany({
      where: {
        navigationScope: 'TENANT_CRM',
        isEnabled: true,
        isVisible: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    const isSuperAdmin = userContext?.isSuperAdmin === true;
    const roleUpper = (userContext?.role || '').toUpperCase();
    const isAdmin = roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN';

    if (isSuperAdmin || isAdmin) {
      return modules;
    }

    const userPermissions = userContext?.permissions || [];
    const normalizedPerms = userPermissions.map((p) => p.trim().toLowerCase());

    return modules.filter((mod) => {
      if (!mod.permission) return true;
      const permLower = mod.permission.toLowerCase();
      const keyLower = mod.key.toLowerCase();
      const labelLower = mod.label.toLowerCase();
      return (
        normalizedPerms.includes(permLower) ||
        normalizedPerms.includes(keyLower) ||
        normalizedPerms.includes(labelLower) ||
        normalizedPerms.some(
          (p) => p.startsWith(keyLower) || p.startsWith(permLower),
        )
      );
    });
  }

  // ============================================================
  // SUPER ADMIN NAVIGATION
  // Returns only SUPER_ADMIN scope, enabled & visible
  // Used exclusively by the Super Admin platform sidebar
  // ============================================================

  async getSuperAdminNavigationMenu() {
    await this.seedSuperAdminMenusIfEmpty();

    return this.prisma.platformModule.findMany({
      where: {
        navigationScope: 'SUPER_ADMIN',
        isEnabled: true,
        isVisible: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }
}
