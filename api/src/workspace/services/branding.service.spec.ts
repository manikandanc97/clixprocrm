import { BrandingService } from './branding.service';
import sharp from 'sharp';

describe('BrandingService', () => {
  let service: BrandingService;

  beforeEach(() => {
    service = new BrandingService();
  });

  describe('validateImageBuffer', () => {
    it('should validate PNG magic bytes', async () => {
      const pngBuffer = await sharp({
        create: {
          width: 10,
          height: 10,
          channels: 4,
          background: { r: 255, g: 0, b: 0, alpha: 1 },
        },
      })
        .png()
        .toBuffer();

      const result = service.validateImageBuffer(pngBuffer, 'test.png');
      expect(result.format).toBe('png');
      expect(result.mimeType).toBe('image/png');
    });

    it('should validate JPEG magic bytes', async () => {
      const jpegBuffer = await sharp({
        create: {
          width: 10,
          height: 10,
          channels: 3,
          background: { r: 0, g: 255, b: 0 },
        },
      })
        .jpeg()
        .toBuffer();

      const result = service.validateImageBuffer(jpegBuffer, 'test.jpg');
      expect(result.format).toBe('jpeg');
      expect(result.mimeType).toBe('image/jpeg');
    });

    it('should validate WebP magic bytes', async () => {
      const webpBuffer = await sharp({
        create: {
          width: 10,
          height: 10,
          channels: 4,
          background: { r: 0, g: 0, b: 255, alpha: 1 },
        },
      })
        .webp()
        .toBuffer();

      const result = service.validateImageBuffer(webpBuffer, 'test.webp');
      expect(result.format).toBe('webp');
      expect(result.mimeType).toBe('image/webp');
    });

    it('should reject invalid / executable files', () => {
      const invalidBuffer = Buffer.from('MZ...This program cannot be run in DOS mode');
      expect(() => service.validateImageBuffer(invalidBuffer, 'malicious.exe')).toThrow();
    });
  });

  describe('optimizeToWebP', () => {
    it('should convert an image to WebP with dimensions constrained to 512x512', async () => {
      const inputBuffer = await sharp({
        create: {
          width: 800,
          height: 600,
          channels: 4,
          background: { r: 100, g: 150, b: 200, alpha: 0.8 },
        },
      })
        .png()
        .toBuffer();

      const webpBuffer = await service.optimizeToWebP(inputBuffer);
      const metadata = await sharp(webpBuffer).metadata();

      expect(metadata.format).toBe('webp');
      expect(metadata.width).toBeLessThanOrEqual(512);
      expect(metadata.height).toBeLessThanOrEqual(512);
      expect(metadata.hasAlpha).toBe(true);
    });
  });

  describe('extractDominantColor', () => {
    it('should extract dominant vibrant blue color while ignoring white background', async () => {
      // Create an image with 80% white background and a dominant 20% vibrant blue box
      const blueBox = await sharp({
        create: {
          width: 40,
          height: 40,
          channels: 4,
          background: { r: 37, g: 99, b: 235, alpha: 1 }, // #2563eb
        },
      })
        .png()
        .toBuffer();

      const compositeImage = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }, // pure white
        },
      })
        .composite([{ input: blueBox, top: 30, left: 30 }])
        .png()
        .toBuffer();

      const color = await service.extractDominantColor(compositeImage);
      expect(color.toLowerCase()).toMatch(/^#2[56]63eb$/);
    });

    it('should fallback to default #10b981 for pure black-and-white or transparent images', async () => {
      const transparentImage = await sharp({
        create: {
          width: 50,
          height: 50,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .png()
        .toBuffer();

      const color = await service.extractDominantColor(transparentImage);
      expect(color.toLowerCase()).toBe('#10b981');
    });
  });

  describe('persistRawMedia', () => {
    let mockSupabase: any;

    beforeEach(() => {
      mockSupabase = {
        storage: {
          listBuckets: jest.fn().mockResolvedValue({ data: [{ name: 'workspace-logos' }], error: null }),
          from: jest.fn().mockReturnValue({
            upload: jest.fn().mockResolvedValue({ data: { path: 'staging/path' }, error: null }),
          }),
        },
      };
      (service as any).getSupabase = jest.fn().mockReturnValue(mockSupabase);
    });

    it('should validate and persist raw image buffer to Supabase storage staging path', async () => {
      const pngBuffer = await sharp({
        create: {
          width: 20,
          height: 20,
          channels: 4,
          background: { r: 255, g: 0, b: 0, alpha: 1 },
        },
      })
        .png()
        .toBuffer();

      const result = await service.persistRawMedia('tenant-unit-1', pngBuffer, 'logo.png');

      expect(result.mimeType).toBe('image/png');
      expect(result.format).toBe('png');
      expect(result.storagePath).toMatch(/^staging\/tenant-unit-1\/raw-logo-\d+\.png$/);
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('workspace-logos');
    });

    it('should reject persistence if tenantId is missing', async () => {
      const buffer = Buffer.from('test');
      await expect(service.persistRawMedia('', buffer)).rejects.toThrow(
        'Tenant ID is required for branding upload',
      );
    });

    it('should reject invalid file types before uploading to storage', async () => {
      const invalidBuffer = Buffer.from('NOT_AN_IMAGE_BUFFER');
      await expect(service.persistRawMedia('tenant-unit-1', invalidBuffer)).rejects.toThrow();
      expect(mockSupabase.storage.from).not.toHaveBeenCalled();
    });
  });

  describe('processPersistedLogo', () => {
    let mockSupabase: any;
    let validPngBuffer: Buffer;

    beforeEach(async () => {
      validPngBuffer = await sharp({
        create: {
          width: 30,
          height: 30,
          channels: 4,
          background: { r: 37, g: 99, b: 235, alpha: 1 },
        },
      })
        .png()
        .toBuffer();

      mockSupabase = {
        storage: {
          listBuckets: jest.fn().mockResolvedValue({ data: [{ name: 'workspace-logos' }], error: null }),
          from: jest.fn().mockReturnValue({
            download: jest.fn().mockResolvedValue({
              data: {
                arrayBuffer: async () => validPngBuffer.buffer.slice(validPngBuffer.byteOffset, validPngBuffer.byteOffset + validPngBuffer.byteLength),
              },
              error: null,
            }),
            upload: jest.fn().mockResolvedValue({ data: { path: 'uploaded' }, error: null }),
            remove: jest.fn().mockResolvedValue({ data: [], error: null }),
            getPublicUrl: jest.fn().mockReturnValue({
              data: { publicUrl: 'https://example.com/storage/workspace-logos/tenant-unit-1/logo.webp' },
            }),
          }),
        },
      };
      (service as any).getSupabase = jest.fn().mockReturnValue(mockSupabase);
    });

    it('should download raw image, optimize to WebP, extract color, upload, and cleanup staging', async () => {
      const result = await service.processPersistedLogo(
        'tenant-unit-1',
        'staging/tenant-unit-1/raw-logo-12345.png',
        'logo.png',
      );

      expect(result.storageUrl).toContain('https://example.com/storage/workspace-logos/tenant-unit-1/logo.webp?v=');
      expect(result.storagePath).toBe('workspace-logos/tenant-unit-1/logo.webp');
      expect(result.dominantColor.toLowerCase()).toMatch(/^#2[456]63eb$/);
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('workspace-logos');
    });

    it('should throw if raw download fails', async () => {
      mockSupabase.storage.from().download.mockResolvedValueOnce({
        data: null,
        error: { message: 'Object not found' },
      });

      await expect(
        service.processPersistedLogo('tenant-unit-1', 'staging/missing.png'),
      ).rejects.toThrow('Failed to retrieve raw branding media from Supabase Storage: Object not found');
    });
  });

  describe('getPublicLogoUrl', () => {
    it('should return cache-busted public URL for workspace logo', () => {
      const mockSupabase = {
        storage: {
          from: jest.fn().mockReturnValue({
            getPublicUrl: jest.fn().mockReturnValue({
              data: { publicUrl: 'https://example.com/storage/workspace-logos/tenant-xyz/logo.webp' },
            }),
          }),
        },
      };
      (service as any).getSupabase = jest.fn().mockReturnValue(mockSupabase);

      const url = service.getPublicLogoUrl('tenant-xyz');
      expect(url).toMatch(/^https:\/\/example\.com\/storage\/workspace-logos\/tenant-xyz\/logo\.webp\?v=\d+$/);
    });
  });

  describe('persistRawAvatar', () => {
    it('should validate and persist raw avatar buffer into staging', async () => {
      const mockSupabase = {
        storage: {
          listBuckets: jest.fn().mockResolvedValue({ data: [{ name: 'workspace-logos' }], error: null }),
          from: jest.fn().mockReturnValue({
            upload: jest.fn().mockResolvedValue({ error: null }),
          }),
        },
      };
      (service as any).getSupabase = jest.fn().mockReturnValue(mockSupabase);

      const buffer = await sharp({
        create: { width: 30, height: 30, channels: 4, background: { r: 10, g: 20, b: 30, alpha: 1 } },
      })
        .png()
        .toBuffer();

      const result = await service.persistRawAvatar('usr-unit-1', buffer, 'profile.png');
      expect(result.storagePath).toMatch(/^staging\/avatars\/usr-unit-1\/raw-avatar-\d+\.png$/);
      expect(result.mimeType).toBe('image/png');
      expect(result.format).toBe('png');
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('workspace-logos');
    });

    it('should throw if userId is missing', async () => {
      const buffer = Buffer.from('fake');
      await expect(service.persistRawAvatar('', buffer)).rejects.toThrow('User ID is required for avatar upload');
    });
  });

  describe('processPersistedAvatar', () => {
    let mockSupabase: any;
    let sampleAvatarPng: Buffer;

    beforeEach(async () => {
      sampleAvatarPng = await sharp({
        create: {
          width: 60,
          height: 60,
          channels: 4,
          background: { r: 50, g: 100, b: 150, alpha: 1 },
        },
      })
        .png()
        .toBuffer();

      mockSupabase = {
        storage: {
          listBuckets: jest.fn().mockResolvedValue({ data: [{ name: 'workspace-logos' }], error: null }),
          from: jest.fn().mockReturnValue({
            download: jest.fn().mockResolvedValue({
              data: {
                arrayBuffer: jest.fn().mockResolvedValue(sampleAvatarPng.buffer),
              },
              error: null,
            }),
            upload: jest.fn().mockResolvedValue({ error: null }),
            remove: jest.fn().mockResolvedValue({ error: null }),
            getPublicUrl: jest.fn().mockReturnValue({
              data: { publicUrl: 'https://example.com/storage/workspace-logos/avatars/usr-unit-1/avatar.webp' },
            }),
          }),
        },
      };
      (service as any).getSupabase = jest.fn().mockReturnValue(mockSupabase);
    });

    it('should download raw avatar, optimize to WebP, upload, and cleanup staging', async () => {
      const result = await service.processPersistedAvatar(
        'usr-unit-1',
        'staging/avatars/usr-unit-1/raw-avatar-12345.png',
        'profile.png',
      );

      expect(result.storageUrl).toContain('https://example.com/storage/workspace-logos/avatars/usr-unit-1/avatar.webp?v=');
      expect(result.storagePath).toBe('workspace-logos/avatars/usr-unit-1/avatar.webp');
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('workspace-logos');
    });

    it('should throw if download fails', async () => {
      mockSupabase.storage.from().download.mockResolvedValueOnce({
        data: null,
        error: { message: 'File not found' },
      });

      await expect(
        service.processPersistedAvatar('usr-unit-1', 'staging/avatars/usr-unit-1/missing.png'),
      ).rejects.toThrow('Failed to retrieve raw avatar from Supabase Storage: File not found');
    });
  });

  describe('getPublicAvatarUrl', () => {
    it('should return cache-busted public URL for user avatar', () => {
      const mockSupabase = {
        storage: {
          from: jest.fn().mockReturnValue({
            getPublicUrl: jest.fn().mockReturnValue({
              data: { publicUrl: 'https://example.com/storage/workspace-logos/avatars/usr-abc/avatar.webp' },
            }),
          }),
        },
      };
      (service as any).getSupabase = jest.fn().mockReturnValue(mockSupabase);

      const url = service.getPublicAvatarUrl('usr-abc');
      expect(url).toMatch(/^https:\/\/example\.com\/storage\/workspace-logos\/avatars\/usr-abc\/avatar\.webp\?v=\d+$/);
    });
  });
});
