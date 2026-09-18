import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { REQUIRE_AAL_KEY } from './aal.decorator';

@Injectable()
export class AalGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredAal = this.reflector.getAllAndOverride<'aal1' | 'aal2'>(
      REQUIRE_AAL_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    const currentAal = user.aal || 'aal1';
    let enforceAal2 = requiredAal === 'aal2';

    // Check organization-level MFA policy if tenant is present and user is an Admin
    if (!enforceAal2 && request.tenantId) {
      const roleName = request.userRole?.name || user.roleName;
      if (roleName === 'ADMIN' || roleName === 'SUPER_ADMIN') {
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: request.tenantId },
          select: { mfaPolicy: true },
        });
        if (tenant?.mfaPolicy === 'REQUIRED') {
          enforceAal2 = true;
        }
      }
    }

    if (enforceAal2 && currentAal !== 'aal2') {
      try {
        await this.prisma.auditLog.create({
          data: {
            tenantId: request.tenantId || null,
            userId: user.id,
            action: 'AAL2_REQUIRED_DENIED',
            module: 'Security',
            details: {
              reason: 'Action requires AAL2 assurance level',
              currentAal,
              route: request.url || request.originalUrl,
            },
            ipAddress: request.ip || request.headers?.['x-forwarded-for'],
            userAgent: request.headers?.['user-agent'],
          },
        });
      } catch {
        // Suppress audit log failures
      }

      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        code: 'AAL2_REQUIRED',
        message:
          'MFA verification required: AAL2 session assurance is required for this operation',
      });
    }

    return true;
  }
}
