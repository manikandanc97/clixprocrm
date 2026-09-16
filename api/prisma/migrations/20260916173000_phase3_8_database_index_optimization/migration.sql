-- ============================================================================
-- Migration 20: Phase 3.8 Database Index Optimization
-- Additive, idempotent composite indexes aligned with Phase 3 CRM query workloads.
-- Reconciles:
-- 1. Task: Composite index for status-filtered recent activity and update sorting
-- 2. Quotation: Tenant isolation, soft-delete filtering, and creation date ordering indexes
-- 3. Meeting: Employee-scoped datetime range query index
-- 4. Company: Tenant-scoped soft-delete directory listing index
-- ============================================================================

-- 1. Task Index Optimization
CREATE INDEX IF NOT EXISTS "Task_tenantId_deletedAt_status_updatedAt_idx" 
  ON "Task"("tenantId", "deletedAt", "status", "updatedAt");

-- 2. Quotation Index Optimization
CREATE INDEX IF NOT EXISTS "Quotation_tenantId_idx" 
  ON "Quotation"("tenantId");

CREATE INDEX IF NOT EXISTS "Quotation_tenantId_deletedAt_idx" 
  ON "Quotation"("tenantId", "deletedAt");

CREATE INDEX IF NOT EXISTS "Quotation_tenantId_deletedAt_createdAt_idx" 
  ON "Quotation"("tenantId", "deletedAt", "createdAt");

CREATE INDEX IF NOT EXISTS "Quotation_tenantId_status_idx" 
  ON "Quotation"("tenantId", "status");

-- 3. Meeting Index Optimization
CREATE INDEX IF NOT EXISTS "Meeting_tenantId_assignedToId_startTime_idx" 
  ON "Meeting"("tenantId", "assignedToId", "startTime");

-- 4. Company Index Optimization
CREATE INDEX IF NOT EXISTS "Company_tenantId_deletedAt_createdAt_idx" 
  ON "Company"("tenantId", "deletedAt", "createdAt");
