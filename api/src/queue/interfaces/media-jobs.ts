import { BaseJobPayload } from './job-payloads';

/**
 * Constants for Media Queue Job Names in ClixProCRM BullMQ Queue.
 */
export const MEDIA_JOB_NAMES = {
  PROCESS_BRANDING: 'process-branding',
  PROCESS_AVATAR: 'process-avatar',
} as const;

export type MediaJobName =
  (typeof MEDIA_JOB_NAMES)[keyof typeof MEDIA_JOB_NAMES];

/**
 * Strongly typed payload for asynchronous workspace branding media processing.
 *
 * Extends BaseJobPayload to enforce multi-tenant isolation, distributed tracing,
 * and deterministic job identity.
 *
 * PAYLOAD HYGIENE & REDIS SAFETY:
 * Stored in Redis. Only minimal lightweight references required by the worker are retained.
 * Strictly NO raw binary buffers, base64 images, storage secrets, credentials,
 * or large HTML strings.
 */
export interface BrandingMediaJobPayload extends BaseJobPayload {
  /**
   * Safe unique media identifier or reference key (e.g. storage file reference).
   */
  mediaReference: string;

  /**
   * Supabase storage bucket name (e.g. 'workspace-logos').
   */
  storageBucket: string;

  /**
   * Storage path where the raw media was temporarily persisted for the worker.
   */
  storagePath: string;

  /**
   * Destination path in storage for the processed WebP output.
   */
  targetStoragePath: string;

  /**
   * Original file name of the uploaded image if provided.
   */
  originalFilename?: string;

  /**
   * Validated MIME type of the uploaded media (e.g. 'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml').
   */
  mimeType: string;

  /**
   * Branding media operation type.
   */
  operation: 'PROCESS_WORKSPACE_LOGO';
}

/**
 * Strongly typed payload for asynchronous user profile avatar media processing.
 *
 * Extends BaseJobPayload to enforce multi-tenant isolation, distributed tracing,
 * and deterministic job identity.
 */
export interface AvatarMediaJobPayload extends BaseJobPayload {
  /**
   * Safe unique media identifier or reference key (e.g. storage file reference).
   */
  mediaReference: string;

  /**
   * Supabase storage bucket name (e.g. 'workspace-logos').
   */
  storageBucket: string;

  /**
   * Storage path where the raw avatar was temporarily persisted for the worker.
   */
  storagePath: string;

  /**
   * Destination path in storage for the processed WebP output (e.g. 'avatars/{userId}/avatar.webp').
   */
  targetStoragePath: string;

  /**
   * Original file name of the uploaded image if provided.
   */
  originalFilename?: string;

  /**
   * Validated MIME type of the uploaded media.
   */
  mimeType: string;

  /**
   * Avatar media operation type.
   */
  operation: 'PROCESS_USER_AVATAR';
}

export type MediaJobPayload =
  | BrandingMediaJobPayload
  | AvatarMediaJobPayload;

