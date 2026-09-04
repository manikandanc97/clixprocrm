import { QueueName } from '../queue.constants';

export interface QueueJobCounts {
  active: number;
  waiting: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
  total: number;
}

export type QueueHealthStatus = 'HEALTHY' | 'DEGRADED' | 'WARNING' | 'CRITICAL';

export interface SingleQueueMetrics {
  queueName: QueueName;
  status: QueueHealthStatus;
  available: boolean;
  counts: QueueJobCounts;
  isPaused: boolean;
}

export interface AggregateQueueMetrics {
  status: QueueHealthStatus;
  totalActive: number;
  totalWaiting: number;
  totalCompleted: number;
  totalFailed: number;
  totalDelayed: number;
  queues: SingleQueueMetrics[];
  timestamp: string;
}

export interface DeadLetterJobRecord {
  id: string;
  name: string;
  queueName: QueueName;
  tenantId?: string;
  userId?: string;
  correlationId?: string;
  failedReason?: string;
  attemptsMade: number;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  stacktrace: string[];
  data: Record<string, any>;
}

export interface DeadLetterQueryOptions {
  limit?: number;
  offset?: number;
}
