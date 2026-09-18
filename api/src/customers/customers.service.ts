import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, CustomerStatus } from '@prisma/client';
import { EncryptionService } from '../common/encryption/encryption.service';
import { invalidateDashboardCache } from '../insights/services/dashboard.service';

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
      page = Math.max(1, page);
      limit = Math.max(1, Math.min(limit, 500));
      const skip = (page - 1) * limit;

      const where: Prisma.CustomerWhereInput = { tenantId, deletedAt: null };
      const searchTrimmed = search?.trim() || '';

      if (searchTrimmed) {
        // Fast path: Exact email match via HMAC-SHA256 blind index
        const isEmailFormat = searchTrimmed.includes('@');
        if (isEmailFormat) {
          const emailHash = this.enc.hash(searchTrimmed);
          const emailWhere: Prisma.CustomerWhereInput = {
            ...where,
            emailHash,
          };

          const [customers, total] = await Promise.all([
            this.prisma.withTenantContext({ tenantId }, (tx) =>
              tx.customer.findMany({
                where: emailWhere,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                  id: true,
                  tenantId: true,
                  assignedToId: true,
                  name: true,
                  company: true,
                  email: true,
                  status: true,
                  revenue: true,
                  lastContactAt: true,
                  createdAt: true,
                  updatedAt: true,
                  leadId: true,
                  companyId: true,
                  _count: {
                    select: { deals: { where: { status: { not: 'LOST' } } } },
                  },
                  deals: {
                    where: { stage: { not: 'LOST' } },
                    select: { value: true, stage: true },
                  },
                },
              })
            ),
            this.prisma.withTenantContext({ tenantId }, (tx) =>
              tx.customer.count({ where: emailWhere })
            ),
          ]);

          if (total > 0) {
            const mappedCustomers = customers.map((c) => {
              const dealsRevenue = (c.deals || []).reduce(
                (sum, d) => sum + Number(d.value || 0),
                0,
              );
              return {
                id: c.id,
                tenantId: c.tenantId,
                assignedToId: c.assignedToId,
                name: this.enc.decrypt(c.name),
                email: this.enc.decrypt(c.email),
                company: this.enc.decrypt(c.company),
                status: c.status,
                revenue: c.revenue,
                lastContactAt: c.lastContactAt,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
                leadId: c.leadId,
                companyId: c.companyId,
                dealsCount: c._count.deals,
                revenueValue:
                  dealsRevenue > 0 ? dealsRevenue : Number(c.revenue || 0),
              };
            });

            return {
              customers: mappedCustomers,
              pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
              },
            };
          }
        }

        // Substring search on decrypted fields:
        // Query candidate records with targeted select and filtered deal relations
        const candidates = await this.prisma.withTenantContext({ tenantId }, (tx) =>
          tx.customer.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 250,
            select: {
              id: true,
              tenantId: true,
              assignedToId: true,
              name: true,
              company: true,
              email: true,
              status: true,
              revenue: true,
              lastContactAt: true,
              createdAt: true,
              updatedAt: true,
              leadId: true,
              companyId: true,
              _count: {
                select: { deals: { where: { status: { not: 'LOST' } } } },
              },
              deals: {
                where: { stage: { not: 'LOST' } },
                select: { value: true, stage: true },
              },
            },
          })
        );

        const searchLower = searchTrimmed.toLowerCase();
        const matchedCustomers: Array<
          Omit<(typeof candidates)[0], 'name' | 'company' | 'email'> & {
            name: string | null;
            company: string | null;
            email: string | null;
          }
        > = [];

        for (let i = 0; i < candidates.length; i++) {
          const c = candidates[i];
          const decName = this.enc.decrypt(c.name);
          const decCompany = this.enc.decrypt(c.company);
          const decEmail = this.enc.decrypt(c.email);

          const nameMatches = (decName || '')
            .toLowerCase()
            .includes(searchLower);
          const companyMatches = (decCompany || '')
            .toLowerCase()
            .includes(searchLower);
          const emailMatches = (decEmail || '')
            .toLowerCase()
            .includes(searchLower);

          if (nameMatches || companyMatches || emailMatches) {
            matchedCustomers.push({
              ...c,
              name: decName,
              company: decCompany,
              email: decEmail,
            });
          }
        }

        const total = matchedCustomers.length;
        const paginatedSlice = matchedCustomers.slice(skip, skip + limit);

        const mappedCustomers = paginatedSlice.map((c) => {
          const dealsRevenue = (c.deals || []).reduce(
            (sum, d) => sum + Number(d.value || 0),
            0,
          );
          return {
            id: c.id,
            tenantId: c.tenantId,
            assignedToId: c.assignedToId,
            name: c.name,
            company: c.company,
            email: c.email,
            status: c.status,
            revenue: c.revenue,
            lastContactAt: c.lastContactAt,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            leadId: c.leadId,
            companyId: c.companyId,
            dealsCount: c._count?.deals || 0,
            revenueValue:
              dealsRevenue > 0 ? dealsRevenue : Number(c.revenue || 0),
          };
        });

        return {
          customers: mappedCustomers,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      }

      // Fast path: Server-side pagination without search query
      const [customers, total] = await Promise.all([
        this.prisma.withTenantContext({ tenantId }, (tx) =>
          tx.customer.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            select: {
              id: true,
              tenantId: true,
              assignedToId: true,
              name: true,
              company: true,
              email: true,
              status: true,
              revenue: true,
              lastContactAt: true,
              createdAt: true,
              updatedAt: true,
              leadId: true,
              companyId: true,
              _count: {
                select: { deals: { where: { status: { not: 'LOST' } } } },
              },
              deals: {
                where: { stage: { not: 'LOST' } },
                select: { value: true, stage: true },
              },
            },
          })
        ),
        this.prisma.withTenantContext({ tenantId }, (tx) =>
          tx.customer.count({ where })
        ),
      ]);

      const mappedCustomers = customers.map((c) => {
        const dealsRevenue = (c.deals || []).reduce(
          (sum, d) => sum + Number(d.value || 0),
          0,
        );

        return {
          id: c.id,
          tenantId: c.tenantId,
          assignedToId: c.assignedToId,
          name: this.enc.decrypt(c.name),
          email: this.enc.decrypt(c.email),
          company: this.enc.decrypt(c.company),
          status: c.status,
          revenue: c.revenue,
          lastContactAt: c.lastContactAt,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          leadId: c.leadId,
          companyId: c.companyId,
          dealsCount: c._count.deals,
          revenueValue:
            dealsRevenue > 0 ? dealsRevenue : Number(c.revenue || 0),
        };
      });

      return {
        customers: mappedCustomers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
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
    const customer = await this.prisma.withTenantContext({ tenantId }, async (tx) => {
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

    await invalidateDashboardCache(tenantId, [userId]);
    return customer;
  }

  async updateCustomer(
    tenantId: string,
    id: string,
    data: Prisma.CustomerUpdateInput,
  ) {
    const customer = await this.prisma.withTenantContext({ tenantId }, async (tx) => {
      // Encrypt PII fields if provided
      const updateData: Prisma.CustomerUpdateInput = { ...data };
      if (typeof data.name === 'string') {
        updateData.name = this.enc.encrypt(data.name)!;
      }
      if (typeof data.email === 'string') {
        const { encrypted, hash } = this.enc.encryptWithHash(data.email);
        updateData.email = encrypted;
        updateData.emailHash = hash;
      }
      if (typeof data.company === 'string') {
        updateData.company = this.enc.encrypt(data.company)!;
      }
      return tx.customer.update({
        where: { id, tenantId },
        data: updateData,
      });
    });

    await invalidateDashboardCache(tenantId);
    return customer;
  }

  async deleteCustomer(tenantId: string, id: string) {
    const deleted = await this.prisma.withTenantContext({ tenantId }, async (tx) => {
      return tx.customer.update({
        where: { id, tenantId },
        data: { deletedAt: new Date(), status: 'INACTIVE' },
      });
    });

    await invalidateDashboardCache(tenantId);
    return deleted;
  }

  async bulkDeleteCustomers(tenantId: string, ids: string[]) {
    const result = await this.prisma.withTenantContext({ tenantId }, async (tx) => {
      return tx.customer.updateMany({
        where: { id: { in: ids }, tenantId },
        data: { deletedAt: new Date(), status: 'INACTIVE' },
      });
    });

    await invalidateDashboardCache(tenantId);
    return result;
  }
}
