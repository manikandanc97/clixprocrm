import { PlanDefinition, MatrixCategory } from './plan-definitions.constant';

export interface WorkspaceUsageStats {
  users: {
    current: number;
    limit: number;
    remaining: number;
    percentage: number;
    isLimitReached: boolean;
  };
  contacts: {
    current: number;
    limit: number;
    remaining: number;
    percentage: number;
    isLimitReached: boolean;
  };
  leads: {
    current: number;
    limit: number;
    remaining: number;
    percentage: number;
    isLimitReached: boolean;
  };
  tasks: {
    current: number;
    limit: number;
    remaining: number;
    percentage: number;
    isLimitReached: boolean;
  };
  pipelines: {
    current: number;
    limit: number;
    remaining: number;
    percentage: number;
    isLimitReached: boolean;
  };
  customFields: {
    current: number;
    limit: number;
    remaining: number;
    percentage: number;
    isLimitReached: boolean;
  };
  deals: {
    current: number;
    limit: number;
    remaining: number;
    percentage: number;
    isLimitReached: boolean;
  };
  automations: {
    current: number;
    limit: number;
    remaining: number;
    percentage: number;
    isLimitReached: boolean;
  };
  storageGb: {
    current: number;
    limit: number;
    remaining: number;
    percentage: number;
    isLimitReached: boolean;
  };
  apiRequests: {
    current: number;
    limit: number;
    remaining: number;
    percentage: number;
    isLimitReached: boolean;
  };
}

export interface WorkspaceSubscriptionDetails {
  tenantId: string;
  tenantName: string;
  tenantType: 'CUSTOMER' | 'PLATFORM';
  isPlatformTenant: boolean;
  planId: string;
  planName: string;
  status: string; // ACTIVE, TRIALING, PAST_DUE, CANCELED, EXPIRED, SUSPENDED
  billingCycle: 'monthly' | 'annual';
  trialStart?: string | null;
  trialEnd?: string | null;
  trialDaysRemaining?: number | null;
  currentPeriodEnd?: string | null;
  currency: string;
  seats: number;
  activeUsers: number;
  monthlyPricePerUser: number;
  annualPricePerUser: number;
  totalRecurringAmount: number;
  plan: PlanDefinition;
  usage: WorkspaceUsageStats;
  entitledFeatures: string[];
  availablePlans: PlanDefinition[];
  comparisonMatrix: MatrixCategory[];
}

export interface SubscriptionQuote {
  planId: string;
  planName: string;
  seats: number;
  billingCycle: 'monthly' | 'annual';
  currency: string;
  unitPricePerMonth: number;
  subtotal: number;
  annualDiscountPercentage: number;
  annualDiscountAmount: number;
  taxRatePercentage: number;
  taxAmount: number;
  totalAmount: number;
  totalAmountInMinorUnits: number; // Integer minor units (e.g. paise)
  recurringAmount: number;
  intervalDescription: string;
  isUpgrade: boolean;
  isDowngrade: boolean;
  effectiveImmediately: boolean;
}

export interface BillingInvoiceItem {
  id: string;
  invoiceNumber: string;
  date: string;
  description: string;
  planName: string;
  seats: number;
  amount: number;
  currency: string;
  status: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
  downloadUrl?: string | null;
}
