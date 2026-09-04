import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { QUEUE_NAMES } from '../queue.constants';
import {
  MEDIA_JOB_NAMES,
  BrandingMediaJobPayload,
  AvatarMediaJobPayload,
} from '../interfaces/media-jobs';

export const MEDIA_DEFAULT_JOB_OPTS = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 3000,
  },
  removeOnComplete: true,
  removeOnFail: 100,
} as const;

@Injectable()
export class MediaQueueProducer {
  private readonly logger = new Logger(MediaQueueProducer.name);

  constructor(
    @Optional()
    @InjectQueue(QUEUE_NAMES.MEDIA)
    private readonly mediaQueue?: Queue,
  ) {}

  /**
   * Helper to check if queue is available (e.g. during disconnected/testing environments).
   */
  public isQueueAvailable(): boolean {
    return Boolean(this.mediaQueue);
  }

  /**
   * Enqueues a branding media processing job into crm-media-queue.
   *
   * Enforces:
   * - Deterministic job identity: branding-media:{tenantId}:{mediaRef}:{operation}
   * - Typed BaseJobPayload with correlationId and verified tenantId
   * - Bounded exponential backoff retry policy (3 attempts, 3s delay)
   * - Lightweight references only; NO raw binary or base64 images in Redis
   */
  async enqueueBrandingMedia(
    payload: Omit<BrandingMediaJobPayload, 'correlationId' | 'timestamp'> & {
      correlationId?: string;
      timestamp?: string;
    },
  ): Promise<{ enqueued: boolean; jobId?: string }> {
    const correlationId = payload.correlationId || randomUUID();
    const timestamp = payload.timestamp || new Date().toISOString();
    const tenantId = payload.tenantId || 'system';
    const userId = payload.userId || 'system';

    const safeMediaRef = (payload.mediaReference || correlationId).replace(
      /[^a-zA-Z0-9_-]/g,
      '_',
    );
    const operation = payload.operation || 'PROCESS_WORKSPACE_LOGO';
    const jobId =
      payload.jobId || `branding-media:${tenantId}:${safeMediaRef}:${operation}`;

    const fullPayload: BrandingMediaJobPayload = {
      ...payload,
      tenantId,
      userId,
      correlationId,
      timestamp,
      jobId,
    };

    if (!this.mediaQueue) {
      this.logger.warn(
        `[MEDIA QUEUE] Media queue not initialized; cannot enqueue branding media job for tenant ${tenantId}`,
      );
      return { enqueued: false };
    }

    const job = await this.mediaQueue.add(
      MEDIA_JOB_NAMES.PROCESS_BRANDING,
      fullPayload,
      {
        ...MEDIA_DEFAULT_JOB_OPTS,
        jobId,
      },
    );

    this.logger.log(
      `[MEDIA QUEUE] Enqueued branding media job ${job.id} for tenant ${tenantId} (operation: ${operation}, correlationId: ${correlationId})`,
    );

    return { enqueued: true, jobId: job.id };
  }

  /**
   * Enqueues a user avatar media processing job into crm-media-queue.
   *
   * Enforces:
   * - Deterministic job identity: avatar-media:{userId}:{safeMediaRef}:{operation}
   * - Typed BaseJobPayload with correlationId, userId, and tenantId
   * - Bounded exponential backoff retry policy (3 attempts, 3s delay)
   * - Lightweight references only; NO raw binary or base64 images in Redis
   */
  async enqueueAvatarMedia(
    payload: Omit<AvatarMediaJobPayload, 'correlationId' | 'timestamp'> & {
      correlationId?: string;
      timestamp?: string;
    },
  ): Promise<{ enqueued: boolean; jobId?: string }> {
    const correlationId = payload.correlationId || randomUUID();
    const timestamp = payload.timestamp || new Date().toISOString();
    const tenantId = payload.tenantId || 'system';
    const userId = payload.userId || 'system';

    const safeMediaRef = (payload.mediaReference || correlationId).replace(
      /[^a-zA-Z0-9_-]/g,
      '_',
    );
    const operation = payload.operation || 'PROCESS_USER_AVATAR';
    const jobId =
      payload.jobId || `avatar-media:${userId}:${safeMediaRef}:${operation}`;

    const fullPayload: AvatarMediaJobPayload = {
      ...payload,
      tenantId,
      userId,
      correlationId,
      timestamp,
      jobId,
    };

    if (!this.mediaQueue) {
      this.logger.warn(
        `[MEDIA QUEUE] Media queue not initialized; cannot enqueue avatar media job for user ${userId}`,
      );
      return { enqueued: false };
    }

    const job = await this.mediaQueue.add(
      MEDIA_JOB_NAMES.PROCESS_AVATAR,
      fullPayload,
      {
        ...MEDIA_DEFAULT_JOB_OPTS,
        jobId,
      },
    );

    this.logger.log(
      `[MEDIA QUEUE] Enqueued avatar media job ${job.id} for user ${userId} (operation: ${operation}, correlationId: ${correlationId})`,
    );

    return { enqueued: true, jobId: job.id };
  }
}

