import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { invalidateDashboardCache } from '../../insights/services/dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConvertLeadDto } from '../dto/convert-lead.dto';

/**
 * @file leads/services/leads.convert.service.ts
 * Lead conversion transaction logic: resolving company/customer, creating deal, updating lead stage.
 *
 * ENCRYPTION NOTE:
 *  - Company name lookup uses nameHash (HMAC-SHA256 deterministic hash).
 *  - Customer email lookup uses emailHash.
 *  - All created records have PII fields encrypted.
 */
@Injectable()
export class LeadsConvertService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enc: EncryptionService,
  ) {}

  async convertLead(
    tenantId: string,
    userId: string,
    leadId: string,
    data: ConvertLeadDto,
  ) {
    const result = await this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const lead = await tx.lead.findUnique({
        where: { id: leadId, tenantId, deletedAt: null },
      });

      if (!lead) throw new NotFoundException('Lead not found');
      if (lead.isConverted)
        throw new BadRequestException('Lead is already converted');

      // 1. Resolve Company (via nameHash for exact-match)
      let finalCompanyId = data.companyId;
      if (!finalCompanyId && data.companyName) {
        const companyNameHash = this.enc.hash(data.companyName);
        const existingCompany = await tx.company.findFirst({
          where: { tenantId, nameHash: companyNameHash, deletedAt: null },
        });
        if (existingCompany) {
          finalCompanyId = existingCompany.id;
        } else {
          const { encrypted: encName, hash: nameHash } =
            this.enc.encryptWithHash(data.companyName);
          const newCompany = await tx.company.create({
            data: {
              tenantId,
              name: encName!,
              nameHash,
              ownerId: data.ownerId || userId,
              status: 'ACTIVE',
            },
          });
          finalCompanyId = newCompany.id;
        }
      }

      // 2. Resolve Customer (via emailHash for exact-match, then name+company)
      let finalCustomerId = data.customerId;
      if (!finalCustomerId && data.customerName) {
        if (data.customerEmail) {
          const emailHash = this.enc.hash(data.customerEmail);
          const existing = await tx.customer.findFirst({
            where: { tenantId, emailHash, deletedAt: null },
          });
          if (existing) finalCustomerId = existing.id;
        }

        if (!finalCustomerId) {
          // Fallback: find by decrypting all — iterate over tenant customers
          // For performance, we limit this to active customers and check name match
          const candidates = await tx.customer.findMany({
            where: { tenantId, deletedAt: null },
            select: { id: true, name: true, company: true },
          });
          const leadCompanyPlain = this.enc.decrypt(lead.company) || '';
          const matchCompanyName = data.companyName || leadCompanyPlain;
          for (const c of candidates) {
            const decName = this.enc.decrypt(c.name) || '';
            const decCompany = this.enc.decrypt(c.company) || '';
            if (
              decName.toLowerCase() ===
                (data.customerName || '').toLowerCase() &&
              decCompany.toLowerCase() === matchCompanyName.toLowerCase()
            ) {
              finalCustomerId = c.id;
              break;
            }
          }
        }

        if (!finalCustomerId) {
          const encEmail = this.enc.encrypt(
            data.customerEmail || this.enc.decrypt(lead.email) || '',
          );
          const emailHash = this.enc.hash(
            data.customerEmail || this.enc.decrypt(lead.email) || '',
          );
          const encCompany = this.enc.encrypt(
            data.companyName || this.enc.decrypt(lead.company) || '',
          );
          const newCustomer = await tx.customer.create({
            data: {
              tenantId,
              name: this.enc.encrypt(data.customerName)!,
              email: encEmail,
              emailHash,
              companyId: finalCompanyId,
              company: encCompany!,
              revenue: data.createDeal ? data.dealValue || lead.value : 0,
              status: 'ACTIVE',
              assignedToId: data.ownerId || userId,
            },
          });
          finalCustomerId = newCustomer.id;
        }
      }

      // 3. Create Deal
      let deal = null;
      if (data.createDeal) {
        const leadNamePlain = this.enc.decrypt(lead.name) || '';
        deal = await tx.deal.create({
          data: {
            tenantId,
            name: data.dealName || `${leadNamePlain} Deal`,
            companyId: finalCompanyId,
            customerId: finalCustomerId,
            value: data.dealValue || lead.value,
            stage: data.dealStage || 'NEW',
            probability:
              data.probability !== undefined ? Number(data.probability) : 20,
            expectedCloseDate: data.expectedCloseDate
              ? new Date(data.expectedCloseDate)
              : null,
            ownerId: data.ownerId || userId,
            leadId: lead.id,
            source: lead.source,
            status: 'OPEN',
          },
        });
      }

      // 4. Update Lead
      await tx.lead.update({
        where: { id: lead.id },
        data: {
          isConverted: true,
          convertedAt: new Date(),
          customerId: finalCustomerId,
          companyId: finalCompanyId,
          stage: 'WON',
        },
      });

      // 5. Timeline Event
      await tx.timelineEvent.create({
        data: {
          tenantId,
          action: 'LEAD_CONVERTED',
          description: deal
            ? `Lead converted to Deal: ${deal.name}`
            : `Lead converted to Customer`,
          userId: userId,
          leadId: lead.id,
          dealId: deal?.id,
          companyId: finalCompanyId,
          customerId: finalCustomerId,
        },
      });

      return { deal, customerId: finalCustomerId, companyId: finalCompanyId };
    });

    const affectedUserIds = [data.ownerId, userId].filter(Boolean) as string[];
    await invalidateDashboardCache(tenantId, affectedUserIds);
    return result;
  }
}
