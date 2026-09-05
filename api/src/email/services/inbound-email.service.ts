import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { ConnectionVerifierService } from './connection-verifier.service';
import { MimeParserService, ParsedInboundEmail } from './mime-parser.service';
import { EmailHtmlSanitizerService } from './email-html-sanitizer.service';
import { EmailAttachmentStorageService } from './email-attachment-storage.service';
import { ImapClientFactory, IImapClient } from './imap-client.factory';
import { SyncInboxJobPayload } from '../../queue/interfaces/email-jobs';
import { EmailSyncStatus, EmailDirection, EmailMessageStatus, Prisma } from '@prisma/client';

export interface InboundSyncResult {
  success: boolean;
  messagesProcessed: number;
  messagesSkipped: number;
  cursorAdvancedTo?: number;
  lastError?: string | null;
  skipped?: boolean;
  reason?: string;
}

@Injectable()
export class InboundEmailService {
  private readonly logger = new Logger(InboundEmailService.name);
  private readonly activeSyncAccounts = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly enc: EncryptionService,
    private readonly verifier: ConnectionVerifierService,
    private readonly mimeParser: MimeParserService,
    private readonly htmlSanitizer: EmailHtmlSanitizerService,
    private readonly attachmentStorage: EmailAttachmentStorageService,
    private readonly imapFactory: ImapClientFactory,
  ) {}

  /**
   * Main entrypoint for processing BullMQ sync-inbox background job.
   * Enforces strict tenant isolation, memory-only credential decryption,
   * SSRF protection, idempotent deduplication, RFC threading, and incremental cursor management.
   */
  async processSyncInboxJob(payload: SyncInboxJobPayload): Promise<InboundSyncResult> {
    const { tenantId, accountId, folder = 'INBOX', limit = 50 } = payload;

    if (!tenantId || !accountId) {
      throw new BadRequestException('tenantId and accountId are required for sync-inbox');
    }

    // Mutex: Prevent overlapping sync worker executions for the same account
    const lockKey = `${tenantId}:${accountId}`;
    if (this.activeSyncAccounts.has(lockKey)) {
      this.logger.warn(`Sync already active in worker memory for account ${accountId}; skipping overlapping execution.`);
      return { success: true, messagesProcessed: 0, messagesSkipped: 0, skipped: true, reason: 'Sync already running for account' };
    }

    this.activeSyncAccounts.add(lockKey);

    let imapClient: IImapClient | null = null;
    let messagesProcessed = 0;
    let messagesSkipped = 0;
    let lastProcessedUid = 0;

    try {
      // 1. Authoritative account lookup within tenant scope
      const account = await this.prisma.withTenantContext(
        { tenantId, userId: payload.userId },
        async (tx) =>
          tx.emailAccount.findFirst({
            where: { id: accountId, tenantId, deletedAt: null },
          }),
      );

      if (!account) {
        this.logger.warn(`Email account ${accountId} not found in tenant ${tenantId}. Aborting sync.`);
        return { success: false, messagesProcessed: 0, messagesSkipped: 0, skipped: true, reason: 'Account not found' };
      }

      if (!account.isActive) {
        this.logger.log(`Email account ${accountId} is inactive. Skipping sync.`);
        return { success: true, messagesProcessed: 0, messagesSkipped: 0, skipped: true, reason: 'Account is inactive' };
      }

      if (!account.imapHost) {
        this.logger.warn(`Email account ${accountId} has no IMAP host configured.`);
        return { success: false, messagesProcessed: 0, messagesSkipped: 0, skipped: true, reason: 'No IMAP host' };
      }

      // 2. SSRF Protection: Ensure target host does not resolve to private/loopback/cloud metadata
      await this.verifier.assertSafeHost(account.imapHost);

      // 3. Mark account state as SYNCING
      await this.updateAccountState(tenantId, account.id, {
        syncStatus: EmailSyncStatus.SYNCING,
      });

      // 4. Decrypt IMAP credentials strictly in worker memory (zero logging, zero Redis)
      let decryptedPass: string | undefined;
      if (account.encryptedImapPass) {
        decryptedPass = this.enc.decrypt(account.encryptedImapPass) || undefined;
      }
      let decryptedOAuth: string | undefined;
      if (account.encryptedOauthAccess) {
        decryptedOAuth = this.enc.decrypt(account.encryptedOauthAccess) || undefined;
      }

      const imapPort = account.imapPort || 993;
      const imapSecure = account.imapSecure !== undefined ? account.imapSecure : imapPort === 993;
      const imapUser = account.imapUser || account.email;

      // 5. Connect to IMAP server
      imapClient = this.imapFactory.createClient({
        host: account.imapHost,
        port: imapPort,
        secure: imapSecure,
        auth: {
          user: imapUser,
          pass: decryptedPass,
          accessToken: decryptedOAuth,
        },
      });

      try {
        await imapClient.connect();
      } catch (connErr: any) {
        const errorMsg = this.sanitizeErrorMessage(connErr?.message || 'IMAP connection failed');
        const isAuthError = /auth|credential|login|denied|password/i.test(connErr?.message || '');
        const newStatus = isAuthError ? EmailSyncStatus.AUTH_FAILED : EmailSyncStatus.ERROR;

        await this.updateAccountState(tenantId, account.id, {
          syncStatus: newStatus,
          lastError: errorMsg,
        });

        throw new Error(`IMAP connection failure (${newStatus}): ${errorMsg}`);
      }

      // 6. Resolve current sync cursor
      const lastSyncedUid = this.parseCursor(account.syncCursor, folder);
      const fromUid = lastSyncedUid > 0 ? lastSyncedUid + 1 : 1;
      lastProcessedUid = lastSyncedUid;

      // 7. Fetch messages starting from cursor
      const fetchedMessages = await imapClient.fetchMessages(folder, fromUid, limit);
      this.logger.log(
        `[INBOUND EMAIL] Account ${accountId}: Fetched ${fetchedMessages.length} messages (fromUid: ${fromUid}, folder: ${folder})`,
      );

      // 8. Process messages sequentially in ascending UID order
      for (const msg of fetchedMessages) {
        try {
          // Parse RFC 5322 MIME
          const parsed = await this.mimeParser.parseMime(msg.source);

          // Establish authoritative Message-ID or deterministic fallback
          const internetMessageId =
            parsed.internetMessageId ||
            this.generateSyntheticMessageId(account.id, folder, msg.uid, parsed.subject, parsed.date);

          // Atomically persist message, thread, attachments, and timeline event
          const persistResult = await this.persistInboundMessageAtomic(
            tenantId,
            account,
            folder,
            msg.uid,
            parsed,
            internetMessageId,
            msg.externalThreadId,
          );

          if (persistResult.deduplicated) {
            messagesSkipped++;
          } else {
            messagesProcessed++;
          }

          // Advance cursor immediately after successful processing of this message
          lastProcessedUid = msg.uid;
          await this.advanceSyncCursor(tenantId, account.id, folder, msg.uid);
        } catch (msgErr: any) {
          // Failure on message msg.uid:
          // CRITICAL: Cursor is NOT advanced past this message!
          const sanitizedErr = this.sanitizeErrorMessage(msgErr?.message || 'Message processing failed');
          this.logger.error(`Failed to process message UID ${msg.uid} for account ${account.id}: ${sanitizedErr}`);

          await this.updateAccountState(tenantId, account.id, {
            syncStatus: EmailSyncStatus.ERROR,
            lastError: sanitizedErr,
          });

          // Re-throw to halt batch and trigger bounded BullMQ retry
          throw msgErr;
        }
      }

      // 9. Mark account state as SUCCESS
      await this.updateAccountState(tenantId, account.id, {
        syncStatus: EmailSyncStatus.SUCCESS,
        lastSyncedAt: new Date(),
        lastError: null,
      });

      return {
        success: true,
        messagesProcessed,
        messagesSkipped,
        cursorAdvancedTo: lastProcessedUid,
        lastError: null,
      };
    } finally {
      this.activeSyncAccounts.delete(lockKey);
      if (imapClient) {
        try {
          await imapClient.logout();
        } catch {}
        try {
          await imapClient.close();
        } catch {}
      }
    }
  }

  /**
   * Atomically handles deduplication, threading, HTML sanitization, attachment persistence,
   * message creation, and exactly-once TimelineEvent creation under tenant context.
   */
  private async persistInboundMessageAtomic(
    tenantId: string,
    account: { id: string; userId: string | null },
    folder: string,
    uid: number,
    parsed: ParsedInboundEmail,
    internetMessageId: string,
    externalThreadId?: string | null,
  ): Promise<{ deduplicated: boolean; messageId: string }> {
    return this.prisma.withTenantContext(
      { tenantId, userId: account.userId || undefined },
      async (tx) => {
        // 1. Deduplication check: RFC Message-ID
        const existing = await tx.emailMessage.findFirst({
          where: {
            tenantId,
            accountId: account.id,
            internetMessageId,
          },
        });

        if (existing) {
          // Idempotent: Already processed. Do NOT create duplicate message, thread, attachments, or timeline event.
          return { deduplicated: true, messageId: existing.id };
        }

        // 2. Thread Matching Priority:
        //    1) In-Reply-To
        //    2) References
        //    3) Provider External Thread ID
        //    4) Normalized Subject Fallback
        let matchedThreadId: string | null = null;

        // 2a. In-Reply-To
        if (parsed.inReplyTo) {
          const repliedMsg = await tx.emailMessage.findFirst({
            where: {
              tenantId,
              accountId: account.id,
              internetMessageId: parsed.inReplyTo,
            },
            select: { threadId: true },
          });
          if (repliedMsg) {
            matchedThreadId = repliedMsg.threadId;
          }
        }

        // 2b. References chain
        if (!matchedThreadId && parsed.references.length > 0) {
          const refMsg = await tx.emailMessage.findFirst({
            where: {
              tenantId,
              accountId: account.id,
              internetMessageId: { in: parsed.references },
            },
            orderBy: { createdAt: 'desc' },
            select: { threadId: true },
          });
          if (refMsg) {
            matchedThreadId = refMsg.threadId;
          }
        }

        // 2c. Provider thread identifier (e.g. Gmail threadId)
        if (!matchedThreadId && externalThreadId) {
          const extThread = await tx.emailThread.findFirst({
            where: {
              tenantId,
              accountId: account.id,
              externalThreadId,
            },
            select: { id: true },
          });
          if (extThread) {
            matchedThreadId = extThread.id;
          }
        }

        // 2d. Normalized Subject fallback
        const normalizedSubj = this.normalizeSubject(parsed.subject);
        if (!matchedThreadId && normalizedSubj.length > 0) {
          const subjThread = await tx.emailThread.findFirst({
            where: {
              tenantId,
              accountId: account.id,
              normalizedSubject: normalizedSubj,
            },
            orderBy: { lastMessageAt: 'desc' },
            select: { id: true },
          });
          if (subjThread) {
            matchedThreadId = subjThread.id;
          }
        }

        const snippet = this.htmlSanitizer.generateSnippet(parsed.bodyPlain, parsed.bodyHtml);
        const hasAttachments = parsed.attachments.length > 0;
        const msgDate = parsed.date || new Date();

        let threadId: string;

        if (matchedThreadId) {
          // Update existing thread counters & metadata
          threadId = matchedThreadId;
          await tx.emailThread.update({
            where: { id: matchedThreadId },
            data: {
              messageCount: { increment: 1 },
              unreadCount: { increment: 1 },
              hasAttachments: hasAttachments ? true : undefined,
              lastMessageAt: msgDate,
              snippet,
              ...(externalThreadId ? { externalThreadId } : {}),
            },
          });
        } else {
          // Create new thread
          const createdThread = await tx.emailThread.create({
            data: {
              tenantId,
              accountId: account.id,
              subject: parsed.subject || '(No Subject)',
              normalizedSubject: normalizedSubj,
              snippet,
              messageCount: 1,
              unreadCount: 1,
              hasAttachments,
              lastMessageAt: msgDate,
              externalThreadId: externalThreadId || null,
            },
          });
          threadId = createdThread.id;
        }

        // 3. Sanitize HTML
        const sanitizedHtml = this.htmlSanitizer.sanitize(parsed.bodyHtml);

        // 4. Create EmailMessage record (direction = INBOUND, status = RECEIVED)
        const createdMessage = await tx.emailMessage.create({
          data: {
            tenantId,
            threadId,
            accountId: account.id,
            direction: EmailDirection.INBOUND,
            status: EmailMessageStatus.RECEIVED,
            internetMessageId,
            inReplyTo: parsed.inReplyTo,
            references: parsed.references,
            fromAddress: parsed.fromAddress,
            fromName: parsed.fromName,
            toRecipients: parsed.toRecipients,
            ccRecipients: parsed.ccRecipients,
            bccRecipients: parsed.bccRecipients,
            replyTo: parsed.replyTo,
            subject: parsed.subject || '(No Subject)',
            bodyPlain: parsed.bodyPlain,
            bodyHtml: sanitizedHtml,
            headers: parsed.headers,
            hasAttachments,
            receivedAt: msgDate,
            sentAt: msgDate,
          },
        });

        // 5. Store Attachments in Private Storage & Database
        if (hasAttachments) {
          const storedAttachments = await this.attachmentStorage.processAndStoreAttachments(
            tenantId,
            createdMessage.id,
            parsed.attachments,
          );

          for (const att of storedAttachments) {
            await tx.emailAttachment.create({
              data: {
                id: att.id,
                tenantId,
                messageId: createdMessage.id,
                fileName: att.fileName,
                fileSize: att.fileSize,
                contentType: att.contentType,
                contentId: att.contentId,
                storageKey: att.storageKey,
                isInline: att.isInline,
                isQuarantined: att.isQuarantined,
              },
            });
          }
        }

        // 6. Create exactly one EMAIL_RECEIVED TimelineEvent
        await tx.timelineEvent.create({
          data: {
            tenantId,
            emailMessageId: createdMessage.id,
            action: 'EMAIL_RECEIVED',
            description: `Inbound email from ${parsed.fromAddress}: ${parsed.subject || '(No Subject)'}`,
            metadata: {
              subject: parsed.subject,
              from: parsed.fromAddress,
              to: parsed.toRecipients,
              threadId,
              internetMessageId,
            },
          },
        });

        return { deduplicated: false, messageId: createdMessage.id };
      },
    );
  }

  /**
   * Normalizes subject by removing leading Re:/Fwd: prefixes, whitespace, and bracket tags.
   */
  normalizeSubject(rawSubject: string | null | undefined): string {
    if (!rawSubject || typeof rawSubject !== 'string') {
      return '';
    }

    let subj = rawSubject.trim();
    // Repeatedly strip Re:, Fwd:, Fw:, Aw:, Sv:, Vs:
    const prefixPattern = /^(?:re|fwd|fw|aw|sv|vs):\s*/i;
    while (prefixPattern.test(subj)) {
      subj = subj.replace(prefixPattern, '').trim();
    }

    return subj.toLowerCase();
  }

  /**
   * Deterministic fallback Message-ID for emails lacking an RFC 5322 Message-ID.
   */
  private generateSyntheticMessageId(
    accountId: string,
    folder: string,
    uid: number,
    subject: string,
    date?: Date,
  ): string {
    const raw = `${accountId}:${folder}:${uid}:${subject}:${date?.toISOString() || ''}`;
    const hash = this.enc.hash(raw) || `${uid}-${Date.now()}`;
    return `<synthetic-${hash}@clixprocrm.internal>`;
  }

  /**
   * Parses current cursor string (JSON or legacy UID).
   */
  private parseCursor(cursor: string | null | undefined, targetFolder: string): number {
    if (!cursor) return 0;

    try {
      const parsed = JSON.parse(cursor);
      if (parsed && typeof parsed.lastUid === 'number') {
        if (!parsed.folder || parsed.folder.toLowerCase() === targetFolder.toLowerCase()) {
          return parsed.lastUid;
        }
      }
    } catch {
      const num = parseInt(cursor, 10);
      if (!isNaN(num) && num > 0) return num;
    }

    return 0;
  }

  /**
   * Advances sync cursor in DB only after successful message processing.
   */
  private async advanceSyncCursor(
    tenantId: string,
    accountId: string,
    folder: string,
    uid: number,
  ): Promise<void> {
    const cursorJson = JSON.stringify({
      folder,
      lastUid: uid,
      syncedAt: new Date().toISOString(),
    });

    await this.prisma.withTenantContext({ tenantId }, async (tx) => {
      await tx.emailAccount.update({
        where: { id: accountId },
        data: {
          syncCursor: cursorJson,
        },
      });
    });
  }

  /**
   * Updates sync status, lastSyncedAt, and sanitized lastError on EmailAccount.
   */
  private async updateAccountState(
    tenantId: string,
    accountId: string,
    data: {
      syncStatus?: EmailSyncStatus;
      lastSyncedAt?: Date;
      lastError?: string | null;
    },
  ): Promise<void> {
    try {
      await this.prisma.withTenantContext({ tenantId }, async (tx) => {
        await tx.emailAccount.update({
          where: { id: accountId },
          data,
        });
      });
    } catch (err: any) {
      this.logger.warn(`Failed to update account sync state for ${accountId}: ${err?.message || err}`);
    }
  }

  /**
   * Sanitizes error message strings to ensure zero passwords, bearer tokens, or secrets leak.
   */
  sanitizeErrorMessage(msg: string): string {
    if (!msg) return 'Unknown error';
    return msg
      .replace(/password[:=]\s*[^\s,;]+/gi, 'password=***')
      .replace(/pass[:=]\s*[^\s,;]+/gi, 'pass=***')
      .replace(/bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer ***')
      .replace(/token[:=]\s*[^\s,;]+/gi, 'token=***')
      .replace(/secret[:=]\s*[^\s,;]+/gi, 'secret=***');
  }
}
