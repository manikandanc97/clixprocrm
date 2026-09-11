import { SecurityConfigValidator } from '../common/utils/security-config.validator';

describe('P9 Final Production Security & Configuration Readiness Suite', () => {
  describe('1. Production Configuration Check', () => {
    it('detects insecure placeholder secrets and reports sanitized error without leaking secrets', () => {
      const originalEnv = { ...process.env };
      process.env.DATABASE_URL =
        'postgres://user:password_placeholder@localhost:5432/db';
      process.env.SUPABASE_URL = 'http://placeholder.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'placeholder_key';

      const validation = SecurityConfigValidator.validateEnvironment();
      expect(validation.valid).toBe(false);
      expect(
        validation.errors.some((e) =>
          e.toLowerCase().includes('insecure placeholder'),
        ),
      ).toBe(true);

      // Verify validation output does not contain raw passwords
      for (const err of validation.errors) {
        expect(err).not.toContain('password_placeholder');
      }

      process.env = originalEnv;
    });

    it('fails closed in production if FIELD_ENCRYPTION_KEY is missing or invalid length', () => {
      const originalEnv = { ...process.env };
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL =
        'postgresql://user:pass@ep-prd.aws.neon.tech/prod';
      process.env.SUPABASE_URL = 'https://prd.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'valid-production-anon-key-string-long';
      process.env.AUDIT_LOG_HMAC_SECRET = 'a'.repeat(32);
      delete process.env.FIELD_ENCRYPTION_KEY;

      const res1 = SecurityConfigValidator.validateEnvironment();
      expect(res1.valid).toBe(false);
      expect(res1.errors.some((e) => e.includes('FIELD_ENCRYPTION_KEY'))).toBe(
        true,
      );

      process.env.FIELD_ENCRYPTION_KEY = 'tooshort';
      const res2 = SecurityConfigValidator.validateEnvironment();
      expect(res2.valid).toBe(false);
      expect(res2.errors.some((e) => e.includes('64 hex characters'))).toBe(
        true,
      );

      process.env = originalEnv;
    });

    it('fails closed in production if AUDIT_LOG_HMAC_SECRET is missing or < 32 characters', () => {
      const originalEnv = { ...process.env };
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL =
        'postgresql://user:pass@ep-prd.aws.neon.tech/prod';
      process.env.SUPABASE_URL = 'https://prd.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'valid-production-anon-key-string-long';
      process.env.FIELD_ENCRYPTION_KEY = 'a'.repeat(64);
      delete process.env.AUDIT_LOG_HMAC_SECRET;
      delete process.env.AUDIT_HMAC_SECRET;

      const res1 = SecurityConfigValidator.validateEnvironment();
      expect(res1.valid).toBe(false);
      expect(res1.errors.some((e) => e.includes('AUDIT_LOG_HMAC_SECRET'))).toBe(
        true,
      );

      process.env.AUDIT_LOG_HMAC_SECRET = 'short-secret';
      const res2 = SecurityConfigValidator.validateEnvironment();
      expect(res2.valid).toBe(false);
      expect(res2.errors.some((e) => e.includes('32 characters'))).toBe(true);

      process.env = originalEnv;
    });

    it('passes production validation when all mandatory security secrets are valid', () => {
      const originalEnv = { ...process.env };
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL =
        'postgresql://user:securepass@ep-prd.aws.neon.tech/prod';
      process.env.SUPABASE_URL = 'https://prd.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'valid-production-anon-key-string-long';
      process.env.FIELD_ENCRYPTION_KEY = 'f'.repeat(64);
      process.env.AUDIT_LOG_HMAC_SECRET = 'b'.repeat(48);

      const res = SecurityConfigValidator.validateEnvironment();
      expect(res.valid).toBe(true);
      expect(res.errors.length).toBe(0);

      process.env = originalEnv;
    });
  });
});
