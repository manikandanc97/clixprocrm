import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('Checking database and test users...');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      isSuperAdmin: true,
      status: true,
      memberships: {
        select: {
          tenantId: true,
          status: true,
          role: { select: { id: true, name: true } },
          tenant: { select: { id: true, name: true, status: true } },
        },
      },
    },
  });

  console.log('Found users:', JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
