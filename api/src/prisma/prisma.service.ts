import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Optional } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { TenantContextService } from '../common/context/tenant-context.service';
import { sanitizeAuditDetails } from '../common/utils/audit-sanitizer.util';
import {
  computeAuditRecordHash,
  AuditLogSealInput,
} from '../common/audit/audit-crypto.util';
import { randomUUID } from 'crypto';

export interface TenantContextOptions {
  tenantId?: string;
  isSuperAdmin?: boolean;
  userId?: string;
  timeout?: number;
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  private isReady = false;
  private readyPromise: Promise<void> | null = null;

  constructor(@Optional() private readonly tenantContext?: TenantContextService) {
    super();
  }

  async onModuleInit() {
    this.readyPromise = this.connectWithRetry();
    await this.readyPromise;
  }

  /**
   * Helper to allow other services or background startup tasks to await DB readiness safely.
   */
  async waitUntilReady(): Promise<void> {
    if (this.isReady) return;
    if (this.readyPromise) {
      await this.readyPromise;
      return;
    }
    this.readyPromise = this.connectWithRetry();
    await this.readyPromise;
  }

  private async connectWithRetry(): Promise<void> {
    const maxRetries = 5;
    const initialBackoffMs = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.isReady = true;
        this.logger.log('Database connected successfully');
        return;
      } catch (err: any) {
        this.isReady = false;
        const delay = Math.min(initialBackoffMs * Math.pow(2, attempt - 1), 10000);
        this.logger.warn(
          `Database connection attempt ${attempt}/${maxRetries} failed: ${err.message}. Retrying in ${delay}ms...`,
        );
        if (attempt === maxRetries) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  async onModuleDestroy() {
    try {
      this.isReady = false;
      await this.$disconnect();
    } catch (err: any) {
      this.logger.warn(`Notice during database disconnect: ${err.message}`);
    }
  }

  /**
   * Executes a database callback within a strictly transaction-local tenant context.
   * Uses `set_config(..., true)` (is_local = true) so the session variable automatically
   * resets on COMMIT or ROLLBACK, completely preventing connection pool context poisoning.
   *
   * @param options TenantContextOptions with tenantId, optional isSuperAdmin flag, and optional userId
   * @param fn Callback receiving the tenant-isolated transaction client
   */
  async withTenantContext<T>(
    options: TenantContextOptions,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    const { tenantId, isSuperAdmin = false, userId, timeout = 20000 } = options;

    return this.$transaction(
      async (tx) => {
        const tenantParam = tenantId || '';
        const superAdminParam = isSuperAdmin ? 'true' : 'false';
        const userParam = userId || '';

        await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantParam}, true)`;
        await tx.$executeRaw`SELECT set_config('app.is_super_admin', ${superAdminParam}, true)`;
        if (userId !== undefined) {
          await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userParam}, true)`;
        }

        return fn(tx);
      },
      { timeout, maxWait: 10000 },
    );
  }

  /**
   * Automatically executes a database callback within the active request's verified tenant context
   * resolved from AsyncLocalStorage.
   *
   * @param fn Callback receiving the tenant-isolated transaction client
   * @param timeout Optional transaction timeout in ms (defaults to 20000)
   */
  async withCurrentTenantContext<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    timeout = 20000,
  ): Promise<T> {
    const ctx = this.tenantContext?.getContext();
    if (!ctx || (!ctx.tenantId && !ctx.isSuperAdmin)) {
      throw new Error(
        'Tenant context missing: cannot execute tenant-isolated database query without an active verified tenantId or isSuperAdmin authorization',
      );
    }

    return this.withTenantContext(
      {
        tenantId: ctx.tenantId,
        isSuperAdmin: ctx.isSuperAdmin,
        userId: ctx.userId,
        timeout,
      },
      fn,
    );
  }

  /**
   * Creates a cryptographically sealed, hash-chained AuditLog record.
   * Concurrency-safe via PostgreSQL transaction-level advisory locking.
   */
  async createSealedAuditLog(
    dto: {
      tenantId?: string | null;
      userId?: string | null;
      targetUserId?: string | null;
      action: string;
      module?: string | null;
      details?: Record<string, any> | null;
      ipAddress?: string | null;
      userAgent?: string | null;
    },
    customTx?: any,
  ) {
    const tenantId = dto.tenantId || null;
    const sanitizedDetails = dto.details
      ? sanitizeAuditDetails(dto.details)
      : null;
    const chainKey = `audit_chain_${tenantId || 'platform'}`;

    const executeWithChainLock = async (tx: any) => {
      try {
        await tx.$executeRawUnsafe(
          `SELECT pg_advisory_xact_lock(hashtext($1));`,
          chainKey,
        );
      } catch (lockErr: any) {
        this.logger.debug(
          `Advisory lock notice for ${chainKey}: ${lockErr?.message || lockErr}`,
        );
      }

      const lastRecord = await tx.auditLog.findFirst({
        where: tenantId ? { tenantId } : { tenantId: null },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: { id: true, recordHash: true },
      });

      const previousHash = lastRecord?.recordHash || null;
      const id = randomUUID();
      const createdAt = new Date();

      const sealInput: AuditLogSealInput = {
        id,
        tenantId,
        userId: dto.userId || null,
        targetUserId: dto.targetUserId || null,
        action: dto.action,
        module: dto.module || null,
        details: sanitizedDetails,
        ipAddress: dto.ipAddress || null,
        userAgent: dto.userAgent || null,
        createdAt,
        previousHash,
      };

      const recordHash = computeAuditRecordHash(sealInput);

      const created = await tx.auditLog.create({
        data: {
          id,
          tenantId,
          userId: dto.userId || null,
          targetUserId: dto.targetUserId || null,
          action: dto.action,
          module: dto.module || null,
          details: sanitizedDetails,
          ipAddress: dto.ipAddress || null,
          userAgent: dto.userAgent || null,
          previousHash,
          recordHash,
          createdAt,
        },
      });

      if ((tx as any).auditArchiveOutbox) {
        try {
          await (tx as any).auditArchiveOutbox.create({
            data: {
              auditLogId: id,
              status: 'PENDING',
              nextAttemptAt: new Date(),
            },
          });
        } catch (outboxErr: any) {
          this.logger.warn(`Outbox creation notice: ${outboxErr?.message || outboxErr}`);
        }
      }

      return created;
    };

    if (customTx) {
      return executeWithChainLock(customTx);
    }

    return this.$transaction(async (tx) => {
      return executeWithChainLock(tx);
    });
  }
}

