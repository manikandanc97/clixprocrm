import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { ConnectionVerifierService } from './connection-verifier.service';
import { CreateEmailAccountDto } from '../dto/create-email-account.dto';
import { UpdateEmailAccountDto } from '../dto/update-email-account.dto';
import { VerifyEmailAccountDto } from '../dto/verify-email-account.dto';
import {
  EmailAccountResponseDto,
  toEmailAccountResponse,
} from '../dto/email-account-response.dto';
import { EmailProviderType, EmailAuthType, EmailSyncStatus, Prisma } from '@prisma/client';

@Injectable()
export class EmailAccountsService {
  private readonly logger = new Logger(EmailAccountsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly enc: EncryptionService,
    private readonly verifier: ConnectionVerifierService,
  ) {}

  /**
   * Creates a new email account under strict tenant isolation.
   * Handles AES-256-GCM encryption of credentials, HMAC-SHA256 blind indexing,
   * and personal vs shared mailbox access validation.
   */
  async createAccount(
    tenantId: string,
    callerUserId: string,
    isTenantAdmin: boolean,
    dto: CreateEmailAccountDto,
  ): Promise<EmailAccountResponseDto> {
    if (!dto.email || !dto.email.includes('@')) {
      throw new BadRequestException('A valid email address is required');
    }

    const normalizedEmail = dto.email.trim();
    const emailHash = this.enc.hash(normalizedEmail);
    if (!emailHash) {
      throw new BadRequestException('Could not derive email hash');
    }

    // Shared mailbox / target user authorization
    let targetUserId: string | null = null;
    let isShared = !!dto.isShared;

    if (isShared || (dto.userId === null && dto.isShared === true)) {
      if (!isTenantAdmin) {
        throw new ForbiddenException('Only tenant administrators can configure shared organization mailboxes');
      }
      isShared = true;
      targetUserId = null;
    } else if (dto.userId && dto.userId !== callerUserId) {
      if (!isTenantAdmin) {
        throw new ForbiddenException('Only tenant administrators can assign email accounts to other users');
      }
      targetUserId = dto.userId;
      isShared = false;
    } else {
      // Regular user creating personal account
      targetUserId = callerUserId;
      isShared = false;
    }

    // Encrypt sensitive secrets in memory immediately using existing EncryptionService
    const encryptedSmtpPass = dto.smtpPass ? this.enc.encrypt(dto.smtpPass) : null;
    const encryptedImapPass = dto.imapPass ? this.enc.encrypt(dto.imapPass) : null;
    const encryptedOauthRefresh = dto.oauthRefresh ? this.enc.encrypt(dto.oauthRefresh) : null;
    const encryptedOauthAccess = dto.oauthAccess ? this.enc.encrypt(dto.oauthAccess) : null;

    return this.prisma.withTenantContext({ tenantId, userId: callerUserId }, async (tx) => {
      // Check for active duplicate in this tenant
      const existing = await tx.emailAccount.findFirst({
        where: {
          tenantId,
          emailHash,
        },
      });

      if (existing) {
        if (!existing.deletedAt) {
          throw new ConflictException('An email account with this address already exists in your organization');
        }

        // Reactivate soft-deleted mailbox with updated configuration
        const updated = await tx.emailAccount.update({
          where: { id: existing.id },
          data: {
            userId: targetUserId,
            email: normalizedEmail,
            displayName: dto.displayName?.trim() || null,
            provider: dto.provider || EmailProviderType.CUSTOM_SMTP_IMAP,
            authType: dto.authType || EmailAuthType.PASSWORD,
            encryptedSmtpPass,
            encryptedImapPass,
            encryptedOauthRefresh,
            encryptedOauthAccess,
            oauthExpiresAt: dto.oauthExpiresAt ? new Date(dto.oauthExpiresAt) : null,
            smtpHost: dto.smtpHost?.trim() || null,
            smtpPort: dto.smtpPort ?? 587,
            smtpSecure: dto.smtpSecure ?? false,
            smtpUser: dto.smtpUser?.trim() || null,
            imapHost: dto.imapHost?.trim() || null,
            imapPort: dto.imapPort ?? 993,
            imapSecure: dto.imapSecure ?? true,
            imapUser: dto.imapUser?.trim() || null,
            isShared,
            isActive: true,
            syncStatus: EmailSyncStatus.IDLE,
            lastError: null,
            deletedAt: null,
          },
        });

        return toEmailAccountResponse(updated);
      }

      try {
        const created = await tx.emailAccount.create({
          data: {
            tenantId,
            userId: targetUserId,
            email: normalizedEmail,
            emailHash,
            displayName: dto.displayName?.trim() || null,
            provider: dto.provider || EmailProviderType.CUSTOM_SMTP_IMAP,
            authType: dto.authType || EmailAuthType.PASSWORD,
            encryptedSmtpPass,
            encryptedImapPass,
            encryptedOauthRefresh,
            encryptedOauthAccess,
            oauthExpiresAt: dto.oauthExpiresAt ? new Date(dto.oauthExpiresAt) : null,
            smtpHost: dto.smtpHost?.trim() || null,
            smtpPort: dto.smtpPort ?? 587,
            smtpSecure: dto.smtpSecure ?? false,
            smtpUser: dto.smtpUser?.trim() || null,
            imapHost: dto.imapHost?.trim() || null,
            imapPort: dto.imapPort ?? 993,
            imapSecure: dto.imapSecure ?? true,
            imapUser: dto.imapUser?.trim() || null,
            isShared,
            isActive: true,
            syncStatus: EmailSyncStatus.IDLE,
          },
        });

        return toEmailAccountResponse(created);
      } catch (err: any) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          throw new ConflictException('An email account with this address already exists in your organization');
        }
        throw err;
      }
    });
  }

  /**
   * Retrieves all accessible email accounts for the caller.
   * Admins can see all active tenant accounts.
   * Regular users can only see their own personal accounts and shared accounts.
   */
  async getAccounts(
    tenantId: string,
    callerUserId: string,
    isTenantAdmin: boolean,
  ): Promise<EmailAccountResponseDto[]> {
    return this.prisma.withTenantContext({ tenantId, userId: callerUserId }, async (tx) => {
      const where: Prisma.EmailAccountWhereInput = {
        tenantId,
        deletedAt: null,
      };

      if (!isTenantAdmin) {
        where.OR = [
          { userId: callerUserId },
          { isShared: true },
        ];
      }

      const accounts = await tx.emailAccount.findMany({
        where,
        orderBy: [{ isShared: 'desc' }, { createdAt: 'desc' }],
      });

      return accounts.map((acc) => toEmailAccountResponse(acc));
    });
  }

  /**
   * Retrieves a single email account by ID with strict tenant and personal/shared access enforcement.
   */
  async getAccountById(
    tenantId: string,
    callerUserId: string,
    isTenantAdmin: boolean,
    accountId: string,
  ): Promise<EmailAccountResponseDto> {
    return this.prisma.withTenantContext({ tenantId, userId: callerUserId }, async (tx) => {
      const account = await tx.emailAccount.findFirst({
        where: { id: accountId, tenantId, deletedAt: null },
      });

      if (!account) {
        throw new NotFoundException('Email account not found');
      }

      this.assertAccountAccess(account, callerUserId, isTenantAdmin, 'view');

      return toEmailAccountResponse(account);
    });
  }

  /**
   * Updates an email account.
   * Personal mailboxes can be updated by their owner or tenant admins.
   * Shared mailboxes can only be updated by tenant admins.
   */
  async updateAccount(
    tenantId: string,
    callerUserId: string,
    isTenantAdmin: boolean,
    accountId: string,
    dto: UpdateEmailAccountDto,
  ): Promise<EmailAccountResponseDto> {
    return this.prisma.withTenantContext({ tenantId, userId: callerUserId }, async (tx) => {
      const account = await tx.emailAccount.findFirst({
        where: { id: accountId, tenantId, deletedAt: null },
      });

      if (!account) {
        throw new NotFoundException('Email account not found');
      }

      this.assertAccountAccess(account, callerUserId, isTenantAdmin, 'update');

      const dataToUpdate: Prisma.EmailAccountUpdateInput = {};

      if (dto.displayName !== undefined) dataToUpdate.displayName = dto.displayName?.trim() || null;
      if (dto.provider !== undefined) dataToUpdate.provider = dto.provider;
      if (dto.authType !== undefined) dataToUpdate.authType = dto.authType;
      if (dto.isActive !== undefined) dataToUpdate.isActive = dto.isActive;

      if (dto.isShared !== undefined) {
        if (!isTenantAdmin) {
          throw new ForbiddenException('Only tenant administrators can change mailbox sharing status');
        }
        dataToUpdate.isShared = dto.isShared;
        if (dto.isShared) {
          dataToUpdate.user = { disconnect: true };
        }
      }

      // Re-encrypt updated credentials
      if (dto.smtpPass !== undefined) {
        dataToUpdate.encryptedSmtpPass = dto.smtpPass ? this.enc.encrypt(dto.smtpPass) : null;
      }
      if (dto.imapPass !== undefined) {
        dataToUpdate.encryptedImapPass = dto.imapPass ? this.enc.encrypt(dto.imapPass) : null;
      }
      if (dto.oauthRefresh !== undefined) {
        dataToUpdate.encryptedOauthRefresh = dto.oauthRefresh ? this.enc.encrypt(dto.oauthRefresh) : null;
      }
      if (dto.oauthAccess !== undefined) {
        dataToUpdate.encryptedOauthAccess = dto.oauthAccess ? this.enc.encrypt(dto.oauthAccess) : null;
      }
      if (dto.oauthExpiresAt !== undefined) {
        dataToUpdate.oauthExpiresAt = dto.oauthExpiresAt ? new Date(dto.oauthExpiresAt) : null;
      }

      if (dto.smtpHost !== undefined) dataToUpdate.smtpHost = dto.smtpHost?.trim() || null;
      if (dto.smtpPort !== undefined) dataToUpdate.smtpPort = dto.smtpPort;
      if (dto.smtpSecure !== undefined) dataToUpdate.smtpSecure = dto.smtpSecure;
      if (dto.smtpUser !== undefined) dataToUpdate.smtpUser = dto.smtpUser?.trim() || null;

      if (dto.imapHost !== undefined) dataToUpdate.imapHost = dto.imapHost?.trim() || null;
      if (dto.imapPort !== undefined) dataToUpdate.imapPort = dto.imapPort;
      if (dto.imapSecure !== undefined) dataToUpdate.imapSecure = dto.imapSecure;
      if (dto.imapUser !== undefined) dataToUpdate.imapUser = dto.imapUser?.trim() || null;

      const updated = await tx.emailAccount.update({
        where: { id: accountId },
        data: dataToUpdate,
      });

      return toEmailAccountResponse(updated);
    });
  }

  /**
   * Soft-deletes an email account.
   * Personal mailboxes can be deleted by owner or tenant admins.
   * Shared mailboxes can only be deleted by tenant admins.
   */
  async deleteAccount(
    tenantId: string,
    callerUserId: string,
    isTenantAdmin: boolean,
    accountId: string,
  ): Promise<{ success: boolean; id: string }> {
    return this.prisma.withTenantContext({ tenantId, userId: callerUserId }, async (tx) => {
      const account = await tx.emailAccount.findFirst({
        where: { id: accountId, tenantId, deletedAt: null },
      });

      if (!account) {
        throw new NotFoundException('Email account not found');
      }

      this.assertAccountAccess(account, callerUserId, isTenantAdmin, 'delete');

      await tx.emailAccount.update({
        where: { id: accountId },
        data: {
          deletedAt: new Date(),
          isActive: false,
        },
      });

      return { success: true, id: accountId };
    });
  }

  /**
   * Verifies an existing email account's SMTP and IMAP connections.
   * Decrypts credentials in memory strictly for the handshake test, then records the sync status.
   */
  async verifyAccount(
    tenantId: string,
    callerUserId: string,
    isTenantAdmin: boolean,
    accountId: string,
  ): Promise<{
    success: boolean;
    smtp?: { success: boolean; error?: string };
    imap?: { success: boolean; error?: string };
  }> {
    const account = await this.prisma.withTenantContext({ tenantId, userId: callerUserId }, async (tx) => {
      const acc = await tx.emailAccount.findFirst({
        where: { id: accountId, tenantId, deletedAt: null },
      });

      if (!acc) {
        throw new NotFoundException('Email account not found');
      }

      this.assertAccountAccess(acc, callerUserId, isTenantAdmin, 'verify');
      return acc;
    });

    // Decrypt credentials in memory immediately before testing
    const smtpPass = account.encryptedSmtpPass ? this.enc.decrypt(account.encryptedSmtpPass) : undefined;
    const imapPass = account.encryptedImapPass ? this.enc.decrypt(account.encryptedImapPass) : undefined;

    let smtpResult: { success: boolean; error?: string } | undefined;
    let imapResult: { success: boolean; error?: string } | undefined;

    if (account.smtpHost && account.smtpPort) {
      smtpResult = await this.verifier.verifySmtp({
        host: account.smtpHost,
        port: account.smtpPort,
        secure: account.smtpSecure,
        user: account.smtpUser || account.email,
        pass: smtpPass || undefined,
      });
    }

    if (account.imapHost && account.imapPort) {
      imapResult = await this.verifier.verifyImap({
        host: account.imapHost,
        port: account.imapPort,
        secure: account.imapSecure,
        user: account.imapUser || account.email,
        pass: imapPass || undefined,
      });
    }

    const overallSuccess =
      (!smtpResult || smtpResult.success) && (!imapResult || imapResult.success);

    const errorMessage =
      (!smtpResult?.success && smtpResult?.error) ||
      (!imapResult?.success && imapResult?.error) ||
      null;

    // Update account sync status
    await this.prisma.withTenantContext({ tenantId, userId: callerUserId }, async (tx) => {
      await tx.emailAccount.update({
        where: { id: accountId },
        data: {
          syncStatus: overallSuccess ? EmailSyncStatus.SUCCESS : EmailSyncStatus.AUTH_FAILED,
          lastError: errorMessage,
        },
      });
    });

    return {
      success: overallSuccess,
      smtp: smtpResult,
      imap: imapResult,
    };
  }

  /**
   * Ad-hoc connection verification without persisting any credentials.
   */
  async verifyDirect(dto: VerifyEmailAccountDto): Promise<{
    success: boolean;
    smtp?: { success: boolean; error?: string };
    imap?: { success: boolean; error?: string };
  }> {
    let smtpResult: { success: boolean; error?: string } | undefined;
    let imapResult: { success: boolean; error?: string } | undefined;

    if (dto.smtpHost && dto.smtpPort) {
      smtpResult = await this.verifier.verifySmtp({
        host: dto.smtpHost,
        port: dto.smtpPort,
        secure: dto.smtpSecure,
        user: dto.smtpUser,
        pass: dto.smtpPass,
      });
    }

    if (dto.imapHost && dto.imapPort) {
      imapResult = await this.verifier.verifyImap({
        host: dto.imapHost,
        port: dto.imapPort,
        secure: dto.imapSecure,
        user: dto.imapUser,
        pass: dto.imapPass,
      });
    }

    const overallSuccess =
      (!smtpResult || smtpResult.success) && (!imapResult || imapResult.success);

    return {
      success: overallSuccess,
      smtp: smtpResult,
      imap: imapResult,
    };
  }

  /**
   * Central authorization helper enforcing personal vs shared mailbox access boundaries.
   */
  private assertAccountAccess(
    account: { userId: string | null; isShared: boolean },
    callerUserId: string,
    isTenantAdmin: boolean,
    action: 'view' | 'update' | 'delete' | 'verify',
  ): void {
    if (isTenantAdmin) {
      return; // Tenant administrators have full management access over tenant accounts
    }

    // Shared mailbox
    if (account.isShared || account.userId === null) {
      if (action === 'view') {
        return; // Authenticated tenant members can view shared mailboxes
      }
      throw new ForbiddenException('Only tenant administrators can modify, delete, or re-verify shared mailboxes');
    }

    // Personal mailbox
    if (account.userId !== callerUserId) {
      throw new ForbiddenException('You do not have permission to access this email account');
    }
  }
}
