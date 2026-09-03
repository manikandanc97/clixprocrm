import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, CustomerStatus } from '@prisma/client';
import { EncryptionService } from '../common/encryption/encryption.service';

/**
 * ENCRYPTION NOTE:
 *  - Customer.name, Customer.email, Customer.company are AES-256-GCM encrypted.
 *  - Customer.emailHash is used for exact-match email lookups.
 *  - Search is applied post-decryption for substring match.
 */
@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enc: EncryptionService,
  ) {}

  async getCustomers(tenantId: string, page = 1, limit = 10, search = '') {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      page = Math.max(1, page);
      limit = Math.max(1, Math.min(limit, 10000));
      const skip = (page - 1) * limit;

      const where: Prisma.CustomerWhereInput = { tenantId, deletedAt: null };

      const searchTrimmed = search?.trim() || '';

      if (searchTrimmed) {
        // When searching encrypted records, fetch tenant records to filter across the full dataset
        const allCustomers = await tx.customer.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { deals: { where: { status: { not: 'LOST' } } } },
            },
            deals: {
              select: { value: true, stage: true },
            },
          },
        });

        const mapped = allCustomers.map((c) => {
          const dealsRevenue = c.deals
            .filter((d) => d.stage !== 'LOST')
            .reduce((sum, d) => sum + Number(d.value || 0), 0);

          return {
            ...c,
            name: this.enc.decrypt(c.name),
            email: this.enc.decrypt(c.email),
            company: this.enc.decrypt(c.company),
            dealsCount: c._count.deals,
            revenueValue: dealsRevenue > 0 ? dealsRevenue : Number(c.revenue || 0),
          };
        });

        const searchLower = searchTrimmed.toLowerCase();
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

      const [customers, total] = await Promise.all([
        tx.customer.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            _count: {
              select: { deals: { where: { status: { not: 'LOST' } } } },
            },
            deals: {
              select: { value: true, stage: true },
            },
          },
        }),
        tx.customer.count({ where }),
      ]);

      const mappedCustomers = customers.map((c) => {
        const dealsRevenue = c.deals
          .filter((d) => d.stage !== 'LOST')
          .reduce((sum, d) => sum + Number(d.value || 0), 0);

        // Decrypt PII fields
        const decrypted = {
          ...c,
          name: this.enc.decrypt(c.name),
          email: this.enc.decrypt(c.email),
          company: this.enc.decrypt(c.company),
          dealsCount: c._count.deals,
          revenueValue: dealsRevenue > 0 ? dealsRevenue : Number(c.revenue || 0),
        };
        return decrypted;
      });

      return {
        customers: mappedCustomers,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    });
  }

  async createCustomer(
    tenantId: string,
    userId: string,
    data: {
      name: string;
      company: string;
      email?: string;
      revenue?: number | string;
      status?: CustomerStatus;
    },
  ) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const { encrypted: encEmail, hash: emailHash } = this.enc.encryptWithHash(
        data.email,
      );
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

  async updateCustomer(
    tenantId: string,
    id: string,
    data: Partial<Prisma.CustomerUpdateInput>,
  ) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      // Encrypt PII fields if provided
      const updateData: any = { ...data };
      if (typeof data.name === 'string') {
        updateData.name = this.enc.encrypt(data.name);
      }
      if (typeof data.email === 'string') {
        const { encrypted, hash } = this.enc.encryptWithHash(data.email);
        updateData.email = encrypted;
        updateData.emailHash = hash;
      }
      if (typeof data.company === 'string') {
        updateData.company = this.enc.encrypt(data.company);
      }
      return tx.customer.update({
        where: { id, tenantId },
        data: updateData,
      });
    });
  }

  async deleteCustomer(tenantId: string, id: string) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      return tx.customer.update({
        where: { id, tenantId },
        data: { deletedAt: new Date(), status: 'INACTIVE' },
      });
    });
  }

  async bulkDeleteCustomers(tenantId: string, ids: string[]) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      return tx.customer.updateMany({
        where: { id: { in: ids }, tenantId },
        data: { deletedAt: new Date(), status: 'INACTIVE' },
      });
    });
  }

}
