import {
  sanitizeXss,
  sanitizeObjectXss,
} from '../common/utils/xss-sanitizer.util';
import { sanitizeRedirectUrl } from '../common/utils/redirect-security.util';
import { SecurityConfigValidator } from '../common/utils/security-config.validator';

describe('P5 Security Hardening & Sanitization Suite', () => {
  describe('1. XSS Payload Sanitization', () => {
    it('strips script tags and executable code', () => {
      const dirty = 'Hello <script>alert("XSS")</script> World';
      expect(sanitizeXss(dirty)).toBe('Hello  World');
    });

    it('strips inline event handlers (onerror, onload, onclick)', () => {
      const dirty =
        '<img src="x" onerror="alert(1)"> <a href="javascript:alert(2)">Click</a>';
      const clean = sanitizeXss(dirty);
      expect(clean).not.toContain('onerror');
      expect(clean).not.toContain('javascript:');
    });

    it('strips iframes, objects, and embed tags', () => {
      const dirty = '<iframe src="https://evil.com"></iframe>';
      expect(sanitizeXss(dirty)).toBe('');
    });

    it('recursively sanitizes nested objects and arrays', () => {
      const payload = {
        title: 'Report <script>evil()</script>',
        metadata: {
          comment: 'Good <img src=x onerror=alert(1)>',
          tags: ['safe', '<script>bad()</script>'],
        },
      };

      const sanitized = sanitizeObjectXss(payload);
      expect(sanitized.title).toBe('Report ');
      expect(sanitized.metadata.comment).not.toContain('onerror');
      expect(sanitized.metadata.tags[1]).toBe('');
    });
  });

  describe('2. Open Redirect Sanitization', () => {
    it('allows safe relative paths', () => {
      expect(sanitizeRedirectUrl('/dashboard')).toBe('/dashboard');
      expect(sanitizeRedirectUrl('/super-admin/security')).toBe(
        '/super-admin/security',
      );
      expect(sanitizeRedirectUrl('/leads?page=2')).toBe('/leads?page=2');
    });

    it('blocks protocol-relative URLs (//evil.com)', () => {
      expect(sanitizeRedirectUrl('//evil.com')).toBe('/dashboard');
      expect(sanitizeRedirectUrl('//google.com/phishing')).toBe('/dashboard');
    });

    it('blocks backslash evasion (/\\evil.com)', () => {
      expect(sanitizeRedirectUrl('/\\evil.com')).toBe('/dashboard');
    });

    it('blocks external untrusted domains', () => {
      expect(sanitizeRedirectUrl('https://evil-hacker.com/login')).toBe(
        '/dashboard',
      );
      expect(sanitizeRedirectUrl('javascript:alert(1)')).toBe('/dashboard');
    });

    it('allows configured frontend origins', () => {
      expect(sanitizeRedirectUrl('http://localhost:3000/settings')).toBe(
        'http://localhost:3000/settings',
      );
    });
  });

  describe('3. Security Configuration Validator', () => {
    it('detects missing or placeholder secrets', () => {
      const originalEnv = { ...process.env };
      delete process.env.DATABASE_URL;

      const res = SecurityConfigValidator.validateEnvironment();
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('DATABASE_URL'))).toBe(true);

      process.env = originalEnv;
    });
  });
});
