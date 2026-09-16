import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
      const where = { tenantId, deletedAt: null };

      if (search) {
        // Fast path: Exact email match via HMAC-SHA256 blind index
        const isEmailFormat = search.includes('@');
        if (isEmailFormat) {
          const emailHash = this.enc.hash(search);
          const emailWhere = {
            ...where,
            emailHash,
          };

          const [customers, total] = await Promise.all([
            tx.customer.findMany({
              where: emailWhere,
              orderBy: { createdAt: 'desc' },
              skip,
              take: limit,
              include: {
                _count: {
                  select: { deals: { where: { status: { not: 'LOST' } } } },
                },
                deals: {
                  where: { stage: { not: 'LOST' } },
                  select: { value: true, stage: true },
                },
              },
            }),
            tx.customer.count({ where: emailWhere }),
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
        const candidates = await tx.customer.findMany({
          where,
          orderBy: { createdAt: 'desc' },
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
            deletedAt: true,
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
        });

        const searchLower = search.toLowerCase();
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
            deletedAt: c.deletedAt,
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

      // Fast DB-level pagination when no search query is active
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
              where: { stage: { not: 'LOST' } },
              select: { value: true, stage: true },
            },
          },
        }),
        tx.customer.count({ where }),
      ]);

      // Decrypt + map
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
    });
  }

  async createCustomer(
    tenantId: string,
    data: CreateContactDto,
    userId: string,
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
}
