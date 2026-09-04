import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../queue.constants';
import {
  MEDIA_JOB_NAMES,
  MediaJobPayload,
  BrandingMediaJobPayload,
  AvatarMediaJobPayload,
} from '../interfaces/media-jobs';
import { BrandingService } from '../../workspace/services/branding.service';
import { PrismaService } from '../../prisma/prisma.service';
import { invalidateGetMeCache } from '../../auth/auth.service';

@Processor(QUEUE_NAMES.MEDIA)
export class MediaQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(MediaQueueProcessor.name);

  constructor(
    @Inject(forwardRef(() => BrandingService))
    private readonly brandingService: BrandingService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<MediaJobPayload, any, string>): Promise<any> {
    this.logger.log(
      `[MEDIA WORKER] Processing job "${job.name}" (ID: ${job.id}, Tenant: ${job.data?.tenantId}, Operation: ${job.data?.operation}, Correlation: ${job.data?.correlationId})`,
    );

    try {
      switch (job.name) {
        case MEDIA_JOB_NAMES.PROCESS_BRANDING:
          return await this.handleBrandingMedia(
            job.data as BrandingMediaJobPayload,
          );

        case MEDIA_JOB_NAMES.PROCESS_AVATAR:
          return await this.handleAvatarMedia(
            job.data as AvatarMediaJobPayload,
          );

        default:
          this.logger.warn(
            `[MEDIA WORKER] Unknown media job type received: "${job.name}"`,
          );
          return { skipped: true, reason: `Unknown job type: ${job.name}` };
      }
    } catch (err: any) {
      this.logger.error(
        `[MEDIA WORKER] Job "${job.name}" (ID: ${job.id}, Tenant: ${job.data?.tenantId}, StoragePath: ${job.data?.storagePath}) failed: ${err?.message || err}`,
        err?.stack,
      );
      // Re-throw to trigger BullMQ bounded retries
      throw err;
    }
  }

  /**
   * Processes persisted raw workspace branding media:
   * 1. Validates tenant context
   * 2. Delegates CPU-heavy image optimization (WebP & dominant color extraction) to BrandingService
   * 3. Executes DB updates within isolated tenant context via PrismaService.withTenantContext
   * 4. Invalidates cached auth profile for instantaneous tenant-wide reflection
   */
  private async handleBrandingMedia(
    payload: BrandingMediaJobPayload,
  ): Promise<any> {
    const {
      tenantId,
      userId,
      storagePath,
      originalFilename,
      correlationId,
      operation,
    } = payload;

    if (!tenantId) {
      throw new Error(
        'Tenant context missing: tenantId is required for multi-tenant media processing',
      );
    }

    if (!storagePath) {
      throw new Error(
        'Storage reference missing: storagePath is required to retrieve persisted raw media',
      );
    }

    this.logger.log(
      `[MEDIA WORKER] Executing branding media processing for tenant ${tenantId} (StoragePath: ${storagePath}, Operation: ${operation}, Correlation: ${correlationId})`,
    );

    // 1. Process persisted media with Sharp (WebP conversion + dominant color extraction)
    const { storageUrl, dominantColor } =
      await this.brandingService.processPersistedLogo(
        tenantId,
        storagePath,
        originalFilename,
      );

    // 2. Persist updated logo URL and brand primary color within tenant context
    await this.prisma.withTenantContext(
      { tenantId, userId },
      async (tx) => {
        return tx.tenant.update({
          where: { id: tenantId },
          data: {
            logo: storageUrl,
            brandPrimaryColor: dominantColor,
          },
        });
      },
    );

    // 3. Invalidate auth profile cache
    invalidateGetMeCache();

    this.logger.log(
      `[MEDIA WORKER] Successfully completed branding media processing for tenant ${tenantId} (Color: ${dominantColor}, URL: ${storageUrl})`,
    );

    return {
      success: true,
      tenantId,
      logo: storageUrl,
      brandPrimaryColor: dominantColor,
    };
  }

  /**
   * Processes persisted raw user avatar media:
   * 1. Validates user context and storage reference
   * 2. Delegates CPU-heavy image optimization (WebP conversion) to BrandingService
   * 3. Executes DB updates within isolated tenant/user context
   * 4. Invalidates cached auth profile for instantaneous reflection
   */
  private async handleAvatarMedia(
    payload: AvatarMediaJobPayload,
  ): Promise<any> {
    const {
      tenantId,
      userId,
      storagePath,
      originalFilename,
      correlationId,
      operation,
    } = payload;

    if (!userId) {
      throw new Error(
        'User context missing: userId is required for avatar media processing',
      );
    }

    if (!storagePath) {
      throw new Error(
        'Storage reference missing: storagePath is required to retrieve persisted raw avatar',
      );
    }

    this.logger.log(
      `[MEDIA WORKER] Executing avatar media processing for user ${userId} (Tenant: ${tenantId}, StoragePath: ${storagePath}, Operation: ${operation}, Correlation: ${correlationId})`,
    );

    // 1. Process persisted avatar with Sharp (WebP conversion)
    const { storageUrl, storagePath: finalStoragePath } =
      await this.brandingService.processPersistedAvatar(
        userId,
        storagePath,
        originalFilename,
      );

    // 2. Persist updated avatar URL within tenant/user context
    if (tenantId && tenantId !== 'system') {
      await this.prisma.withTenantContext(
        { tenantId, userId },
        async (tx) => {
          return tx.user.update({
            where: { id: userId },
            data: {
              avatar: storageUrl,
            },
          });
        },
      );
    } else {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          avatar: storageUrl,
        },
      });
    }

    // 3. Invalidate auth profile cache for this specific user
    invalidateGetMeCache(userId);

    this.logger.log(
      `[MEDIA WORKER] Successfully completed avatar media processing for user ${userId} (URL: ${storageUrl})`,
    );

    return {
      success: true,
      userId,
      tenantId,
      avatar: storageUrl,
      storagePath: finalStoragePath,
    };
  }
}
