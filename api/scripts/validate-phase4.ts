import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

const prisma = new PrismaClient();

async function run() {
  console.log("Running Phase 4 Validation Script...");
  
  const tenants = await prisma.tenant.findMany({ take: 2 });
  if (tenants.length === 0) {
    console.log("No tenants found.");
    return;
  }
  
  const tenant1 = tenants[0];
  const tenant2 = tenants.length > 1 ? tenants[1] : tenant1;
  const admin = await prisma.user.findFirst();

  console.log(`Tenant 1: ${tenant1.id}`);
  console.log(`Tenant 2: ${tenant2.id}`);
  
  // 1. Pipeline Migration Validation
  console.log("== Testing Pipeline Migration ==");
  
  // Create 50 dummy leads for tenant1
  for(let i = 0; i < 50; i++) {
    await prisma.lead.create({
      data: {
        tenantId: tenant1.id,
        name: `T1 Lead ${Date.now()}_${i}`,
        company: 'T1 Corp',
        email: `t1_${Date.now()}_${i}@test.com`,
        stage: 'NEW'
      }
    });
  }

  // Create 20 dummy leads for tenant2
  for(let i = 0; i < 20; i++) {
    await prisma.lead.create({
      data: {
        tenantId: tenant2.id,
        name: `T2 Lead ${Date.now()}_${i}`,
        company: 'T2 Corp',
        email: `t2_${Date.now()}_${i}@test.com`,
        stage: 'NEW'
      }
    });
  }

  async function migrate(tenantId: string) {
    let createdCount = 0;
    let totalLeads = 0;
    let cursor: string | undefined = undefined;

    const start = performance.now();
    while (true) {
      const queryArgs: any = {
        where: { tenantId },
        take: 100,
        orderBy: { id: 'asc' },
      };
      if (cursor) {
        queryArgs.skip = 1;
        queryArgs.cursor = { id: cursor };
      }
      
      const leads = await prisma.lead.findMany(queryArgs);
      if (leads.length === 0) break;
      totalLeads += leads.length;
      cursor = leads[leads.length - 1].id;

      const leadIds = leads.map((l: any) => l.id);

      const existingDeals = await prisma.deal.findMany({
        where: { tenantId, leadId: { in: leadIds } },
        select: { leadId: true },
      });
      
      const existingDealLeadIds = new Set(existingDeals.map(d => d.leadId));

      const dealsToCreate = leads
        .filter((lead: any) => !existingDealLeadIds.has(lead.id))
        .map((lead: any) => ({
          tenantId,
          name: `${lead.name} - Deal`,
          companyId: lead.companyId,
          customerId: lead.customerId,
          leadId: lead.id,
          value: lead.value,
          ownerId: lead.assignedToId || lead.createdById,
          stage: 'NEW' as any,
        }));

      if (dealsToCreate.length > 0) {
        await prisma.deal.createMany({
          data: dealsToCreate,
          skipDuplicates: true,
        });
        createdCount += dealsToCreate.length;
      }
    }
    const duration = performance.now() - start;
    return { createdCount, totalLeads, duration };
  }

  const res1 = await migrate(tenant1.id);
  console.log(`Tenant 1 Migration: ${res1.createdCount} deals created out of ${res1.totalLeads} leads in ${res1.duration.toFixed(2)}ms`);

  const res2 = await migrate(tenant2.id);
  console.log(`Tenant 2 Migration: ${res2.createdCount} deals created out of ${res2.totalLeads} leads in ${res2.duration.toFixed(2)}ms`);
  
  // Re-run to ensure no duplicates
  const res1_dupe = await migrate(tenant1.id);
  console.log(`Tenant 1 Migration (Dupe test): ${res1_dupe.createdCount} deals created out of ${res1_dupe.totalLeads} leads in ${res1_dupe.duration.toFixed(2)}ms`);
  if (res1_dupe.createdCount > 0) {
    console.error("FAIL: Duplicate deals created!");
  } else {
    console.log("PASS: No duplicate deals created.");
  }
}

run().finally(() => prisma.$disconnect());
