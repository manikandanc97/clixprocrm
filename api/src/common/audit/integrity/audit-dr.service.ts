import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditArchiveProvider } from '../archive/audit-archive.interface';
import { AuditArchiveService } from '../archive/audit-archive.service';
import {
    buildAuditObjectKey
} from '../archive/s3-object-lock.provider';
import { AuditLogSealInput, verifyRecordHash } from '../audit-crypto.util';

export interface DisasterRecoveryVerificationResult {
  restorable: boolean;
  archiveFound: boolean;
  payloadValid: boolean;
  hashValid: boolean;
  chainLinkValid: boolean;
  recordId: string;
  reason: string | null;
}

@Injectable()
export class AuditDisasterRecoveryService {
  private readonly logger = new Logger(AuditDisasterRecoveryService.name);
  private customProvider: AuditArchiveProvider | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly archiveService: AuditArchiveService,
  ) {}

  setProvider(provider: AuditArchiveProvider) {
    this.customProvider = provider;
  }

  /**
   * Safe, zero-write disaster recovery verification dry run.
   * Confirms that an external WORM audit object can be retrieved, parsed, and cryptographically verified.
   */
  async verifyAuditArchiveRestore(
    recordId: string,
  ): Promise<DisasterRecoveryVerificationResult> {
    const dbRecord = await this.prisma.auditLog.findUnique({
      where: { id: recordId },
    });

    if (!dbRecord) {
      return {
        restorable: false,
        archiveFound: false,
        payloadValid: false,
        hashValid: false,
        chainLinkValid: false,
        recordId,
        reason: `AuditLog ${recordId} not found in database reference index`,
      };
    }

    const objectKey = buildAuditObjectKey(
      dbRecord.id,
      dbRecord.tenantId,
      dbRecord.createdAt,
    );

    // Retrieve archived JSON from WORM storage
    const provider: any =
      this.customProvider || (this.archiveService as any).provider;
    const archived = await provider.getObject(objectKey);

    if (!archived) {
      return {
        restorable: false,
        archiveFound: false,
        payloadValid: false,
        hashValid: false,
        chainLinkValid: false,
        recordId,
        reason: `External WORM object not found at ${objectKey}`,
      };
    }

    // 1. Structure validation
    if (!archived.record || !archived.record.id || !archived.record.action) {
      return {
        restorable: false,
        archiveFound: true,
        payloadValid: false,
        hashValid: false,
        chainLinkValid: false,
        recordId,
        reason:
          'Archived JSON structure is malformed or missing mandatory fields',
      };
    }

    // 2. Cryptographic signature validation
    const sealInput: AuditLogSealInput = {
      id: archived.record.id,
      tenantId: archived.record.tenantId,
      userId: archived.record.userId,
      targetUserId: archived.record.targetUserId,
      action: archived.record.action,
      module: archived.record.module,
      details: archived.record.details,
      ipAddress: archived.record.ipAddress,
      userAgent: archived.record.userAgent,
      createdAt: archived.record.createdAt,
      previousHash: archived.record.previousHash,
    };

    const isHashValid = verifyRecordHash(sealInput, archived.record.recordHash);
    if (!isHashValid) {
      return {
        restorable: false,
        archiveFound: true,
        payloadValid: true,
        hashValid: false,
        chainLinkValid: false,
        recordId,
        reason:
          'Archived record HMAC-SHA256 signature is invalid or payload was modified',
      };
    }

    // 3. Database correspondence
    const isChainLinkValid =
      archived.record.previousHash === dbRecord.previousHash &&
      archived.record.recordHash === dbRecord.recordHash;

    if (!isChainLinkValid) {
      return {
        restorable: false,
        archiveFound: true,
        payloadValid: true,
        hashValid: true,
        chainLinkValid: false,
        recordId,
        reason: 'Archived record hashes do not match database chain state',
      };
    }

    return {
      restorable: true,
      archiveFound: true,
      payloadValid: true,
      hashValid: true,
      chainLinkValid: true,
      recordId,
      reason: null,
    };
  }
}
