import { Logger } from '@nestjs/common';

export interface SecurityConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class SecurityConfigValidator {
  private static readonly logger = new Logger(SecurityConfigValidator.name);

  static validateEnvironment(): SecurityConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const isProduction = process.env.NODE_ENV === 'production';

    // 1. Mandatory Core Variables
    const requiredVars = ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];
    for (const v of requiredVars) {
      const val = process.env[v];
      if (!val || val.trim() === '') {
        errors.push(`Missing mandatory environment variable: ${v}`);
      } else if (
        val.includes('placeholder') ||
        val.includes('your-secret-here') ||
        val.includes('changeme')
      ) {
        errors.push(`Insecure placeholder value detected in variable: ${v}`);
      }
    }

    // 2. Field Encryption Key Validation (AES-256-GCM)
    const encKey = process.env.FIELD_ENCRYPTION_KEY;
    if (isProduction) {
      if (!encKey || encKey.trim() === '') {
        errors.push(
          'Missing mandatory environment variable in production: FIELD_ENCRYPTION_KEY',
        );
      } else if (encKey.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(encKey)) {
        errors.push(
          'FIELD_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes) in production.',
        );
      }
    } else if (
      encKey &&
      (encKey.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(encKey))
    ) {
      warnings.push(
        'FIELD_ENCRYPTION_KEY is recommended to be 64 hex characters (32 bytes).',
      );
    }

    // 3. Audit HMAC Secret Validation
    const hmacSecret =
      process.env.AUDIT_LOG_HMAC_SECRET || process.env.AUDIT_HMAC_SECRET;
    if (isProduction) {
      if (!hmacSecret || hmacSecret.trim() === '') {
        errors.push(
          'Missing mandatory environment variable in production: AUDIT_LOG_HMAC_SECRET',
        );
      } else if (hmacSecret.length < 32) {
        errors.push(
          'AUDIT_LOG_HMAC_SECRET must be at least 32 characters long in production.',
        );
      }
    } else if (hmacSecret && hmacSecret.length < 32) {
      warnings.push(
        'AUDIT_LOG_HMAC_SECRET is recommended to be at least 32 characters long in production.',
      );
    }

    // 4. Database URL Security Check
    const dbUrl = process.env.DATABASE_URL || '';
    if (
      dbUrl &&
      !dbUrl.startsWith('postgresql://') &&
      !dbUrl.startsWith('postgres://')
    ) {
      errors.push('DATABASE_URL must be a valid PostgreSQL connection string.');
    }

    // 5. Supabase URL Check
    const sbUrl = process.env.SUPABASE_URL || '';
    if (
      sbUrl &&
      !sbUrl.startsWith('http://') &&
      !sbUrl.startsWith('https://')
    ) {
      errors.push('SUPABASE_URL must be a valid HTTP/HTTPS URL.');
    }

    if (errors.length > 0) {
      this.logger.error(
        `[SECURITY CONFIG ERROR] Found ${errors.length} configuration violation(s): \n - ${errors.join('\n - ')}`,
      );
    }

    if (warnings.length > 0) {
      this.logger.warn(
        `[SECURITY CONFIG WARNING] \n - ${warnings.join('\n - ')}`,
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
