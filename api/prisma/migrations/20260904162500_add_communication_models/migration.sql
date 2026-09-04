-- CreateEnum
CREATE TYPE "EmailProviderType" AS ENUM ('CUSTOM_SMTP_IMAP', 'GMAIL', 'OUTLOOK', 'POSTMARK', 'SENDGRID');

-- CreateEnum
CREATE TYPE "EmailAuthType" AS ENUM ('PASSWORD', 'OAUTH2');

-- CreateEnum
CREATE TYPE "EmailSyncStatus" AS ENUM ('IDLE', 'SYNCING', 'SUCCESS', 'ERROR', 'AUTH_FAILED', 'DISABLED');

-- CreateEnum
CREATE TYPE "EmailDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "EmailMessageStatus" AS ENUM ('DRAFT', 'QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'FAILED', 'RECEIVED', 'BOUNCED');

-- AlterTable
ALTER TABLE "TimelineEvent" ADD COLUMN     "emailMessageId" TEXT;

-- CreateTable
CREATE TABLE "EmailAccount" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "displayName" TEXT,
    "provider" "EmailProviderType" NOT NULL DEFAULT 'CUSTOM_SMTP_IMAP',
    "authType" "EmailAuthType" NOT NULL DEFAULT 'PASSWORD',
    "encryptedSmtpPass" TEXT,
    "encryptedImapPass" TEXT,
    "encryptedOauthRefresh" TEXT,
    "encryptedOauthAccess" TEXT,
    "oauthExpiresAt" TIMESTAMP(3),
    "smtpHost" TEXT,
    "smtpPort" INTEGER DEFAULT 587,
    "smtpSecure" BOOLEAN NOT NULL DEFAULT false,
    "smtpUser" TEXT,
    "imapHost" TEXT,
    "imapPort" INTEGER DEFAULT 993,
    "imapSecure" BOOLEAN NOT NULL DEFAULT true,
    "imapUser" TEXT,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "syncStatus" "EmailSyncStatus" NOT NULL DEFAULT 'IDLE',
    "lastSyncedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "syncCursor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "EmailAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailThread" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "normalizedSubject" TEXT NOT NULL,
    "snippet" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 1,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "hasAttachments" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isSpam" BOOLEAN NOT NULL DEFAULT false,
    "isTrash" BOOLEAN NOT NULL DEFAULT false,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "externalThreadId" TEXT,
    "leadId" TEXT,
    "customerId" TEXT,
    "companyId" TEXT,
    "dealId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "EmailThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailMessage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "direction" "EmailDirection" NOT NULL,
    "status" "EmailMessageStatus" NOT NULL DEFAULT 'DRAFT',
    "internetMessageId" TEXT,
    "inReplyTo" TEXT,
    "references" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fromAddress" TEXT NOT NULL,
    "fromName" TEXT,
    "toRecipients" TEXT[],
    "ccRecipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bccRecipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "replyTo" TEXT,
    "subject" TEXT NOT NULL,
    "bodyPlain" TEXT,
    "bodyHtml" TEXT,
    "headers" JSONB,
    "hasAttachments" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "failedReason" TEXT,
    "sendAttemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "EmailMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailAttachment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT,
    "storageKey" TEXT NOT NULL,
    "isInline" BOOLEAN NOT NULL DEFAULT false,
    "isQuarantined" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailAccount_tenantId_idx" ON "EmailAccount"("tenantId");

-- CreateIndex
CREATE INDEX "EmailAccount_tenantId_userId_idx" ON "EmailAccount"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "EmailAccount_tenantId_isActive_syncStatus_idx" ON "EmailAccount"("tenantId", "isActive", "syncStatus");

-- CreateIndex
CREATE UNIQUE INDEX "EmailAccount_tenantId_emailHash_key" ON "EmailAccount"("tenantId", "emailHash");

-- CreateIndex
CREATE INDEX "EmailThread_tenantId_idx" ON "EmailThread"("tenantId");

-- CreateIndex
CREATE INDEX "EmailThread_tenantId_accountId_lastMessageAt_idx" ON "EmailThread"("tenantId", "accountId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "EmailThread_tenantId_leadId_idx" ON "EmailThread"("tenantId", "leadId");

-- CreateIndex
CREATE INDEX "EmailThread_tenantId_customerId_idx" ON "EmailThread"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "EmailThread_tenantId_companyId_idx" ON "EmailThread"("tenantId", "companyId");

-- CreateIndex
CREATE INDEX "EmailThread_tenantId_dealId_idx" ON "EmailThread"("tenantId", "dealId");

-- CreateIndex
CREATE INDEX "EmailThread_tenantId_externalThreadId_idx" ON "EmailThread"("tenantId", "externalThreadId");

-- CreateIndex
CREATE INDEX "EmailMessage_tenantId_idx" ON "EmailMessage"("tenantId");

-- CreateIndex
CREATE INDEX "EmailMessage_tenantId_threadId_idx" ON "EmailMessage"("tenantId", "threadId");

-- CreateIndex
CREATE INDEX "EmailMessage_tenantId_accountId_idx" ON "EmailMessage"("tenantId", "accountId");

-- CreateIndex
CREATE INDEX "EmailMessage_tenantId_internetMessageId_idx" ON "EmailMessage"("tenantId", "internetMessageId");

-- CreateIndex
CREATE INDEX "EmailMessage_tenantId_direction_status_idx" ON "EmailMessage"("tenantId", "direction", "status");

-- CreateIndex
CREATE INDEX "EmailMessage_tenantId_createdAt_idx" ON "EmailMessage"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailAttachment_tenantId_idx" ON "EmailAttachment"("tenantId");

-- CreateIndex
CREATE INDEX "EmailAttachment_tenantId_messageId_idx" ON "EmailAttachment"("tenantId", "messageId");

-- CreateIndex
CREATE INDEX "TimelineEvent_tenantId_emailMessageId_idx" ON "TimelineEvent"("tenantId", "emailMessageId");

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_emailMessageId_fkey" FOREIGN KEY ("emailMessageId") REFERENCES "EmailMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAccount" ADD CONSTRAINT "EmailAccount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAccount" ADD CONSTRAINT "EmailAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailThread" ADD CONSTRAINT "EmailThread_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailThread" ADD CONSTRAINT "EmailThread_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "EmailAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailThread" ADD CONSTRAINT "EmailThread_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailThread" ADD CONSTRAINT "EmailThread_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailThread" ADD CONSTRAINT "EmailThread_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailThread" ADD CONSTRAINT "EmailThread_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "EmailThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "EmailAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAttachment" ADD CONSTRAINT "EmailAttachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAttachment" ADD CONSTRAINT "EmailAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "EmailMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
