import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomerStatus } from '@prisma/client';
import { CreateContactDto } from './dto/create-contact.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { EncryptionService } from '../common/encryption/encryption.service';

/**
 * @file contacts/contacts.service.ts
 *
 * ENCRYPTION NOTE:
 *  - Customer.name, email, company are AES-256-GCM encrypted in DB.
 *  - The raw SQL ILIKE search on ciphertext is disabled after encryption.
 *  - Search is applied post-decryption for substring match.
 *  - create uses EncryptionService to encrypt before insert.
 */
@Injectable()
export class ContactsService implements OnModuleInit {
  private readonly logger = new Logger(ContactsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly enc: EncryptionService,
  ) {}

  async onModuleInit() {
    // Database schema is managed via Prisma migrations
  }

  async getCustomers(tenantId: string, query: PaginationQueryDto) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const page = Math.max(1, query.page || 1);
      const limit = Math.max(1, Math.min(query.limit || 1000, 10000));
      const search = query.search?.trim() || '';
      const skip = (page - 1) * limit;

      if (search) {
        // When searching encrypted records, fetch tenant records to filter across the full dataset
        const allCustomers = await tx.customer.findMany({
          where: { tenantId, deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { deals: { where: { status: { not: 'LOST' } } } },
            },
            deals: { select: { value: true, stage: true } },
          },
        });

        const mapped = allCustomers.map((c) => {
          const dealsRevenue = c.deals
            .filter((d) => d.stage !== 'LOST')
            .reduce((sum, d) => sum + Number(d.value || 0), 0);

          return {
            id: c.id,
            tenantId: c.tenantId,
            assignedToId: c.assignedToId,
            name: this.enc.decrypt(c.name),
            company: this.enc.decrypt(c.company),
            email: this.enc.decrypt(c.email),
            status: c.status,
            revenue: c.revenue,
            lastContactAt: c.lastContactAt,
            deletedAt: c.deletedAt,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            leadId: c.leadId,
            companyId: c.companyId,
            dealsCount: c._count.deals,
            revenueValue: dealsRevenue > 0 ? dealsRevenue : Number(c.revenue || 0),
          };
        });

        const searchLower = search.toLowerCase();
        const filtered = mapped.filter(
          (c) =>
            (c.name || '').toLowerCase().includes(searchLower) ||
            (c.email || '').toLowerCase().includes(searchLower) ||
            (c.company || '').toLowerCase().includes(searchLower),
        );

        const total = filtered.length;
        const paginated = filtered.slice(skip, skip + limit);

        return {
          customers: paginated,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
      }

      // Fast DB-level pagination when no search query is active
      const [customers, total] = await Promise.all([
        tx.customer.findMany({
          where: { tenantId, deletedAt: null },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            _count: {
              select: { deals: { where: { status: { not: 'LOST' } } } },
            },
            deals: { select: { value: true, stage: true } },
          },
        }),
        tx.customer.count({ where: { tenantId, deletedAt: null } }),
      ]);

      // Decrypt + map
      const mappedCustomers = customers.map((c) => {
        const dealsRevenue = c.deals
          .filter((d) => d.stage !== 'LOST')
          .reduce((sum, d) => sum + Number(d.value || 0), 0);

        return {
          id: c.id,
          tenantId: c.tenantId,
          assignedToId: c.assignedToId,
          name: this.enc.decrypt(c.name),
          company: this.enc.decrypt(c.company),
          email: this.enc.decrypt(c.email),
          status: c.status,
          revenue: c.revenue,
          lastContactAt: c.lastContactAt,
          deletedAt: c.deletedAt,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          leadId: c.leadId,
          companyId: c.companyId,
          dealsCount: c._count.deals,
          revenueValue: dealsRevenue > 0 ? dealsRevenue : Number(c.revenue || 0),
        };
      });

      return {
        customers: mappedCustomers,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    });
  }

  async createCustomer(
    tenantId: string,
    data: CreateContactDto,
    userId: string,
  ) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const { encrypted: encEmail, hash: emailHash } = this.enc.encryptWithHash(data.email);
      return tx.customer.create({
        data: {
          name: this.enc.encrypt(data.name)!,
          company: this.enc.encrypt(data.company)!,
          email: encEmail,
          emailHash,
          tenantId,
          revenue: data.revenue || 0,
          status: data.status || 'ACTIVE',
          assignedToId: userId,
        },
      });
    });
  }
}

