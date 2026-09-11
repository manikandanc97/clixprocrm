import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuotationDto } from '../dto/create-quotation.dto';
import {
  UpdateQuotationDto,
  UpdateQuotationStatusDto,
} from '../dto/update-quotation.dto';
import { Prisma, QuotationStatus } from '@prisma/client';
import {
  toNumber,
  formatCurrency,
  formatDate,
} from '../../common/utils/crm-formatters.util';
import { getCachedTenantCurrency } from '../../common/utils/tenant-cache.util';
import { EncryptionService } from '../../common/encryption/encryption.service';

@Injectable()
export class QuotationsService {
  constructor(
    private prisma: PrismaService,
    private readonly enc: EncryptionService,
  ) {}

  private async getTenantCurrency(tenantId: string): Promise<string> {
    return getCachedTenantCurrency(this.prisma, tenantId);
  }

  private async generateQuoteNumber(
    tenantId: string,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const last = await tx.quotation.findFirst({
      where: { tenantId, quoteNumber: { startsWith: 'QT-' } },
      orderBy: { createdAt: 'desc' },
      select: { quoteNumber: true },
    });
    const lastSeq = last?.quoteNumber
      ? parseInt(last.quoteNumber.replace('QT-', ''), 10)
      : 0;
    const nextSeq = (isNaN(lastSeq) ? 0 : lastSeq) + 1;
    return `QT-${String(nextSeq).padStart(4, '0')}`;
  }

  async createQuotation(tenantId: string, data: CreateQuotationDto) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const quoteNumber =
        data.quoteNumber || (await this.generateQuoteNumber(tenantId, tx));
      const quotation = await tx.quotation.create({
        data: {
          tenantId,
          leadId: data.leadId,
          quoteNumber,
          client: this.enc.encrypt(data.client)!, // Encrypt client name
          amount: data.amount || 0,
          status: data.status || 'DRAFT',
          validTill: data.validTill ? new Date(data.validTill) : null,
          items: data.items || [],
          notes: this.enc.encrypt(data.notes || ''), // Encrypt notes
          discount: data.discount || 0,
          tax: data.tax || 0,
        },
      });
      return {
        ...quotation,
        client: this.enc.decrypt(quotation.client),
        notes: this.enc.decrypt(quotation.notes),
      };
    });
  }

  async updateQuotation(
    tenantId: string,
    id: string,
    data: Partial<CreateQuotationDto>,
  ) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const existing = await tx.quotation.findFirst({
        where: { id, tenantId },
      });
      if (!existing) throw new NotFoundException('Quotation not found');

      return tx.quotation.update({
        where: { id },
        data: {
          ...(data.client && {
            client: this.enc.encrypt(data.client) ?? data.client,
          }),
          ...(data.leadId && { lead: { connect: { id: data.leadId } } }),
          ...(data.amount !== undefined && { amount: data.amount }),
          ...(data.status && { status: data.status }),
          ...(data.validTill !== undefined && {
            validTill: data.validTill ? new Date(data.validTill) : null,
          }),
          ...(data.quoteNumber && { quoteNumber: data.quoteNumber }),
          ...(data.items !== undefined && { items: data.items }),
          ...(data.notes !== undefined && {
            notes: this.enc.encrypt(data.notes),
          }),
          ...(data.discount !== undefined && { discount: data.discount }),
          ...(data.tax !== undefined && { tax: data.tax }),
        },
      });
    });
  }

  async deleteQuotation(tenantId: string, id: string) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const existing = await tx.quotation.findFirst({
        where: { id, tenantId },
      });
      if (!existing) throw new NotFoundException('Quotation not found');

      return tx.quotation.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    });
  }

  async updateQuotationStatus(
    tenantId: string,
    id: string,
    data: UpdateQuotationStatusDto,
  ) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const quotation = await tx.quotation.findFirst({
        where: { id, tenantId },
      });
      if (!quotation) throw new NotFoundException('Quotation not found');

      return tx.quotation.update({
        where: { id },
        data: { status: data.status },
      });
    });
  }

  async getQuotations(tenantId: string, page = 1, limit = 10, search = '') {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      page = Math.max(1, page);
      limit = Math.max(1, Math.min(limit, 10000));
      const skip = (page - 1) * limit;
      const where: Prisma.QuotationWhereInput = { tenantId, deletedAt: null };

      if (search) {
        where.OR = [
          { quoteNumber: { contains: search, mode: 'insensitive' } },
          { client: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [quotations, total, currency] = await Promise.all([
        tx.quotation.findMany({
          where,
          include: {
            lead: {
              select: {
                id: true,
                name: true,
                company: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        tx.quotation.count({ where }),
        this.getTenantCurrency(tenantId),
      ]);

      // Automatic Expiry behavior
      const now = new Date();
      const expiredIds: string[] = [];
      quotations.forEach((q) => {
        if (
          (q.status === 'DRAFT' || q.status === 'SENT') &&
          q.validTill &&
          q.validTill < now
        ) {
          q.status = 'EXPIRED';
          expiredIds.push(q.id);
        }
      });

      if (expiredIds.length > 0) {
        await tx.quotation.updateMany({
          where: { id: { in: expiredIds } },
          data: { status: 'EXPIRED' },
        });
      }

      // Stats from FULL dataset
      const allStats = await tx.quotation.groupBy({
        by: ['status'],
        where: { tenantId, deletedAt: null },
        _count: { id: true },
        _sum: { amount: true },
      });

      const totalCount = allStats.reduce((s, r) => s + r._count.id, 0);
      const totalValue = allStats.reduce(
        (s, r) => s + toNumber(r._sum.amount),
        0,
      );
      const sentCount =
        allStats.find((r) => r.status === 'SENT')?._count.id ?? 0;
      const acceptedCount =
        allStats.find((r) => r.status === 'APPROVED')?._count.id ?? 0;

      return {
        stats: [
          { title: 'Total Quotations', value: totalCount.toString() },
          {
            title: 'Total Quote Value',
            value: formatCurrency(totalValue, currency),
            valueAmount: totalValue,
          },
          { title: 'Sent Quotes', value: sentCount.toString() },
          { title: 'Accepted Quotes', value: acceptedCount.toString() },
        ],
        quotations: quotations.map((q) => ({
          id: q.id,
          quoteId: q.quoteNumber,
          client: this.enc.decrypt(q.client),
          leadId: q.leadId,
          leadName: q.lead?.name
            ? this.enc.decrypt(q.lead.name)
            : this.enc.decrypt(q.client),
          leadDetails: q.lead
            ? {
                name: this.enc.decrypt(q.lead.name),
                email: this.enc.decrypt(q.lead.email),
                phone: this.enc.decrypt(q.lead.phone),
                company: this.enc.decrypt(q.lead.company),
              }
            : undefined,
          amount: formatCurrency(toNumber(q.amount), currency),
          amountValue: toNumber(q.amount),
          status: q.status,
          validTill: formatDate(q.validTill || new Date()),
          validTillValue: q.validTill
            ? new Date(q.validTill).toISOString()
            : null,
          items: q.items,
          notes: this.enc.decrypt(q.notes),
          discount: toNumber(q.discount),
          tax: toNumber(q.tax),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    });
  }
}
