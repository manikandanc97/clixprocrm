import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreatePlatformModuleDto {
  key?: string;
  label: string;
  icon?: string;
  route: string;
  group?: string;
  parentId?: string | null;
  sortOrder?: number;
  isEnabled?: boolean;
  isVisible?: boolean;
  isSystem?: boolean;
  permission?: string | null;
  badge?: string | null;
  description?: string | null;
}

export interface UpdatePlatformModuleDto {
  key?: string;
  label?: string;
  icon?: string;
  route?: string;
  group?: string;
  parentId?: string | null;
  sortOrder?: number;
  isEnabled?: boolean;
  isVisible?: boolean;
  isSystem?: boolean;
  permission?: string | null;
  badge?: string | null;
  description?: string | null;
}

const DEFAULT_PLATFORM_MODULES: CreatePlatformModuleDto[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    route: '/dashboard',
    group: 'Core',
    sortOrder: 1,
    isSystem: true,
    permission: 'Dashboard',
    description: 'Main workspace KPI overview and operational activity stream',
  },
  {
    key: 'contacts',
    label: 'Contacts',
    icon: 'Users',
    route: '/contacts',
    group: 'Core',
    sortOrder: 2,
    isSystem: true,
    permission: 'Contacts',
    description: 'Customer contacts and relationship directory',
  },
  {
    key: 'companies',
    label: 'Companies',
    icon: 'Building2',
    route: '/companies',
    group: 'Core',
    sortOrder: 3,
    isSystem: true,
    permission: 'Companies',
    description: 'Business accounts and corporate directory',
  },
  {
    key: 'deals',
    label: 'Deals',
    icon: 'Handshake',
    route: '/deals',
    group: 'Core',
    sortOrder: 4,
    isSystem: true,
    permission: 'Deals',
    description: 'Sales pipelines, deal stages, and opportunity tracking',
  },
  {
    key: 'tasks',
    label: 'Tasks',
    icon: 'CheckSquare',
    route: '/tasks',
    group: 'Core',
    sortOrder: 5,
    isSystem: true,
    permission: 'Tasks',
    description: 'Task assignments, checklists, and daily actions',
  },
  {
    key: 'calendar',
    label: 'Calendar',
    icon: 'CalendarDays',
    route: '/calendar',
    group: 'Core',
    sortOrder: 6,
    isSystem: true,
    permission: 'Calendar',
    description: 'Team schedules, customer meetings, and deadlines',
  },
  {
    key: 'quotations',
    label: 'Quotations',
    icon: 'FileText',
    route: '/quotations',
    group: 'CRM',
    sortOrder: 7,
    isSystem: true,
    permission: 'Quotations',
    description: 'Proposals, client quotations, and approval workflows',
  },
  {
    key: 'clixpro_ai',
    label: 'ClixPro AI',
    icon: 'Sparkles',
    route: '/ai',
    group: 'AI',
    sortOrder: 8,
    isSystem: true,
    permission: null,
    description: 'Enterprise AI Workspace for CRM analysis and action execution',
  },
  {
    key: 'reports',
    label: 'Reports & Analytics',
    icon: 'BarChart3',
    route: '/reports',
    group: 'Insights',
    sortOrder: 9,
    isSystem: false,
    permission: 'Reports & Analytics',
    description: 'Revenue performance and conversion analytics',
  },
  {
    key: 'employees',
    label: 'Employees',
    icon: 'UserSquare2',
    route: '/employees',
    group: 'Administration',
    sortOrder: 9,
    isSystem: false,
    permission: 'Employees',
    description: 'Team member directory and onboarding',
  },
  {
    key: 'role_management',
    label: 'Role Management',
    icon: 'ShieldCheck',
    route: '/role-management',
    group: 'Administration',
    sortOrder: 10,
    isSystem: false,
    permission: 'Role Management',
    description: 'Custom roles, granular access, and permissions',
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: 'Settings',
    route: '/settings',
    group: 'Administration',
    sortOrder: 11,
    isSystem: true,
    permission: 'Settings',
    description: 'Workspace profile, currencies, branding, and defaults',
  },
  {
    key: 'support_tickets',
    label: 'Support Tickets',
    icon: 'Ticket',
    route: '/support-tickets',
    group: 'Core',
    sortOrder: 12,
    isSystem: false,
    permission: 'Support Tickets',
    description: 'Customer support issues and resolution tracking',
  },
  {
    key: 'team_performance',
    label: 'Team Performance',
    icon: 'BriefcaseBusiness',
    route: '/team-performance',
    group: 'Insights',
    sortOrder: 13,
    isSystem: false,
    permission: 'Team Performance',
    description: 'Managerial performance summaries and KPIs',
  },
  {
    key: 'attendance',
    label: 'Attendance',
    icon: 'CalendarDays',
    route: '/attendance',
    group: 'HRM & Operations',
    sortOrder: 14,
    isSystem: false,
    permission: 'Attendance',
    description: 'Employee attendance and shift monitoring',
  },
  {
    key: 'performance',
    label: 'Performance',
    icon: 'BarChart3',
    route: '/performance',
    group: 'HRM & Operations',
    sortOrder: 15,
    isSystem: false,
    permission: 'Performance',
    description: 'Individual goal appraisal and performance reviews',
  },
  {
    key: 'help_center',
    label: 'Help Center',
    icon: 'LifeBuoy',
    route: '/help',
    group: 'Support',
    sortOrder: 16,
    isSystem: false,
    permission: 'Help Center',
    description: 'Documentation and platform support guides',
  },
];

