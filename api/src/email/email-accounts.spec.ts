import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailAccountsService } from './services/email-accounts.service';
import { ConnectionVerifierService } from './services/connection-verifier.service';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption/encryption.service';
import { CreateEmailAccountDto } from './dto/create-email-account.dto';
import { UpdateEmailAccountDto } from './dto/update-email-account.dto';
import { EmailProviderType, EmailAuthType, EmailSyncStatus } from '@prisma/client';

describe('EmailAccountsService & Security Tests', () => {
  let service: EmailAccountsService;
  let encService: EncryptionService;
  let verifierService: ConnectionVerifierService;

  // In-memory mock database store for EmailAccount table
  let emailAccountsDb: any[] = [];

  const TEST_KEY = 'a1b2c3d4e5f67890123456789abcdef0a1b2c3d4e5f67890123456789abcdef0';
  const TENANT_A = 'tenant-uuid-1111';
  const TENANT_B = 'tenant-uuid-2222';
  const USER_1 = 'user-uuid-aaaa';
  const USER_2 = 'user-uuid-bbbb';

  const mockPrismaService = {
    withTenantContext: jest.fn(async (ctx, fn) => {
      const tx = {
        emailAccount: {
          findFirst: jest.fn(async ({ where }: any) => {
            return emailAccountsDb.find((item) => {
              for (const [key, val] of Object.entries(where)) {
                if (key === 'deletedAt' && val === null && item.deletedAt !== null) return false;
                if (item[key] !== val) return false;
              }
              return true;
            }) || null;
          }),
          findMany: jest.fn(async ({ where }: any) => {
            return emailAccountsDb.filter((item) => {
              if (where.tenantId && item.tenantId !== where.tenantId) return false;
              if (where.deletedAt === null && item.deletedAt !== null) return false;
              if (where.OR) {
                const matchesOr = where.OR.some((cond: any) => {
                  return Object.entries(cond).every(([k, v]) => item[k] === v);
                });
                if (!matchesOr) return false;
              }
              return true;
            });
          }),
          create: jest.fn(async ({ data }: any) => {
            // Enforce unique constraint [tenantId, emailHash]
            const dup = emailAccountsDb.find(
              (item) => item.tenantId === data.tenantId && item.emailHash === data.emailHash && !item.deletedAt,
            );
            if (dup) {
              const err: any = new Error('Unique constraint failed on the fields: (`tenantId`,`emailHash`)');
              err.code = 'P2002';
              throw err;
            }
            const record = {
              id: `acc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              createdAt: new Date(),
              updatedAt: new Date(),
              deletedAt: null,
              syncStatus: EmailSyncStatus.IDLE,
              lastSyncedAt: null,
              lastError: null,
              syncCursor: null,
              ...data,
            };
            emailAccountsDb.push(record);
            return record;
          }),
          update: jest.fn(async ({ where, data }: any) => {
            const index = emailAccountsDb.findIndex((i) => i.id === where.id);
            if (index === -1) throw new Error('Record not found');
            const updated = {
              ...emailAccountsDb[index],
              ...data,
              updatedAt: new Date(),
            };
            emailAccountsDb[index] = updated;
            return updated;
          }),
        },
      };
      return fn(tx);
    }),
  };

  const mockVerifierService = {
    assertSafeHost: jest.fn().mockResolvedValue(undefined),
    verifySmtp: jest.fn().mockResolvedValue({ success: true }),
    verifyImap: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailAccountsService,
        EncryptionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(TEST_KEY),
          },
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConnectionVerifierService,
          useValue: mockVerifierService,
        },
      ],
    }).compile();

    service = module.get<EmailAccountsService>(EmailAccountsService);
    encService = module.get<EncryptionService>(EncryptionService);
    verifierService = module.get<ConnectionVerifierService>(ConnectionVerifierService);

    encService.onModuleInit();
  });

  beforeEach(() => {
    emailAccountsDb = [];
    jest.clearAllMocks();
  });

  // 1. Create account encrypts credentials
  it('1. should encrypt SMTP and IMAP credentials with AES-256-GCM upon creation', async () => {
    const dto: CreateEmailAccountDto = {
      email: 'user@example.com',
      displayName: 'Personal Work',
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      smtpUser: 'user@example.com',
      smtpPass: 'SuperSecretSmtpPass123!',
      imapHost: 'imap.example.com',
      imapPort: 993,
      imapUser: 'user@example.com',
      imapPass: 'SuperSecretImapPass456!',
    };

    const result = await service.createAccount(TENANT_A, USER_1, false, dto);

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();

    // Check underlying DB store
    const stored = emailAccountsDb.find((item) => item.id === result.id);
    expect(stored).toBeDefined();
    expect(stored.encryptedSmtpPass).toBeDefined();
    expect(stored.encryptedImapPass).toBeDefined();

    // Ensure plaintext never stored in DB
    expect(stored.encryptedSmtpPass).not.toEqual(dto.smtpPass);
    expect(stored.encryptedImapPass).not.toEqual(dto.imapPass);

    // Verify AES-256-GCM decryption
    const decryptedSmtp = encService.decrypt(stored.encryptedSmtpPass);
    const decryptedImap = encService.decrypt(stored.encryptedImapPass);
    expect(decryptedSmtp).toBe('SuperSecretSmtpPass123!');
    expect(decryptedImap).toBe('SuperSecretImapPass456!');
  });

  // 2. Email hash generated correctly
  it('2. should generate HMAC-SHA256 emailHash blind index correctly with lowercase and trim normalization', async () => {
    const rawEmail = '  Sales.Lead@Example.COM  ';
    const dto: CreateEmailAccountDto = {
      email: rawEmail,
      displayName: 'Sales Account',
    };

    const result = await service.createAccount(TENANT_A, USER_1, false, dto);

    const stored = emailAccountsDb.find((item) => item.id === result.id);
    expect(stored).toBeDefined();
    expect(stored.email).toBe(rawEmail.trim());

    // Compute expected HMAC
    const expectedHash = encService.hash('sales.lead@example.com');
    expect(stored.emailHash).toBe(expectedHash);
  });

  // 3. Plaintext credentials never appear in returned DTO
  it('3. should never return plaintext or encrypted passwords in the response DTO', async () => {
    const dto: CreateEmailAccountDto = {
      email: 'secret@example.com',
      smtpPass: 'PlainSmtpPassword',
      imapPass: 'PlainImapPassword',
      oauthAccess: 'PlainOauthAccessToken',
      oauthRefresh: 'PlainOauthRefreshToken',
    };

    const result: any = await service.createAccount(TENANT_A, USER_1, false, dto);

    expect(result.encryptedSmtpPass).toBeUndefined();
    expect(result.encryptedImapPass).toBeUndefined();
    expect(result.encryptedOauthAccess).toBeUndefined();
    expect(result.encryptedOauthRefresh).toBeUndefined();
    expect(result.smtpPass).toBeUndefined();
    expect(result.imapPass).toBeUndefined();
    expect(result.oauthAccess).toBeUndefined();
    expect(result.oauthRefresh).toBeUndefined();

    // Verification flags present
    expect(result.hasSmtpPass).toBe(true);
    expect(result.hasImapPass).toBe(true);
    expect(result.hasOauth).toBe(true);
  });

  // 4. Get/list never expose secrets
  it('4. should never expose credentials or tokens when fetching or listing email accounts', async () => {
    const dto: CreateEmailAccountDto = {
      email: 'list-test@example.com',
      smtpPass: 'Pass123',
      imapPass: 'Pass456',
    };
    const created = await service.createAccount(TENANT_A, USER_1, false, dto);

    const list = await service.getAccounts(TENANT_A, USER_1, false);
    const fetched = await service.getAccountById(TENANT_A, USER_1, false, created.id);

    for (const item of [...list, fetched] as any[]) {
      expect(item.encryptedSmtpPass).toBeUndefined();
      expect(item.encryptedImapPass).toBeUndefined();
      expect(item.smtpPass).toBeUndefined();
      expect(item.imapPass).toBeUndefined();
      expect(item.hasSmtpPass).toBe(true);
      expect(item.hasImapPass).toBe(true);
    }
  });

  // 5. Update encrypts changed credentials
  it('5. should encrypt updated credentials when modifying an email account', async () => {
    const createDto: CreateEmailAccountDto = {
      email: 'update-test@example.com',
      smtpPass: 'InitialPass',
    };
    const created = await service.createAccount(TENANT_A, USER_1, false, createDto);

    const updateDto: UpdateEmailAccountDto = {
      smtpPass: 'UpdatedNewPassword999!',
      displayName: 'Renamed Account',
    };
    const updatedResult = await service.updateAccount(TENANT_A, USER_1, false, created.id, updateDto);

    expect(updatedResult.displayName).toBe('Renamed Account');

    const stored = emailAccountsDb.find((item) => item.id === created.id);
    const decrypted = encService.decrypt(stored.encryptedSmtpPass);
    expect(decrypted).toBe('UpdatedNewPassword999!');
  });

  // 6. Delete respects tenant isolation
  it('6. should soft-delete an account within the tenant scope and mark isActive as false', async () => {
    const created = await service.createAccount(TENANT_A, USER_1, false, {
      email: 'delete-me@example.com',
    });

    const delResult = await service.deleteAccount(TENANT_A, USER_1, false, created.id);
    expect(delResult.success).toBe(true);

    const stored = emailAccountsDb.find((item) => item.id === created.id);
    expect(stored.deletedAt).toBeInstanceOf(Date);
    expect(stored.isActive).toBe(false);

    // Further get should return 404
    await expect(service.getAccountById(TENANT_A, USER_1, false, created.id)).rejects.toThrow(
      NotFoundException,
    );
  });

  // 7. Cross-tenant account access is rejected
  it('7. should reject cross-tenant access and return NotFoundException without disclosing account existence', async () => {
    // Tenant A creates an account
    const createdA = await service.createAccount(TENANT_A, USER_1, false, {
      email: 'tenant-a-user@example.com',
    });

    // Tenant B attempts to fetch it
    await expect(service.getAccountById(TENANT_B, 'some-tenant-b-user', true, createdA.id)).rejects.toThrow(
      NotFoundException,
    );

    // Tenant B attempts to update it
    await expect(
      service.updateAccount(TENANT_B, 'some-tenant-b-user', true, createdA.id, {
        displayName: 'Hacked',
      }),
    ).rejects.toThrow(NotFoundException);

    // Tenant B attempts to delete it
    await expect(service.deleteAccount(TENANT_B, 'some-tenant-b-user', true, createdA.id)).rejects.toThrow(
      NotFoundException,
    );
  });

  // 8. Personal mailbox authorization
  it('8. should enforce personal mailbox authorization: only owner or tenant admin can manage', async () => {
    // User 1 creates personal account
    const personalAccount = await service.createAccount(TENANT_A, USER_1, false, {
      email: 'user1.personal@example.com',
    });

    // User 2 (same tenant, regular user) attempts to view User 1's personal mailbox
    await expect(
      service.getAccountById(TENANT_A, USER_2, false, personalAccount.id),
    ).rejects.toThrow(ForbiddenException);

    // User 2 attempts to update User 1's personal mailbox
    await expect(
      service.updateAccount(TENANT_A, USER_2, false, personalAccount.id, { displayName: 'Tamper' }),
    ).rejects.toThrow(ForbiddenException);

    // User 2 attempts to delete User 1's personal mailbox
    await expect(
      service.deleteAccount(TENANT_A, USER_2, false, personalAccount.id),
    ).rejects.toThrow(ForbiddenException);

    // Tenant Admin in same tenant CAN view and manage User 1's personal mailbox
    const adminView = await service.getAccountById(TENANT_A, USER_2, true, personalAccount.id);
    expect(adminView.id).toBe(personalAccount.id);
  });

  // 9. Shared mailbox authorization
  it('9. should enforce shared mailbox authorization: only tenant admin can create, update, or delete', async () => {
    // Regular user attempts to create shared mailbox -> Forbidden
    await expect(
      service.createAccount(TENANT_A, USER_1, false, {
        email: 'support@example.com',
        isShared: true,
      }),
    ).rejects.toThrow(ForbiddenException);

    // Tenant Admin creates shared mailbox -> Allowed
    const sharedAccount = await service.createAccount(TENANT_A, USER_1, true, {
      email: 'support@example.com',
      isShared: true,
      displayName: 'Support Team',
    });
    expect(sharedAccount.isShared).toBe(true);
    expect(sharedAccount.userId).toBeNull();

    // Regular user CAN view shared mailbox
    const userView = await service.getAccountById(TENANT_A, USER_2, false, sharedAccount.id);
    expect(userView.id).toBe(sharedAccount.id);

    // Regular user CANNOT update shared mailbox
    await expect(
      service.updateAccount(TENANT_A, USER_2, false, sharedAccount.id, { displayName: 'User rename' }),
    ).rejects.toThrow(ForbiddenException);

    // Regular user CANNOT delete shared mailbox
    await expect(
      service.deleteAccount(TENANT_A, USER_2, false, sharedAccount.id),
    ).rejects.toThrow(ForbiddenException);
  });

  // 10. Connection verification does not persist plaintext credentials
  it('10. should decrypt credentials in memory for connection test and never persist plaintext', async () => {
    const created = await service.createAccount(TENANT_A, USER_1, false, {
      email: 'verify-test@example.com',
      smtpHost: 'smtp.mail.com',
      smtpPort: 587,
      smtpPass: 'SecretVerifyPass',
      imapHost: 'imap.mail.com',
      imapPort: 993,
      imapPass: 'SecretImapPass',
    });

    const verifyResult = await service.verifyAccount(TENANT_A, USER_1, false, created.id);

    expect(verifyResult.success).toBe(true);
    expect(mockVerifierService.verifySmtp).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.mail.com',
        port: 587,
        pass: 'SecretVerifyPass',
      }),
    );
    expect(mockVerifierService.verifyImap).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'imap.mail.com',
        port: 993,
        pass: 'SecretImapPass',
      }),
    );

    // Verify DB still only has ciphertext
    const stored = emailAccountsDb.find((item) => item.id === created.id);
    expect(stored.encryptedSmtpPass).not.toBe('SecretVerifyPass');
    expect(stored.syncStatus).toBe(EmailSyncStatus.SUCCESS);
  });

  // 11. Invalid email rejected
  it('11. should reject invalid email address before attempting database persistence', async () => {
    await expect(
      service.createAccount(TENANT_A, USER_1, false, {
        email: 'invalid-email-no-at',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  // 12. Duplicate tenant + emailHash rejected cleanly
  it('12. should cleanly reject duplicate email address within the same tenant with ConflictException', async () => {
    await service.createAccount(TENANT_A, USER_1, false, {
      email: 'duplicate@example.com',
      displayName: 'First Creation',
    });

    // Attempt to create same email in Tenant A
    await expect(
      service.createAccount(TENANT_A, USER_2, true, {
        email: 'DUPLICATE@example.com', // case variation
        displayName: 'Second Creation',
      }),
    ).rejects.toThrow(ConflictException);

    // Creating same email in Tenant B is ALLOWED (tenant-isolated unique constraint)
    const tenantBAccount = await service.createAccount(TENANT_B, 'tenant-b-user', false, {
      email: 'duplicate@example.com',
      displayName: 'Tenant B Account',
    });
    expect(tenantBAccount.tenantId).toBe(TENANT_B);
  });
});
