import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
// override with direct url
process.env.DATABASE_URL = process.env.DIRECT_URL;

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to DB...');
  const leads = await prisma.lead.findMany();
  console.log(`Found ${leads.length} leads`);
  
  let count = 0;
  for (const lead of leads) {
    const existing = await prisma.deal.findFirst({ where: { leadId: lead.id } });
    if (!existing) {
      await prisma.deal.create({
        data: {
          tenantId: lead.tenantId,
          name: `${lead.company || lead.name} Deal`,
          value: lead.value,
          stage: 'NEW',
          companyId: lead.companyId,
          customerId: lead.customerId,
          ownerId: lead.assignedToId || lead.createdById,
          leadId: lead.id
        }
      });
      count++;
      console.log(`Created deal for lead: ${lead.name}`);
    }
  }
  console.log(`Created ${count} new deals.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
