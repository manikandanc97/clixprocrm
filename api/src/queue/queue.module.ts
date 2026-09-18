import { BullModule } from '@nestjs/bullmq';
import { Global, Logger, Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BillingModule } from '../common/billing/billing.module';
import { EmailModule } from '../email/email.module';
import { LeadsModule } from '../leads/leads.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { EmailQueueProcessor } from './processors/email-queue.processor';
import { ImportQueueProcessor } from './processors/import-queue.processor';
import { MediaQueueProcessor } from './processors/media-queue.processor';
import { WebhookQueueProcessor } from './processors/webhook-queue.processor';
import { EmailQueueProducer } from './producers/email-queue.producer';
import { ImportQueueProducer } from './producers/import-queue.producer';
import { MediaQueueProducer } from './producers/media-queue.producer';
import { WebhookQueueProducer } from './producers/webhook-queue.producer';
import { QUEUE_NAMES } from './queue.constants';
import { QueueMetricsService } from './services/queue-metrics.service';

const logger = new Logger('QueueModule');

/**
 * Helper to parse a standard redis:// or rediss:// connection URI into
 * BullMQ / ioredis connection options.
 */
function parseRedisUrl(redisUrl: string) {
  try {
    const url = new URL(redisUrl);
    const isTls = url.protocol === 'rediss:';
    const isStandard = url.protocol === 'redis:';

    if (!isTls && !isStandard) {
      throw new Error(
        `Unsupported Redis protocol: "${url.protocol}". Expected "redis:" or "rediss:".`,
      );
    }

    const host = url.hostname || '127.0.0.1';
    const port = url.port ? parseInt(url.port, 10) : 6379;
    const username = url.username
      ? decodeURIComponent(url.username)
      : undefined;
    const password = url.password
      ? decodeURIComponent(url.password)
      : undefined;
    const db =
      url.pathname && url.pathname.length > 1
        ? parseInt(url.pathname.slice(1), 10)
        : 0;

    return {
      host,
      port,
      username,
      password,
      db: isNaN(db) ? 0 : db,
      tls: isTls ? { rejectUnauthorized: false } : undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: (times: number) => {
        if (times > 10) {
          logger.warn(
            `[QUEUE] Redis connection retry limit reached (${times} attempts). Halting reconnect attempts.`,
          );
          return null;
        }
        return Math.min(times * 1000, 10000);
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error(`Failed to parse REDIS_URL ("${redisUrl}"): ${errorMsg}`);
    throw err;
  }
}

@Global()
@Module({
  imports: [
    PrismaModule,
    forwardRef(() => LeadsModule),
    forwardRef(() => BillingModule),
    forwardRef(() => WorkspaceModule),
    forwardRef(() => EmailModule),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';
        const redisUrl = configService.get<string>('REDIS_URL');

        if (!redisUrl) {
          if (isProduction) {
            const msg =
              '[FATAL] REDIS_URL environment variable is mandatory for BullMQ queue operations in production.';
            logger.error(msg);
            throw new Error(msg);
          }
          logger.warn(
            '[QUEUE] REDIS_URL not configured. Defaulting to local redis://127.0.0.1:6379 with bounded backoff for non-production environment. Start local Redis or configure REDIS_URL in .env to process asynchronous background queue jobs.',
          );
          return {
            connection: {
              host: '127.0.0.1',
              port: 6379,
              maxRetriesPerRequest: null,
              enableReadyCheck: false,
              lazyConnect: true,
              enableOfflineQueue: false,
              retryStrategy: (times: number) => {
                if (times > 2) {
                  return null;
                }
                return Math.min(times * 1000, 3000);
              },
            },
          };
        }

        logger.log('[QUEUE] Initializing BullMQ Redis TCP connection');
        const connectionOptions = parseRedisUrl(redisUrl);

        return {
          connection: connectionOptions,
        };
      },
    }),
    BullModule.registerQueue(
      {
        name: QUEUE_NAMES.EMAIL,
      },
      {
        name: QUEUE_NAMES.IMPORT,
      },
      {
        name: QUEUE_NAMES.WEBHOOK,
      },
      {
        name: QUEUE_NAMES.MEDIA,
      },
    ),
  ],
  providers: [
    EmailQueueProducer,
    EmailQueueProcessor,
    ImportQueueProducer,
    ImportQueueProcessor,
    WebhookQueueProducer,
    WebhookQueueProcessor,
    MediaQueueProducer,
    MediaQueueProcessor,
    QueueMetricsService,
  ],
  exports: [
    BullModule,
    EmailQueueProducer,
    EmailQueueProcessor,
    ImportQueueProducer,
    ImportQueueProcessor,
    WebhookQueueProducer,
    WebhookQueueProcessor,
    MediaQueueProducer,
    MediaQueueProcessor,
    QueueMetricsService,
  ],
})
export class QueueModule {}
