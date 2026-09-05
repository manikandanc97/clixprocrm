import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { EmailProviderType, EmailAuthType } from '@prisma/client';

export class UpdateEmailAccountDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsEnum(EmailProviderType)
  provider?: EmailProviderType;

  @IsOptional()
  @IsEnum(EmailAuthType)
  authType?: EmailAuthType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isShared?: boolean;

  // SMTP Settings
  @IsOptional()
  @IsString()
  smtpHost?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort?: number;

  @IsOptional()
  @IsBoolean()
  smtpSecure?: boolean;

  @IsOptional()
  @IsString()
  smtpUser?: string;

  /**
   * Plaintext SMTP password if changing credentials.
   * Immediately encrypted with AES-256-GCM and never persisted in plaintext.
   */
  @IsOptional()
  @IsString()
  smtpPass?: string;

  // IMAP Settings
  @IsOptional()
  @IsString()
  imapHost?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  imapPort?: number;

  @IsOptional()
  @IsBoolean()
  imapSecure?: boolean;

  @IsOptional()
  @IsString()
  imapUser?: string;

  /**
   * Plaintext IMAP password if changing credentials.
   * Immediately encrypted with AES-256-GCM and never persisted in plaintext.
   */
  @IsOptional()
  @IsString()
  imapPass?: string;

  // OAuth Settings (if applicable)
  @IsOptional()
  @IsString()
  oauthRefresh?: string;

  @IsOptional()
  @IsString()
  oauthAccess?: string;

  @IsOptional()
  @IsDateString()
  oauthExpiresAt?: string;
}
