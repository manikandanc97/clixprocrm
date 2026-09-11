import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Optional,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../common/context/tenant-context.service';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  private readonly logger = new Logger(SuperAdminGuard.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly tenantContext?: TenantContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const route = request.url || request.originalUrl || 'unknown';

    if (!user || !user.id) {
      this.logger.warn(
        `[AUTH_DENIED] Missing user in SuperAdminGuard on route: ${route}`,
      );
      throw new UnauthorizedException('User not authenticated');
    }

    // Direct database check for isSuperAdmin flag (never trust frontend headers/flags)
    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, isSuperAdmin: true, status: true },
    });

    if (!userRecord) {
      this.logger.warn(
        `[SUPER_ADMIN_DENIED] User not found in database: userId=${user.id}, route=${route}`,
      );
      throw new ForbiddenException('User record not found');
    }

    if (userRecord.status !== 'ACTIVE') {
      this.logger.warn(
        `[SUPER_ADMIN_DENIED] Inactive user account: userId=${user.id}, status=${userRecord.status}, route=${route}`,
      );
      throw new ForbiddenException('User account is not active');
    }

    if (!userRecord.isSuperAdmin) {
      this.logger.warn(
        `[SUPER_ADMIN_DENIED] Non-super-admin user denied: userId=${user.id}, isSuperAdmin=${userRecord.isSuperAdmin}, route=${route}`,
      );
      throw new ForbiddenException(
        'Access denied: Super Admin platform privileges required',
      );
    }

    // Strict backend AAL2 enforcement for Super Admin platform access
    const currentAal = user.aal || 'aal1';
    if (currentAal !== 'aal2') {
      this.logger.warn(
        `[AAL2_REQUIRED] Super Admin accessed without AAL2: userId=${user.id}, currentAal=${currentAal}, route=${route}`,
      );

      // Record audit event for AAL2 denial
      try {
        await this.prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'AAL2_REQUIRED_DENIED',
            module: 'SuperAdmin',
            details: {
              reason:
                'Super Admin platform route accessed without AAL2 assurance',
              currentAal,
              route,
            },
            ipAddress: request.ip || request.headers?.['x-forwarded-for'],
            userAgent: request.headers?.['user-agent'],
          },
        });
      } catch {
        // Suppress audit log insert errors so exception propagates cleanly
      }

      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        code: 'AAL2_REQUIRED',
        message:
          'MFA verification required: AAL2 session assurance required for Super Admin platform access',
      });
    }

    this.logger.log(
      `[SUPER_ADMIN_GRANTED] Access granted: userId=${user.id}, aal=${currentAal}, route=${route}`,
    );
    request.isSuperAdmin = true;

    this.tenantContext?.setContext({
      userId: user.id,
      isSuperAdmin: true,
      userRole: { name: 'SUPER_ADMIN' },
    });

    return true;
  }
}
