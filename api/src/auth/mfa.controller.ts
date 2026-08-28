import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { MfaService } from './mfa.service';
import { SupabaseAuthGuard } from './supabase.guard';
import { TenantGuard } from './tenant.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { AalGuard } from './aal.guard';
import { RequireAal } from './aal.decorator';
import {
  checkRateLimit,
  incrementRateLimit,
  getClientIp,
  RATE_LIMITS,
} from '../common/utils/rate-limit.util';

@Controller()
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @UseGuards(SupabaseAuthGuard)
  @Get('auth/mfa/status')
  async getStatus(@Req() req: any) {
    const userId = req.user.id || req.user.sub;
    const tenantId = req.headers?.['x-tenant-id'] || req.tenantId;
    const result = await this.mfaService.getMfaStatus(userId, tenantId);
    return {
      success: true,
      data: {
        ...result,
        currentAal: req.user.aal || 'aal1',
      },
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Post('auth/mfa/recovery-codes')
  async generateRecoveryCodes(@Req() req: any) {
    const userId = req.user.id || req.user.sub;
    const ip = getClientIp(req);
    const userAgent = req.headers?.['user-agent'];

    const result = await this.mfaService.generateRecoveryCodes(
      userId,
      userId,
      ip,
      userAgent,
    );

    return {
      success: true,
      data: result,
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Post('auth/mfa/recovery-verify')
  async verifyRecoveryCode(@Req() req: any, @Body() body: any) {
    const ip = getClientIp(req);
    const userId = req.user.id || req.user.sub;
    const identifier = `auth:mfa:recovery:${ip}:${userId}`;

    const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.MFA_RECOVERY);
    if (!rateLimit.allowed) {
      const waitSec = Math.ceil(
        Math.max(0, rateLimit.resetTime - Date.now()) / 1000,
      );
      throw new HttpException(
        {
          success: false,
          error: 'Too Many Requests',
          message: `Too many recovery attempts. Please wait ${waitSec} seconds before trying again.`,
          retryAfter: waitSec,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await incrementRateLimit(identifier, RATE_LIMITS.MFA_RECOVERY);

    const userAgent = req.headers?.['user-agent'];
    const result = await this.mfaService.verifyAndConsumeRecoveryCode(
      userId,
      body?.code || '',
      ip,
      userAgent,
    );

    return {
      success: true,
      data: result,
    };
  }

  @UseGuards(SupabaseAuthGuard, AalGuard)
  @Post('auth/mfa/disable')
  async disableMfa(@Req() req: any, @Body() body: any) {
    const userId = req.user.id || req.user.sub;
    const tenantId = req.headers?.['x-tenant-id'] || req.tenantId;
    const ip = getClientIp(req);
    const userAgent = req.headers?.['user-agent'];

    const result = await this.mfaService.disableMfa(
      userId,
      tenantId,
      body?.factorId,
      ip,
      userAgent,
    );

    return {
      success: true,
      data: result,
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Post('auth/mfa/audit-event')
  async recordAuditEvent(@Req() req: any, @Body() body: any) {
    const userId = req.user.id || req.user.sub;
    const tenantId = req.headers?.['x-tenant-id'] || req.tenantId;
    const ip = getClientIp(req);
    const userAgent = req.headers?.['user-agent'];

    if (!body?.event) {
      throw new BadRequestException('Event name is required');
    }

    const aal = req.user.aal || 'aal1';

    const result = await this.mfaService.recordAuditEvent(
      userId,
      body.event,
      body.details || {},
      tenantId,
      ip,
      userAgent,
      aal,
    );

    return {
      success: true,
      data: result,
    };
  }

  @UseGuards(SupabaseAuthGuard, TenantGuard, RolesGuard, AalGuard)
  @Roles('ADMIN')
  @Patch('crm/settings/mfa-policy')
  async updateMfaPolicy(@Req() req: any, @Body() body: any) {
    const actorUserId = req.user.id || req.user.sub;
    const tenantId = req.tenantId;
    const policy = body?.mfaPolicy;

    if (!policy || !['OPTIONAL', 'REQUIRED'].includes(policy)) {
      throw new BadRequestException('Valid mfaPolicy ("OPTIONAL" or "REQUIRED") is required');
    }

    const ip = getClientIp(req);
    const userAgent = req.headers?.['user-agent'];

    const result = await this.mfaService.updateTenantMfaPolicy(
      tenantId,
      actorUserId,
      policy,
      ip,
      userAgent,
    );

    return {
      success: true,
      data: result,
    };
  }
}
