import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSION_REQUIREMENT_KEY,
  REQUIRE_OWNER_KEY,
  PermissionRequirementMetadata,
} from './authorization.decorator';
import { AuthorizationService } from './authorization.service';
import { UserAuthContext } from './authorization-types';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isOwnerRequired = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_OWNER_KEY,
      [context.getHandler(), context.getClass()],
    );

    const permRequirement = this.reflector.getAllAndOverride<PermissionRequirementMetadata>(
      PERMISSION_REQUIREMENT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isOwnerRequired && !permRequirement) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.tenantId;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const userContext: UserAuthContext = {
      userId: user.id || user.sub,
      tenantId: tenantId,
      isSuperAdmin: !!request.isSuperAdmin,
      isOrgOwner: !!request.isOrgOwner,
      roleName: request.userRole?.name,
      roles: request.userRole ? [request.userRole] : [],
      branchId: request.branchId || null,
      ipAddress: request.ip,
      userAgent: request.headers?.['user-agent'],
    };

    // 1. Check Owner requirement
    if (isOwnerRequired) {
      if (userContext.isSuperAdmin || userContext.isOrgOwner) {
        return true;
      }
      throw new ForbiddenException(
        'Access denied: This operation strictly requires Organization Owner authorization.',
      );
    }

    // 2. Check Permission requirement
    if (permRequirement) {
      // Build record context if route params have id
      const recordContext = request.params?.id
        ? { id: request.params.id, tenantId }
        : undefined;

      const isAllowed = await this.authService.can(
        userContext,
        permRequirement.permission,
        recordContext,
      );

      if (!isAllowed) {
        throw new ForbiddenException(
          `Insufficient permissions: Required '${permRequirement.permission}'`,
        );
      }
    }

    return true;
  }
}
