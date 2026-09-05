import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { EmailProviderType, EmailAuthType } from '@prisma/client';

export class CreateEmailAccountDto {
  @IsEmail({}, { message: 'A valid email address is required' })
  @IsNotEmpty({ message: 'Email address cannot be empty' })
  email: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsEnum(EmailProviderType)
  provider?: EmailProviderType = EmailProviderType.CUSTOM_SMTP_IMAP;

  @IsOptional()
  @IsEnum(EmailAuthType)
  authType?: EmailAuthType = EmailAuthType.PASSWORD;

  @IsOptional()
  @IsBoolean()
  isShared?: boolean = false;

  @IsOptional()
  @IsUUID('4', { message: 'Target userId must be a valid UUID' })
  userId?: string;

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
   * Plaintext SMTP password supplied during account creation.
   * This is immediately encrypted in memory with AES-256-GCM and never persisted in plaintext.
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
   * Plaintext IMAP password supplied during account creation.
   * This is immediately encrypted in memory with AES-256-GCM and never persisted in plaintext.
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
