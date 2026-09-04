import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';

export interface ProcessedLogoResult {
  storageUrl: string;
  storagePath: string;
  dominantColor: string;
}

const DEFAULT_PRIMARY_COLOR = '#10b981'; // ClixProCRM emerald
const BUCKET_NAME = 'workspace-logos';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

@Injectable()
export class BrandingService {
  private readonly logger = new Logger(BrandingService.name);
  private supabaseClient: SupabaseClient | null = null;
  private bucketChecked = false;

  private getSupabase(): SupabaseClient {
    if (this.supabaseClient) return this.supabaseClient;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new BadRequestException('Supabase storage configuration is missing');
    }

    this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return this.supabaseClient;
  }

  private async ensureBucketExists(): Promise<void> {
    if (this.bucketChecked) return;

    try {
      const supabase = this.getSupabase();
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (!error && buckets) {
        const exists = buckets.some((b) => b.name === BUCKET_NAME);
        if (!exists) {
          await supabase.storage.createBucket(BUCKET_NAME, {
            public: true,
            fileSizeLimit: '10MB',
            allowedMimeTypes: ['image/webp', 'image/png', 'image/jpeg', 'image/svg+xml'],
          });
          this.logger.log(`Created public Supabase storage bucket: ${BUCKET_NAME}`);
        }
      }
      this.bucketChecked = true;
    } catch (err: any) {
      this.logger.warn(`Storage bucket initialization notice: ${err?.message || err}`);
      this.bucketChecked = true; // Avoid repeated retries
    }
  }

  /**
   * Validate file buffer header magic numbers to prevent malicious uploads.
   */
  validateImageBuffer(buffer: Buffer, originalFilename?: string): { mimeType: string; format: string } {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('Image file buffer is empty');
    }

    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File size exceeds the 5MB maximum limit');
    }

    // Check PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return { mimeType: 'image/png', format: 'png' };
    }

    // Check JPEG: FF D8 FF
    if (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    ) {
      return { mimeType: 'image/jpeg', format: 'jpeg' };
    }

    // Check WebP: RIFF ... WEBP
    if (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return { mimeType: 'image/webp', format: 'webp' };
    }

    // Check SVG / XML format
    const head = buffer.subarray(0, Math.min(buffer.length, 512)).toString('utf8').trim();
    if (
      head.includes('<svg') ||
      (head.includes('<?xml') && head.includes('<svg'))
    ) {
      return { mimeType: 'image/svg+xml', format: 'svg' };
    }

    throw new BadRequestException(
      'Invalid file format. Only PNG, JPG/JPEG, and WebP images are allowed.',
    );
  }

  /**
   * Convert any accepted image buffer to optimized WebP while preserving alpha transparency.
   */
  async optimizeToWebP(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .resize({
          width: 512,
          height: 512,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({
          quality: 90,
          alphaQuality: 100,
          effort: 4,
          lossless: false,
        })
        .toBuffer();
    } catch (err: any) {
      this.logger.error(`Sharp WebP conversion error: ${err?.message || err}`);
      throw new BadRequestException('Failed to process image file');
    }
  }

  /**
   * Extract dominant brand primary color from image buffer.
   * Filters out transparent, white, black, and neutral gray pixels.
   * Returns a 6-character hex color (e.g. #2563eb).
   */
  async extractDominantColor(buffer: Buffer): Promise<string> {
    try {
      // Downscale to 80x80 for fast and statistically representative pixel sampling
      const { data, info } = await sharp(buffer)
        .resize(80, 80, { fit: 'inside' })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const pixelCount = info.width * info.height;
      const clusters: Map<string, { count: number; r: number; g: number; b: number; score: number }> = new Map();

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // 1. Ignore transparent / semi-transparent background pixels
        if (a < 128) continue;

        // 2. Compute color metrics
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        const lightness = (max + min) / 2 / 255;

        // 3. Ignore pure / near-white pixels (lightness > 92% or R,G,B all > 235)
        if (lightness > 0.92 || (r > 235 && g > 235 && b > 235)) continue;

        // 4. Ignore pure / near-black pixels (lightness < 10% or R,G,B all < 25)
        if (lightness < 0.1 || (r < 25 && g < 25 && b < 25)) continue;

        // 5. Ignore neutral gray / achromatic pixels
        if (delta < 24) continue;

        // Calculate Saturation
        const saturation = lightness > 0.5 ? delta / (510 - max - min) : delta / (max + min);
        if (saturation < 0.18) continue; // Skip washed-out grays

        // Calculate Hue [0, 360)
        let h = 0;
        if (delta > 0) {
          if (max === r) {
            h = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
          } else if (max === g) {
            h = ((b - r) / delta + 2) * 60;
          } else {
            h = ((r - g) / delta + 4) * 60;
          }
        }

        // Quantize into 24 hue bins (15 deg each) and 4 saturation/lightness bins
        const hueBin = Math.floor(h / 15);
        const satBin = Math.floor(saturation * 3);
        const clusterKey = `${hueBin}_${satBin}`;

        // Vibrancy weight: higher saturation and balanced lightness gets higher score
        const vibrancyWeight = (saturation * 2.0) * (1 - Math.abs(lightness - 0.5) * 0.8);

        const existing = clusters.get(clusterKey);
        if (existing) {
          existing.count += 1;
          existing.r += r;
          existing.g += g;
          existing.b += b;
          existing.score += vibrancyWeight;
        } else {
          clusters.set(clusterKey, {
            count: 1,
            r,
            g,
            b,
            score: vibrancyWeight,
          });
        }
      }

      if (clusters.size === 0) {
        this.logger.log('No distinct chromatic brand color found; using default ClixProCRM primary');
        return DEFAULT_PRIMARY_COLOR;
      }

      // Pick the winning cluster with highest weighted vibrancy & frequency
      let bestCluster: { count: number; r: number; g: number; b: number; score: number } | null = null;
      for (const cluster of clusters.values()) {
        if (!bestCluster || cluster.score > bestCluster.score) {
          bestCluster = cluster;
        }
      }

      if (!bestCluster || bestCluster.count === 0) {
        return DEFAULT_PRIMARY_COLOR;
      }

      const avgR = Math.round(bestCluster.r / bestCluster.count);
      const avgG = Math.round(bestCluster.g / bestCluster.count);
      const avgB = Math.round(bestCluster.b / bestCluster.count);

      const hex = `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`;
      this.logger.log(`Extracted dominant brand color: ${hex}`);
      return hex;
    } catch (err: any) {
      this.logger.warn(`Dominant color extraction fallback: ${err?.message || err}`);
      return DEFAULT_PRIMARY_COLOR;
    }
  }

  /**
   * Persists raw uploaded media into Supabase Storage staging location synchronously.
   * Validates image format and size before saving.
   * Returns lightweight storage reference for BullMQ job queue.
   */
  async persistRawMedia(
    tenantId: string,
    rawBuffer: Buffer,
    originalFilename?: string,
  ): Promise<{ storagePath: string; mimeType: string; format: string }> {
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required for branding upload');
    }

    const { mimeType, format } = this.validateImageBuffer(rawBuffer, originalFilename);

    await this.ensureBucketExists();

    const timestamp = Date.now();
    const storagePath = `staging/${tenantId}/raw-logo-${timestamp}.${format}`;
    const supabase = this.getSupabase();

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, rawBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      this.logger.error(`Supabase storage raw upload error: ${uploadError.message}`);
      throw new BadRequestException(
        `Failed to store raw logo in Supabase Storage: ${uploadError.message}`,
      );
    }

    return {
      storagePath,
      mimeType,
      format,
    };
  }

  /**
   * Asynchronously processes persisted raw media from Supabase Storage:
   * 1. Downloads raw buffer from staging path
   * 2. Optimizes & converts to WebP (512x512 max)
   * 3. Extracts dominant brand primary color
   * 4. Uploads processed WebP to target storage path (upsert: true)
   * 5. Safely cleans up staging raw media file
   * 6. Returns processed URL, path, and dominant color
   */
  async processPersistedLogo(
    tenantId: string,
    rawStoragePath: string,
    originalFilename?: string,
  ): Promise<ProcessedLogoResult> {
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required for branding upload');
    }

    const supabase = this.getSupabase();

    // 1. Download raw media from Supabase storage staging path
    const { data: rawBlob, error: downloadError } = await supabase.storage
      .from(BUCKET_NAME)
      .download(rawStoragePath);

    if (downloadError || !rawBlob) {
      this.logger.error(`Supabase storage download error: ${downloadError?.message}`);
      throw new BadRequestException(
        `Failed to retrieve raw branding media from Supabase Storage: ${downloadError?.message || 'Empty file'}`,
      );
    }

    const rawBuffer = Buffer.from(await rawBlob.arrayBuffer());

    // 2. Validate downloaded buffer
    this.validateImageBuffer(rawBuffer, originalFilename);

    // 3. Optimize & convert to WebP
    const webpBuffer = await this.optimizeToWebP(rawBuffer);

    // 4. Extract dominant color
    const dominantColor = await this.extractDominantColor(webpBuffer);

    // 5. Ensure bucket exists
    await this.ensureBucketExists();

    // 6. Upload WebP to final destination: workspace-logos/{tenantId}/logo.webp
    const targetStoragePath = `${tenantId}/logo.webp`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(targetStoragePath, webpBuffer, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: '3600',
      });

    if (uploadError) {
      this.logger.error(`Supabase storage upload error: ${uploadError.message}`);
      throw new BadRequestException(
        `Failed to store processed logo in Supabase Storage: ${uploadError.message}`,
      );
    }

    // 7. Clean up staging raw media file asynchronously
    try {
      await supabase.storage.from(BUCKET_NAME).remove([rawStoragePath]);
    } catch (cleanupErr: any) {
      this.logger.warn(`Staging raw media cleanup notice: ${cleanupErr?.message || cleanupErr}`);
    }

    // 8. Generate public URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(targetStoragePath);

    const storageUrl = publicUrlData?.publicUrl || '';
    const cacheBustedUrl = `${storageUrl}?v=${Date.now()}`;

    return {
      storageUrl: cacheBustedUrl,
      storagePath: `${BUCKET_NAME}/${targetStoragePath}`,
      dominantColor,
    };
  }

  /**
   * Helper to construct the deterministic public logo URL for a workspace.
   */
  getPublicLogoUrl(tenantId: string): string {
    const supabase = this.getSupabase();
    const targetStoragePath = `${tenantId}/logo.webp`;
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(targetStoragePath);
    const storageUrl = publicUrlData?.publicUrl || '';
    return `${storageUrl}?v=${Date.now()}`;
  }

  /**
   * Complete workflow: Validate → Convert to WebP → Upload to Supabase Storage → Extract Brand Color
   */
  async processAndUploadLogo(
    tenantId: string,
    rawBuffer: Buffer,
    originalFilename?: string,
  ): Promise<ProcessedLogoResult> {
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required for branding upload');
    }

    // 1. Validate file
    this.validateImageBuffer(rawBuffer, originalFilename);

    // 2. Optimize & convert to WebP
    const webpBuffer = await this.optimizeToWebP(rawBuffer);

    // 3. Extract dominant color from the image
    const dominantColor = await this.extractDominantColor(webpBuffer);

    // 4. Ensure Supabase storage bucket exists
    await this.ensureBucketExists();

    // 5. Upload WebP to Supabase Storage: workspace-logos/{tenantId}/logo.webp
    const storagePath = `${tenantId}/logo.webp`;
    const supabase = this.getSupabase();

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, webpBuffer, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: '3600',
      });

    if (uploadError) {
      this.logger.error(`Supabase storage upload error: ${uploadError.message}`);
      throw new BadRequestException(
        `Failed to store logo in Supabase Storage: ${uploadError.message}`,
      );
    }

    // 6. Get public storage URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    const storageUrl = publicUrlData?.publicUrl || '';
    const cacheBustedUrl = `${storageUrl}?v=${Date.now()}`;

    return {
      storageUrl: cacheBustedUrl,
      storagePath: `${BUCKET_NAME}/${storagePath}`,
      dominantColor,
    };
  }

  /**
   * Process and upload user profile avatar.
   * Optimizes image to WebP and uploads to Supabase storage.
   * DOES NOT modify or extract workspace brand primary theme colors.
   */
  async processAndUploadAvatar(
    userId: string,
    rawBuffer: Buffer,
    originalFilename?: string,
  ): Promise<{ storageUrl: string; storagePath: string }> {
    if (!userId) {
      throw new BadRequestException('User ID is required for avatar upload');
    }

    // 1. Validate file buffer
    this.validateImageBuffer(rawBuffer, originalFilename);

    // 2. Optimize & convert to WebP (512x512 max square fit)
    const webpBuffer = await this.optimizeToWebP(rawBuffer);

    // 3. Ensure Supabase storage bucket exists
    await this.ensureBucketExists();

    // 4. Upload WebP to Supabase Storage: workspace-logos/avatars/{userId}/avatar.webp
    const storagePath = `avatars/${userId}/avatar.webp`;
    const supabase = this.getSupabase();

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, webpBuffer, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: '3600',
      });

    if (uploadError) {
      this.logger.error(`Supabase storage avatar upload error: ${uploadError.message}`);
      throw new BadRequestException(
        `Failed to store avatar in Supabase Storage: ${uploadError.message}`,
      );
    }

    // 5. Get public storage URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    const storageUrl = publicUrlData?.publicUrl || '';
    const cacheBustedUrl = `${storageUrl}?v=${Date.now()}`;

    return {
      storageUrl: cacheBustedUrl,
      storagePath: `${BUCKET_NAME}/${storagePath}`,
    };
  }

  /**
   * Returns the canonical public Supabase Storage URL for a user's avatar.
   */
  getPublicAvatarUrl(userId: string): string {
    const supabase = this.getSupabase();
    const storagePath = `avatars/${userId}/avatar.webp`;
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);
    return `${publicUrlData?.publicUrl || ''}?v=${Date.now()}`;
  }

  /**
   * Persists raw uploaded avatar into Supabase Storage staging location synchronously.
   * Validates image format and size before saving.
   * Returns lightweight storage reference for BullMQ job queue.
   */
  async persistRawAvatar(
    userId: string,
    rawBuffer: Buffer,
    originalFilename?: string,
  ): Promise<{ storagePath: string; mimeType: string; format: string }> {
    if (!userId) {
      throw new BadRequestException('User ID is required for avatar upload');
    }

    const { mimeType, format } = this.validateImageBuffer(rawBuffer, originalFilename);

    await this.ensureBucketExists();

    const timestamp = Date.now();
    const storagePath = `staging/avatars/${userId}/raw-avatar-${timestamp}.${format}`;
    const supabase = this.getSupabase();

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, rawBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      this.logger.error(`Supabase storage raw avatar upload error: ${uploadError.message}`);
      throw new BadRequestException(
        `Failed to store raw avatar in Supabase Storage: ${uploadError.message}`,
      );
    }

    return {
      storagePath,
      mimeType,
      format,
    };
  }

  /**
   * Asynchronously processes persisted raw avatar media from Supabase Storage:
   * 1. Downloads raw buffer from staging path
   * 2. Optimizes & converts to WebP (512x512 max square fit)
   * 3. Uploads processed WebP to target storage path (avatars/${userId}/avatar.webp, upsert: true)
   * 4. Safely cleans up staging raw media file
   * 5. Returns processed URL and storage path
   */
  async processPersistedAvatar(
    userId: string,
    rawStoragePath: string,
    originalFilename?: string,
  ): Promise<{ storageUrl: string; storagePath: string }> {
    if (!userId) {
      throw new BadRequestException('User ID is required for avatar processing');
    }

    const supabase = this.getSupabase();

    // 1. Download raw media from Supabase storage staging path
    const { data: rawBlob, error: downloadError } = await supabase.storage
      .from(BUCKET_NAME)
      .download(rawStoragePath);

    if (downloadError || !rawBlob) {
      this.logger.error(`Supabase storage download error: ${downloadError?.message}`);
      throw new BadRequestException(
        `Failed to retrieve raw avatar from Supabase Storage: ${downloadError?.message || 'Empty file'}`,
      );
    }

    const rawBuffer = Buffer.from(await rawBlob.arrayBuffer());

    // 2. Validate downloaded buffer
    this.validateImageBuffer(rawBuffer, originalFilename);

    // 3. Optimize & convert to WebP (512x512 max)
    const webpBuffer = await this.optimizeToWebP(rawBuffer);

    // 4. Ensure bucket exists
    await this.ensureBucketExists();

    // 5. Upload WebP to final destination: workspace-logos/avatars/{userId}/avatar.webp
    const targetStoragePath = `avatars/${userId}/avatar.webp`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(targetStoragePath, webpBuffer, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: '3600',
      });

    if (uploadError) {
      this.logger.error(`Supabase storage avatar upload error: ${uploadError.message}`);
      throw new BadRequestException(
        `Failed to store processed avatar in Supabase Storage: ${uploadError.message}`,
      );
    }

    // 6. Clean up staging raw media file asynchronously
    try {
      await supabase.storage.from(BUCKET_NAME).remove([rawStoragePath]);
    } catch (cleanupErr: any) {
      this.logger.warn(`Staging raw avatar cleanup notice: ${cleanupErr?.message || cleanupErr}`);
    }

    // 7. Generate public URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(targetStoragePath);

    const storageUrl = publicUrlData?.publicUrl || '';
    const cacheBustedUrl = `${storageUrl}?v=${Date.now()}`;

    return {
      storageUrl: cacheBustedUrl,
      storagePath: `${BUCKET_NAME}/${targetStoragePath}`,
    };
  }
}

