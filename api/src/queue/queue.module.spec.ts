import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { QueueModule } from './queue.module';
import { QUEUE_NAMES } from './queue.constants';
import { BaseJobPayload } from './interfaces/job-payloads';
import { EncryptionModule } from '../common/encryption/encryption.module';
import { SubscriptionEntitlementModule } from '../common/plans/subscription-entitlement.module';
import { TenantContextModule } from '../common/context/tenant-context.module';
import { WebhookQueueProducer } from './producers/webhook-queue.producer';
import { WebhookQueueProcessor } from './processors/webhook-queue.processor';
import { MediaQueueProducer } from './producers/media-queue.producer';
import { MediaQueueProcessor } from './processors/media-queue.processor';
import { QueueMetricsService } from './services/queue-metrics.service';

jest.mock('bullmq', () => {
  const actual = jest.requireActual('bullmq');
  return {
    ...actual,
    Queue: jest.fn().mockImplementation((name, opts) => ({
      name,
      opts,
      add: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
    })),
    Worker: jest.fn().mockImplementation((name, processor, opts) => ({
      name,
      opts,
      close: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
    })),
  };
});

describe('QueueModule Infrastructure', () => {

  it('should export all defined QUEUE_NAMES constants', () => {
    expect(QUEUE_NAMES.EMAIL).toBe('crm-email-queue');
    expect(QUEUE_NAMES.IMPORT).toBe('crm-import-queue');
    expect(QUEUE_NAMES.WEBHOOK).toBe('crm-webhook-queue');
    expect(QUEUE_NAMES.MEDIA).toBe('crm-media-queue');
  });

  it('should conform to BaseJobPayload contract with mandatory tenantId and correlationId', () => {
    const payload: BaseJobPayload = {
      tenantId: 'tenant-uuid-1234',
      userId: 'user-uuid-5678',
      correlationId: 'corr-uuid-9999',
      timestamp: new Date().toISOString(),
      jobId: 'job-1',
    };

    expect(payload.tenantId).toBe('tenant-uuid-1234');
    expect(payload.correlationId).toBe('corr-uuid-9999');
    expect(payload.userId).toBe('user-uuid-5678');
    expect(payload.timestamp).toBeDefined();
    expect(payload.jobId).toBe('job-1');
  });

  it('should compile QueueModule successfully and export producers and processors', async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        TenantContextModule,
        EncryptionModule,
        SubscriptionEntitlementModule,
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              NODE_ENV: 'test',
              REDIS_URL: 'redis://127.0.0.1:6379',
            }),
          ],
        }),
        QueueModule,
      ],
    }).compile();

    expect(moduleRef).toBeDefined();
    expect(moduleRef.get(QueueModule)).toBeDefined();
    expect(moduleRef.get(WebhookQueueProducer)).toBeDefined();
    expect(moduleRef.get(WebhookQueueProcessor)).toBeDefined();
    expect(moduleRef.get(MediaQueueProducer)).toBeDefined();
    expect(moduleRef.get(MediaQueueProcessor)).toBeDefined();
    expect(moduleRef.get(QueueMetricsService)).toBeDefined();
    await moduleRef.close();
  });


  it('should support rediss:// TLS connection strings without error', async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        TenantContextModule,
        EncryptionModule,
        SubscriptionEntitlementModule,
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              NODE_ENV: 'test',
              REDIS_URL: 'rediss://default:secret@redis.example.com:6380/1',
            }),
          ],
        }),
        QueueModule,
      ],
    }).compile();

    expect(moduleRef).toBeDefined();
    await moduleRef.close();
  });
});

