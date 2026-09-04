import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LeadStage, LeadPriority } from '@prisma/client';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { SubscriptionEntitlementService } from '../../common/plans/subscription-entitlement.service';

/**
 * @file leads/services/leads.import.service.ts
 *
 * ENCRYPTION NOTE:
 *  - Duplicate detection uses emailHash (HMAC-SHA256) for exact-match lookup.
 *  - All PII fields (name, email, phone, company) are encrypted before insert/update.
 *  - Company name dedup uses nameHash for exact-match.
 */
@Injectable()
export class LeadsImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enc: EncryptionService,
    @Optional() private readonly entitlementService?: SubscriptionEntitlementService,
  ) {}

  async bulkImportLeads(
    tenantId: string,
    userId: string,
    leadsData: any[],
    duplicateStrategy: 'skip' | 'update' | 'create',
  ) {
    if (!leadsData || leadsData.length === 0) {
      return { imported: 0, skipped: 0, failed: 0, failedRows: [] };
    }

    // Atomically validate that the workspace has sufficient lead capacity for this import
    if (duplicateStrategy !== 'update') {
      await this.entitlementService?.assertWithinLimit(tenantId, 'maxLeads', leadsData.length);
    }

    let totalImported = 0;
    let totalSkipped = 0;
    let totalFailed = 0;
    const allFailedRows: any[] = [];

    const defaults = {
      stage: 'NEW' as LeadStage,
      priority: 'MEDIUM' as LeadPriority,
    };

    // Bounded chunk size to prevent long-running single transactions and database lock contention
    const BATCH_SIZE = 50;
    const batches: any[][] = [];
    for (let i = 0; i < leadsData.length; i += BATCH_SIZE) {
      batches.push(leadsData.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      await this.prisma.withTenantContext({ tenantId, userId }, async (tx) => {
        for (let i = 0; i < batch.length; i++) {
          const row = batch[i];
          try {
            if (!row.name || !row.email) {
              totalFailed++;
              allFailedRows.push({
                ...row,
                ErrorReason: 'Missing required fields (Name or Email)',
              });
              continue;
            }

            const stageToUse = (
              row.stage ||
              row.status ||
              defaults.stage
            ).toUpperCase();
            let priorityToUse = defaults.priority;
            if (row.priority) {
              priorityToUse = String(row.priority).toUpperCase() as LeadPriority;
            }

            let valueToUse = 0;
            if (row.valueAmount !== undefined) {
              valueToUse =
                parseFloat(String(row.valueAmount).replace(/[^0-9.-]+/g, '')) || 0;
            } else if (row.value !== undefined) {
              valueToUse =
                parseFloat(String(row.value).replace(/[^0-9.-]+/g, '')) || 0;
            }

            const companyName = (row.company || 'Unknown Company').trim();
            let companyId: string | null = null;
            if (companyName && companyName !== 'Unknown Company') {
              // Exact-match on encrypted company name via nameHash
              const companyNameHash = this.enc.hash(companyName);
              let company = await tx.company.findFirst({
                where: { tenantId, nameHash: companyNameHash, deletedAt: null },
              });
              if (!company) {
                const { encrypted: encName, hash: nameHash } =
                  this.enc.encryptWithHash(companyName);
                company = await tx.company.create({
                  data: {
                    tenantId,
                    name: encName!,
                    nameHash,
                    ownerId: userId,
                    status: 'ACTIVE',
                  },
                });
              }
              companyId = company.id;
            }

            // Duplicate detection via emailHash (deterministic, no plaintext scan)
            const emailHash = this.enc.hash(row.email);
            const existing = await tx.lead.findFirst({
              where: { tenantId, emailHash, deletedAt: null },
            });

            if (existing) {
              if (duplicateStrategy === 'skip') {
                totalSkipped++;
                continue;
              } else if (duplicateStrategy === 'update') {
                await tx.lead.update({
                  where: { id: existing.id },
                  data: {
                    name: this.enc.encrypt(row.name)!,
                    company: this.enc.encrypt(companyName)!,
                    companyId: companyId || existing.companyId,
                    phone: this.enc.encrypt(row.phone),
                    value: valueToUse,
                    stage: stageToUse as LeadStage,
                    priority: priorityToUse,
                    assignedToId: row.assignedToId || existing.assignedToId,
                  },
                });
                totalImported++;
              } else if (duplicateStrategy === 'create') {
                const { encrypted: encEmail, hash: newEmailHash } =
                  this.enc.encryptWithHash(row.email);
                await tx.lead.create({
                  data: {
                    tenantId,
                    name: this.enc.encrypt(row.name)!,
                    company: this.enc.encrypt(companyName)!,
                    companyId,
                    email: encEmail!,
                    emailHash: newEmailHash,
                    phone: this.enc.encrypt(row.phone),
                    value: valueToUse,
                    stage: stageToUse as LeadStage,
                    priority: priorityToUse,
                    assignedToId: row.assignedToId || null,
                  },
                });
                totalImported++;
              }
            } else {
              const { encrypted: encEmail, hash: newEmailHash } =
                this.enc.encryptWithHash(row.email);
              await tx.lead.create({
                data: {
                  tenantId,
                  name: this.enc.encrypt(row.name)!,
                  company: this.enc.encrypt(companyName)!,
                  companyId,
                  email: encEmail!,
                  emailHash: newEmailHash,
                  phone: this.enc.encrypt(row.phone),
                  value: valueToUse,
                  stage: stageToUse as LeadStage,
                  priority: priorityToUse,
                  assignedToId: row.assignedToId || null,
                },
              });
              totalImported++;
            }
          } catch (err: any) {
            totalFailed++;
            allFailedRows.push({
              ...row,
              ErrorReason: err.message || 'Database error',
            });
          }
        }
      });
    }

    if (totalImported > 0) {
      await this.prisma.withTenantContext({ tenantId, userId }, async (tx) => {
        await tx.auditLog.create({
          data: {
            tenantId,
            userId,
            action: 'BULK_IMPORT_LEADS',
            module: 'PIPELINE',
            details: { imported: totalImported, skipped: totalSkipped, failed: totalFailed },
          },
        });
      });
    }

    return {
      imported: totalImported,
      skipped: totalSkipped,
      failed: totalFailed,
      failedRows: allFailedRows,
    };
  }
}
