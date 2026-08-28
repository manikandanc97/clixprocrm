import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as path from 'path';

export interface UploadAttachmentResult {
  storageUrl: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

const ATTACHMENTS_BUCKET = 'crm-attachments';
const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
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

  public async ensureAttachmentsBucketExists(): Promise<void> {
    if (this.bucketChecked) return;

    try {
      const supabase = this.getSupabase();
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (!error && buckets) {
        const exists = buckets.some((b) => b.name === ATTACHMENTS_BUCKET);
        if (!exists) {
          await supabase.storage.createBucket(ATTACHMENTS_BUCKET, {
            public: true,
            fileSizeLimit: '25MB',
          });
          this.logger.log(`Created Supabase storage bucket: ${ATTACHMENTS_BUCKET}`);
        }
      }
      this.bucketChecked = true;
    } catch (err: any) {
      this.logger.warn(`Storage attachments bucket initialization notice: ${err?.message || err}`);
      this.bucketChecked = true;
    }
  }

  /**
   * Upload an attachment file buffer directly into Supabase Storage.
   */
  async uploadAttachment(
    tenantId: string,
    entityFolder: string,
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType?: string,
  ): Promise<UploadAttachmentResult> {
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required for storage upload');
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestException('Attachment file buffer is empty');
    }

    if (fileBuffer.length > MAX_ATTACHMENT_SIZE_BYTES) {
      throw new BadRequestException('File size exceeds the 25MB maximum limit');
    }

    await this.ensureAttachmentsBucketExists();

    const sanitizedBaseName = path
      .basename(originalFilename || 'attachment')
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const storagePath = `${tenantId}/${entityFolder}/${timestamp}_${sanitizedBaseName}`;
    const resolvedMime = mimeType || 'application/octet-stream';

    const supabase = this.getSupabase();
    const { error: uploadError } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: resolvedMime,
        upsert: true,
      });

    if (uploadError) {
      this.logger.error(`Supabase attachment upload error: ${uploadError.message}`);
      throw new BadRequestException(
        `Failed to store attachment in Supabase Storage: ${uploadError.message}`,
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .getPublicUrl(storagePath);

    const storageUrl = publicUrlData?.publicUrl || '';

    return {
      storageUrl,
      storagePath: `${ATTACHMENTS_BUCKET}/${storagePath}`,
      fileName: sanitizedBaseName,
      fileSize: fileBuffer.length,
      fileType: resolvedMime,
    };
  }

  /**
   * Delete an attachment from Supabase Storage by its bucket path.
   */
  async deleteAttachment(storagePath: string): Promise<void> {
    if (!storagePath) return;

    try {
      const cleanPath = storagePath.startsWith(`${ATTACHMENTS_BUCKET}/`)
        ? storagePath.replace(`${ATTACHMENTS_BUCKET}/`, '')
        : storagePath;

      const supabase = this.getSupabase();
      await supabase.storage.from(ATTACHMENTS_BUCKET).remove([cleanPath]);
    } catch (err: any) {
      this.logger.warn(`Failed to delete storage file ${storagePath}: ${err?.message || err}`);
    }
  }
}
