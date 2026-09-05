-- ============================================================================
-- Migration 19: Schema Drift Remediation
-- Forward-only, idempotent, non-destructive reconciliation of historical schema drift.
-- Reconciles:
-- 1. SecurityIncident: acknowledgedAt, assignedTo, organizationId, organizationId_idx (drop detectedBy, resolvedBy)
-- 2. Invoice: dealId, foreign keys (companyId, dealId, quotationId, createdById), indexes
-- 3. Billing: PlatformBillingConfig keys, PlatformPayment & PlatformSubscription provider fields
-- 4. Foreign Keys: Payment_createdById_fkey, PlatformRefund_platformPaymentId_fkey, TimelineEvent_invoiceId_fkey, AuditLog FKs
-- 5. Indexes: Missing query and filtering indexes across billing, invoice, and webhook models
-- 6. UserSession: RLS enablement and exact user_isolation_usersession policy
-- ============================================================================

-- 1. SecurityIncident Exact Reconciliation
ALTER TABLE "SecurityIncident" ADD COLUMN IF NOT EXISTS "acknowledgedAt" TIMESTAMP(3);
ALTER TABLE "SecurityIncident" ADD COLUMN IF NOT EXISTS "assignedTo" TEXT;
ALTER TABLE "SecurityIncident" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "SecurityIncident" DROP COLUMN IF EXISTS "detectedBy";
ALTER TABLE "SecurityIncident" DROP COLUMN IF EXISTS "resolvedBy";
CREATE INDEX IF NOT EXISTS "SecurityIncident_organizationId_idx" ON "SecurityIncident"("organizationId");

-- 2. Invoice Drift Reconciliation
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "dealId" TEXT;
CREATE INDEX IF NOT EXISTS "Invoice_companyId_idx" ON "Invoice"("companyId");
CREATE INDEX IF NOT EXISTS "Invoice_dealId_idx" ON "Invoice"("dealId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'Invoice_companyId_fkey' AND table_name = 'Invoice' AND table_schema = 'public'
  ) THEN
    ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_companyId_fkey" 
      FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'Invoice_dealId_fkey' AND table_name = 'Invoice' AND table_schema = 'public'
  ) THEN
    ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_dealId_fkey" 
      FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'Invoice_quotationId_fkey' AND table_name = 'Invoice' AND table_schema = 'public'
  ) THEN
    ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_quotationId_fkey" 
      FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'Invoice_createdById_fkey' AND table_name = 'Invoice' AND table_schema = 'public'
  ) THEN
    ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_createdById_fkey" 
      FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 3. Billing Drift Reconciliation
ALTER TABLE "PlatformBillingConfig" ADD COLUMN IF NOT EXISTS "razorpayKeyId" TEXT;
ALTER TABLE "PlatformBillingConfig" ADD COLUMN IF NOT EXISTS "razorpayKeySecret" TEXT;
ALTER TABLE "PlatformBillingConfig" ADD COLUMN IF NOT EXISTS "stripePublishableKey" TEXT;
ALTER TABLE "PlatformBillingConfig" ADD COLUMN IF NOT EXISTS "stripeSecretKey" TEXT;

ALTER TABLE "PlatformPayment" ADD COLUMN IF NOT EXISTS "providerOrderId" TEXT;
ALTER TABLE "PlatformPayment" ADD COLUMN IF NOT EXISTS "providerPaymentId" TEXT;
ALTER TABLE "PlatformPayment" ADD COLUMN IF NOT EXISTS "providerSignature" TEXT;

ALTER TABLE "PlatformSubscription" ADD COLUMN IF NOT EXISTS "providerCustomerId" TEXT;
ALTER TABLE "PlatformSubscription" ADD COLUMN IF NOT EXISTS "providerOrderId" TEXT;
ALTER TABLE "PlatformSubscription" ADD COLUMN IF NOT EXISTS "providerPriceId" TEXT;
ALTER TABLE "PlatformSubscription" ADD COLUMN IF NOT EXISTS "providerSubscriptionId" TEXT;

