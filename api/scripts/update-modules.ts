import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  await prisma.platformModule.updateMany({
    where: { key: 'sa_users' },
    data: { label: 'Users' },
  });
  await prisma.platformModule.updateMany({
    where: { key: 'sa_modules' },
    data: { label: 'Modules' },
  });
  await prisma.platformModule.updateMany({
    where: { key: 'sa_settings' },
    data: { label: 'Settings' },
  });
  console.log('Updated platform module labels');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
