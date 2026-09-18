import {
    isPrivateOrReservedIPv4,
    isPrivateOrReservedIPv6,
    validateSafeUrlForFetch,
} from '../common/utils/ssrf.util';

describe('P5 SSRF & Safe URL Validation Suite', () => {
  describe('1. IPv4 Private & Reserved Ranges', () => {
    it('blocks loopback (127.0.0.1, 127.0.0.2)', () => {
      expect(isPrivateOrReservedIPv4('127.0.0.1')).toBe(true);
      expect(isPrivateOrReservedIPv4('127.0.10.50')).toBe(true);
    });

    it('blocks RFC1918 Class A (10.0.0.0/8)', () => {
      expect(isPrivateOrReservedIPv4('10.0.0.1')).toBe(true);
      expect(isPrivateOrReservedIPv4('10.254.1.1')).toBe(true);
    });

    it('blocks RFC1918 Class B (172.16.0.0/12)', () => {
      expect(isPrivateOrReservedIPv4('172.16.0.1')).toBe(true);
      expect(isPrivateOrReservedIPv4('172.31.255.254')).toBe(true);
      expect(isPrivateOrReservedIPv4('172.32.0.1')).toBe(false); // Public
    });

    it('blocks RFC1918 Class C (192.168.0.0/16)', () => {
      expect(isPrivateOrReservedIPv4('192.168.1.1')).toBe(true);
      expect(isPrivateOrReservedIPv4('192.168.100.200')).toBe(true);
      expect(isPrivateOrReservedIPv4('192.169.1.1')).toBe(false); // Public
    });

    it('blocks Cloud Metadata & Link-Local (169.254.169.254)', () => {
      expect(isPrivateOrReservedIPv4('169.254.169.254')).toBe(true);
      expect(isPrivateOrReservedIPv4('169.254.1.1')).toBe(true);
    });

    it('blocks 0.0.0.0/8 and broadcast/multicast', () => {
      expect(isPrivateOrReservedIPv4('0.0.0.0')).toBe(true);
      expect(isPrivateOrReservedIPv4('224.0.0.1')).toBe(true);
      expect(isPrivateOrReservedIPv4('255.255.255.255')).toBe(true);
    });

    it('allows valid public IPv4 addresses', () => {
      expect(isPrivateOrReservedIPv4('8.8.8.8')).toBe(false);
      expect(isPrivateOrReservedIPv4('1.1.1.1')).toBe(false);
      expect(isPrivateOrReservedIPv4('93.184.216.34')).toBe(false);
    });
  });

  describe('2. IPv6 Private & Loopback Ranges', () => {
    it('blocks IPv6 loopback (::1)', () => {
      expect(isPrivateOrReservedIPv6('::1')).toBe(true);
      expect(isPrivateOrReservedIPv6('0:0:0:0:0:0:0:1')).toBe(true);
    });

    it('blocks IPv6 link-local (fe80::/10)', () => {
      expect(isPrivateOrReservedIPv6('fe80::1')).toBe(true);
    });

    it('blocks IPv6 unique local (fc00::/7)', () => {
      expect(isPrivateOrReservedIPv6('fc00::1')).toBe(true);
      expect(isPrivateOrReservedIPv6('fd00::1')).toBe(true);
    });
  });

  describe('3. URL SSRF Validation', () => {
    it('blocks private IP URLs', async () => {
      const res = await validateSafeUrlForFetch('http://127.0.0.1:8080/admin');
      expect(res.safe).toBe(false);
      expect(res.reason).toContain('Blocked private or reserved IPv4 address');
    });

    it('blocks cloud metadata URLs', async () => {
      const res = await validateSafeUrlForFetch(
        'http://169.254.169.254/latest/meta-data/',
      );
      expect(res.safe).toBe(false);
      expect(res.reason).toContain('Blocked private or reserved IPv4 address');
    });

    it('blocks localhost hostname', async () => {
      const res = await validateSafeUrlForFetch('http://localhost:3000/api');
      expect(res.safe).toBe(false);
      expect(res.reason).toContain('Blocked private hostname');
    });

    it('blocks non-HTTP protocols (file:, ftp:, gopher:)', async () => {
      const res = await validateSafeUrlForFetch('file:///etc/passwd');
      expect(res.safe).toBe(false);
      expect(res.reason).toContain('Disallowed protocol');
    });
  });
});
