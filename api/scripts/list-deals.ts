import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
process.env.DATABASE_URL = process.env.DIRECT_URL;

const prisma = new PrismaClient();

async function main() {
  const deals = await prisma.deal.findMany();
  console.log('Deals count:', deals.length);
  for (const deal of deals) {
    console.log(`Deal ID: ${deal.id}, Name: ${deal.name}, Stage: ${deal.stage}, Lead ID: ${deal.leadId}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