-- 4. Foreign Keys Reconciliation (Guarded)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'Payment_createdById_fkey' AND table_name = 'Payment' AND table_schema = 'public'
  ) THEN
    ALTER TABLE "Payment" ADD CONSTRAINT "Payment_createdById_fkey" 
      FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'PlatformRefund_platformPaymentId_fkey' AND table_name = 'PlatformRefund' AND table_schema = 'public'
  ) THEN
    ALTER TABLE "PlatformRefund" ADD CONSTRAINT "PlatformRefund_platformPaymentId_fkey" 
      FOREIGN KEY ("platformPaymentId") REFERENCES "PlatformPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'TimelineEvent_invoiceId_fkey' AND table_name = 'TimelineEvent' AND table_schema = 'public'
  ) THEN
    ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_invoiceId_fkey" 
      FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'AuditLog_userId_fkey' AND table_name = 'AuditLog' AND table_schema = 'public'
  ) THEN
    ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'AuditLog_targetUserId_fkey' AND table_name = 'AuditLog' AND table_schema = 'public'
  ) THEN
    ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_targetUserId_fkey" 
      FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END $$;

-- 5. Index Reconciliation
CREATE INDEX IF NOT EXISTS "InvoiceItem_productId_idx" ON "InvoiceItem"("productId");
CREATE INDEX IF NOT EXISTS "Payment_paymentDate_idx" ON "Payment"("paymentDate");
CREATE INDEX IF NOT EXISTS "PlatformInvoice_invoiceDate_idx" ON "PlatformInvoice"("invoiceDate");
CREATE INDEX IF NOT EXISTS "PlatformInvoice_paymentStatus_idx" ON "PlatformInvoice"("paymentStatus");
CREATE INDEX IF NOT EXISTS "PlatformInvoiceItem_platformInvoiceId_idx" ON "PlatformInvoiceItem"("platformInvoiceId");
CREATE INDEX IF NOT EXISTS "PlatformPayment_gatewayTransactionId_idx" ON "PlatformPayment"("gatewayTransactionId");
CREATE INDEX IF NOT EXISTS "PlatformPayment_paymentDate_idx" ON "PlatformPayment"("paymentDate");
CREATE INDEX IF NOT EXISTS "PlatformPayment_platformInvoiceId_idx" ON "PlatformPayment"("platformInvoiceId");
CREATE INDEX IF NOT EXISTS "PlatformPayment_providerPaymentId_idx" ON "PlatformPayment"("providerPaymentId");
CREATE INDEX IF NOT EXISTS "PlatformPayment_status_idx" ON "PlatformPayment"("status");
CREATE INDEX IF NOT EXISTS "PlatformRefund_platformInvoiceId_idx" ON "PlatformRefund"("platformInvoiceId");
CREATE INDEX IF NOT EXISTS "PlatformRefund_platformPaymentId_idx" ON "PlatformRefund"("platformPaymentId");
CREATE INDEX IF NOT EXISTS "PlatformRefund_tenantId_idx" ON "PlatformRefund"("tenantId");
CREATE INDEX IF NOT EXISTS "PlatformSubscription_providerCustomerId_idx" ON "PlatformSubscription"("providerCustomerId");
CREATE INDEX IF NOT EXISTS "PlatformSubscription_providerSubscriptionId_idx" ON "PlatformSubscription"("providerSubscriptionId");
CREATE INDEX IF NOT EXISTS "PlatformWebhookEvent_createdAt_idx" ON "PlatformWebhookEvent"("createdAt");
CREATE INDEX IF NOT EXISTS "PlatformWebhookEvent_provider_eventId_idx" ON "PlatformWebhookEvent"("provider", "eventId");
CREATE INDEX IF NOT EXISTS "PlatformWebhookEvent_status_idx" ON "PlatformWebhookEvent"("status");

-- 6. UserSession RLS and Exact Policy
ALTER TABLE "UserSession" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'UserSession' 
      AND policyname = 'user_isolation_usersession'
  ) THEN
    CREATE POLICY "user_isolation_usersession" ON "UserSession"
    AS PERMISSIVE FOR ALL
    TO public
    USING (("userId" = NULLIF(current_setting('app.current_user_id'::text, true), ''::text)) OR COALESCE((current_setting('app.is_super_admin'::text, true) = 'true'::text), false))
    WITH CHECK (("userId" = NULLIF(current_setting('app.current_user_id'::text, true), ''::text)) OR COALESCE((current_setting('app.is_super_admin'::text, true) = 'true'::text), false));
  END IF;
END $$;
