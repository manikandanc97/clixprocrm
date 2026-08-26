-- Enterprise Invoice and Billing System Safe Migration
-- Extends Invoice, adds InvoiceItem, Payment, TenantInvoiceSettings,
-- PlatformSubscription, PlatformInvoice, PlatformInvoiceItem, PlatformPayment, PlatformRefund, PlatformBillingConfig

-- 1. Alter existing Invoice table
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "quotationId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'INR';
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "paymentTerms" TEXT DEFAULT 'DUE_ON_RECEIPT';
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "discountType" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "discountValue" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "taxableAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "cgstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "sgstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "igstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "otherTaxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "roundOff" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "balanceAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "termsAndConditions" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "customerBillingAddress" JSONB;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "orgBillingAddress" JSONB;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "pdfUrl" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "createdById" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "viewedAt" TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3);

-- Make customerId nullable if not already
ALTER TABLE "Invoice" ALTER COLUMN "customerId" DROP NOT NULL;

-- 2. Alter TimelineEvent table
ALTER TABLE "TimelineEvent" ADD COLUMN IF NOT EXISTS "invoiceId" TEXT;

-- 3. Create InvoiceItem table
CREATE TABLE IF NOT EXISTS "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit" TEXT DEFAULT 'unit',
    "unitPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountType" TEXT,
    "discountValue" DECIMAL(12,2) DEFAULT 0,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- 4. Create Payment table
CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "paymentMethod" TEXT NOT NULL DEFAULT 'BANK_TRANSFER',
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referenceNumber" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "receiptUrl" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- 5. Create TenantInvoiceSettings table
CREATE TABLE IF NOT EXISTS "TenantInvoiceSettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invoicePrefix" TEXT NOT NULL DEFAULT 'INV',
    "nextInvoiceNumber" INTEGER NOT NULL DEFAULT 1,
    "financialYear" TEXT DEFAULT '2026-2027',
    "gstin" TEXT,
    "pan" TEXT,
    "legalName" TEXT,
    "billingAddress" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT DEFAULT 'India',
    "bankName" TEXT,
    "accountNumber" TEXT,
    "ifscCode" TEXT,
    "accountHolderName" TEXT,
    "upiId" TEXT,
    "defaultNotes" TEXT DEFAULT 'Thank you for doing business with us.',
    "defaultTerms" TEXT DEFAULT 'Payment is due within 15 days of invoice date.',
    "taxType" TEXT NOT NULL DEFAULT 'GST',
    "defaultTaxRate" DECIMAL(6,2) NOT NULL DEFAULT 18.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TenantInvoiceSettings_pkey" PRIMARY KEY ("id")
);

-- 6. Create PlatformSubscription table
CREATE TABLE IF NOT EXISTS "PlatformSubscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "seats" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "unitPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "recurringAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlatformSubscription_pkey" PRIMARY KEY ("id")
);

-- 7. Create PlatformInvoice table
CREATE TABLE IF NOT EXISTS "PlatformInvoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "seats" INTEGER NOT NULL DEFAULT 1,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(6,2) NOT NULL DEFAULT 18.0,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PAID',
    "pdfUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlatformInvoice_pkey" PRIMARY KEY ("id")
);

-- 8. Create PlatformInvoiceItem table
CREATE TABLE IF NOT EXISTS "PlatformInvoiceItem" (
    "id" TEXT NOT NULL,
    "platformInvoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlatformInvoiceItem_pkey" PRIMARY KEY ("id")
);

-- 9. Create PlatformPayment table
CREATE TABLE IF NOT EXISTS "PlatformPayment" (
    "id" TEXT NOT NULL,
    "platformInvoiceId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "gatewayTransactionId" TEXT,
    "gatewayProvider" TEXT NOT NULL DEFAULT 'MANUAL',
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "paymentMethod" TEXT NOT NULL DEFAULT 'CARD',
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "rawGatewayResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlatformPayment_pkey" PRIMARY KEY ("id")
);

-- 10. Create PlatformRefund table
CREATE TABLE IF NOT EXISTS "PlatformRefund" (
    "id" TEXT NOT NULL,
    "platformInvoiceId" TEXT NOT NULL,
    "platformPaymentId" TEXT,
    "tenantId" TEXT NOT NULL,
    "refundNumber" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "processedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlatformRefund_pkey" PRIMARY KEY ("id")
);

