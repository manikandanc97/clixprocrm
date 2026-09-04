import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_NAMES } from '../queue.constants';
import {
  EMAIL_JOB_NAMES,
  EmailJobPayload,
  SecurityAlertJobPayload,
  InvoiceNotificationJobPayload,
  PaymentReceiptJobPayload,
  SupportTicketJobPayload,
} from '../interfaces/email-jobs';
import { escapeHtml } from '../../common/services/email.service';
import { formatCurrency, toNumber } from '../../common/utils/crm-formatters.util';

@Processor(QUEUE_NAMES.EMAIL)
export class EmailQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailQueueProcessor.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly prisma: PrismaService) {
    super();
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

  async process(job: Job<EmailJobPayload, any, string>): Promise<any> {
    this.logger.log(
      `[EMAIL WORKER] Processing job "${job.name}" (ID: ${job.id}, Tenant: ${job.data.tenantId}, Correlation: ${job.data.correlationId})`,
    );

    try {
      switch (job.name) {
        case EMAIL_JOB_NAMES.SECURITY_ALERT:
          return await this.handleSecurityAlert(job.data as SecurityAlertJobPayload);

        case EMAIL_JOB_NAMES.INVOICE_NOTIFICATION:
          return await this.handleInvoiceNotification(
            job.data as InvoiceNotificationJobPayload,
          );

        case EMAIL_JOB_NAMES.PAYMENT_RECEIPT:
          return await this.handlePaymentReceipt(
            job.data as PaymentReceiptJobPayload,
          );

        case EMAIL_JOB_NAMES.SUPPORT_TICKET:
          return await this.handleSupportTicket(
            job.data as SupportTicketJobPayload,
          );

        default:
          this.logger.warn(`[EMAIL WORKER] Unknown email job type received: "${job.name}"`);
          return { skipped: true, reason: `Unknown job type: ${job.name}` };
      }
    } catch (err: any) {
      this.logger.error(
        `[EMAIL WORKER] Job "${job.name}" (ID: ${job.id}) failed: ${err?.message || err}`,
        err?.stack,
      );
      // Re-throw so BullMQ triggers bounded exponential retry
      throw err;
    }
  }

  /**
   * Processes Security / New Device Alert email delivery.
   */
  private async handleSecurityAlert(
    payload: SecurityAlertJobPayload,
  ): Promise<{ success: boolean; messageId?: string; skipped?: boolean }> {
    const { to, deviceType, browser, operatingSystem, ipAddress, time } = payload;

    if (!to || typeof to !== 'string' || !to.includes('@')) {
      this.logger.warn('[EMAIL WORKER] Skipping security alert: Invalid recipient email.');
      return { success: false, skipped: true };
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

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      this.logger.warn('[EMAIL WORKER] SMTP configuration not set; security alert delivery simulated.');
      return { success: true, messageId: `sim_${Date.now()}` };
    }

    const info = await this.transporter.sendMail({
      from: process.env.SMTP_FROM || '"ClixProCRM Security" <no-reply@clixprocrm.com>',
      to,
      subject: 'New sign-in detected on your ClixProCRM account',
      html: htmlContent,
    });

    this.logger.log(`[EMAIL WORKER] Security alert sent to ${to} (Message ID: ${info?.messageId || 'sent'})`);
    return { success: true, messageId: info?.messageId };
  }

