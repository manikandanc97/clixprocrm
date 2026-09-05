import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class VerifyEmailAccountDto {
  // SMTP settings to test
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

  @IsOptional()
  @IsString()
  smtpPass?: string;

  // IMAP settings to test
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

  @IsOptional()
  @IsString()
  imapPass?: string;
}
