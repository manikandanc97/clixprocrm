import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import { sanitizeAuditDetails } from '../common/utils/audit-sanitizer.util';
import { PrismaService } from '../prisma/prisma.service';
import { invalidateGetMeCache } from './auth.service';
import { invalidateTokenUserCache } from './supabase.guard';

function hashRecoveryCode(code: string): string {
  const normalized = code.trim().replace(/[-\s]/g, '').toUpperCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

function generateRandomCode(): string {
  const bytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${bytes.slice(0, 4)}-${bytes.slice(4, 8)}`;
}

@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);

  constructor(private readonly prisma: PrismaService) {}

  private getSupabaseAdminClient(): SupabaseClient {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables are missing');
    }

    return createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  async getMfaStatus(userId: string, tenantId?: string) {
    const supabaseAdmin = this.getSupabaseAdminClient();
    let factors: any[] = [];
    let hasVerifiedFactor = false;

    try {
      const { data, error } = await supabaseAdmin.auth.admin.mfa.listFactors({
        userId,
      });
      if (!error && data?.factors) {
        factors = data.factors.map((f: any) => ({
          id: f.id,
          friendlyName:
            f.friendly_name || f.friendlyName || 'TOTP Authenticator',
          factorType: f.factor_type || f.factorType || 'totp',
          status: f.status,
          createdAt: f.created_at || f.createdAt,
          updatedAt: f.updated_at || f.updatedAt,
        }));
        hasVerifiedFactor = factors.some((f) => f.status === 'verified');
      }
    } catch (err: any) {
      this.logger.warn(
        `Failed to list MFA factors for user ${userId}: ${err?.message || err}`,
      );
    }

    let orgMfaPolicy = 'OPTIONAL';
    let isEnforcedByOrg = false;

    if (tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { mfaPolicy: true },
      });
      orgMfaPolicy = tenant?.mfaPolicy || 'OPTIONAL';
      isEnforcedByOrg = orgMfaPolicy === 'REQUIRED';
    }

    const remainingRecoveryCodes = await this.prisma.mfaRecoveryCode.count({
      where: { userId, used: false },
    });

    return {
      hasVerifiedFactor,
      factors,
      isEnforcedByOrg,
      orgMfaPolicy,
      recoveryCodesRemaining: remainingRecoveryCodes,
    };
  }

  async generateRecoveryCodes(
    userId: string,
    actorUserId: string,
    reqIp?: string,
    userAgent?: string,
  ) {
    if (userId !== actorUserId) {
      throw new ForbiddenException(
        'Cannot generate recovery codes for another user',
      );
    }

    const plaintextCodes: string[] = [];
    const hashedEntries: { userId: string; codeHash: string }[] = [];

    for (let i = 0; i < 10; i++) {
      const code = generateRandomCode();
      plaintextCodes.push(code);
      hashedEntries.push({
        userId,
        codeHash: hashRecoveryCode(code),
      });
    }

    // Replace previous unused recovery codes with the fresh set
    await this.prisma.$transaction(async (tx) => {
      await tx.mfaRecoveryCode.deleteMany({
        where: { userId },
      });
      await tx.mfaRecoveryCode.createMany({
        data: hashedEntries,
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: 'MFA_RECOVERY_CODES_GENERATED',
          module: 'Security',
          details: {
            count: 10,
          },
          ipAddress: reqIp,
          userAgent,
        },
      });
    });

    // Return plaintext codes once ONLY
    return {
      recoveryCodes: plaintextCodes,
      count: plaintextCodes.length,
      warning:
        'Store these recovery codes in a secure location. They will not be displayed again.',
    };
  }

  async verifyAndConsumeRecoveryCode(
    userId: string,
    rawCode: string,
    reqIp?: string,
    userAgent?: string,
  ) {
    if (!rawCode || typeof rawCode !== 'string') {
      throw new BadRequestException('Recovery code is required');
    }

    const codeHash = hashRecoveryCode(rawCode);

    const matchingCode = await this.prisma.mfaRecoveryCode.findFirst({
      where: {
        userId,
        codeHash,
        used: false,
      },
    });

    if (!matchingCode) {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'MFA_CHALLENGE_FAILED',
          module: 'Security',
          details: {
            reason: 'Invalid or already used recovery code',
            method: 'recovery_code',
          },
          ipAddress: reqIp,
          userAgent,
        },
      });
      throw new BadRequestException('Invalid or already used recovery code');
    }

    // Mark code as used
    await this.prisma.mfaRecoveryCode.update({
      where: { id: matchingCode.id },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });

    const remaining = await this.prisma.mfaRecoveryCode.count({
      where: { userId, used: false },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'MFA_RECOVERY_USED',
        module: 'Security',
        details: {
          remainingRecoveryCodes: remaining,
        },
        ipAddress: reqIp,
        userAgent,
      },
    });

    return {
      success: true,
      message: 'Recovery code verified successfully',
      remainingRecoveryCodes: remaining,
    };
  }

  async disableMfa(
    userId: string,
    tenantId?: string,
    factorId?: string,
    reqIp?: string,
    userAgent?: string,
  ) {
    const supabaseAdmin = this.getSupabaseAdminClient();

    try {
      if (factorId) {
        await supabaseAdmin.auth.admin.mfa.deleteFactor({
          userId,
          id: factorId,
        });
      } else {
        const { data } = await supabaseAdmin.auth.admin.mfa.listFactors({
          userId,
        });
        if (data?.factors && data.factors.length > 0) {
          for (const factor of data.factors) {
            await supabaseAdmin.auth.admin.mfa.deleteFactor({
              userId,
              id: factor.id,
            });
          }
        }
      }
    } catch (err: any) {
      this.logger.error(
        `Error deleting MFA factors in Supabase Admin: ${err?.message || err}`,
      );
      throw new BadRequestException(
        'Failed to disable MFA factors in authentication provider',
      );
    }

    // Remove recovery codes
    await this.prisma.mfaRecoveryCode.deleteMany({
      where: { userId },
    });

    // Record audit log
    await this.prisma.auditLog.create({
      data: {
        tenantId: tenantId || null,
        userId,
        action: 'MFA_DISABLED',
        module: 'Security',
        details: {
          factorId: factorId || 'all',
        },
        ipAddress: reqIp,
        userAgent,
      },
    });

    // Invalidate caches
    invalidateTokenUserCache(userId);
    invalidateGetMeCache(userId);

    return {
      success: true,
      message: 'Two-factor authentication disabled successfully',
    };
  }

  async recordAuditEvent(
    userId: string,
    event: 'MFA_ENROLLED' | 'MFA_VERIFIED' | 'MFA_CHALLENGE_FAILED',
    details: Record<string, any> = {},
    tenantId?: string,
    reqIp?: string,
    userAgent?: string,
    callerAal?: string,
  ) {
    const allowedEvents = [
      'MFA_ENROLLED',
      'MFA_VERIFIED',
      'MFA_CHALLENGE_FAILED',
    ];
    if (!allowedEvents.includes(event)) {
      throw new BadRequestException('Invalid MFA audit event type');
    }

    // Authenticity validation:
    if (event === 'MFA_VERIFIED') {
      // Must be AAL2 verified in token
      if (callerAal !== 'aal2') {
        throw new ForbiddenException(
          'Cannot record MFA_VERIFIED: Current session is not AAL2 verified',
        );
      }
    } else if (event === 'MFA_ENROLLED') {
      // Verify via Supabase Admin that user has a verified factor
      try {
        const supabaseAdmin = this.getSupabaseAdminClient();
        const { data, error } = await supabaseAdmin.auth.admin.mfa.listFactors({
          userId,
        });
        const hasVerifiedFactor =
          !error && data?.factors?.some((f: any) => f.status === 'verified');
        if (!hasVerifiedFactor) {
          throw new BadRequestException(
            'Cannot record MFA_ENROLLED: No verified MFA factor found for user',
          );
        }
      } catch (err: any) {
        if (err instanceof BadRequestException) throw err;
        this.logger.warn(
          `Supabase factor check note during MFA_ENROLLED audit: ${err?.message || err}`,
        );
      }
    }

    // Strictly sanitize details: strip any secret, token, password, and enforce size bounds
    const safeDetails = sanitizeAuditDetails(details);

    await this.prisma.auditLog.create({
      data: {
        tenantId: tenantId || null,
        userId,
        action: event,
        module: 'Security',
        details: safeDetails,
        ipAddress: reqIp,
        userAgent,
      },
    });

    if (event === 'MFA_ENROLLED' || event === 'MFA_VERIFIED') {
      invalidateTokenUserCache(userId);
      invalidateGetMeCache(userId);
    }

    return { success: true };
  }

  async updateTenantMfaPolicy(
    tenantId: string,
    actorUserId: string,
    policy: 'OPTIONAL' | 'REQUIRED',
    reqIp?: string,
    userAgent?: string,
  ) {
    if (!['OPTIONAL', 'REQUIRED'].includes(policy)) {
      throw new BadRequestException(
        'Invalid MFA policy. Allowed values: OPTIONAL, REQUIRED',
      );
    }

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { mfaPolicy: policy },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: actorUserId,
        action: 'MFA_POLICY_CHANGED',
        module: 'Security',
        details: {
          mfaPolicy: policy,
        },
        ipAddress: reqIp,
        userAgent,
      },
    });

    invalidateGetMeCache();

    return {
      success: true,
      mfaPolicy: updated.mfaPolicy,
      message: `Organization MFA policy updated to ${policy}`,
    };
  }
}
