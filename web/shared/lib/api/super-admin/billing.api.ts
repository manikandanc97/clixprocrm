import client from "../client";

export interface PlatformBillingOverviewData {
  kpis: {
    mrr: number;
    mrrFormatted: string;
    arr: number;
    arrFormatted: string;
    totalRevenue: number;
    totalRevenueFormatted: string;
    paidRevenue: number;
    paidRevenueFormatted: string;
    pendingRevenue: number;
    pendingRevenueFormatted: string;
    overdueRevenue: number;
    overdueRevenueFormatted: string;
    totalRefunds?: number;
    totalRefundsFormatted?: string;
    paidSubscriptions?: number;
    pendingInvoicesCount?: number;
    activeSubscriptions: number;
    totalSubscriptions: number;
    totalOrganizations: number;
  };
  planDistribution: Array<{ count: number; name: string; revenue: number; percentage?: number }>;
  monthlyTrend: Array<{ month: string; revenue: number; projected?: number; invoicesCount: number }>;
  config: Record<string, unknown>;
}

export interface PlatformSubscriptionItem {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantLogo?: string | null;
  planId: string;
  planName: string;
  billingCycle: string;
  seats: number;
  status: string;
  unitPrice: number;
  recurringAmount: number;
  recurringAmountFormatted: string;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialStart?: string | null;
  trialEnd?: string | null;
  cancelAtPeriodEnd: boolean;
  latestInvoice?: PlatformInvoiceItemData | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformInvoiceItemData {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantLogo?: string | null;
  tenantGstin?: string | null;
  subscriptionId?: string | null;
  invoiceNumber: string;
  planName: string;
  billingCycle: string;
  seats: number;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  totalAmountFormatted: string;
  paidAmount: number;
  paidAmountFormatted: string;
  status: string;
  paymentStatus: string;
  paidAt?: string | null;
  createdAt: string;
}

export const fetchPlatformBillingOverview = async (): Promise<PlatformBillingOverviewData> => {
  const response = await client.get<{ success: boolean; data: PlatformBillingOverviewData }>(
    "/super-admin/billing/overview"
  );
  return response.data.data;
};

export const fetchPlatformSubscriptions = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  planId?: string;
  status?: string;
}) => {
  const response = await client.get<{
    success: boolean;
    subscriptions: PlatformSubscriptionItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>("/super-admin/billing/subscriptions", { params });
  return response.data;
};

export interface PlatformBillingSettingsData {
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
  [key: string]: unknown;
}

export const createOrUpdatePlatformSubscription = async (data: {
  tenantId: string;
  planId: string;
  billingCycle?: "monthly" | "annual";
  seats?: number;
  status?: string;
}): Promise<{ success: boolean; data: PlatformSubscriptionItem }> => {
  const response = await client.post<{ success: boolean; data: PlatformSubscriptionItem }>(
    "/super-admin/billing/subscriptions",
    data
  );
  return response.data;
};

export const fetchPlatformInvoices = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  paymentStatus?: string;
  tenantId?: string;
}) => {
  const response = await client.get<{
    success: boolean;
    invoices: PlatformInvoiceItemData[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>("/super-admin/billing/invoices", { params });
  return response.data;
};

export const fetchPlatformInvoiceById = async (id: string): Promise<PlatformInvoiceItemData> => {
  const response = await client.get<{ success: boolean; data: PlatformInvoiceItemData }>(
    `/super-admin/billing/invoices/${id}`
  );
  return response.data.data;
};

export const processPlatformRefund = async (
  invoiceId: string,
  data: { amount: number; reason: string; paymentId?: string }
): Promise<{ success: boolean; data: Record<string, unknown> }> => {
  const response = await client.post<{ success: boolean; data: Record<string, unknown> }>(
    `/super-admin/billing/invoices/${invoiceId}/refund`,
    data
  );
  return response.data;
};

export const fetchPlatformBillingSettings = async (): Promise<PlatformBillingSettingsData> => {
  const response = await client.get<{ success: boolean; data: PlatformBillingSettingsData }>(
    "/super-admin/billing/settings"
  );
  return response.data.data;
};

export const updatePlatformBillingSettings = async (
  data: Partial<PlatformBillingSettingsData>
): Promise<PlatformBillingSettingsData> => {
  const response = await client.put<{ success: boolean; data: PlatformBillingSettingsData }>(
    "/super-admin/billing/settings",
    data
  );
  return response.data.data;
};

// ----------------------------------------------------
// Support Ticket Platform Operations
// ----------------------------------------------------

