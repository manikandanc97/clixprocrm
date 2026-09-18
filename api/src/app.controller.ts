import {
    Controller,
    Get,
    HttpException,
    HttpStatus,
    Optional,
    Req,
    UseGuards,
} from '@nestjs/common';
import { AppService } from './app.service';
import { Permissions } from './auth/permissions.decorator';
import { PermissionsGuard } from './auth/permissions.guard';
import { Roles } from './auth/roles.decorator';
import { RolesGuard } from './auth/roles.guard';
import { SupabaseAuthGuard } from './auth/supabase.guard';
import { TenantGuard } from './auth/tenant.guard';
import { SecurityConfigValidator } from './common/utils/security-config.validator';
import { PrismaService } from './prisma/prisma.service';

@Controller(['crm', ''])
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  @Get('health')
  getHealth(): string {
    return 'OK';
  }

  @Get('health/live')
  getLiveness() {
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('health/ready')
  async getReadiness() {
    const checks: Record<
      string,
      { status: 'UP' | 'DOWN' | 'DEGRADED'; message?: string }
    > = {};
    let isReady = true;

    // 1. Database Check (Critical)
    if (this.prisma) {
      try {
        await this.prisma.$queryRaw`SELECT 1`;
        checks.database = { status: 'UP' };
      } catch (err: any) {
        checks.database = {
          status: 'DOWN',
          message: 'Database connection check failed',
        };
        isReady = false;
      }
    } else {
      checks.database = {
        status: 'DOWN',
        message: 'Prisma database service unavailable',
      };
      isReady = false;
    }

    // 2. Security Configuration Check (Critical)
    try {
      const configValidation = SecurityConfigValidator.validateEnvironment();
      if (!configValidation.valid) {
        checks.configuration = {
          status: 'DOWN',
          message: 'Missing mandatory configuration variables',
        };
        isReady = false;
      } else {
        checks.configuration = { status: 'UP' };
      }
    } catch {
      checks.configuration = { status: 'DOWN' };
      isReady = false;
    }

    // 3. Optional Services (Non-blocking)
    const redisConfigured = !!(
      (process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL) &&
      (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_TOKEN)
    );
    checks.redis = {
      status: redisConfigured ? 'UP' : 'DEGRADED',
      message: redisConfigured
        ? 'Distributed Redis configured'
        : 'In-memory fallback active (single-instance safe)',
    };

    const wormConfigured = !!(
      (process.env.AWS_S3_AUDIT_BUCKET || process.env.AUDIT_ARCHIVE_BUCKET) &&
      process.env.AWS_ACCESS_KEY_ID
    );
    checks.wormArchive = {
      status: wormConfigured ? 'UP' : 'DEGRADED',
      message: wormConfigured
        ? 'AWS S3 WORM archive configured'
        : 'Database outbox active; external S3 archive not configured',
    };

    const responsePayload = {
      status: isReady ? 'UP' : 'DOWN',
      timestamp: new Date().toISOString(),
      checks,
    };

    if (!isReady) {
      throw new HttpException(responsePayload, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return responsePayload;
  }

  @Get('auth-test')
  @UseGuards(SupabaseAuthGuard)
  testAuth(@Req() req: any) {
    return {
      message: 'Authenticated successfully',
      user: req.user,
    };
  }

  @Get('tenant-test')
  @UseGuards(SupabaseAuthGuard, TenantGuard)
  testTenant(@Req() req: any) {
    return {
      message: 'Tenant resolved successfully',
      tenantId: req.tenantId,
      role: req.userRole,
    };
  }

  @Get('rbac-test')
  @UseGuards(SupabaseAuthGuard, TenantGuard, RolesGuard, PermissionsGuard)
  @Roles('ADMIN')
  @Permissions('DASHBOARD_READ')
  testRbac() {
    return { message: 'RBAC verification successful' };
  }
}
