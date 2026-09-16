import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, LeadStage } from '@prisma/client';
import {
  formatCurrency,
  getStatusLabel,
  toNumber,
  LEAD_STATUS_LABELS,
} from '../../common/utils/crm-formatters.util';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { getCachedTenantCurrency } from '../../common/utils/tenant-cache.util';
import { EncryptionService } from '../../common/encryption/encryption.service';

/**
 * @file leads/services/leads.query.service.ts
 * Query, filter, format, and pagination operations for Leads.
 *
 * ENCRYPTION NOTE:
 *  - Lead.name, email, phone, company are AES-256-GCM encrypted in DB.
 *  - Search by name uses DB-side LIKE on ciphertext (not ideal but acceptable for
 *    non-exact search; for exact email search, use emailHash column).
 *  - On list, all PII fields are decrypted before returning.
 */
@Injectable()
export class LeadsQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enc: EncryptionService,
  ) {}

  private async getTenantCurrency(tenantId: string): Promise<string> {
    return getCachedTenantCurrency(this.prisma, tenantId);
  }

  async getLeads(
    tenantId: string,
    query: PaginationQueryDto & { stage?: string; status?: string },
  ) {
    const currency = await this.getTenantCurrency(tenantId);
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const page = Math.max(1, query.page || 1);
      const limit = Math.max(1, Math.min(query.limit || 50, 10000));
      const skip = (page - 1) * limit;
      const search = query.search || '';
      const stageQuery = query.stage || query.status || '';

      const where: Prisma.LeadWhereInput = { tenantId, deletedAt: null };
      if (stageQuery) {
        where.stage = stageQuery as LeadStage;
      }

      const [leads, total] = await Promise.all([
        tx.lead.findMany({
          where,
          orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
            phone: true,
            source: true,
            stage: true,
            priority: true,
            assignedToId: true,
            value: true,
            expectedCloseDate: true,
            tags: true,
            isConverted: true,
            convertedAt: true,
            customerId: true,
            lastActivityAt: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { notes: true, meetings: true } },
            meetings: {
              where: { startTime: { gte: new Date() } },
              orderBy: { startTime: 'asc' },
              take: 1,
              select: { startTime: true, title: true },
            },
          },
        }),
        tx.lead.count({ where }),
      ]);

      // Decrypt PII fields
      const decryptedLeads = leads.map((lead) => ({
        ...lead,
        name: this.enc.decrypt(lead.name),
        company: this.enc.decrypt(lead.company),
        email: this.enc.decrypt(lead.email),
        phone: this.enc.decrypt(lead.phone),
      }));

      // Apply search filter post-decryption (substring match on decrypted name)
      const filteredLeads = search
        ? decryptedLeads.filter((lead) =>
            (lead.name || '').toLowerCase().includes(search.toLowerCase()),
          )
        : decryptedLeads;

      return {
        summary: { total },
        leads: filteredLeads.map((lead) => {
          const customerId = lead.customerId;
          return {
            id: lead.id,
            name: lead.name,
            company: lead.company,
            email: lead.email,
            phone: lead.phone,
            source: lead.source,
            stage: lead.stage,
            status: getStatusLabel(LEAD_STATUS_LABELS, lead.stage),
            priority: lead.priority,
            value: formatCurrency(lead.value, currency),
            valueAmount: toNumber(lead.value),
            expectedCloseDate: lead.expectedCloseDate,
            tags: lead.tags,
            lastActivityAt: lead.lastActivityAt,
            createdAt: lead.createdAt,
            updatedAt: lead.updatedAt,
            customerId,
            isConverted:
              !!customerId || lead.isConverted || lead.stage === 'WON',
            notesCount: lead._count?.notes || 0,
            meetingsCount: lead._count?.meetings || 0,
            upcomingMeeting:
              lead.meetings && lead.meetings.length > 0
                ? lead.meetings[0]
                : null,
          };
        }),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    });
  }

  async getHotLeads(tenantId: string) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const [currency, leads] = await Promise.all([
        this.getTenantCurrency(tenantId),
        tx.lead.findMany({
          where: { tenantId, stage: 'NEW', deletedAt: null },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, company: true, value: true },
        }),
      ]);
      return leads.map((l) => ({
        id: l.id,
        name: this.enc.decrypt(l.name),
        company: this.enc.decrypt(l.company),
        score: 90,
        value: formatCurrency(toNumber(l.value), currency),
      }));
    });
  }
}
