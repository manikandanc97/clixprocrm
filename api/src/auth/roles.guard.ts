import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    if (request.isSuperAdmin || request.isOrgOwner) {
      return true;
    }

    const { userRole } = request;

    if (!userRole) {
      throw new ForbiddenException('No role assigned to user');
    }

    if (userRole.isActive === false) {
      throw new ForbiddenException('Role is currently deactivated');
    }

    const roleName = (userRole.name || '').toUpperCase().trim();
    const normalizedRole = roleName.replace(/[\s_]+/g, '');
    if (
      normalizedRole === 'SUPERADMIN' ||
      normalizedRole === 'ADMIN' ||
      normalizedRole === 'OWNER'
    ) {
      return true;
    }

    const normalizedRequiredRoles = requiredRoles.map((r) =>
      r.toUpperCase().trim().replace(/[\s_]+/g, ''),
    );

    if (normalizedRequiredRoles.includes(normalizedRole)) {
      return true;
    }

    // For custom roles: Check if user's permissions satisfy the module access
    if (userRole.permissions && Array.isArray(userRole.permissions)) {
      const activeModules = userRole.permissions
        .filter((p: any) => p.hasAccess)
        .map((p: any) => (p.module || '').toLowerCase().replace(/[\s_]+/g, ''));

      const normalizedRoles = requiredRoles.map((r) =>
        r.toLowerCase().replace(/[\s_]+/g, ''),
      );

      const hasModuleEquivalence = activeModules.some((mod: string) =>
        mod === 'all' ||
        normalizedRoles.some(
          (reqRole) =>
            reqRole === mod ||
            (reqRole === 'sales' &&
              (mod.includes('lead') ||
                mod.includes('deal') ||
                mod.includes('quotation') ||
                mod.includes('customer') ||
                mod.includes('contact') ||
                mod.includes('company'))) ||
            (reqRole === 'manager' &&
              (mod.includes('lead') ||
                mod.includes('deal') ||
                mod.includes('report') ||
                mod.includes('employee'))) ||
            (reqRole === 'employee' &&
              (mod.includes('task') || mod.includes('calendar'))),
        ),
      );

      if (hasModuleEquivalence) {
        return true;
      }
    }

    throw new ForbiddenException('Insufficient role permissions');
  }
}

