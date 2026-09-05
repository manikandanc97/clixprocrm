import { Module, Logger, Global, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { QUEUE_NAMES } from './queue.constants';
import { EmailQueueProducer } from './producers/email-queue.producer';
import { EmailQueueProcessor } from './processors/email-queue.processor';
import { ImportQueueProducer } from './producers/import-queue.producer';
import { ImportQueueProcessor } from './processors/import-queue.processor';
import { WebhookQueueProducer } from './producers/webhook-queue.producer';
import { WebhookQueueProcessor } from './processors/webhook-queue.processor';
import { MediaQueueProducer } from './producers/media-queue.producer';
import { MediaQueueProcessor } from './processors/media-queue.processor';
import { QueueMetricsService } from './services/queue-metrics.service';
import { LeadsModule } from '../leads/leads.module';
import { BillingModule } from '../common/billing/billing.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { EmailModule } from '../email/email.module';

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
      throw new Error(`Unsupported Redis protocol: "${url.protocol}". Expected "redis:" or "rediss:".`);
    }

    const host = url.hostname || '127.0.0.1';
    const port = url.port ? parseInt(url.port, 10) : 6379;
    const username = url.username ? decodeURIComponent(url.username) : undefined;
    const password = url.password ? decodeURIComponent(url.password) : undefined;
    const db = url.pathname && url.pathname.length > 1 ? parseInt(url.pathname.slice(1), 10) : 0;

    return {
      host,
      port,
      username,
      password,
      db: isNaN(db) ? 0 : db,
      tls: isTls ? { rejectUnauthorized: false } : undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };
  } catch (err: any) {
    logger.error(`Failed to parse REDIS_URL ("${redisUrl}"): ${err.message}`);
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
        const isProduction = configService.get<string>('NODE_ENV') === 'production';
        const redisUrl = configService.get<string>('REDIS_URL');

        if (!redisUrl) {
          if (isProduction) {
            const msg = '[FATAL] REDIS_URL environment variable is mandatory for BullMQ queue operations in production.';
            logger.error(msg);
            throw new Error(msg);
          }
          logger.warn('[QUEUE] REDIS_URL not set; defaulting to local redis://127.0.0.1:6379 for non-production environment.');
          return {
            connection: {
              host: '127.0.0.1',
              port: 6379,
              maxRetriesPerRequest: null,
              enableReadyCheck: false,
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



