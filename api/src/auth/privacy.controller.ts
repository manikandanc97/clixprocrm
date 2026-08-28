import {
  Controller,
  Get,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MfaService } from './mfa.service';
import { SupabaseAuthGuard } from './supabase.guard';
import { TenantGuard } from './tenant.guard';
import {
  checkRateLimit,
  incrementRateLimit,
  getClientIp,
  RATE_LIMITS,
} from '../common/utils/rate-limit.util';

@Controller('auth/privacy')
export class PrivacyController {
  private readonly logger = new Logger(PrivacyController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mfaService: MfaService,
  ) {}

  @UseGuards(SupabaseAuthGuard, TenantGuard)
  @Get('export-data')
  async exportUserData(@Req() req: any) {
    const userId = req.user.id || req.user.sub;
    const tenantId = req.tenantId;
    const ip = getClientIp(req);
    const userAgent = req.headers?.['user-agent'];

    // Rate limit per user
    const identifier = `privacy:export:${userId}:${ip}`;
    const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.EXPORT);
    if (!rateLimit.allowed) {
      const waitSec = Math.ceil(
        Math.max(0, rateLimit.resetTime - Date.now()) / 1000,
      );
      throw new HttpException(
        {
          success: false,
          error: 'Too Many Requests',
          message: `Too many data export requests. Please wait ${waitSec} seconds before requesting another export.`,
          retryAfter: waitSec,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await incrementRateLimit(identifier, RATE_LIMITS.EXPORT);

    try {
      // 1. Fetch user base record
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          status: true,
          securityStatus: true,
          notificationPrefs: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new HttpException('User record not found', HttpStatus.NOT_FOUND);
      }

      // 2. Fetch tenant membership for current tenant
      const membership = await this.prisma.tenantUser.findUnique({
        where: {
          tenantId_userId: {
            tenantId,
            userId,
          },
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
              plan: true,
              status: true,
              createdAt: true,
            },
          },
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // 3. Aggregate user activity metrics and records in this tenant
      const [
        tasksCreatedCount,
        tasksAssignedCount,
        leadsCreatedCount,
        notesAuthorCount,
        meetingsAssignedCount,
        mfaStatus,
        recentTimelineEvents,
      ] = await Promise.all([
        this.prisma.task.count({ where: { tenantId, createdById: userId, deletedAt: null } }),
        this.prisma.task.count({ where: { tenantId, assignedToId: userId, deletedAt: null } }),
        this.prisma.lead.count({ where: { tenantId, createdById: userId, deletedAt: null } }),
        this.prisma.note.count({ where: { tenantId, userId, deletedAt: null } }),
        this.prisma.meeting.count({ where: { tenantId, assignedToId: userId } }),
        this.mfaService.getMfaStatus(userId, tenantId),
        this.prisma.timelineEvent.findMany({
          where: { tenantId, userId },
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            action: true,
            description: true,
            createdAt: true,
          },
        }),
      ]);

      // 4. Sanitize and structure the export bundle
      const exportData = {
        exportMetadata: {
          exportedAt: new Date().toISOString(),
          exportId: `EXP-${Date.now()}-${userId.slice(0, 8)}`,
          system: 'ClixProCRM Privacy Center',
          compliance: 'GDPR / DPDP Personal Data Portability',
        },
        userProfile: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          status: user.status,
          securityStatus: user.securityStatus,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        workspaceMembership: membership
          ? {
              workspaceId: membership.tenant.id,
              workspaceName: membership.tenant.name,
              workspaceSlug: membership.tenant.slug,
              role: membership.role?.name || 'MEMBER',
              department: membership.department?.name || null,
              isOrgOwner: membership.isOrgOwner,
              joinedAt: membership.joinedAt,
            }
          : null,
        securityOverview: {
          twoFactorAuthEnabled: mfaStatus.hasVerifiedFactor,
          factorCount: mfaStatus.factors.length,
          recoveryCodesConfigured: mfaStatus.recoveryCodesRemaining > 0,
          remainingRecoveryCodes: mfaStatus.recoveryCodesRemaining,
          orgMfaPolicy: mfaStatus.orgMfaPolicy,
        },
        notificationPreferences: user.notificationPrefs || {},
        workspaceActivitySummary: {
          tasksCreated: tasksCreatedCount,
          tasksAssigned: tasksAssignedCount,
          leadsCreated: leadsCreatedCount,
          notesAuthored: notesAuthorCount,
          meetingsAssigned: meetingsAssignedCount,
          recentTimelineEvents,
        },
      };

      // 5. Create audit log for data export
      await this.prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'PRIVACY_DATA_EXPORTED',
          module: 'Privacy',
          details: {
            exportId: exportData.exportMetadata.exportId,
            exportedAt: exportData.exportMetadata.exportedAt,
          },
          ipAddress: ip,
          userAgent,
        },
      });

      return {
        success: true,
        data: exportData,
      };
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      this.logger.error(`Failed to export privacy data for user ${userId}: ${err?.message || err}`);
      throw new HttpException(
        'Failed to generate privacy data export. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
