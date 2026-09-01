import { Injectable } from '@nestjs/common';
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
    private readonly entitlementService: SubscriptionEntitlementService,
  ) {}

  async bulkImportLeads(
    tenantId: string,
    userId: string,
    leadsData: any[],
    duplicateStrategy: 'skip' | 'update' | 'create',
  ) {
    // Atomically validate that the workspace has sufficient lead capacity for this import
    if (leadsData && leadsData.length > 0 && duplicateStrategy !== 'update') {
      await this.entitlementService.assertWithinLimit(tenantId, 'maxLeads', leadsData.length);
    }

    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      let imported = 0;
      let skipped = 0;
      let failed = 0;
      const failedRows = [];

      const defaults = {
        stage: 'NEW' as LeadStage,
        priority: 'MEDIUM' as LeadPriority,
      };

      for (let i = 0; i < leadsData.length; i++) {
        const row = leadsData[i];
        try {
          if (!row.name || !row.email) {
            failed++;
            failedRows.push({
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
              skipped++;
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
              imported++;
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
              imported++;
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
            imported++;
          }
        } catch (err: any) {
          failed++;
          failedRows.push({
            ...row,
            ErrorReason: err.message || 'Database error',
          });
        }
      }

      if (imported > 0) {
        await tx.auditLog.create({
          data: {
            tenantId,
            userId,
            action: 'BULK_IMPORT_LEADS',
            module: 'PIPELINE',
            details: { imported, skipped, failed },
          },
        });
      }

      return { imported, skipped, failed, failedRows };
    });
  }
}
