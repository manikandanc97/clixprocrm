import { BaseJobPayload } from './job-payloads';

/**
 * Constants for Webhook Job Names in ClixProCRM BullMQ Queue.
 */
export const WEBHOOK_JOB_NAMES = {
  BILLING_WEBHOOK: 'billing-webhook',
} as const;

export type WebhookJobName =
  (typeof WEBHOOK_JOB_NAMES)[keyof typeof WEBHOOK_JOB_NAMES];

/**
 * Strongly typed payload for asynchronous billing webhook processing.
 *
 * Extends BaseJobPayload to enforce multi-tenant isolation, distributed tracing,
 * and deterministic job identity.
 *
 * PAYLOAD HYGIENE & SECURITY:
 * Stored in Redis. Only minimal normalized data required by the worker is retained.
 * Strictly NO secrets, signing secrets, API keys, credentials, or raw body blobs.
 */
export interface BillingWebhookJobPayload extends BaseJobPayload {
  /**
   * Authoritative payment provider event ID (e.g. evt_xxxx or razorpay event id).
   */
  providerEventId: string;

  /**
   * Gateway provider source.
   */
  provider: 'RAZORPAY' | 'STRIPE' | 'MANUAL';

  /**
   * Gateway event type (e.g. "payment.captured", "order.paid").
   */
  eventType: string;

  /**
   * Payment / transaction status normalized from the gateway.
   */
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'REFUNDED';

  /**
   * Target subscription plan identifier (normalized).
   */
  planId?: string;

  /**
   * Billing cadence.
   */
  billingCycle?: 'monthly' | 'annual';

  /**
   * Number of purchased seats.
   */
  seats?: number;

  /**
   * Associated provider order identifier.
   */
  orderId?: string;

  /**
   * Associated provider payment identifier.
   */
  paymentId?: string;

  /**
   * Transaction amount in minor units (or normalized integer).
   */
  amount: number;

  /**
   * Three-letter currency code (e.g. "INR", "USD").
   */
  currency: string;

  /**
   * ISO 8601 string of provider event timestamp.
   */
  eventTimestamp?: string;
}

/**
 * Union of all supported webhook job payloads in ClixProCRM.
 */
export type WebhookJobPayload = BillingWebhookJobPayload;