-- 11. Create PlatformBillingConfig table
CREATE TABLE IF NOT EXISTS "PlatformBillingConfig" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "companyLegalName" TEXT NOT NULL DEFAULT 'ClixPro Technologies Pvt. Ltd.',
    "billingAddress" TEXT DEFAULT 'Level 4, Cyber City, Phase II',
    "city" TEXT DEFAULT 'Bengaluru',
    "state" TEXT DEFAULT 'Karnataka',
    "postalCode" TEXT DEFAULT '560100',
    "country" TEXT DEFAULT 'India',
    "gstin" TEXT DEFAULT '29AAAAA0000A1Z5',
    "pan" TEXT DEFAULT 'AAAAA0000A',
    "invoicePrefix" TEXT NOT NULL DEFAULT 'CP-INV',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "taxRate" DECIMAL(6,2) NOT NULL DEFAULT 18.0,
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 15,
    "bankName" TEXT DEFAULT 'HDFC Bank',
    "accountNumber" TEXT DEFAULT '50200012345678',
    "ifscCode" TEXT DEFAULT 'HDFC0001234',
    "accountHolder" TEXT DEFAULT 'ClixPro Technologies Private Limited',
    "upiId" TEXT DEFAULT 'clixpro@hdfcbank',
    "paymentGateway" TEXT NOT NULL DEFAULT 'RAZORPAY',
    "webhookSecret" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    CONSTRAINT "PlatformBillingConfig_pkey" PRIMARY KEY ("id")
);

-- Constraints and Indexes
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TenantInvoiceSettings_tenantId_key') THEN
        ALTER TABLE "TenantInvoiceSettings" ADD CONSTRAINT "TenantInvoiceSettings_tenantId_key" UNIQUE ("tenantId");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Payment_tenantId_paymentNumber_key') THEN
        ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_paymentNumber_key" UNIQUE ("tenantId", "paymentNumber");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlatformInvoice_invoiceNumber_key') THEN
        ALTER TABLE "PlatformInvoice" ADD CONSTRAINT "PlatformInvoice_invoiceNumber_key" UNIQUE ("invoiceNumber");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlatformPayment_paymentNumber_key') THEN
        ALTER TABLE "PlatformPayment" ADD CONSTRAINT "PlatformPayment_paymentNumber_key" UNIQUE ("paymentNumber");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlatformRefund_refundNumber_key') THEN
        ALTER TABLE "PlatformRefund" ADD CONSTRAINT "PlatformRefund_refundNumber_key" UNIQUE ("refundNumber");
    END IF;
END $$;

-- Foreign Keys
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InvoiceItem_invoiceId_fkey') THEN
        ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Payment_tenantId_fkey') THEN
        ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Payment_invoiceId_fkey') THEN
        ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TenantInvoiceSettings_tenantId_fkey') THEN
        ALTER TABLE "TenantInvoiceSettings" ADD CONSTRAINT "TenantInvoiceSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlatformSubscription_tenantId_fkey') THEN
        ALTER TABLE "PlatformSubscription" ADD CONSTRAINT "PlatformSubscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlatformInvoice_tenantId_fkey') THEN
        ALTER TABLE "PlatformInvoice" ADD CONSTRAINT "PlatformInvoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlatformInvoice_subscriptionId_fkey') THEN
        ALTER TABLE "PlatformInvoice" ADD CONSTRAINT "PlatformInvoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "PlatformSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlatformInvoiceItem_platformInvoiceId_fkey') THEN
        ALTER TABLE "PlatformInvoiceItem" ADD CONSTRAINT "PlatformInvoiceItem_platformInvoiceId_fkey" FOREIGN KEY ("platformInvoiceId") REFERENCES "PlatformInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlatformPayment_tenantId_fkey') THEN
        ALTER TABLE "PlatformPayment" ADD CONSTRAINT "PlatformPayment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlatformPayment_platformInvoiceId_fkey') THEN
        ALTER TABLE "PlatformPayment" ADD CONSTRAINT "PlatformPayment_platformInvoiceId_fkey" FOREIGN KEY ("platformInvoiceId") REFERENCES "PlatformInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlatformRefund_tenantId_fkey') THEN
        ALTER TABLE "PlatformRefund" ADD CONSTRAINT "PlatformRefund_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlatformRefund_platformInvoiceId_fkey') THEN
        ALTER TABLE "PlatformRefund" ADD CONSTRAINT "PlatformRefund_platformInvoiceId_fkey" FOREIGN KEY ("platformInvoiceId") REFERENCES "PlatformInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");
CREATE INDEX IF NOT EXISTS "Payment_tenantId_idx" ON "Payment"("tenantId");
CREATE INDEX IF NOT EXISTS "Payment_invoiceId_idx" ON "Payment"("invoiceId");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");
CREATE INDEX IF NOT EXISTS "PlatformSubscription_tenantId_idx" ON "PlatformSubscription"("tenantId");
CREATE INDEX IF NOT EXISTS "PlatformSubscription_status_idx" ON "PlatformSubscription"("status");
CREATE INDEX IF NOT EXISTS "PlatformInvoice_tenantId_idx" ON "PlatformInvoice"("tenantId");
CREATE INDEX IF NOT EXISTS "PlatformInvoice_status_idx" ON "PlatformInvoice"("status");
CREATE INDEX IF NOT EXISTS "PlatformPayment_tenantId_idx" ON "PlatformPayment"("tenantId");
CREATE INDEX IF NOT EXISTS "TimelineEvent_invoiceId_idx" ON "TimelineEvent"("invoiceId");
