import { MediaQueueProcessor } from './media-queue.processor';
import { MEDIA_JOB_NAMES, BrandingMediaJobPayload } from '../interfaces/media-jobs';

describe('MediaQueueProcessor Suite', () => {
  let processor: MediaQueueProcessor;
  let mockBrandingService: any;
  let mockPrisma: any;

  beforeEach(() => {
    mockBrandingService = {
      processPersistedLogo: jest.fn().mockResolvedValue({
        storageUrl: 'https://example.com/storage/workspace-logos/tenant-test/logo.webp?v=12345',
        storagePath: 'workspace-logos/tenant-test/logo.webp',
        dominantColor: '#2563eb',
      }),
      processPersistedAvatar: jest.fn().mockResolvedValue({
        storageUrl: 'https://example.com/storage/workspace-logos/avatars/usr-123/avatar.webp?v=12345',
        storagePath: 'workspace-logos/avatars/usr-123/avatar.webp',
      }),
    };

    mockPrisma = {
      user: {
        update: jest.fn().mockResolvedValue({
          id: 'usr-123',
          avatar: 'https://example.com/storage/workspace-logos/avatars/usr-123/avatar.webp?v=12345',
        }),
      },
      withTenantContext: jest.fn().mockImplementation(async (options, callback) => {
        const tx = {
          tenant: {
            update: jest.fn().mockResolvedValue({
              id: options.tenantId,
              logo: 'https://example.com/storage/workspace-logos/tenant-test/logo.webp?v=12345',
              brandPrimaryColor: '#2563eb',
            }),
          },
          user: {
            update: jest.fn().mockResolvedValue({
              id: options.userId,
              avatar: 'https://example.com/storage/workspace-logos/avatars/usr-123/avatar.webp?v=12345',
            }),
          },
        };
        return callback(tx);
      }),
    };

    processor = new MediaQueueProcessor(mockBrandingService, mockPrisma);
  });

  it('should successfully process valid branding media job within tenant context', async () => {
    const job: any = {
      name: MEDIA_JOB_NAMES.PROCESS_BRANDING,
      id: 'job-media-1',
      data: {
        tenantId: 'tenant-test',
        userId: 'usr-admin',
        mediaReference: 'staging/tenant-test/raw-logo.png',
        storageBucket: 'workspace-logos',
        storagePath: 'staging/tenant-test/raw-logo.png',
        targetStoragePath: 'tenant-test/logo.webp',
        originalFilename: 'logo.png',
        mimeType: 'image/png',
        operation: 'PROCESS_WORKSPACE_LOGO',
        correlationId: 'corr-media-100',
        timestamp: new Date().toISOString(),
        jobId: 'branding-media:tenant-test:staging_raw:PROCESS_WORKSPACE_LOGO',
      } as BrandingMediaJobPayload,
    };

    const result = await processor.process(job);

    expect(mockBrandingService.processPersistedLogo).toHaveBeenCalledWith(
      'tenant-test',
      'staging/tenant-test/raw-logo.png',
      'logo.png',
    );
    expect(mockPrisma.withTenantContext).toHaveBeenCalledWith(
      { tenantId: 'tenant-test', userId: 'usr-admin' },
      expect.any(Function),
    );
    expect(result).toEqual({
      success: true,
      tenantId: 'tenant-test',
      logo: 'https://example.com/storage/workspace-logos/tenant-test/logo.webp?v=12345',
      brandPrimaryColor: '#2563eb',
    });
  });

  it('should fail and re-throw if tenantId is missing', async () => {
    const job: any = {
      name: MEDIA_JOB_NAMES.PROCESS_BRANDING,
      id: 'job-missing-tenant',
      data: {
        mediaReference: 'staging/raw-logo.png',
        storagePath: 'staging/raw-logo.png',
      } as any,
    };

    await expect(processor.process(job)).rejects.toThrow(
      'Tenant context missing: tenantId is required for multi-tenant media processing',
    );
  });

  it('should fail and re-throw if storagePath is missing', async () => {
    const job: any = {
      name: MEDIA_JOB_NAMES.PROCESS_BRANDING,
      id: 'job-missing-path',
      data: {
        tenantId: 'tenant-test',
        mediaReference: 'staging/raw-logo.png',
      } as any,
    };

    await expect(processor.process(job)).rejects.toThrow(
      'Storage reference missing: storagePath is required to retrieve persisted raw media',
    );
  });

  it('should propagate BrandingService processing errors for BullMQ retries', async () => {
    mockBrandingService.processPersistedLogo.mockRejectedValue(
      new Error('Sharp decompression error: invalid image buffer'),
    );

    const job: any = {
      name: MEDIA_JOB_NAMES.PROCESS_BRANDING,
      id: 'job-fail-processing',
      data: {
        tenantId: 'tenant-test',
        storagePath: 'staging/corrupt-image.png',
        operation: 'PROCESS_WORKSPACE_LOGO',
      } as any,
    };

    await expect(processor.process(job)).rejects.toThrow(
      'Sharp decompression error: invalid image buffer',
    );
  });

  it('should handle unknown job names gracefully without throwing', async () => {
    const job: any = {
      name: 'unsupported-media-operation',
      id: 'job-unknown',
      data: { tenantId: 'tenant-test' } as any,
    };

    const result = await processor.process(job);
    expect(result).toEqual({
      skipped: true,
      reason: 'Unknown job type: unsupported-media-operation',
    });
  });

  it('should remain idempotent when processing identical jobs consecutively', async () => {
    const job: any = {
      name: MEDIA_JOB_NAMES.PROCESS_BRANDING,
      id: 'job-idempotent',
      data: {
        tenantId: 'tenant-idempotent',
        storagePath: 'staging/tenant-idempotent/raw-logo.png',
        operation: 'PROCESS_WORKSPACE_LOGO',
      } as any,
    };

    const result1 = await processor.process(job);
    const result2 = await processor.process(job);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(mockBrandingService.processPersistedLogo).toHaveBeenCalledTimes(2);
    expect(mockPrisma.withTenantContext).toHaveBeenCalledTimes(2);
  });

  describe('handleAvatarMedia', () => {
    it('should successfully process valid avatar media job within tenant context', async () => {
      const job: any = {
        name: MEDIA_JOB_NAMES.PROCESS_AVATAR,
        id: 'job-avatar-1',
        data: {
          tenantId: 'tenant-test',
          userId: 'usr-123',
          mediaReference: 'staging/avatars/usr-123/raw-avatar.png',
          storageBucket: 'workspace-logos',
          storagePath: 'staging/avatars/usr-123/raw-avatar.png',
          targetStoragePath: 'avatars/usr-123/avatar.webp',
          originalFilename: 'profile.png',
          mimeType: 'image/png',
          operation: 'PROCESS_USER_AVATAR',
          correlationId: 'corr-avatar-100',
          timestamp: new Date().toISOString(),
          jobId: 'avatar-media:usr-123:staging_raw:PROCESS_USER_AVATAR',
        },
      };

      const result = await processor.process(job);

      expect(mockBrandingService.processPersistedAvatar).toHaveBeenCalledWith(
        'usr-123',
        'staging/avatars/usr-123/raw-avatar.png',
        'profile.png',
      );
      expect(mockPrisma.withTenantContext).toHaveBeenCalledWith(
        { tenantId: 'tenant-test', userId: 'usr-123' },
        expect.any(Function),
      );
      expect(result).toEqual({
        success: true,
        userId: 'usr-123',
        tenantId: 'tenant-test',
        avatar: 'https://example.com/storage/workspace-logos/avatars/usr-123/avatar.webp?v=12345',
        storagePath: 'workspace-logos/avatars/usr-123/avatar.webp',
      });
    });

    it('should fall back to direct prisma user update if tenantId is system or absent', async () => {
      const job: any = {
        name: MEDIA_JOB_NAMES.PROCESS_AVATAR,
        id: 'job-avatar-system',
        data: {
          tenantId: 'system',
          userId: 'usr-super',
          storagePath: 'staging/avatars/usr-super/raw-avatar.png',
          operation: 'PROCESS_USER_AVATAR',
        },
      };

      const result = await processor.process(job);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'usr-super' },
        data: {
          avatar: 'https://example.com/storage/workspace-logos/avatars/usr-123/avatar.webp?v=12345',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should fail and re-throw if userId is missing', async () => {
      const job: any = {
        name: MEDIA_JOB_NAMES.PROCESS_AVATAR,
        id: 'job-missing-user',
        data: {
          storagePath: 'staging/avatars/usr-123/raw.png',
          operation: 'PROCESS_USER_AVATAR',
        },
      };

      await expect(processor.process(job)).rejects.toThrow(
        'User context missing: userId is required for avatar media processing',
      );
    });

    it('should fail and re-throw if storagePath is missing for avatar', async () => {
      const job: any = {
        name: MEDIA_JOB_NAMES.PROCESS_AVATAR,
        id: 'job-missing-avatar-path',
        data: {
          userId: 'usr-123',
          operation: 'PROCESS_USER_AVATAR',
        },
      };

      await expect(processor.process(job)).rejects.toThrow(
        'Storage reference missing: storagePath is required to retrieve persisted raw avatar',
      );
    });
  });
});
