import * as dns from 'dns';
import * as net from 'net';
import { URL } from 'url';

/**
 * Checks if an IPv4 address is in a private, loopback, link-local, or reserved range.
 */
export function isPrivateOrReservedIPv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Invalid format treated as unsafe
  }

  const [a, b] = parts;

  // Loopback (127.0.0.0/8)
  if (a === 127) return true;

  // Private RFC1918: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;

  // Link-local / Cloud Metadata (169.254.0.0/16)
  if (a === 169 && b === 254) return true;

  // Current network (0.0.0.0/8)
  if (a === 0) return true;

  // Carrier-grade NAT (100.64.0.0/10)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // Multicast / Reserved (224.0.0.0/4, 240.0.0.0/4, 255.255.255.255)
  if (a >= 224) return true;

  return false;
}

/**
 * Checks if an IPv6 address is in a private, loopback, or link-local range.
 */
export function isPrivateOrReservedIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // Loopback ::1
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;

  // Unspecified ::
  if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true;

  // Link-local fe80::/10
  if (
    normalized.startsWith('fe80:') ||
    normalized.startsWith('fe90:') ||
    normalized.startsWith('fea0:') ||
    normalized.startsWith('feb0:')
  ) {
    return true;
  }

  // Unique local fc00::/7 (fc00:: and fd00::)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;

  // IPv4-mapped IPv6 ::ffff:x.x.x.x
  if (normalized.includes('::ffff:')) {
    const ipv4Part = normalized.split('::ffff:')[1];
    if (ipv4Part && net.isIPv4(ipv4Part)) {
      return isPrivateOrReservedIPv4(ipv4Part);
    }
  }

  return false;
}

/**
 * Validates a target URL against SSRF vulnerabilities.
 */
export async function validateSafeUrlForFetch(
  rawUrl: string,
): Promise<{ safe: boolean; reason?: string }> {
  try {
    const parsed = new URL(rawUrl);

    // Only HTTP and HTTPS allowed
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, reason: `Disallowed protocol: ${parsed.protocol}` };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check dangerous hostnames
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local') ||
      hostname === 'metadata.google.internal' ||
      hostname === 'instance-data'
    ) {
      return { safe: false, reason: `Blocked private hostname: ${hostname}` };
    }

    // If hostname is directly an IP
    if (net.isIPv4(hostname)) {
      if (isPrivateOrReservedIPv4(hostname)) {
        return {
          safe: false,
          reason: `Blocked private or reserved IPv4 address: ${hostname}`,
        };
      }
      return { safe: true };
    }

    if (net.isIPv6(hostname)) {
      if (isPrivateOrReservedIPv6(hostname)) {
        return {
          safe: false,
          reason: `Blocked private or reserved IPv6 address: ${hostname}`,
        };
      }
      return { safe: true };
    }

    // DNS lookup to prevent DNS rebinding / private IP resolution
    return new Promise((resolve) => {
      dns.lookup(hostname, { all: true }, (err, addresses) => {
        if (err || !addresses || addresses.length === 0) {
          resolve({
            safe: false,
            reason: `DNS resolution failed for hostname: ${hostname}`,
          });
          return;
        }

        for (const addr of addresses) {
          if (addr.family === 4 && isPrivateOrReservedIPv4(addr.address)) {
            resolve({
              safe: false,
              reason: `Hostname resolves to private IPv4 address: ${addr.address}`,
            });
            return;
          }
          if (addr.family === 6 && isPrivateOrReservedIPv6(addr.address)) {
            resolve({
              safe: false,
              reason: `Hostname resolves to private IPv6 address: ${addr.address}`,
            });
            return;
          }
        }

        resolve({ safe: true });
      });
    });
  } catch (e: any) {
    return { safe: false, reason: `Invalid URL format: ${e?.message || e}` };
  }
}
