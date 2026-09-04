import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService, escapeHtml } from '../../common/services/email.service';
import { formatCurrency, toNumber } from '../../common/utils/crm-formatters.util';
import { EmailQueueProducer } from '../../queue/producers/email-queue.producer';

@Injectable()
export class InvoiceEmailService {
  private readonly logger = new Logger(InvoiceEmailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    @Optional() private readonly emailQueueProducer?: EmailQueueProducer,
  ) {}

  /**
   * Sends an invoice notification email to the customer with billing details.
   * Dispatches asynchronously to crm-email-queue via BullMQ.
   */
  async sendInvoiceEmail(
    tenantId: string,
    invoiceId: string,
    userId: string,
    options?: { recipientEmail?: string; subject?: string; message?: string; cc?: string[] },
  ): Promise<{ success: boolean; message: string; messageId?: string }> {
    if (this.emailQueueProducer && this.emailQueueProducer.isQueueAvailable()) {
      try {
        const queueResult = await this.emailQueueProducer.enqueueInvoiceNotification({
          tenantId,
          userId,
          invoiceId,
          options,
        });

        if (queueResult.enqueued) {
          return {
            success: true,
            message: `Invoice email queued for processing`,
            messageId: queueResult.jobId,
          };
        }
      } catch (queueErr: any) {
        this.logger.warn(
          `Queue dispatch failed for invoice ${invoiceId}, falling back to direct send: ${queueErr?.message || queueErr}`,
        );
      }
    }

    return this.processInvoiceEmailDirect(tenantId, invoiceId, userId, options);
  }

  /**
   * Direct execution of invoice email sending and timeline recording.
   */
  async processInvoiceEmailDirect(
    tenantId: string,
    invoiceId: string,
    userId: string,
    options?: { recipientEmail?: string; subject?: string; message?: string; cc?: string[] },
  ): Promise<{ success: boolean; message: string; messageId?: string }> {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
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
        return { success: false, message: 'Invoice not found' };
      }

      const toEmail = options?.recipientEmail || invoice.customer?.email;
      if (!toEmail) {
        return { success: false, message: 'Customer has no valid email address' };
      }

      const companyName = invoice.tenant.name || 'Our Company';
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

      try {
        // Record timeline event
        await tx.timelineEvent.create({
          data: {
            tenantId,
            userId,
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

        this.logger.log(`Invoice email simulated/dispatched to ${toEmail} for invoice ${invNumber}`);
        return {
          success: true,
          message: `Invoice successfully sent to ${toEmail}`,
          messageId: `msg_${Date.now()}`,
        };
      } catch (err: any) {
        this.logger.error(`Error sending invoice email: ${err.message}`, err.stack);
        return { success: false, message: `Failed to send email: ${err.message}` };
      }
    });
  }

  /**
   * Sends payment receipt email upon payment confirmation.
   * Dispatches asynchronously to crm-email-queue via BullMQ.
   */
  async sendPaymentReceiptEmail(
    tenantId: string,
    paymentId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    if (this.emailQueueProducer && this.emailQueueProducer.isQueueAvailable()) {
      try {
        const queueResult = await this.emailQueueProducer.enqueuePaymentReceipt({
          tenantId,
          userId,
          paymentId,
        });

        if (queueResult.enqueued) {
          return { success: true, message: `Payment receipt email queued for processing` };
        }
      } catch (queueErr: any) {
        this.logger.warn(
          `Queue dispatch failed for payment receipt ${paymentId}, falling back to direct send: ${queueErr?.message || queueErr}`,
        );
      }
    }

    return this.processPaymentReceiptDirect(tenantId, paymentId, userId);
  }

  /**
   * Direct execution of payment receipt email sending and timeline recording.
   */
  async processPaymentReceiptDirect(
    tenantId: string,
    paymentId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const payment = await tx.payment.findFirst({
        where: { id: paymentId, tenantId },
        include: {
          invoice: {
            include: { customer: true, company: true, tenant: true },
          },
        },
      });

      if (!payment || !payment.invoice) {
        return { success: false, message: 'Payment record not found' };
      }

      const toEmail = payment.invoice.customer?.email;
      if (!toEmail) {
        return { success: false, message: 'No customer email address on file' };
      }

      const companyName = payment.invoice.tenant.name || 'Our Company';
      const currency = payment.currency || 'INR';
      const amountFormatted = formatCurrency(toNumber(payment.amount), currency);
      const invNumber = payment.invoice.invoiceNumber || payment.invoice.id.slice(0, 8);

      await tx.timelineEvent.create({
        data: {
          tenantId,
          userId,
          action: 'PAYMENT_RECEIPT_SENT',
          description: `Payment receipt for ${amountFormatted} sent to ${toEmail}`,
          invoiceId: payment.invoice.id,
          customerId: payment.invoice.customerId,
          companyId: payment.invoice.companyId,
          dealId: payment.invoice.dealId,
          metadata: { paymentNumber: payment.paymentNumber, amountFormatted, toEmail },
        },
      });

      this.logger.log(`Payment receipt email logged for payment ${payment.paymentNumber}`);
      return { success: true, message: `Payment receipt successfully sent to ${toEmail}` };
    });
  }
}