@Injectable()
export class PlatformModulesService {
  constructor(private readonly prisma: PrismaService) {}

  async seedDefaultModulesIfEmpty(): Promise<number> {
    for (const mod of DEFAULT_PLATFORM_MODULES) {
      await this.prisma.platformModule.upsert({
        where: { key: mod.key! },
        create: {
          key: mod.key!,
          label: mod.label,
          icon: mod.icon || 'Layers',
          route: mod.route,
          group: mod.group || 'Core',
          sortOrder: mod.sortOrder ?? 0,
          isEnabled: mod.isEnabled ?? true,
          isVisible: mod.isVisible ?? true,
          isSystem: mod.isSystem ?? false,
          permission: mod.permission || null,
          badge: mod.badge || null,
          description: mod.description || null,
        },
        update: {},
      });
    }

    return DEFAULT_PLATFORM_MODULES.length;
  }

  async listModules(filters?: {
    search?: string;
    group?: string;
    isEnabled?: boolean;
    isVisible?: boolean;
  }) {
    await this.seedDefaultModulesIfEmpty();

    const where: any = {};
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

    const modules = await this.prisma.platformModule.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        children: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    const totalCount = await this.prisma.platformModule.count();
    const enabledCount = await this.prisma.platformModule.count({ where: { isEnabled: true } });
    const disabledCount = await this.prisma.platformModule.count({ where: { isEnabled: false } });
    const systemCount = await this.prisma.platformModule.count({ where: { isSystem: true } });

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
    const existingKey = await this.prisma.platformModule.findUnique({ where: { key } });
    if (existingKey) {
      throw new BadRequestException(`Module key '${key}' already exists`);
    }

    const existingRoute = await this.prisma.platformModule.findFirst({
      where: { route: dto.route.trim() },
    });
    if (existingRoute) {
      throw new BadRequestException(`Route '${dto.route}' is already used by module '${existingRoute.label}'`);
    }

    // 3. Determine max sort order if not provided
    let sortOrder = dto.sortOrder;
    if (sortOrder === undefined || sortOrder === null) {
      const maxSort = await this.prisma.platformModule.aggregate({
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
        details: { moduleId: created.id, key: created.key, label: created.label },
      },
    });

    return created;
  }