  /**
   * Processes Invoice Notification email delivery and records timeline event.
   * Multi-tenant safety enforced via withTenantContext.
   */
  private async handleInvoiceNotification(
    payload: InvoiceNotificationJobPayload,
  ): Promise<{ success: boolean; message: string; messageId?: string }> {
    const { tenantId, userId, invoiceId, options } = payload;

    return this.prisma.withTenantContext({ tenantId, userId }, async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, tenantId },
        include: {
          customer: true,
          company: true,
          tenant: true,
          items: true,
        },
      });

      if (!invoice) {
        this.logger.warn(`[EMAIL WORKER] Invoice ${invoiceId} not found in tenant ${tenantId}`);
        return { success: false, message: 'Invoice not found' };
      }

      const toEmail = options?.recipientEmail || invoice.customer?.email;
      if (!toEmail) {
        this.logger.warn(`[EMAIL WORKER] Customer for invoice ${invoiceId} has no valid email`);
        return { success: false, message: 'Customer has no valid email address' };
      }

      const companyName = invoice.tenant?.name || 'Our Company';
      const currency = invoice.currency || 'INR';
      const invNumber = invoice.invoiceNumber || invoice.id.slice(0, 8);
      const totalFormatted = formatCurrency(toNumber(invoice.totalAmount || invoice.amount), currency);
      const dueFormatted = invoice.dueDate
        ? new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Due upon receipt';

      const subject = options?.subject || `Invoice ${invNumber} from ${companyName}`;
      const customMsg = options?.message
        ? `<p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">${escapeHtml(options.message)}</p>`
        : '';

      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 24px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">${escapeHtml(companyName)}</h2>
            <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0 0;">TAX INVOICE</p>
          </div>
          <div style="padding: 24px;">
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
              Dear ${escapeHtml(invoice.customer?.name || 'Customer')},
            </p>
            ${customMsg}
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
              Please find the invoice summary below:
            </p>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
              <table style="width: 100%; font-size: 13px; text-align: left; border-collapse: collapse;">
                <tbody>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Invoice Number:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;">${escapeHtml(invNumber)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Due Date:</td>
                    <td style="padding: 6px 0; color: #0f172a; text-align: right;">${dueFormatted}</td>
                  </tr>
                  <tr style="border-top: 1px solid #e2e8f0;">
                    <td style="padding: 8px 0 0 0; color: #0f172a; font-weight: 700; font-size: 15px;">Total Due:</td>
                    <td style="padding: 8px 0 0 0; color: #4f46e5; font-weight: 800; font-size: 16px; text-align: right;">${totalFormatted}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p style="font-size: 13px; line-height: 1.6; color: #64748b;">
              If you have any questions concerning this invoice, please do not hesitate to contact us.
            </p>
          </div>
          <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
            Thank you for your business!
          </div>
        </div>
      `;

      let messageId = `msg_${Date.now()}`;
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        const info = await this.transporter.sendMail({
          from: process.env.SMTP_FROM || `"${companyName}" <billing@clixprocrm.com>`,
          to: toEmail,
          cc: options?.cc,
          subject,
          html: htmlContent,
        });
        messageId = info?.messageId || messageId;
      }

      // Record timeline event
      await tx.timelineEvent.create({
        data: {
          tenantId,
          userId: userId || undefined,
          action: 'INVOICE_SENT',
          description: `Invoice ${invNumber} sent to ${toEmail} (${totalFormatted})`,
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          companyId: invoice.companyId,
          dealId: invoice.dealId,
          metadata: { toEmail, totalFormatted, invNumber },
        },
      });

      // Update invoice status if in DRAFT
      if (invoice.status === 'DRAFT') {
        await tx.invoice.update({
          where: { id: invoiceId, tenantId },
          data: { status: 'SENT', sentAt: new Date() },
        });
      }

      this.logger.log(`[EMAIL WORKER] Invoice email dispatched to ${toEmail} for invoice ${invNumber}`);
      return {
        success: true,
        message: `Invoice successfully sent to ${toEmail}`,
        messageId,
      };
    });
  }

  /**
   * Processes Payment Receipt email delivery and records timeline event.
   * Multi-tenant safety enforced via withTenantContext.
   */
  private async handlePaymentReceipt(
    payload: PaymentReceiptJobPayload,
  ): Promise<{ success: boolean; message: string }> {
    const { tenantId, userId, paymentId } = payload;

    return this.prisma.withTenantContext({ tenantId, userId }, async (tx) => {
      const payment = await tx.payment.findFirst({
        where: { id: paymentId, tenantId },
        include: {
          invoice: {
            include: { customer: true, company: true, tenant: true },
          },
        },
      });

      if (!payment || !payment.invoice) {
        this.logger.warn(`[EMAIL WORKER] Payment ${paymentId} or linked invoice not found in tenant ${tenantId}`);
        return { success: false, message: 'Payment record not found' };
      }

      const toEmail = payment.invoice.customer?.email;
      if (!toEmail) {
        this.logger.warn(`[EMAIL WORKER] Customer for payment ${paymentId} has no email address`);
        return { success: false, message: 'No customer email address on file' };
      }

      const companyName = payment.invoice.tenant?.name || 'Our Company';
      const currency = payment.currency || 'INR';
      const amountFormatted = formatCurrency(toNumber(payment.amount), currency);
      const invNumber = payment.invoice.invoiceNumber || payment.invoice.id.slice(0, 8);

      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        await this.transporter.sendMail({
          from: process.env.SMTP_FROM || `"${companyName}" <billing@clixprocrm.com>`,
          to: toEmail,
          subject: `Payment Receipt: ${payment.paymentNumber} for Invoice ${invNumber}`,
          html: `<p>Thank you! We received your payment of ${amountFormatted} for invoice ${invNumber}.</p>`,
        });
      }

      await tx.timelineEvent.create({
        data: {
          tenantId,
          userId: userId || undefined,
          action: 'PAYMENT_RECEIPT_SENT',
          description: `Payment receipt for ${amountFormatted} sent to ${toEmail}`,
          invoiceId: payment.invoice.id,
          customerId: payment.invoice.customerId,
          companyId: payment.invoice.companyId,
          dealId: payment.invoice.dealId,
          metadata: { paymentNumber: payment.paymentNumber, amountFormatted, toEmail },
        },
      });

      this.logger.log(`[EMAIL WORKER] Payment receipt email logged for payment ${payment.paymentNumber}`);
      return { success: true, message: `Payment receipt successfully sent to ${toEmail}` };
    });
  }

  /**
   * Processes Support Ticket email notification to the support team.
   */
  private async handleSupportTicket(
    payload: SupportTicketJobPayload,
  ): Promise<{ success: boolean; messageId?: string }> {
    const {
      ticketId,
      subject,
      category,
      priority,
      description,
      diagnostics,
      userEmail,
      userName,
      userId,
      attachmentsCount = 0,
    } = payload;

    const safeSubject = escapeHtml(subject);
    const safeCategory = escapeHtml(category);
    const safePriority = escapeHtml(priority);
    const safeDescription = escapeHtml(description);

    const safeDiagnostics = {
      currentUserName: escapeHtml(diagnostics?.currentUserName || userName || 'N/A'),
      email: escapeHtml(diagnostics?.email || userEmail || 'N/A'),
      userId: escapeHtml(diagnostics?.userId || userId || 'N/A'),
      role: escapeHtml(diagnostics?.role || 'N/A'),
      currentUrl: escapeHtml(diagnostics?.currentUrl || 'N/A'),
      browser: escapeHtml(diagnostics?.browser || 'N/A'),
      operatingSystem: escapeHtml(diagnostics?.operatingSystem || 'N/A'),
      deviceType: escapeHtml(diagnostics?.deviceType || 'N/A'),
      screenResolution: escapeHtml(diagnostics?.screenResolution || 'N/A'),
      timezone: escapeHtml(diagnostics?.timezone || 'N/A'),
      appVersion: escapeHtml(diagnostics?.appVersion || 'N/A'),
      timestamp: escapeHtml(diagnostics?.timestamp || new Date().toISOString()),
    };

    const priorityColor =
      priority === 'Critical'
        ? '#ef4444'
        : priority === 'High'
          ? '#f97316'
          : priority === 'Medium'
            ? '#eab308'
            : '#10b981';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background-color: #0f172a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">Clixpro CRM Support Ticket</h2>
        </div>
        <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <p><strong>Ticket ID:</strong> ${escapeHtml(ticketId)}</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
          <p><strong>Category:</strong> ${safeCategory}</p>
          <p><strong>Priority:</strong> <span style="background-color: ${priorityColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${safePriority}</span></p>
          
          <div style="margin: 20px 0; padding: 15px; background-color: #f8fafc; border-radius: 4px; white-space: pre-wrap;">
            <strong>Description:</strong><br/>
            ${safeDescription}
          </div>
          
          <h3 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">User & System Diagnostics</h3>
          <table style="width: 100%; font-size: 13px; text-align: left; border-collapse: collapse;">
            <tbody>
              <tr><th style="padding: 4px;">User Name:</th><td>${safeDiagnostics.currentUserName}</td></tr>
              <tr><th style="padding: 4px;">Email:</th><td>${safeDiagnostics.email}</td></tr>
              <tr><th style="padding: 4px;">User ID:</th><td>${safeDiagnostics.userId}</td></tr>
              <tr><th style="padding: 4px;">Role:</th><td>${safeDiagnostics.role}</td></tr>
              <tr><th style="padding: 4px;">Current URL:</th><td>${safeDiagnostics.currentUrl}</td></tr>
              <tr><th style="padding: 4px;">Browser:</th><td>${safeDiagnostics.browser}</td></tr>
              <tr><th style="padding: 4px;">OS:</th><td>${safeDiagnostics.operatingSystem}</td></tr>
              <tr><th style="padding: 4px;">Device:</th><td>${safeDiagnostics.deviceType}</td></tr>
              <tr><th style="padding: 4px;">Resolution:</th><td>${safeDiagnostics.screenResolution}</td></tr>
              <tr><th style="padding: 4px;">Timezone:</th><td>${safeDiagnostics.timezone}</td></tr>
              <tr><th style="padding: 4px;">App Version:</th><td>${safeDiagnostics.appVersion}</td></tr>
              <tr><th style="padding: 4px;">Submitted At:</th><td>${safeDiagnostics.timestamp}</td></tr>
            </tbody>
          </table>
          
          <p style="margin-top: 20px; font-size: 13px; color: #64748b;">
            <em>Attachments: ${attachmentsCount} files included.</em>
          </p>
        </div>
      </div>
    `;

    const supportRecipient = process.env.SUPPORT_EMAIL || 'support@clixprocrm.com';

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      this.logger.warn('[EMAIL WORKER] SMTP configuration not found, skipping email dispatch.');
      return { success: true, messageId: `sim_${Date.now()}` };
    }

    const info = await this.transporter.sendMail({
      from: `"Clixpro Support" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: supportRecipient,
      subject: `[ClixProCRM Support] #${ticketId} - ${subject.slice(0, 80)}`,
      html: htmlContent,
    });

    this.logger.log(`[EMAIL WORKER] Support ticket email delivered for #${ticketId}`);
    return { success: true, messageId: info?.messageId };
  }
}
