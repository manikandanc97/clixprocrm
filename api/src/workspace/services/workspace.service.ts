import { Injectable, Optional, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { invalidateGetMeCache } from '../../auth/auth.service';
import { BrandingService } from './branding.service';
import { MediaQueueProducer } from '../../queue/producers/media-queue.producer';

/**
 * ENCRYPTION NOTE:
 *  - Tenant.taxId and Tenant.address are AES-256-GCM encrypted.
 *  - Decryption happens transparently on read before returning to client.
 */
@Injectable()
export class WorkspaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enc: EncryptionService,
    private readonly brandingService: BrandingService,
    @Optional()
    @Inject(forwardRef(() => MediaQueueProducer))
    private readonly mediaQueueProducer?: MediaQueueProducer,
  ) {}

  async getWorkspace(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    return {
      name: tenant?.name || 'ClixProCRM Workspace',
      taxId: this.enc.decrypt(tenant?.taxId) || '',
      address: this.enc.decrypt(tenant?.address) || '',
      currency: tenant?.currency || 'INR',
      timezone: tenant?.timezone || 'ist',
      logo: tenant?.logo || null,
      brandPrimaryColor: (tenant as any)?.brandPrimaryColor || null,
      plan: tenant?.plan || 'free',
    };
  }

  async updateWorkspace(tenantId: string, data: any) {
    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.taxId !== undefined && { taxId: this.enc.encrypt(data.taxId) }),
        ...(data.address !== undefined && { address: this.enc.encrypt(data.address) }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.logo !== undefined && { logo: data.logo }),
        ...(data.brandPrimaryColor !== undefined && { brandPrimaryColor: data.brandPrimaryColor }),
      },
    });

    // Invalidate cached auth profile so all users in this tenant get immediate updates
    invalidateGetMeCache();

    return {
      name: updated.name || 'ClixProCRM Workspace',
      taxId: this.enc.decrypt(updated.taxId) || '',
      address: this.enc.decrypt(updated.address) || '',
      currency: updated.currency || 'INR',
      timezone: updated.timezone || 'ist',
      logo: updated.logo || null,
      brandPrimaryColor: (updated as any)?.brandPrimaryColor || null,
      plan: updated.plan || 'free',
    };
  }

  async uploadWorkspaceLogo(
    tenantId: string,
    rawBuffer: Buffer,
    originalFilename?: string,
    userId?: string,
  ) {
    if (this.mediaQueueProducer?.isQueueAvailable()) {
      // 1. Synchronously persist raw media to Supabase storage staging path
      const { storagePath, mimeType } =
        await this.brandingService.persistRawMedia(
          tenantId,
          rawBuffer,
          originalFilename,
        );

      // 2. Enqueue branding media processing job with lightweight references
      const enqueueResult =
        await this.mediaQueueProducer.enqueueBrandingMedia({
          tenantId,
          userId,
          mediaReference: storagePath,
          storageBucket: 'workspace-logos',
          storagePath,
          targetStoragePath: `${tenantId}/logo.webp`,
          originalFilename,
          mimeType,
          operation: 'PROCESS_WORKSPACE_LOGO',
        });

      if (enqueueResult.enqueued) {
        // Fast response: compute deterministic public URL
        const deterministicLogoUrl =
          this.brandingService.getPublicLogoUrl(tenantId);
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: tenantId },
        });

        return {
          success: true,
          status: 'queued',
          jobId: enqueueResult.jobId,
          logo: deterministicLogoUrl,
          brandPrimaryColor:
            (tenant as any)?.brandPrimaryColor || '#10b981',
          workspace: {
            name: tenant?.name || 'ClixProCRM Workspace',
            taxId: this.enc.decrypt(tenant?.taxId) || '',
            address: this.enc.decrypt(tenant?.address) || '',
            currency: tenant?.currency || 'INR',
            timezone: tenant?.timezone || 'ist',
            logo: deterministicLogoUrl,
            brandPrimaryColor:
              (tenant as any)?.brandPrimaryColor || '#10b981',
            plan: tenant?.plan || 'free',
          },
        };
      }
    }

    // Direct synchronous execution fallback when queue is unavailable
    const { storageUrl, dominantColor } =
      await this.brandingService.processAndUploadLogo(
        tenantId,
        rawBuffer,
        originalFilename,
      );

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        logo: storageUrl,
        brandPrimaryColor: dominantColor,
      },
    });

    invalidateGetMeCache();

    return {
      success: true,
      logo: updated.logo,
      brandPrimaryColor: (updated as any)?.brandPrimaryColor || dominantColor,
      workspace: {
        name: updated.name || 'ClixProCRM Workspace',
        taxId: this.enc.decrypt(updated.taxId) || '',
        address: this.enc.decrypt(updated.address) || '',
        currency: updated.currency || 'INR',
        timezone: updated.timezone || 'ist',
        logo: updated.logo || null,
        brandPrimaryColor: (updated as any)?.brandPrimaryColor || dominantColor,
        plan: updated.plan || 'free',
      },
    };
  }
}
