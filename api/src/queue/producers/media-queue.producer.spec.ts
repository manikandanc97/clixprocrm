import {
  MediaQueueProducer,
  MEDIA_DEFAULT_JOB_OPTS,
} from './media-queue.producer';
import { MEDIA_JOB_NAMES } from '../interfaces/media-jobs';

describe('MediaQueueProducer Suite', () => {
  let producer: MediaQueueProducer;
  let mockQueue: any;

  beforeEach(() => {
    mockQueue = {
      add: jest.fn().mockImplementation(async (name, data, opts) => ({
        id: opts?.jobId || 'mock-job-id-123',
        name,
        data,
        opts,
      })),
    };
    producer = new MediaQueueProducer(mockQueue);
  });

  it('should indicate queue is available when injected', () => {
    expect(producer.isQueueAvailable()).toBe(true);
  });

  it('should indicate queue is unavailable when not injected', () => {
    const disconnectedProducer = new MediaQueueProducer(undefined);
    expect(disconnectedProducer.isQueueAvailable()).toBe(false);
  });

  describe('enqueueBrandingMedia', () => {
    it('should enqueue branding media job with BaseJobPayload and deterministic options', async () => {
      const result = await producer.enqueueBrandingMedia({
        tenantId: 'tenant-brand-1',
        userId: 'usr-admin-1',
        mediaReference: 'staging/tenant-brand-1/raw-logo-12345.png',
        storageBucket: 'workspace-logos',
        storagePath: 'staging/tenant-brand-1/raw-logo-12345.png',
        targetStoragePath: 'tenant-brand-1/logo.webp',
        originalFilename: 'company-logo.png',
        mimeType: 'image/png',
        operation: 'PROCESS_WORKSPACE_LOGO',
        correlationId: 'corr-media-1',
      });

      expect(result.enqueued).toBe(true);
      expect(result.jobId).toMatch(/^branding-media:tenant-brand-1:staging_tenant-brand-1_raw-logo-12345_png:PROCESS_WORKSPACE_LOGO$/);
      expect(mockQueue.add).toHaveBeenCalledWith(
        MEDIA_JOB_NAMES.PROCESS_BRANDING,
        expect.objectContaining({
          tenantId: 'tenant-brand-1',
          userId: 'usr-admin-1',
          mediaReference: 'staging/tenant-brand-1/raw-logo-12345.png',
          storageBucket: 'workspace-logos',
          storagePath: 'staging/tenant-brand-1/raw-logo-12345.png',
          targetStoragePath: 'tenant-brand-1/logo.webp',
          originalFilename: 'company-logo.png',
          mimeType: 'image/png',
          operation: 'PROCESS_WORKSPACE_LOGO',
          correlationId: 'corr-media-1',
          timestamp: expect.any(String),
          jobId: expect.any(String),
        }),
        expect.objectContaining({
          attempts: MEDIA_DEFAULT_JOB_OPTS.attempts,
          backoff: MEDIA_DEFAULT_JOB_OPTS.backoff,
          removeOnComplete: true,
          removeOnFail: 100,
          jobId: expect.any(String),
        }),
      );
    });

    it('should ensure no raw binary buffers, base64 images, or secrets exist in enqueued job payload', async () => {
      await producer.enqueueBrandingMedia({
        tenantId: 'tenant-brand-2',
        mediaReference: 'ref-123',
        storageBucket: 'workspace-logos',
        storagePath: 'staging/raw-logo.png',
        targetStoragePath: 'tenant-brand-2/logo.webp',
        mimeType: 'image/png',
        operation: 'PROCESS_WORKSPACE_LOGO',
      });

      const enqueuedData = mockQueue.add.mock.calls[0][1];
      expect(enqueuedData).not.toHaveProperty('buffer');
      expect(enqueuedData).not.toHaveProperty('rawBuffer');
      expect(enqueuedData).not.toHaveProperty('base64');
      expect(enqueuedData).not.toHaveProperty('secret');
      expect(enqueuedData).not.toHaveProperty('key');
      expect(enqueuedData).not.toHaveProperty('password');
    });

    it('should return { enqueued: false } gracefully when queue is disconnected', async () => {
      const disconnectedProducer = new MediaQueueProducer(undefined);
      const result = await disconnectedProducer.enqueueBrandingMedia({
        tenantId: 'tenant-brand-3',
        mediaReference: 'ref-offline',
        storageBucket: 'workspace-logos',
        storagePath: 'staging/raw-logo.png',
        targetStoragePath: 'tenant-brand-3/logo.webp',
        mimeType: 'image/png',
        operation: 'PROCESS_WORKSPACE_LOGO',
      });

      expect(result.enqueued).toBe(false);
      expect(result.jobId).toBeUndefined();
    });

    it('should allow custom jobId override if provided', async () => {
      const customJobId = 'custom-branding-job-id-999';
      const result = await producer.enqueueBrandingMedia({
        tenantId: 'tenant-brand-4',
        mediaReference: 'ref-custom',
        storageBucket: 'workspace-logos',
        storagePath: 'staging/raw-logo.png',
        targetStoragePath: 'tenant-brand-4/logo.webp',
        mimeType: 'image/png',
        operation: 'PROCESS_WORKSPACE_LOGO',
        jobId: customJobId,
      });

      expect(result.enqueued).toBe(true);
      expect(result.jobId).toBe(customJobId);
      expect(mockQueue.add).toHaveBeenCalledWith(
        MEDIA_JOB_NAMES.PROCESS_BRANDING,
        expect.objectContaining({ jobId: customJobId }),
        expect.objectContaining({ jobId: customJobId }),
      );
    });
  });

  describe('enqueueAvatarMedia', () => {
    it('should enqueue avatar media job with BaseJobPayload and deterministic options', async () => {
      const result = await producer.enqueueAvatarMedia({
        tenantId: 'tenant-avatar-1',
        userId: 'usr-123',
        mediaReference: 'staging/avatars/usr-123/raw-avatar-12345.png',
        storageBucket: 'workspace-logos',
        storagePath: 'staging/avatars/usr-123/raw-avatar-12345.png',
        targetStoragePath: 'avatars/usr-123/avatar.webp',
        originalFilename: 'profile.png',
        mimeType: 'image/png',
        operation: 'PROCESS_USER_AVATAR',
        correlationId: 'corr-avatar-1',
      });

      expect(result.enqueued).toBe(true);
      expect(result.jobId).toMatch(/^avatar-media:usr-123:staging_avatars_usr-123_raw-avatar-12345_png:PROCESS_USER_AVATAR$/);
      expect(mockQueue.add).toHaveBeenCalledWith(
        MEDIA_JOB_NAMES.PROCESS_AVATAR,
        expect.objectContaining({
          tenantId: 'tenant-avatar-1',
          userId: 'usr-123',
          mediaReference: 'staging/avatars/usr-123/raw-avatar-12345.png',
          storageBucket: 'workspace-logos',
          storagePath: 'staging/avatars/usr-123/raw-avatar-12345.png',
          targetStoragePath: 'avatars/usr-123/avatar.webp',
          originalFilename: 'profile.png',
          mimeType: 'image/png',
          operation: 'PROCESS_USER_AVATAR',
          correlationId: 'corr-avatar-1',
          timestamp: expect.any(String),
          jobId: expect.any(String),
        }),
        expect.objectContaining({
          attempts: MEDIA_DEFAULT_JOB_OPTS.attempts,
          backoff: MEDIA_DEFAULT_JOB_OPTS.backoff,
          removeOnComplete: true,
          removeOnFail: 100,
          jobId: expect.any(String),
        }),
      );
    });

    it('should ensure no raw binary buffers or secrets exist in enqueued avatar payload', async () => {
      await producer.enqueueAvatarMedia({
        tenantId: 'tenant-avatar-2',
        userId: 'usr-456',
        mediaReference: 'ref-avatar-456',
        storageBucket: 'workspace-logos',
        storagePath: 'staging/avatars/usr-456/raw.png',
        targetStoragePath: 'avatars/usr-456/avatar.webp',
        mimeType: 'image/png',
        operation: 'PROCESS_USER_AVATAR',
      });

      const enqueuedData = mockQueue.add.mock.calls[0][1];
      expect(enqueuedData).not.toHaveProperty('buffer');
      expect(enqueuedData).not.toHaveProperty('rawBuffer');
      expect(enqueuedData).not.toHaveProperty('base64');
      expect(enqueuedData).not.toHaveProperty('password');
    });

    it('should return { enqueued: false } gracefully when queue is disconnected for avatar', async () => {
      const disconnectedProducer = new MediaQueueProducer(undefined);
      const result = await disconnectedProducer.enqueueAvatarMedia({
        tenantId: 'tenant-avatar-3',
        userId: 'usr-offline',
        mediaReference: 'ref-avatar-off',
        storageBucket: 'workspace-logos',
        storagePath: 'staging/avatars/usr-offline/raw.png',
        targetStoragePath: 'avatars/usr-offline/avatar.webp',
        mimeType: 'image/png',
        operation: 'PROCESS_USER_AVATAR',
      });

      expect(result.enqueued).toBe(false);
      expect(result.jobId).toBeUndefined();
    });
  });
});
