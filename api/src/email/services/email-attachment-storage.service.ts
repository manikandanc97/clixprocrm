import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as path from 'path';
import { randomUUID } from 'crypto';
import {
  validateFileMagicBytes,
  sanitizeUploadedFilename,
  DISALLOWED_EXTENSIONS,
} from '../../common/utils/upload-security.util';
import { ParsedEmailAttachment } from './mime-parser.service';

export interface StoredAttachmentResult {
  id: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  contentId: string | null;
  storageKey: string;
  isInline: boolean;
  isQuarantined: boolean;
}

export const MAX_SINGLE_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_AGGREGATE_ATTACHMENTS_BYTES = 35 * 1024 * 1024; // 35 MB
const PRIVATE_EMAIL_ATTACHMENTS_BUCKET = 'crm-private-attachments';

@Injectable()
export class EmailAttachmentStorageService {
  private readonly logger = new Logger(EmailAttachmentStorageService.name);
  private supabaseClient: SupabaseClient | null = null;
  private bucketChecked = false;

  private getSupabase(): SupabaseClient | null {
    if (this.supabaseClient) return this.supabaseClient;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return null;
    }

    this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return this.supabaseClient;
  }

  private async ensurePrivateBucket(): Promise<void> {
    if (this.bucketChecked) return;

    try {
      const supabase = this.getSupabase();
      if (!supabase) {
        this.bucketChecked = true;
        return;
      }

      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (!error && buckets) {
        const exists = buckets.some((b) => b.name === PRIVATE_EMAIL_ATTACHMENTS_BUCKET);
        if (!exists) {
          await supabase.storage.createBucket(PRIVATE_EMAIL_ATTACHMENTS_BUCKET, {
            public: false, // Strict private bucket — signed URLs only
            fileSizeLimit: '25MB',
          });
          this.logger.log(`Created private email attachments bucket: ${PRIVATE_EMAIL_ATTACHMENTS_BUCKET}`);
        }
      }
      this.bucketChecked = true;
    } catch (err: any) {
      this.logger.warn(`Notice during private email bucket check: ${err?.message || err}`);
      this.bucketChecked = true;
    }
  }

  /**
   * Validates and persists all attachments for an inbound email.
   * Enforces 25MB individual limit, 35MB aggregate limit, magic byte validation,
   * quarantine for dangerous/suspicious extensions, and tenant-isolated storage path:
   *   tenants/:tenantId/emails/:messageId/:attachmentId_:filename
   */
  async processAndStoreAttachments(
    tenantId: string,
    messageId: string,
    attachments: ParsedEmailAttachment[],
  ): Promise<StoredAttachmentResult[]> {
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is mandatory for attachment persistence');
    }
    if (!messageId) {
      throw new BadRequestException('Message ID is mandatory for attachment persistence');
    }

    if (!attachments || attachments.length === 0) {
      return [];
    }

    // 1. Validate aggregate size limit across all attachments of this email
    const totalAggregateBytes = attachments.reduce((sum, att) => sum + (att.size || att.content.length), 0);
    const exceedsAggregateLimit = totalAggregateBytes > MAX_AGGREGATE_ATTACHMENTS_BYTES;

    await this.ensurePrivateBucket();

    const storedResults: StoredAttachmentResult[] = [];

    for (const att of attachments) {
      const attachmentId = randomUUID();
      const sanitizedName = sanitizeUploadedFilename(att.fileName || 'attachment');
      const ext = path.extname(sanitizedName).toLowerCase();
      const fileSize = att.size || att.content.length;

      let isQuarantined = false;

      // Check single size limit
      if (fileSize > MAX_SINGLE_ATTACHMENT_BYTES || exceedsAggregateLimit) {
        isQuarantined = true;
        this.logger.warn(
          `Attachment "${sanitizedName}" quarantined: exceeds size limits (single=${fileSize}, aggregate=${totalAggregateBytes})`,
        );
      }

      // Check dangerous extensions
      if (DISALLOWED_EXTENSIONS.has(ext)) {
        isQuarantined = true;
        this.logger.warn(`Attachment "${sanitizedName}" quarantined: disallowed extension "${ext}"`);
      }

      // Check magic byte signature if buffer present
      if (att.content && att.content.length >= 4) {
        const magic = validateFileMagicBytes(att.content, att.contentType);
        if (!magic.valid) {
          isQuarantined = true;
          this.logger.warn(`Attachment "${sanitizedName}" quarantined: magic byte validation failed`);
        }
      }

      // Private storage key convention: tenants/:tenantId/emails/:messageId/:attachmentId...
      const storageKey = `tenants/${tenantId}/emails/${messageId}/${attachmentId}_${sanitizedName}`;

      // Upload to private Supabase bucket if available
      const supabase = this.getSupabase();
      if (supabase && att.content && att.content.length > 0) {
        try {
          const { error: uploadError } = await supabase.storage
            .from(PRIVATE_EMAIL_ATTACHMENTS_BUCKET)
            .upload(storageKey, att.content, {
              contentType: att.contentType || 'application/octet-stream',
              upsert: true,
            });

          if (uploadError) {
            this.logger.error(`Storage upload failed for ${storageKey}: ${uploadError.message}`);
          }
        } catch (uploadErr: any) {
          this.logger.error(`Storage upload error for ${storageKey}: ${uploadErr?.message || uploadErr}`);
        }
      }

      storedResults.push({
        id: attachmentId,
        fileName: sanitizedName,
        fileSize,
        contentType: att.contentType || 'application/octet-stream',
        contentId: att.contentId || null,
        storageKey,
        isInline: att.isInline,
        isQuarantined,
      });
    }

    return storedResults;
  }

  /**
   * Generates a secure, temporary signed download URL for an email attachment.
   * Enforces strict tenant isolation: callers can only generate URLs for keys in their tenant.
   */
  async getSignedUrl(
    tenantId: string,
    storageKey: string,
    expiresInSeconds = 900,
  ): Promise<string> {
    if (!storageKey || !storageKey.startsWith(`tenants/${tenantId}/`)) {
      throw new ForbiddenException('Access denied: cross-tenant attachment access is forbidden');
    }

    const supabase = this.getSupabase();
    if (!supabase) {
      return `https://storage.local.clixprocrm.internal/${storageKey}`;
    }

    const { data, error } = await supabase.storage
      .from(PRIVATE_EMAIL_ATTACHMENTS_BUCKET)
      .createSignedUrl(storageKey, expiresInSeconds);

    if (error || !data?.signedUrl) {
      throw new BadRequestException(`Failed to generate signed download URL: ${error?.message}`);
    }

    return data.signedUrl;
  }
}
