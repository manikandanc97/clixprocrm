import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    if (request.isSuperAdmin || request.isOrgOwner) {
      return true;
    }

    const { userRole } = request;

    if (!userRole) {
      throw new ForbiddenException('No permissions found for user');
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

    const matchesPermission = (required: string, userMod: string) => {
      if (!required || !userMod) return false;
      if (userMod === 'ALL' || userMod === 'all' || userMod === '*') return true;
      if (required === userMod) return true;

      const normalize = (s: string) => s.toLowerCase().trim();
      const reqNorm = normalize(required);
      const userNorm = normalize(userMod);

      if (reqNorm === userNorm) return true;

      // Handle standard 'Module:Action' structured permissions (e.g. 'Employees:View', 'Roles:Manage')
      const [reqModule, reqAction] = reqNorm.includes(':')
        ? reqNorm.split(':')
        : [reqNorm, undefined];
      const [userModule, userAction] = userNorm.includes(':')
        ? userNorm.split(':')
        : [userNorm, undefined];

      // Cross-module access is strictly prohibited
      if (reqModule !== userModule) {
        return false;
      }

      // Full module grant (e.g., 'Employees' or 'Employees:Manage' or 'Employees:*') satisfies sub-actions
      if (!userAction || userAction === '*' || userAction === 'manage' || userAction === 'admin') {
        return true;
      }

      // Read-only grant ('view' / 'read') CANNOT satisfy 'manage', 'edit', 'delete', or 'create'
      if (userAction === 'view' || userAction === 'read') {
        return reqAction === 'view' || reqAction === 'read';
      }

      return userAction === reqAction;
    };

    const hasPermission = userRole.permissions?.some(
      (p: any) =>
        p.hasAccess &&
        requiredPermissions.some((reqPerm) => matchesPermission(reqPerm, p.module)),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}

