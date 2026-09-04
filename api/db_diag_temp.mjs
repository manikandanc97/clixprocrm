// READ-ONLY diagnostic: tests DIRECT_URL connectivity via Prisma
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const directUrl = process.env.DIRECT_URL;
const databaseUrl = process.env.DATABASE_URL;

console.log('--- ENV CHECK ---');
console.log('DATABASE_URL host/port:', databaseUrl?.match(/pooler\.supabase\.com:\d+/)?.[0] ?? 'NOT FOUND');
console.log('DIRECT_URL   host/port:', directUrl?.match(/pooler\.supabase\.com:\d+/)?.[0] ?? 'NOT FOUND');
console.log('DIRECT_URL pgbouncer=true:', directUrl?.includes('pgbouncer=true') ?? false);

console.log('\n--- DIRECT_URL Connectivity Test ---');
const db = new PrismaClient({
  datasources: { db: { url: directUrl } },
  log: ['error'],
});

try {
  const result = await db.$queryRawUnsafe('SELECT 1 as result, now()::text as ts');
  console.log('SUCCESS:', JSON.stringify(result));
} catch (err) {
  console.error('FAILED:', err.message);
  console.error('Error code:', err.errorCode ?? err.code ?? 'N/A');
} finally {
  await db.$disconnect();
}

console.log('\n--- DATABASE_URL Connectivity Test (pgbouncer) ---');
const db2 = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
  log: ['error'],
});

try {
  const result2 = await db2.$queryRawUnsafe('SELECT 1 as result, now()::text as ts');
  console.log('SUCCESS:', JSON.stringify(result2));
} catch (err2) {
  console.error('FAILED:', err2.message);
  console.error('Error code:', err2.errorCode ?? err2.code ?? 'N/A');
} finally {
  await db2.$disconnect();
}
