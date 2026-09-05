import { EmailProviderType, EmailAuthType, EmailSyncStatus } from '@prisma/client';

export interface EmailAccountResponseDto {
  id: string;
  tenantId: string;
  userId: string | null;
  email: string;
  displayName: string | null;
  provider: EmailProviderType;
  authType: EmailAuthType;

  // SMTP Info (Safe metadata only - NO passwords/secrets)
  smtpHost: string | null;
  smtpPort: number | null;
  smtpSecure: boolean;
  smtpUser: string | null;
  hasSmtpPass: boolean;

  // IMAP Info (Safe metadata only - NO passwords/secrets)
  imapHost: string | null;
  imapPort: number | null;
  imapSecure: boolean;
  imapUser: string | null;
  hasImapPass: boolean;

  // OAuth Info (Flags & Expiry only - NO tokens)
  hasOauth: boolean;
  oauthExpiresAt: Date | null;

  // State & Sync
  isShared: boolean;
  isActive: boolean;
  syncStatus: EmailSyncStatus;
  lastSyncedAt: Date | null;
  lastError: string | null;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Maps an internal Prisma EmailAccount entity to a public, safe EmailAccountResponseDto.
 * Strictly guarantees that no ciphertexts, hashes, passwords, or tokens leak through the API.
 */
export function toEmailAccountResponse(account: any): EmailAccountResponseDto {
  return {
    id: account.id,
    tenantId: account.tenantId,
    userId: account.userId ?? null,
    email: account.email,
    displayName: account.displayName ?? null,
    provider: account.provider,
    authType: account.authType,

    smtpHost: account.smtpHost ?? null,
    smtpPort: account.smtpPort ?? null,
    smtpSecure: !!account.smtpSecure,
    smtpUser: account.smtpUser ?? null,
    hasSmtpPass: !!account.encryptedSmtpPass,

    imapHost: account.imapHost ?? null,
    imapPort: account.imapPort ?? null,
    imapSecure: !!account.imapSecure,
    imapUser: account.imapUser ?? null,
    hasImapPass: !!account.encryptedImapPass,

    hasOauth: !!(account.encryptedOauthRefresh || account.encryptedOauthAccess),
    oauthExpiresAt: account.oauthExpiresAt ?? null,

    isShared: !!account.isShared,
    isActive: !!account.isActive,
    syncStatus: account.syncStatus,
    lastSyncedAt: account.lastSyncedAt ?? null,
    lastError: account.lastError ?? null,

    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}
