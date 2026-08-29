-- ============================================================================
-- Migration: 20260829103000_add_support_tickets_and_rls
-- Adds SupportDesk models (SupportTicket, SupportTicketMessage, SupportTicketAttachment)
-- and applies Row-Level Security (RLS) tenant isolation.
-- ============================================================================

-- 1. Create Enums if not exist
DO $$ BEGIN
  CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create Tables if not exist
CREATE TABLE IF NOT EXISTS "SupportTicket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "priority" "SupportTicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "diagnostics" JSONB,
    "estimatedResponseTime" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SupportTicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isStaff" BOOLEAN NOT NULL DEFAULT false,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTicketMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SupportTicketAttachment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "storagePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTicketAttachment_pkey" PRIMARY KEY ("id")
);

-- 3. Unique & Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber");
CREATE INDEX IF NOT EXISTS "SupportTicket_tenantId_idx" ON "SupportTicket"("tenantId");
CREATE INDEX IF NOT EXISTS "SupportTicket_createdById_idx" ON "SupportTicket"("createdById");
CREATE INDEX IF NOT EXISTS "SupportTicket_assignedToId_idx" ON "SupportTicket"("assignedToId");
CREATE INDEX IF NOT EXISTS "SupportTicket_status_idx" ON "SupportTicket"("status");
CREATE INDEX IF NOT EXISTS "SupportTicket_priority_idx" ON "SupportTicket"("priority");
CREATE INDEX IF NOT EXISTS "SupportTicket_createdAt_idx" ON "SupportTicket"("createdAt");
CREATE INDEX IF NOT EXISTS "SupportTicket_tenantId_status_idx" ON "SupportTicket"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "SupportTicket_tenantId_createdById_idx" ON "SupportTicket"("tenantId", "createdById");

CREATE INDEX IF NOT EXISTS "SupportTicketMessage_ticketId_idx" ON "SupportTicketMessage"("ticketId");
CREATE INDEX IF NOT EXISTS "SupportTicketMessage_senderId_idx" ON "SupportTicketMessage"("senderId");
CREATE INDEX IF NOT EXISTS "SupportTicketMessage_createdAt_idx" ON "SupportTicketMessage"("createdAt");

CREATE INDEX IF NOT EXISTS "SupportTicketAttachment_ticketId_idx" ON "SupportTicketAttachment"("ticketId");

-- 4. Foreign Keys
DO $$ BEGIN
  ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "SupportTicketMessage" ADD CONSTRAINT "SupportTicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "SupportTicketMessage" ADD CONSTRAINT "SupportTicketMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "SupportTicketAttachment" ADD CONSTRAINT "SupportTicketAttachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 5. Row-Level Security (RLS)
ALTER TABLE "SupportTicket" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_supportticket" ON "SupportTicket";
CREATE POLICY "tenant_isolation_supportticket" ON "SupportTicket"
  FOR ALL
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '') OR COALESCE(current_setting('app.is_super_admin', true) = 'true', false))
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '') OR COALESCE(current_setting('app.is_super_admin', true) = 'true', false));

ALTER TABLE "SupportTicketMessage" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_supportticketmessage" ON "SupportTicketMessage";
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

ALTER TABLE "SupportTicketAttachment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_supportticketattachment" ON "SupportTicketAttachment";
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
