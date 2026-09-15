export class CreatePlatformPlanDto {
  id?: string;
  name: string;
  description?: string;
  price?: string;
  priceNum?: number;
  annualPriceNum?: number;
  currency?: string;
  billing?: string;
  pricingMode?: 'FIXED' | 'CUSTOM';
  features?: string[];
  maxUsers?: number;
  maxLeads?: number;
  maxContacts?: number;
  storageGb?: number;
  maxApiRequests?: number;
  trialDays?: number;
  billingCycleMonthly?: boolean;
  billingCycleAnnual?: boolean;
  highlight?: boolean;
  isActive?: boolean;
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  sortOrder?: number;

  // AI Entitlement Configuration
  aiEnabled?: boolean;
  aiLevel?: string;
  dailyTokenLimit?: number;
  defaultModelId?: string;
  allowedModelIds?: string[];
}

export class UpdatePlatformPlanDto {
  name?: string;
  description?: string;
  price?: string;
  priceNum?: number;
  annualPriceNum?: number;
  currency?: string;
  billing?: string;
  pricingMode?: 'FIXED' | 'CUSTOM';
  features?: string[];
  maxUsers?: number;
  maxLeads?: number;
  maxContacts?: number;
  storageGb?: number;
  maxApiRequests?: number;
  trialDays?: number;
  billingCycleMonthly?: boolean;
  billingCycleAnnual?: boolean;
  highlight?: boolean;
  isActive?: boolean;
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  sortOrder?: number;

  // AI Entitlement Configuration
  aiEnabled?: boolean;
  aiLevel?: string;
  dailyTokenLimit?: number;
  defaultModelId?: string;
  allowedModelIds?: string[];
}
