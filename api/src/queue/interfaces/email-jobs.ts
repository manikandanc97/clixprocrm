import { BaseJobPayload } from './job-payloads';

/**
 * Constants for Email Job Names in ClixProCRM BullMQ Queue.
 */
export const EMAIL_JOB_NAMES = {
  SECURITY_ALERT: 'security-alert',
  INVOICE_NOTIFICATION: 'invoice-notification',
  PAYMENT_RECEIPT: 'payment-receipt',
  SUPPORT_TICKET: 'support-ticket',
} as const;

export type EmailJobName = (typeof EMAIL_JOB_NAMES)[keyof typeof EMAIL_JOB_NAMES];

/**
 * Payload for Security / New-Device Alert emails.
 * Avoids storing any passwords or session secrets in Redis.
 */
export interface SecurityAlertJobPayload extends BaseJobPayload {
  to: string;
  deviceType: string;
  browser: string;
  operatingSystem: string;
  ipAddress?: string | null;
  time?: string | Date;
}

/**
 * Payload for Invoice Notification emails.
 * Large HTML and attachments are NOT stored in Redis; the worker fetches DB records.
 */
export interface InvoiceNotificationJobPayload extends BaseJobPayload {
  invoiceId: string;
  options?: {
    recipientEmail?: string;
    subject?: string;
    message?: string;
    cc?: string[];
  };
}

/**
 * Payload for Payment Receipt emails.
 */
export interface PaymentReceiptJobPayload extends BaseJobPayload {
  paymentId: string;
}

/**
 * Payload for Support Ticket emails.
 * Binary buffers are NOT stored in Redis; only ticket references and metadata.
 */
export interface SupportTicketJobPayload extends BaseJobPayload {
  ticketId: string;
  subject: string;
  category: string;
  priority: string;
  description: string;
  diagnostics?: Record<string, any>;
  userEmail?: string;
  userName?: string;
  attachmentsCount?: number;
}

/**
 * Union of all supported transactional email payloads in Phase 2.1.3.
 */
export type EmailJobPayload =
  | SecurityAlertJobPayload
  | InvoiceNotificationJobPayload
  | PaymentReceiptJobPayload
  | SupportTicketJobPayload;