  async updateModule(id: string, dto: UpdatePlatformModuleDto, adminUserId: string) {
    const existing = await this.getModuleById(id);

    // If key is being updated, check uniqueness
    let key = existing.key;
    if (dto.key && dto.key !== existing.key) {
      if (existing.isSystem) {
        throw new ForbiddenException('Key cannot be modified for core system modules');
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
        throw new BadRequestException(`Route '${dto.route}' is already in use by module '${duplicateRoute.label}'`);
      }
    }

    // Validate parent hierarchy (cannot set self as parent)
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
        sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : existing.sortOrder,
        isEnabled: dto.isEnabled !== undefined ? dto.isEnabled : existing.isEnabled,
        isVisible: dto.isVisible !== undefined ? dto.isVisible : existing.isVisible,
        permission: dto.permission !== undefined ? (dto.permission ? dto.permission.trim() : null) : existing.permission,
        badge: dto.badge !== undefined ? (dto.badge ? dto.badge.trim() : null) : existing.badge,
        description: dto.description !== undefined ? (dto.description ? dto.description.trim() : null) : existing.description,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'PLATFORM_MODULE_UPDATED',
        module: 'SuperAdmin',
        details: { moduleId: id, changes: dto as any },
      },
    });

    return updated;
  }

  async toggleModuleStatus(
    id: string,
    params: { isEnabled?: boolean; isVisible?: boolean },
    adminUserId: string,
  ) {
    const existing = await this.getModuleById(id);

    const updated = await this.prisma.platformModule.update({
      where: { id },
      data: {
        isEnabled: params.isEnabled !== undefined ? params.isEnabled : existing.isEnabled,
        isVisible: params.isVisible !== undefined ? params.isVisible : existing.isVisible,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'PLATFORM_MODULE_STATUS_TOGGLED',
        module: 'SuperAdmin',
        details: { moduleId: id, isEnabled: updated.isEnabled, isVisible: updated.isVisible },
      },
    });

    return updated;
  }

  async reorderModules(
    items: Array<{ id: string; sortOrder: number }>,
    adminUserId: string,
  ) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('Items array with id and sortOrder is required');
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

    return { success: true, message: 'Platform modules reordered successfully' };
  }

  async deleteModule(id: string, adminUserId: string) {
    const existing = await this.getModuleById(id);

    // 1. Core safety check: System modules cannot be deleted
    if (existing.isSystem) {
      throw new ForbiddenException(
        `'${existing.label}' is a core system module and cannot be deleted. You can disable or hide it instead.`,
      );
    }

    // 2. Child dependency check
    const childCount = await this.prisma.platformModule.count({
      where: { parentId: id },
    });
    if (childCount > 0) {
      throw new BadRequestException(
        `Cannot delete module because it has ${childCount} child sub-module(s). Reassign or delete child items first.`,
      );
    }

    // 3. Delete module
    await this.prisma.platformModule.delete({ where: { id } });

    // 4. Audit Log
    await this.prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'PLATFORM_MODULE_DELETED',
        module: 'SuperAdmin',
        details: { moduleId: id, key: existing.key, label: existing.label },
      },
    });

    return {
      success: true,
      message: `Platform module '${existing.label}' deleted successfully`,
    };
  }

  async getNavigationMenu(userContext?: {
    isSuperAdmin?: boolean;
    role?: string;
    permissions?: string[];
  }) {
    await this.seedDefaultModulesIfEmpty();

    // Only query enabled & visible modules for navigation
    const modules = await this.prisma.platformModule.findMany({
      where: {
        isEnabled: true,
        isVisible: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    // If Super Admin or Admin, return all enabled platform modules
    const isSuperAdmin = userContext?.isSuperAdmin === true;
    const roleUpper = (userContext?.role || '').toUpperCase();
    const isAdmin = roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN';

    if (isSuperAdmin || isAdmin) {
      return modules;
    }

    // Role-filtered navigation for other roles (Manager, Sales, Support, Employee)
    const userPermissions = userContext?.permissions || [];
    const normalizedPerms = userPermissions.map((p) => p.trim().toLowerCase());

    const filtered = modules.filter((mod) => {
      // If module doesn't specify a permission, it's public to all authenticated tenant users
      if (!mod.permission) return true;

      const permLower = mod.permission.toLowerCase();
      const keyLower = mod.key.toLowerCase();
      const labelLower = mod.label.toLowerCase();

      // Check if user has permission
      return (
        normalizedPerms.includes(permLower) ||
        normalizedPerms.includes(keyLower) ||
        normalizedPerms.includes(labelLower) ||
        normalizedPerms.some((p) => p.startsWith(keyLower) || p.startsWith(permLower))
      );
    });

    return filtered;
  }
}
