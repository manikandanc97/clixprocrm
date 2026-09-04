import { BadRequestException } from '@nestjs/common';
import { AuthService, invalidateGetMeCache } from './auth.service';

describe('AuthService Avatar Upload Suite', () => {
  let authService: AuthService;
  let mockPrisma: any;
  let mockBrandingService: any;
  let mockMediaQueueProducer: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        update: jest.fn().mockImplementation(async ({ where, data }) => ({
          id: where.id,
          name: 'Test User',
          email: 'test@example.com',
          avatar: data.avatar,
        })),
      },
    };

    mockBrandingService = {
      persistRawAvatar: jest.fn().mockResolvedValue({
        storagePath: 'staging/avatars/usr-123/raw-avatar-12345.png',
        mimeType: 'image/png',
        format: 'png',
      }),
      getPublicAvatarUrl: jest.fn().mockReturnValue(
        'https://example.com/storage/workspace-logos/avatars/usr-123/avatar.webp?v=999',
      ),
      processAndUploadAvatar: jest.fn().mockResolvedValue({
        storageUrl: 'https://example.com/storage/workspace-logos/avatars/usr-123/avatar.webp?v=sync',
        storagePath: 'workspace-logos/avatars/usr-123/avatar.webp',
      }),
    };

    mockMediaQueueProducer = {
      isQueueAvailable: jest.fn().mockReturnValue(true),
      enqueueAvatarMedia: jest.fn().mockResolvedValue({
        enqueued: true,
        jobId: 'avatar-media:usr-123:staging_raw:PROCESS_USER_AVATAR',
      }),
    };

    authService = new AuthService(
      mockPrisma,
      mockBrandingService,
      mockMediaQueueProducer,
    );
  });

  it('should throw BadRequestException if userId is missing', async () => {
    const rawBuffer = Buffer.from('fake-image');
    await expect(authService.uploadAvatar('', rawBuffer)).rejects.toThrow(
      BadRequestException,
    );
  });

  describe('When Media Queue is available', () => {
    it('should persist raw avatar staging, enqueue BullMQ job, and return fast response', async () => {
      const rawBuffer = Buffer.from('fake-avatar-bytes');
      const result = await authService.uploadAvatar(
        'usr-123',
        rawBuffer,
        'profile.png',
        'tenant-xyz',
      );

      expect(mockMediaQueueProducer.isQueueAvailable).toHaveBeenCalled();
      expect(mockBrandingService.persistRawAvatar).toHaveBeenCalledWith(
        'usr-123',
        rawBuffer,
        'profile.png',
      );
      expect(mockBrandingService.getPublicAvatarUrl).toHaveBeenCalledWith('usr-123');
      expect(mockMediaQueueProducer.enqueueAvatarMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-xyz',
          userId: 'usr-123',
          storageBucket: 'workspace-logos',
          storagePath: 'staging/avatars/usr-123/raw-avatar-12345.png',
          targetStoragePath: 'avatars/usr-123/avatar.webp',
          originalFilename: 'profile.png',
          mimeType: 'image/png',
          operation: 'PROCESS_USER_AVATAR',
        }),
      );
      // Synchronous user update skipped in favor of async worker execution
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        avatar: 'https://example.com/storage/workspace-logos/avatars/usr-123/avatar.webp?v=999',
        user: {
          id: 'usr-123',
          avatar: 'https://example.com/storage/workspace-logos/avatars/usr-123/avatar.webp?v=999',
        },
        jobId: 'avatar-media:usr-123:staging_raw:PROCESS_USER_AVATAR',
        queued: true,
      });
    });
  });

  describe('When Media Queue is unavailable (fallback mode)', () => {
    it('should fallback to synchronous processing and DB update when queue is offline', async () => {
      mockMediaQueueProducer.isQueueAvailable.mockReturnValue(false);

      const rawBuffer = Buffer.from('fake-avatar-bytes');
      const result = await authService.uploadAvatar(
        'usr-123',
        rawBuffer,
        'profile.png',
      );

      expect(mockBrandingService.processAndUploadAvatar).toHaveBeenCalledWith(
        'usr-123',
        rawBuffer,
        'profile.png',
      );
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'usr-123' },
        data: {
          avatar: 'https://example.com/storage/workspace-logos/avatars/usr-123/avatar.webp?v=sync',
        },
      });
      expect(result).toEqual({
        success: true,
        avatar: 'https://example.com/storage/workspace-logos/avatars/usr-123/avatar.webp?v=sync',
        user: {
          id: 'usr-123',
          name: 'Test User',
          email: 'test@example.com',
          avatar: 'https://example.com/storage/workspace-logos/avatars/usr-123/avatar.webp?v=sync',
        },
      });
    });

    it('should fallback to synchronous processing when producer is omitted', async () => {
      const synchronousAuthService = new AuthService(
        mockPrisma,
        mockBrandingService,
        undefined,
      );

      const rawBuffer = Buffer.from('fake-avatar-bytes');
      const result = await synchronousAuthService.uploadAvatar(
        'usr-456',
        rawBuffer,
        'profile.png',
      );

      expect(mockBrandingService.processAndUploadAvatar).toHaveBeenCalledWith(
        'usr-456',
        rawBuffer,
        'profile.png',
      );
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'usr-456' },
        data: {
          avatar: 'https://example.com/storage/workspace-logos/avatars/usr-123/avatar.webp?v=sync',
        },
      });
      expect(result.success).toBe(true);
    });
  });
});
