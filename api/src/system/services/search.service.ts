import { Injectable } from '@nestjs/common';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enc: EncryptionService,
  ) {}

  async globalSearch(
    tenantId: string,
    userId: string,
    isEmployee: boolean,
    query: string,
  ) {
    if (!query || query.length < 2) {
      return [];
    }

    const employeeFilter = isEmployee ? { ownerId: userId } : {};

    const [leads, customers, companies, deals, tasks] = await Promise.all([
      // Leads
      this.prisma.withTenantContext({ tenantId }, (tx) =>
        tx.lead.findMany({
          where: { tenantId, deletedAt: null, ...employeeFilter },
          take: 20,
          select: { id: true, name: true, email: true, company: true },
        }),
      ),
      // Customers
      this.prisma.withTenantContext({ tenantId }, (tx) =>
        tx.customer.findMany({
          where: { tenantId, deletedAt: null, ...employeeFilter },
          take: 20,
          select: { id: true, name: true, email: true, company: true },
        }),
      ),
      // Companies
      this.prisma.withTenantContext({ tenantId }, (tx) =>
        tx.company.findMany({
          where: { tenantId, deletedAt: null, ...employeeFilter },
          take: 20,
          select: { id: true, name: true, email: true },
        }),
      ),
      // Deals
      this.prisma.withTenantContext({ tenantId }, (tx) =>
        tx.deal.findMany({
          where: {
            tenantId,
            deletedAt: null,
            OR: [{ name: { contains: query, mode: 'insensitive' } }],
            ...employeeFilter,
          },
          take: 10,
          select: { id: true, name: true, value: true },
        }),
      ),
      // Tasks
      this.prisma.withTenantContext({ tenantId }, (tx) =>
        tx.task.findMany({
          where: {
            tenantId,
            deletedAt: null,
            OR: [{ title: { contains: query, mode: 'insensitive' } }],
          },
          take: 30,
          select: {
            id: true,
            title: true,
            priority: true,
            assignedToId: true,
            createdById: true,
          },
        }),
      ),
    ]);

    const filteredTasks = isEmployee
      ? tasks.filter(
          (t) => t.assignedToId === userId || t.createdById === userId,
        )
      : tasks;

    const lowerQ = query.toLowerCase();

    const decryptedLeads = leads
      .map((l) => {
        const name = this.enc.decrypt(l.name) || '';
        const email = this.enc.decrypt(l.email) || '';
        const company = this.enc.decrypt(l.company) || '';
        return { id: l.id, name, email, company };
      })
      .filter(
        (l) =>
          l.name.toLowerCase().includes(lowerQ) ||
          l.email.toLowerCase().includes(lowerQ) ||
          l.company.toLowerCase().includes(lowerQ),
      )
      .slice(0, 10);

    const decryptedCustomers = customers
      .map((c) => {
        const name = this.enc.decrypt(c.name) || '';
        const email = this.enc.decrypt(c.email) || '';
        const company = this.enc.decrypt(c.company) || '';
        return { id: c.id, name, email, company };
      })
      .filter(
        (c) =>
          c.name.toLowerCase().includes(lowerQ) ||
          c.email.toLowerCase().includes(lowerQ) ||
          c.company.toLowerCase().includes(lowerQ),
      )
      .slice(0, 10);

    const decryptedCompanies = companies
      .map((c) => {
        const name = this.enc.decrypt(c.name) || '';
        const email = this.enc.decrypt(c.email) || '';
        return { id: c.id, name, email };
      })
      .filter(
        (c) =>
          c.name.toLowerCase().includes(lowerQ) ||
          c.email.toLowerCase().includes(lowerQ),
      )
      .slice(0, 10);

    const results = [
      ...decryptedLeads.map((l) => ({
        id: l.id,
        title: l.name,
        subtitle: l.company || l.email || 'Lead',
        type: 'Lead',
        url: `/leads/${l.id}`,
      })),
      ...decryptedCustomers.map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: c.company || c.email || 'Customer',
        type: 'Customer',
        url: `/customers/${c.id}`,
      })),
      ...decryptedCompanies.map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: c.email || 'Company',
        type: 'Company',
        url: `/companies/${c.id}`,
      })),
      ...deals.map((d) => ({
        id: d.id,
        title: d.name,
        subtitle: `Value: ${d.value}`,
        type: 'Deal',
        url: `/pipeline`,
      })),
      ...filteredTasks.map((t) => ({
        id: t.id,
        title: t.title,
        subtitle: t.priority || 'Task',
        type: 'Task',
        url: `/tasks`,
      })),
    ];

    return results;
  }
}
