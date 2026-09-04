import { WorkspaceService } from './workspace.service';

describe('WorkspaceService Suite', () => {
  let service: WorkspaceService;
  let mockPrisma: any;
  let mockEnc: any;
  let mockBrandingService: any;
  let mockMediaQueueProducer: any;

  beforeEach(() => {
    mockPrisma = {
      tenant: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'tenant-w1',
          name: 'Acme Corp',
          taxId: 'enc_tax_123',
          address: 'enc_addr_123',
          currency: 'INR',
          timezone: 'ist',
          logo: 'https://example.com/logo-old.webp',
          brandPrimaryColor: '#10b981',
          plan: 'growth',
        }),
        update: jest.fn().mockImplementation(async ({ data }) => ({
          id: 'tenant-w1',
          name: 'Acme Corp',
          taxId: 'enc_tax_123',
          address: 'enc_addr_123',
          currency: 'INR',
          timezone: 'ist',
          logo: data.logo,
          brandPrimaryColor: data.brandPrimaryColor,
          plan: 'growth',
        })),
      },
    };

    mockEnc = {
      encrypt: jest.fn((val) => `enc_${val}`),
      decrypt: jest.fn((val) => (val ? val.replace('enc_', '') : '')),
    };

    mockBrandingService = {
      persistRawMedia: jest.fn().mockResolvedValue({
        storagePath: 'staging/tenant-w1/raw-logo-12345.png',
        mimeType: 'image/png',
        format: 'png',
      }),
      processAndUploadLogo: jest.fn().mockResolvedValue({
        storageUrl: 'https://example.com/storage/workspace-logos/tenant-w1/logo.webp?v=999',
        storagePath: 'workspace-logos/tenant-w1/logo.webp',
        dominantColor: '#2563eb',
      }),
      getPublicLogoUrl: jest.fn().mockReturnValue(
        'https://example.com/storage/workspace-logos/tenant-w1/logo.webp?v=12345',
      ),
    };

    mockMediaQueueProducer = {
      isQueueAvailable: jest.fn().mockReturnValue(true),
      enqueueBrandingMedia: jest.fn().mockResolvedValue({
        enqueued: true,
        jobId: 'branding-media:tenant-w1:job-001',
      }),
    };

    service = new WorkspaceService(
      mockPrisma,
      mockEnc,
      mockBrandingService,
      mockMediaQueueProducer,
    );
  });

  describe('uploadWorkspaceLogo', () => {
    it('should asynchronously persist raw media and enqueue to BullMQ when queue is available', async () => {
      const dummyBuffer = Buffer.from('dummy-image-buffer');
      const result = await service.uploadWorkspaceLogo(
        'tenant-w1',
        dummyBuffer,
        'company.png',
        'usr-admin-1',
      );

      expect(mockBrandingService.persistRawMedia).toHaveBeenCalledWith(
        'tenant-w1',
        dummyBuffer,
        'company.png',
      );
      expect(mockMediaQueueProducer.enqueueBrandingMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-w1',
          userId: 'usr-admin-1',
          mediaReference: 'staging/tenant-w1/raw-logo-12345.png',
          storageBucket: 'workspace-logos',
          storagePath: 'staging/tenant-w1/raw-logo-12345.png',
          targetStoragePath: 'tenant-w1/logo.webp',
          originalFilename: 'company.png',
          mimeType: 'image/png',
          operation: 'PROCESS_WORKSPACE_LOGO',
        }),
      );

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          status: 'queued',
          jobId: 'branding-media:tenant-w1:job-001',
          logo: 'https://example.com/storage/workspace-logos/tenant-w1/logo.webp?v=12345',
          workspace: expect.objectContaining({
            name: 'Acme Corp',
            logo: 'https://example.com/storage/workspace-logos/tenant-w1/logo.webp?v=12345',
          }),
        }),
      );
    });

    it('should fallback to direct synchronous execution when queue is unavailable', async () => {
      mockMediaQueueProducer.isQueueAvailable.mockReturnValue(false);

      const dummyBuffer = Buffer.from('dummy-image-buffer');
      const result = await service.uploadWorkspaceLogo(
        'tenant-w1',
        dummyBuffer,
        'company.png',
      );

      expect(mockBrandingService.persistRawMedia).not.toHaveBeenCalled();
      expect(mockMediaQueueProducer.enqueueBrandingMedia).not.toHaveBeenCalled();
      expect(mockBrandingService.processAndUploadLogo).toHaveBeenCalledWith(
        'tenant-w1',
        dummyBuffer,
        'company.png',
      );
      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-w1' },
        data: {
          logo: 'https://example.com/storage/workspace-logos/tenant-w1/logo.webp?v=999',
          brandPrimaryColor: '#2563eb',
        },
      });

      expect(result.success).toBe(true);
      expect(result.logo).toBe(
        'https://example.com/storage/workspace-logos/tenant-w1/logo.webp?v=999',
      );
      expect(result.brandPrimaryColor).toBe('#2563eb');
    });
  });
});
