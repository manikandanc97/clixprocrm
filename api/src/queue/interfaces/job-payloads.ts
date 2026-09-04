/**
 * Base Job Payload Interface for BullMQ Queues in ClixProCRM.
 *
 * TENANT ISOLATION ARCHITECTURAL REQUIREMENT:
 * Background queue workers do NOT execute within an active HTTP request cycle and therefore
 * lack automatic AsyncLocalStorage / NestJS request-scoped tenant resolution.
 *
 * All job payloads MUST explicitly include `tenantId`. When future queue processors/workers
 * consume these jobs, they MUST explicitly wrap database operations in `PrismaService.withTenantContext(job.data.tenantId, ...)`
 * or explicitly filter queries with `{ where: { tenantId: job.data.tenantId } }` to guarantee strict multi-tenant isolation.
 *
 * SECURITY & PAYLOAD HYGIENE:
 * Job payloads are serialized to Redis. DO NOT include:
 * - Passwords, hashes, or symmetric keys
 * - OAuth refresh tokens or API secrets
 * - SMTP passwords or session secrets
 * - Large file buffers / raw binary content (store in storage and pass pointer/URI instead)
 * - Excessive unneeded PII
 */

export interface BaseJobPayload {
  /**
   * Mandatory tenant UUID to enforce multi-tenant isolation in asynchronous workers.
   */
  tenantId: string;

  /**
   * Optional ID of the user who initiated or triggered the asynchronous action.
   */
  userId?: string;

  /**
   * Distributed tracing / correlation ID for log tracing across HTTP -> Queue -> Worker.
   */
  correlationId: string;

  /**
   * ISO 8601 UTC timestamp when the job was dispatched.
   */
  timestamp: string;

  /**
   * Optional unique job identifier or idempotent deduplication key.
   */
  jobId?: string;
}
