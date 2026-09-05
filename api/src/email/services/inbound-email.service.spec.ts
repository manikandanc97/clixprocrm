import { Test, TestingModule } from '@nestjs/testing';
import { InboundEmailService } from './inbound-email.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { ConnectionVerifierService } from './connection-verifier.service';
import { MimeParserService } from './mime-parser.service';
import { EmailHtmlSanitizerService } from './email-html-sanitizer.service';
import { EmailAttachmentStorageService } from './email-attachment-storage.service';
import { ImapClientFactory, IImapClient, FetchedImapMessage } from './imap-client.factory';
import { ConfigService } from '@nestjs/config';
import { EmailSyncStatus, EmailDirection, EmailMessageStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('InboundEmailService Suite', () => {
  let service: InboundEmailService;
  let encService: EncryptionService;
  let verifierService: ConnectionVerifierService;

  // In-memory mock database collections
  let dbAccounts: any[] = [];
  let dbThreads: any[] = [];
  let dbMessages: any[] = [];
  let dbAttachments: any[] = [];
  let dbTimelineEvents: any[] = [];

  const TEST_KEY = 'a1b2c3d4e5f67890123456789abcdef0a1b2c3d4e5f67890123456789abcdef0';
  const TENANT_1 = 'tenant-uuid-1111';
  const TENANT_2 = 'tenant-uuid-2222';
  const ACCOUNT_ID = 'acc-uuid-1234';

  // Mock IMAP Client
  let mockFetchedMessages: FetchedImapMessage[] = [];
  let mockImapClient: jest.Mocked<IImapClient>;

  const mockPrismaService = {
    withTenantContext: jest.fn(async (ctx, fn) => {
      const tx = {
        emailAccount: {
          findFirst: jest.fn(async ({ where }: any) => {
            return dbAccounts.find((item) => {
              for (const [key, val] of Object.entries(where)) {
                if (key === 'deletedAt' && val === null && item.deletedAt !== null) return false;
                if (item[key] !== val) return false;
              }
              return true;
            }) || null;
          }),
          update: jest.fn(async ({ where, data }: any) => {
            const acc = dbAccounts.find((a) => a.id === where.id);
            if (acc) {
              Object.assign(acc, data);
              return acc;
            }
            throw new Error(`Account not found: ${where.id}`);
          }),
        },
        emailThread: {
          findFirst: jest.fn(async ({ where, orderBy }: any) => {
            let matches = dbThreads.filter((item) => {
              for (const [key, val] of Object.entries(where)) {
                if (key === 'deletedAt' && val === null && item.deletedAt !== null) return false;
                if (item[key] !== val) return false;
              }
              return true;
            });
            if (orderBy?.lastMessageAt === 'desc') {
              matches.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
            }
            return matches[0] || null;
          }),
          create: jest.fn(async ({ data }: any) => {
            const newThread = {
              id: `thread-${dbThreads.length + 1}`,
              ...data,
              createdAt: new Date(),
              updatedAt: new Date(),
              deletedAt: null,
            };
            dbThreads.push(newThread);
            return newThread;
          }),
          update: jest.fn(async ({ where, data }: any) => {
            const thread = dbThreads.find((t) => t.id === where.id);
            if (thread) {
              if (data.messageCount?.increment) {
                thread.messageCount += data.messageCount.increment;
              }
              if (data.unreadCount?.increment) {
                thread.unreadCount += data.unreadCount.increment;
              }
              if (data.hasAttachments !== undefined) {
                thread.hasAttachments = thread.hasAttachments || data.hasAttachments;
              }
              if (data.lastMessageAt) thread.lastMessageAt = data.lastMessageAt;
              if (data.snippet) thread.snippet = data.snippet;
              if (data.externalThreadId) thread.externalThreadId = data.externalThreadId;
              return thread;
            }
            throw new Error(`Thread not found: ${where.id}`);
          }),
        },
        emailMessage: {
          findFirst: jest.fn(async ({ where, orderBy }: any) => {
            let matches = dbMessages.filter((item) => {
              for (const [key, val] of Object.entries(where)) {
                if (key === 'internetMessageId' && typeof val === 'object' && val.in) {
                  if (!val.in.includes(item.internetMessageId)) return false;
                  continue;
                }
                if (item[key] !== val) return false;
              }
              return true;
            });
            if (orderBy?.createdAt === 'desc') {
              matches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            }
            return matches[0] || null;
          }),
          create: jest.fn(async ({ data }: any) => {
            const newMsg = {
              id: `msg-${dbMessages.length + 1}`,
              ...data,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            dbMessages.push(newMsg);
            return newMsg;
          }),
        },
        emailAttachment: {
          create: jest.fn(async ({ data }: any) => {
            dbAttachments.push(data);
            return data;
          }),
        },
        timelineEvent: {
          create: jest.fn(async ({ data }: any) => {
            const event = {
              id: `event-${dbTimelineEvents.length + 1}`,
              ...data,
              createdAt: new Date(),
            };
            dbTimelineEvents.push(event);
            return event;
          }),
        },
      };
      return fn(tx);
    }),
  };

  beforeEach(async () => {
    dbAccounts = [];
    dbThreads = [];
    dbMessages = [];
    dbAttachments = [];
    dbTimelineEvents = [];
    mockFetchedMessages = [];

    mockImapClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      logout: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      fetchMessages: jest.fn().mockImplementation(async () => mockFetchedMessages),
    };

    const mockImapFactory = {
      createClient: jest.fn().mockReturnValue(mockImapClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InboundEmailService,
        MimeParserService,
        EmailHtmlSanitizerService,
        EmailAttachmentStorageService,
        ConnectionVerifierService,
        EncryptionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ImapClientFactory,
          useValue: mockImapFactory,
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'FIELD_ENCRYPTION_KEY') return TEST_KEY;
              return null;
            },
          },
        },
      ],
    }).compile();

    service = module.get<InboundEmailService>(InboundEmailService);
    encService = module.get<EncryptionService>(EncryptionService);
    verifierService = module.get<ConnectionVerifierService>(ConnectionVerifierService);
    encService.onModuleInit();

    // Seed default verified test account
    dbAccounts.push({
      id: ACCOUNT_ID,
      tenantId: TENANT_1,
      userId: 'user-123',
      email: 'inbound@clixprocrm.com',
      emailHash: encService.hash('inbound@clixprocrm.com'),
      imapHost: 'imap.example.com',
      imapPort: 993,
      imapSecure: true,
      imapUser: 'inbound@clixprocrm.com',
      encryptedImapPass: encService.encrypt('super-secret-imap-pass'),
      isActive: true,
      syncStatus: EmailSyncStatus.IDLE,
      syncCursor: null,
      lastSyncedAt: null,
      lastError: null,
      deletedAt: null,
    });
  });

  it('1. should perform end-to-end IMAP sync: persist message, thread, timeline event, and advance cursor', async () => {
    jest.spyOn(verifierService, 'assertSafeHost').mockResolvedValue(undefined);

    const rawMime = [
      'From: "Client Alpha" <alpha@client.com>',
      'To: inbound@clixprocrm.com',
      'Subject: Order Inquiry',
      'Message-ID: <order-101@client.com>',
      'Date: Sat, 05 Sep 2026 10:30:00 +0000',
      'Content-Type: text/html; charset=utf-8',
      '',
      '<p>Hello, please send us a quotation for 50 licenses.</p>',
    ].join('\r\n');

    mockFetchedMessages = [
      {
        uid: 101,
        seq: 1,
        source: Buffer.from(rawMime),
        internalDate: new Date('2026-09-05T10:30:00Z'),
      },
    ];

    const result = await service.processSyncInboxJob({
      tenantId: TENANT_1,
      accountId: ACCOUNT_ID,
      folder: 'INBOX',
    });

    expect(result.success).toBe(true);
    expect(result.messagesProcessed).toBe(1);
    expect(result.messagesSkipped).toBe(0);

    // 1. Thread created
    expect(dbThreads).toHaveLength(1);
    expect(dbThreads[0].subject).toBe('Order Inquiry');
    expect(dbThreads[0].normalizedSubject).toBe('order inquiry');
    expect(dbThreads[0].messageCount).toBe(1);
    expect(dbThreads[0].unreadCount).toBe(1);

    // 2. EmailMessage created
    expect(dbMessages).toHaveLength(1);
    const msg = dbMessages[0];
    expect(msg.direction).toBe(EmailDirection.INBOUND);
    expect(msg.status).toBe(EmailMessageStatus.RECEIVED);
    expect(msg.internetMessageId).toBe('<order-101@client.com>');
    expect(msg.fromAddress).toBe('alpha@client.com');
    expect(msg.toRecipients).toEqual(['inbound@clixprocrm.com']);
    expect(msg.bodyHtml).toContain('Hello, please send us a quotation');

    // 3. Exactly one EMAIL_RECEIVED TimelineEvent created
    expect(dbTimelineEvents).toHaveLength(1);
    expect(dbTimelineEvents[0].action).toBe('EMAIL_RECEIVED');
    expect(dbTimelineEvents[0].emailMessageId).toBe(msg.id);
    expect(dbTimelineEvents[0].tenantId).toBe(TENANT_1);

    // 4. Cursor advanced to UID 101
    const account = dbAccounts.find((a) => a.id === ACCOUNT_ID);
    expect(account.syncStatus).toBe(EmailSyncStatus.SUCCESS);
    expect(account.syncCursor).toContain('"lastUid":101');
    expect(account.lastSyncedAt).toBeDefined();
    expect(account.lastError).toBeNull();
  });

  it('2. CRITICAL Deduplication: encountering the same Message-ID twice must never duplicate message, thread, or timeline event', async () => {
    jest.spyOn(verifierService, 'assertSafeHost').mockResolvedValue(undefined);

    const rawMime = [
      'From: "Client Beta" <beta@client.com>',
      'To: inbound@clixprocrm.com',
      'Subject: Pricing Question',
      'Message-ID: <beta-msg-999@client.com>',
      'Content-Type: text/plain',
      '',
      'What are your enterprise rates?',
    ].join('\r\n');

    mockFetchedMessages = [
      {
        uid: 201,
        seq: 1,
        source: Buffer.from(rawMime),
      },
    ];

    // First sync run
    const result1 = await service.processSyncInboxJob({
      tenantId: TENANT_1,
      accountId: ACCOUNT_ID,
    });
    expect(result1.messagesProcessed).toBe(1);
    expect(dbMessages).toHaveLength(1);
    expect(dbThreads).toHaveLength(1);
    expect(dbTimelineEvents).toHaveLength(1);

    // Second sync run with the same message (e.g. re-fetched or retry)
    const result2 = await service.processSyncInboxJob({
      tenantId: TENANT_1,
      accountId: ACCOUNT_ID,
    });
    expect(result2.messagesProcessed).toBe(0);
    expect(result2.messagesSkipped).toBe(1);

    // Guarantees strictly NO duplicates created
    expect(dbMessages).toHaveLength(1);
    expect(dbThreads).toHaveLength(1);
    expect(dbTimelineEvents).toHaveLength(1);
  });

  it('3. Threading: should link reply message to existing thread via In-Reply-To', async () => {
    jest.spyOn(verifierService, 'assertSafeHost').mockResolvedValue(undefined);

    // Initial message
    dbThreads.push({
      id: 'thread-existing-1',
      tenantId: TENANT_1,
      accountId: ACCOUNT_ID,
      subject: 'Contract Discussion',
      normalizedSubject: 'contract discussion',
      messageCount: 1,
      unreadCount: 0,
      hasAttachments: false,
      lastMessageAt: new Date('2026-09-01T10:00:00Z'),
    });
    dbMessages.push({
      id: 'msg-root-1',
      tenantId: TENANT_1,
      accountId: ACCOUNT_ID,
      threadId: 'thread-existing-1',
      internetMessageId: '<root-contract@clixprocrm.com>',
      createdAt: new Date('2026-09-01T10:00:00Z'),
    });

    // Inbound reply referencing root message in In-Reply-To
    const replyMime = [
      'From: partner@corp.com',
      'To: inbound@clixprocrm.com',
      'Subject: Re: Contract Discussion',
      'Message-ID: <reply-contract-2@corp.com>',
      'In-Reply-To: <root-contract@clixprocrm.com>',
      'Content-Type: text/plain',
      '',
      'We accept the proposed terms.',
    ].join('\r\n');

    mockFetchedMessages = [
      {
        uid: 301,
        seq: 1,
        source: Buffer.from(replyMime),
      },
    ];

    await service.processSyncInboxJob({
      tenantId: TENANT_1,
      accountId: ACCOUNT_ID,
    });

    // Message must attach to existing thread
    expect(dbMessages).toHaveLength(2);
    const replyMsg = dbMessages.find((m) => m.internetMessageId === '<reply-contract-2@corp.com>');
    expect(replyMsg?.threadId).toBe('thread-existing-1');

    // Thread counters incremented
    const thread = dbThreads.find((t) => t.id === 'thread-existing-1');
    expect(thread.messageCount).toBe(2);
    expect(thread.unreadCount).toBe(1);
  });

  it('4. Threading: should link reply message to existing thread via References chain', async () => {
    jest.spyOn(verifierService, 'assertSafeHost').mockResolvedValue(undefined);

    dbThreads.push({
      id: 'thread-ref-1',
      tenantId: TENANT_1,
      accountId: ACCOUNT_ID,
      subject: 'Feature Request',
      normalizedSubject: 'feature request',
      messageCount: 1,
      unreadCount: 0,
      hasAttachments: false,
      lastMessageAt: new Date(),
    });
    dbMessages.push({
      id: 'msg-ref-1',
      tenantId: TENANT_1,
      accountId: ACCOUNT_ID,
      threadId: 'thread-ref-1',
      internetMessageId: '<feature-origin-456@corp.com>',
      createdAt: new Date(),
    });

    // Inbound email with References header matching origin
    const refMime = [
      'From: user@corp.com',
      'To: inbound@clixprocrm.com',
      'Subject: Re: Feature Request',
      'Message-ID: <feature-followup-789@corp.com>',
      'References: <unknown-parent@corp.com> <feature-origin-456@corp.com>',
      'Content-Type: text/plain',
      '',
      'Any update on this feature?',
    ].join('\r\n');

    mockFetchedMessages = [
      {
        uid: 302,
        seq: 1,
        source: Buffer.from(refMime),
      },
    ];

    await service.processSyncInboxJob({
      tenantId: TENANT_1,
      accountId: ACCOUNT_ID,
    });

    const followUpMsg = dbMessages.find((m) => m.internetMessageId === '<feature-followup-789@corp.com>');
    expect(followUpMsg?.threadId).toBe('thread-ref-1');
  });

  it('5. Threading: should match existing thread via Normalized Subject fallback', async () => {
    jest.spyOn(verifierService, 'assertSafeHost').mockResolvedValue(undefined);

    dbThreads.push({
      id: 'thread-subj-1',
      tenantId: TENANT_1,
      accountId: ACCOUNT_ID,
      subject: 'Quarterly Review Meeting',
      normalizedSubject: 'quarterly review meeting',
      messageCount: 1,
      unreadCount: 0,
      hasAttachments: false,
      lastMessageAt: new Date('2026-09-02T10:00:00Z'),
    });

    // Inbound email with "Fwd: Re: Quarterly Review Meeting" without In-Reply-To
    const subjMime = [
      'From: attendee@client.com',
      'To: inbound@clixprocrm.com',
      'Subject: Fwd: Re: Quarterly Review Meeting',
      'Message-ID: <subject-match-111@client.com>',
      'Content-Type: text/plain',
      '',
      'Confirming attendance.',
    ].join('\r\n');

    mockFetchedMessages = [
      {
        uid: 303,
        seq: 1,
        source: Buffer.from(subjMime),
      },
    ];

    await service.processSyncInboxJob({
      tenantId: TENANT_1,
      accountId: ACCOUNT_ID,
    });

    const matchedMsg = dbMessages.find((m) => m.internetMessageId === '<subject-match-111@client.com>');
    expect(matchedMsg?.threadId).toBe('thread-subj-1');
  });

  it('6. HTML Security: should sanitize malicious HTML and scripts before persistence', async () => {
    jest.spyOn(verifierService, 'assertSafeHost').mockResolvedValue(undefined);

    const maliciousMime = [
      'From: hacker@evil.com',
      'To: inbound@clixprocrm.com',
      'Subject: Critical Update',
      'Message-ID: <xss-injection-123@evil.com>',
      'Content-Type: text/html',
      '',
      '<div>Safe text<script>alert("hacked")</script><img src="x" onerror="steal()" /><a href="javascript:doEvil()">Click</a></div>',
    ].join('\r\n');

    mockFetchedMessages = [
      {
        uid: 401,
        seq: 1,
        source: Buffer.from(maliciousMime),
      },
    ];

    await service.processSyncInboxJob({
      tenantId: TENANT_1,
      accountId: ACCOUNT_ID,
    });

    const msg = dbMessages.find((m) => m.internetMessageId === '<xss-injection-123@evil.com>');
    expect(msg).toBeDefined();
    expect(msg.bodyHtml).not.toContain('<script');
    expect(msg.bodyHtml).not.toContain('onerror=');
    expect(msg.bodyHtml).not.toContain('href="javascript:');
    expect(msg.bodyHtml).toContain('Safe text');
  });

  it('7. Cursor Safety: partial failure on message N must NOT advance cursor past N', async () => {
    jest.spyOn(verifierService, 'assertSafeHost').mockResolvedValue(undefined);

    const validMime = [
      'From: sender1@corp.com',
      'To: inbound@clixprocrm.com',
      'Subject: Msg 1',
      'Message-ID: <msg-seq-1@corp.com>',
      'Content-Type: text/plain',
      '',
      'Message 1 body',
    ].join('\r\n');

    mockFetchedMessages = [
      { uid: 501, seq: 1, source: Buffer.from(validMime) },
      { uid: 502, seq: 2, source: null as any }, // Trigger intentional failure on message 502
    ];

    await expect(
      service.processSyncInboxJob({
        tenantId: TENANT_1,
        accountId: ACCOUNT_ID,
      }),
    ).rejects.toThrow();

    const account = dbAccounts.find((a) => a.id === ACCOUNT_ID);
    // Cursor MUST have advanced only to 501, NEVER 502!
    expect(account.syncCursor).toContain('"lastUid":501');
    expect(account.syncStatus).toBe(EmailSyncStatus.ERROR);
    expect(account.lastError).toBeDefined();
  });

  it('8. Error Handling & Zero Secret Leakage: auth failure marks AUTH_FAILED and sanitizes passwords', async () => {
    jest.spyOn(verifierService, 'assertSafeHost').mockResolvedValue(undefined);

    mockImapClient.connect.mockRejectedValueOnce(
      new Error('AUTHENTICATIONFAILED Invalid login credentials for password=SuperSecretP@ss123'),
    );

    await expect(
      service.processSyncInboxJob({
        tenantId: TENANT_1,
        accountId: ACCOUNT_ID,
      }),
    ).rejects.toThrow(/IMAP connection failure \(AUTH_FAILED\)/);

    const account = dbAccounts.find((a) => a.id === ACCOUNT_ID);
    expect(account.syncStatus).toBe(EmailSyncStatus.AUTH_FAILED);
    // Password must be redacted!
    expect(account.lastError).not.toContain('SuperSecretP@ss123');
    expect(account.lastError).toContain('password=***');
  });

  it('9. SSRF Protection: blocked host rejects connection before touching socket', async () => {
    const dangerousAccount = {
      id: 'acc-ssrf-1',
      tenantId: TENANT_1,
      email: 'ssrf@clixprocrm.com',
      imapHost: '169.254.169.254', // AWS metadata endpoint
      imapPort: 993,
      isActive: true,
      syncStatus: EmailSyncStatus.IDLE,
      deletedAt: null,
    };
    dbAccounts.push(dangerousAccount);

    await expect(
      service.processSyncInboxJob({
        tenantId: TENANT_1,
        accountId: 'acc-ssrf-1',
      }),
    ).rejects.toThrow(/Connection refused/);

    expect(mockImapClient.connect).not.toHaveBeenCalled();
  });

  it('10. Tenant Isolation: cross-tenant access is rejected without processing', async () => {
    // Attempt to sync Tenant 1 account using Tenant 2 credentials in payload
    const result = await service.processSyncInboxJob({
      tenantId: TENANT_2,
      accountId: ACCOUNT_ID, // belongs to TENANT_1
    });

    expect(result.success).toBe(false);
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('Account not found');
    expect(mockImapClient.connect).not.toHaveBeenCalled();
  });
});
