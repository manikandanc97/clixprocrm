import { Injectable, Logger, Optional } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { getSharedRedisClient } from '../utils/rate-limit.util';
import { EmailQueueProducer } from '../../queue/producers/email-queue.producer';

export function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function normalizeKeyPart(str?: string | null): string {
  if (!str || typeof str !== 'string') return 'unknown';
  return str.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
}

export function buildAlertDeduplicationKey(
  userId: string,
  browser: string,
  operatingSystem: string,
  deviceType?: string,
): string {
  const normUser = userId.trim();
  const normBrowser = normalizeKeyPart(browser);
  const normOS = normalizeKeyPart(operatingSystem);
  const normDevice = normalizeKeyPart(deviceType || 'desktop');
  return `new-device-alert:${normUser}:${normBrowser}:${normOS}:${normDevice}`;
}

export function getAlertCooldownSeconds(): number {
  const rawHours = process.env.NEW_DEVICE_ALERT_COOLDOWN_HOURS;
  if (!rawHours) return 24 * 3600;
  const parsed = Number(rawHours);
  if (isNaN(parsed) || parsed <= 0 || !Number.isFinite(parsed)) {
    return 24 * 3600;
  }
  return Math.floor(parsed * 3600);
}

export interface NewDeviceAlertPayload {
  to: string;
  deviceType: string;
  browser: string;
  operatingSystem: string;
  ipAddress?: string | null;
  time?: Date | string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private customRedisClient?: any;

  constructor(
    @Optional() customRedisClient?: any,
    @Optional() private readonly emailQueueProducer?: EmailQueueProducer,
  ) {
    this.customRedisClient = customRedisClient;
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }


  /**
   * P2 Distributed Redis Alert Deduplication
   *
   * Uses atomic Redis SET NX with TTL (default 24 hours) to prevent duplicate
   * email and in-app alerts across multiple server instances / containers.
   *
   * Returns true only on the first new-device alert within the cooldown window.
   */
  async shouldSendNewDeviceAlert(
    userId: string,
    browser: string,
    operatingSystem: string,
    deviceType?: string,
  ): Promise<boolean> {
    if (!userId) return false;

    const redis =
      this.customRedisClient !== undefined
        ? this.customRedisClient
        : getSharedRedisClient();

    if (!redis) {
      this.logger.warn(
        'Redis is not configured. Suppressing duplicate-sensitive security alerts to prevent notification flooding.',
      );
      return false;
    }

    try {
      const key = buildAlertDeduplicationKey(
        userId,
        browser,
        operatingSystem,
        deviceType,
      );
      const ttlSeconds = getAlertCooldownSeconds();

      // Atomic SET NX with TTL (seconds)
      const result = await redis.set(key, '1', { nx: true, ex: ttlSeconds });

      // If key did not exist, Upstash Redis returns 'OK' (truthy) -> send alert
      // If key already exists, returns null (falsy) -> suppress duplicate alert
      return Boolean(result);
    } catch (err: any) {
      this.logger.warn(
        `Redis error during alert deduplication check: ${err?.message || err}. Suppressing alert to prevent spam.`,
      );
      return false;
    }
  }


  /**
   * Asynchronously send a transactional security alert when a new device / browser signs in.
   *
   * Architectural Flow:
   * - Enqueues a job to crm-email-queue via BullMQ for asynchronous background delivery.
   * - Gracefully falls back to direct SMTP delivery if queue is unavailable (e.g. unit tests).
   *
   * Guarantees:
   * - HTML-escaped dynamic values
   * - Zero credential / secret exposure
   * - Graceful failure (never throws, returns boolean status)
   */
  async sendNewDeviceAlert(
    payload: NewDeviceAlertPayload,
    context?: { tenantId?: string; userId?: string; correlationId?: string },
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { to, deviceType, browser, operatingSystem, ipAddress, time } = payload;

    if (!to || typeof to !== 'string' || !to.includes('@')) {
      this.logger.warn('Skipping new device alert email: No valid recipient email address provided.');
      return { success: false, error: 'Invalid recipient email' };
    }

    // Try enqueuing to BullMQ if producer is available
    if (this.emailQueueProducer && this.emailQueueProducer.isQueueAvailable()) {
      try {
        const queueResult = await this.emailQueueProducer.enqueueSecurityAlert({
          tenantId: context?.tenantId || 'system',
          userId: context?.userId || 'system',
          correlationId: context?.correlationId,
          to,
          deviceType,
          browser,
          operatingSystem,
          ipAddress,
          time,
        });

        if (queueResult.enqueued) {
          return { success: true, messageId: queueResult.jobId };
        }
      } catch (queueErr: any) {
        this.logger.warn(
          `Queue dispatch failed, falling back to direct delivery: ${queueErr?.message || queueErr}`,
        );
      }
    }

    // Direct SMTP delivery fallback
    return this.executeDirectNewDeviceAlert(payload);
  }

  /**
   * Direct execution of new-device alert SMTP delivery.
   */
  async executeDirectNewDeviceAlert(
    payload: NewDeviceAlertPayload,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { to, deviceType, browser, operatingSystem, ipAddress, time } = payload;

    if (!to || typeof to !== 'string' || !to.includes('@')) {
      return { success: false, error: 'Invalid recipient email' };
    }

    const safeDeviceType = escapeHtml(deviceType || 'Unknown Device');
    const safeBrowser = escapeHtml(browser || 'Unknown Browser');
    const safeOS = escapeHtml(operatingSystem || 'Unknown OS');
    const safeIp = escapeHtml(ipAddress || 'Unknown IP');
    const loginTime = time ? new Date(time).toUTCString() : new Date().toUTCString();
    const safeTime = escapeHtml(loginTime);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.clixprocrm.com';
    const securitySettingsUrl = `${appUrl}/settings`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 24px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">ClixProCRM Security Alert</h2>
        </div>
        <div style="padding: 24px;">
          <h3 style="margin-top: 0; color: #0f172a; font-size: 16px;">New Sign-In Detected</h3>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            Your ClixProCRM account was just signed in from a new device or browser environment.
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; font-size: 13px; text-align: left; border-collapse: collapse;">
              <tbody>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 140px;">Device Type:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${safeDeviceType}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Browser:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${safeBrowser}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Operating System:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${safeOS}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Approximate IP:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-family: monospace;">${safeIp}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Time (UTC):</td>
                  <td style="padding: 6px 0; color: #0f172a;">${safeTime}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p style="font-size: 13px; line-height: 1.6; color: #dc2626; font-weight: 600;">
            If this wasn't you, revoke this session immediately from Security Settings and update your password.
          </p>

          <div style="text-align: center; margin: 28px 0 12px 0;">
            <a href="${securitySettingsUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 20px; font-size: 13px; font-weight: 600; border-radius: 6px;">
              Manage Active Sessions
            </a>
          </div>
        </div>
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
          This is an automated security notification sent to ${escapeHtml(to)}.
        </div>
      </div>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"ClixProCRM Security" <no-reply@clixprocrm.com>',
        to,
        subject: 'New sign-in detected on your ClixProCRM account',
        html: htmlContent,
      });

      this.logger.log(`New device security alert sent successfully (ID: ${info?.messageId || 'sent'})`);
      return { success: true, messageId: info?.messageId };
    } catch (err: any) {
      this.logger.warn(`Failed to deliver new device security alert email: ${err?.message || err}`);
      return { success: false, error: err?.message || 'SMTP delivery failure' };
    }
  }
}

