export class UpdatePlatformBillingConfigDto {
  companyLegalName?: string;
  billingAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  gstin?: string;
  pan?: string;
  invoicePrefix?: string;
  currency?: string;
  taxRate?: number;
  paymentTermsDays?: number;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolder?: string;
  upiId?: string;
  paymentGateway?: string;
  webhookSecret?: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  stripePublishableKey?: string;
  stripeSecretKey?: string;
}

export class CreatePlatformSubscriptionDto {
  tenantId: string;
  planId: string;
  billingCycle?: 'monthly' | 'annual';
  seats?: number;
  status?: string;
}

export class RecordPlatformPaymentDto {
  amount: number;
  paymentMethod?: string;
  gatewayProvider?: string;
  gatewayTransactionId?: string;
  notes?: string;
  status?: 'SUCCESS' | 'PENDING' | 'FAILED';
}

export class ProcessPlatformRefundDto {
  amount: number;
  reason: string;
  paymentId?: string;
}
