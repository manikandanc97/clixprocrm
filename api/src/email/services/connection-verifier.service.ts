import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as net from 'net';
import * as tls from 'tls';
import * as dns from 'dns';
import { isPrivateOrReservedIPv4, isPrivateOrReservedIPv6 } from '../../common/utils/ssrf.util';

export interface SmtpVerifyParams {
  host: string;
  port: number;
  secure?: boolean;
  user?: string;
  pass?: string;
}

export interface ImapVerifyParams {
  host: string;
  port: number;
  secure?: boolean;
  user?: string;
  pass?: string;
}

export interface VerificationResult {
  success: boolean;
  smtp?: { success: boolean; error?: string };
  imap?: { success: boolean; error?: string };
}

@Injectable()
export class ConnectionVerifierService {
  private readonly logger = new Logger(ConnectionVerifierService.name);

  /**
   * Asserts that a host does not point to internal, private, loopback, or cloud metadata endpoints.
   */
  async assertSafeHost(host: string): Promise<void> {
    if (!host || typeof host !== 'string') {
      throw new BadRequestException('Host is required and must be a valid string');
    }

    const trimmed = host.trim().toLowerCase();

    if (
      trimmed === 'localhost' ||
      trimmed.endsWith('.localhost') ||
      trimmed.endsWith('.internal') ||
      trimmed.endsWith('.local') ||
      trimmed === 'instance-data' ||
      trimmed === 'metadata.google.internal'
    ) {
      throw new BadRequestException(`Connection refused: Host '${host}' is blocked for security`);
    }

    if (net.isIPv4(trimmed) && isPrivateOrReservedIPv4(trimmed)) {
      throw new BadRequestException(`Connection refused: IPv4 address '${host}' is in a reserved network`);
    }

    if (net.isIPv6(trimmed) && isPrivateOrReservedIPv6(trimmed)) {
      throw new BadRequestException(`Connection refused: IPv6 address '${host}' is in a reserved network`);
    }

    // Resolve hostname to ensure it doesn't resolve to private IP (DNS rebinding prevention)
    await new Promise<void>((resolve, reject) => {
      dns.lookup(trimmed, { all: true }, (err, addresses) => {
        if (err || !addresses || addresses.length === 0) {
          return reject(new BadRequestException(`DNS resolution failed for host: ${host}`));
        }
        for (const addr of addresses) {
          if (addr.family === 4 && isPrivateOrReservedIPv4(addr.address)) {
            return reject(new BadRequestException(`Connection refused: Host resolves to private IPv4 address`));
          }
          if (addr.family === 6 && isPrivateOrReservedIPv6(addr.address)) {
            return reject(new BadRequestException(`Connection refused: Host resolves to private IPv6 address`));
          }
        }
        resolve();
      });
    });
  }

  /**
   * Verifies an SMTP server connection and credentials using Nodemailer.
   * Plaintext credentials exist strictly in local memory and are never persisted or logged.
   */
  async verifySmtp(params: SmtpVerifyParams): Promise<{ success: boolean; error?: string }> {
    try {
      await this.assertSafeHost(params.host);

      const transporter = nodemailer.createTransport({
        host: params.host,
        port: params.port,
        secure: params.secure ?? (params.port === 465),
        auth:
          params.user && params.pass
            ? {
                user: params.user,
                pass: params.pass,
              }
            : undefined,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });

      await transporter.verify();
      return { success: true };
    } catch (err: any) {
      this.logger.warn(`SMTP verification failed for ${params.host}:${params.port}: ${err?.message || err}`);
      return {
        success: false,
        error: this.sanitizeErrorMessage(err?.message || 'SMTP connection or authentication failed'),
      };
    }
  }

  /**
   * Verifies an IMAP server connection and credentials using Node.js TLS/TCP sockets.
   * Performs protocol handshake and LOGIN verification, then issues LOGOUT.
   */
  async verifyImap(params: ImapVerifyParams): Promise<{ success: boolean; error?: string }> {
    try {
      await this.assertSafeHost(params.host);

      const port = params.port || 993;
      const isSecure = params.secure !== undefined ? params.secure : port === 993;

      return await new Promise<{ success: boolean; error?: string }>((resolve) => {
        let socket: net.Socket | tls.TLSSocket;
        let isResolved = false;
        let buffer = '';

        const timer = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            try {
              socket.destroy();
            } catch {}
            resolve({ success: false, error: 'IMAP connection timed out after 10 seconds' });
          }
        }, 10000);

        const safeResolve = (result: { success: boolean; error?: string }) => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timer);
            try {
              socket.destroy();
            } catch {}
            resolve(result);
          }
        };

        const onData = (data: Buffer) => {
          buffer += data.toString('utf8');

          // 1. Initial greeting
          if (buffer.includes('* OK') && !buffer.includes('A01 ')) {
            if (!params.user || !params.pass) {
              // No credentials to test, connection alone verified
              socket.write('A01 LOGOUT\r\n');
              safeResolve({ success: true });
              return;
            }

            // Send LOGIN
            const safeUser = (params.user || '').replace(/["\\]/g, '\\$&');
            const safePass = (params.pass || '').replace(/["\\]/g, '\\$&');
            socket.write(`A01 LOGIN "${safeUser}" "${safePass}"\r\n`);
            return;
          }

          // 2. Auth response
          if (buffer.includes('A01 OK')) {
            socket.write('A02 LOGOUT\r\n');
            safeResolve({ success: true });
          } else if (buffer.includes('A01 NO') || buffer.includes('A01 BAD')) {
            socket.write('A02 LOGOUT\r\n');
            safeResolve({ success: false, error: 'IMAP authentication failed: Invalid credentials or rejected command' });
          }
        };

        try {
          if (isSecure) {
            socket = tls.connect(
              {
                host: params.host,
                port,
                rejectUnauthorized: true,
                timeout: 10000,
              },
              () => {
                socket.on('data', onData);
              },
            );
          } else {
            socket = net.connect(
              {
                host: params.host,
                port,
                timeout: 10000,
              },
              () => {
                socket.on('data', onData);
              },
            );
          }

          socket.on('error', (err: any) => {
            safeResolve({
              success: false,
              error: this.sanitizeErrorMessage(err?.message || 'IMAP socket connection error'),
            });
          });
        } catch (connectErr: any) {
          safeResolve({
            success: false,
            error: this.sanitizeErrorMessage(connectErr?.message || 'Failed to initialize IMAP connection'),
          });
        }
      });
    } catch (err: any) {
      this.logger.warn(`IMAP verification failed for ${params.host}:${params.port}: ${err?.message || err}`);
      return {
        success: false,
        error: this.sanitizeErrorMessage(err?.message || 'IMAP connection verification failed'),
      };
    }
  }

  /**
   * Sanitizes error messages to ensure passwords or auth tokens never appear in exceptions.
   */
  private sanitizeErrorMessage(msg: string): string {
    return msg
      .replace(/password[:=]\s*[^\s,;]+/gi, 'password=***')
      .replace(/bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer ***');
  }
}
