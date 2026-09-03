/**
 * ClixProCRM Payment Provider Abstraction Interface
 * 
 * Provides a normalized gateway contract decoupling business logic
 * from Razorpay, Stripe, and built-in simulation/test engines.
 */

export interface CreateOrderParams {
  tenantId: string;
  planId: string;
  planName: string;
  billingCycle: 'monthly' | 'annual';
  seats: number;
  amountInMinorUnits: number; // Integer minor units: e.g. 49900 paise for ₹499
  currency: string;           // "INR" | "USD"
  customerEmail?: string;
  customerName?: string;
  notes?: Record<string, string>;
}

export interface PaymentOrderResult {
  provider: 'RAZORPAY' | 'STRIPE' | 'MANUAL';
  orderId: string;
  amount: number;             // Minor units
  currency: string;
  keyId?: string;             // Public key for frontend checkout widget
  checkoutUrl?: string;       // Hosted checkout session URL (for Stripe)
  metadata?: Record<string, any>;
}

export interface VerifySignatureParams {
  orderId: string;
  paymentId: string;
  signature: string;
  secret?: string;
}

export interface WebhookVerificationParams {
  rawBody: string | Buffer;
  signature: string;
  secret: string;
}

export interface NormalizedWebhookEvent {
  provider: 'RAZORPAY' | 'STRIPE' | 'MANUAL';
  eventId: string;
  eventType: string;          // e.g. "payment.captured", "order.paid", "subscription.cancelled"
  tenantId?: string;
  planId?: string;
  billingCycle?: 'monthly' | 'annual';
  seats?: number;
  orderId?: string;
  paymentId?: string;
  amount: number;             // Minor units
  currency: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'REFUNDED';
  rawPayload: any;
  eventTimestamp: Date;
}

export interface ProcessRefundParams {
  paymentId: string;
  amountInMinorUnits: number;
  currency: string;
  reason: string;
}

export interface RefundResult {
  refundId: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  rawResponse?: any;
}

export interface IPaymentGatewayAdapter {
  readonly providerName: 'RAZORPAY' | 'STRIPE' | 'MANUAL';

  createOrder(params: CreateOrderParams): Promise<PaymentOrderResult>;

  verifyPaymentSignature(params: VerifySignatureParams): boolean;

  verifyAndParseWebhook(params: WebhookVerificationParams): Promise<NormalizedWebhookEvent | null>;

  processRefund(params: ProcessRefundParams): Promise<RefundResult>;
}
