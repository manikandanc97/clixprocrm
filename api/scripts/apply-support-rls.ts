import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const connectionUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: connectionUrl,
      },
    },
  });
  try {
    console.log('Enabling Row Level Security on SupportTicket, SupportTicketMessage, SupportTicketAttachment...');

    // 1. SupportTicket RLS
    await prisma.$executeRawUnsafe(`ALTER TABLE "SupportTicket" ENABLE ROW LEVEL SECURITY;`);
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "tenant_isolation_supportticket" ON "SupportTicket";`);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "tenant_isolation_supportticket" ON "SupportTicket"
        FOR ALL
        USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '') OR COALESCE(current_setting('app.is_super_admin', true) = 'true', false))
        WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '') OR COALESCE(current_setting('app.is_super_admin', true) = 'true', false));
    `);

    // 2. SupportTicketMessage RLS
    await prisma.$executeRawUnsafe(`ALTER TABLE "SupportTicketMessage" ENABLE ROW LEVEL SECURITY;`);
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "tenant_isolation_supportticketmessage" ON "SupportTicketMessage";`);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "tenant_isolation_supportticketmessage" ON "SupportTicketMessage"
        FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM "SupportTicket" t 
            WHERE t.id = "SupportTicketMessage"."ticketId" 
            AND (t."tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '') OR COALESCE(current_setting('app.is_super_admin', true) = 'true', false))
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM "SupportTicket" t 
            WHERE t.id = "SupportTicketMessage"."ticketId" 
            AND (t."tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '') OR COALESCE(current_setting('app.is_super_admin', true) = 'true', false))
          )
        );
    `);

    // 3. SupportTicketAttachment RLS
    await prisma.$executeRawUnsafe(`ALTER TABLE "SupportTicketAttachment" ENABLE ROW LEVEL SECURITY;`);
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "tenant_isolation_supportticketattachment" ON "SupportTicketAttachment";`);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "tenant_isolation_supportticketattachment" ON "SupportTicketAttachment"
        FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM "SupportTicket" t 
            WHERE t.id = "SupportTicketAttachment"."ticketId" 
            AND (t."tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '') OR COALESCE(current_setting('app.is_super_admin', true) = 'true', false))
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM "SupportTicket" t 
            WHERE t.id = "SupportTicketAttachment"."ticketId" 
            AND (t."tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '') OR COALESCE(current_setting('app.is_super_admin', true) = 'true', false))
          )
        );
    `);

    console.log('Support Ticket RLS policies applied successfully.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Error applying Support Ticket RLS:', err);
  process.exit(1);
});
