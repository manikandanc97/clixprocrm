/**
 * @file shared/types/invoice.ts
 * Canonical domain types for enterprise invoices, items, and payments.
 * Synchronized with backend Prisma schema and NestJS InvoicesController contracts.
 */

export type InvoiceStatus =
  | "DRAFT"
  | "SENT"
  | "VIEWED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED"
  | "VOID"
  | "REFUNDED";

export interface InvoiceItemType {
  id?: string;
  invoiceId?: string;
  productId?: string | null;
  name: string;
  description?: string | null;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
  discountType?: "PERCENTAGE" | "FIXED" | null;
  discountValue?: number | null;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  lineTotal?: number;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoicePaymentType {
  id: string;
  invoiceId: string;
  paymentNumber?: string;
  amount: number;
  currency?: string;
  paymentMethod: string;
  paymentDate?: string;
  referenceNumber?: string | null;
  notes?: string | null;
  status: "SUCCESS" | "PENDING" | "FAILED";
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceTimelineEventType {
  id: string;
  action: string;
  description?: string;
  createdAt: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface InvoiceType {
  id: string;
  tenantId?: string;
  customerId?: string | null;
  companyId?: string | null;
  dealId?: string | null;
  quotationId?: string | null;
  invoiceNumber?: string | null;
  invoiceDate: string;
  dueDate?: string | null;
  currency: string;
  paymentTerms?: string | null;
  status: InvoiceStatus | string;

  // Financial values
  amount?: number;
  subtotal: number;
  discountType?: "PERCENTAGE" | "FIXED" | null;
  discountValue?: number | null;
  discountAmount?: number;
  taxableAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  otherTaxAmount?: number;
  roundOff?: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;

  // Metadata & addresses
  notes?: string | null;
  termsAndConditions?: string | null;
  customerBillingAddress?: Record<string, unknown> | null;
  orgBillingAddress?: Record<string, unknown> | null;
  pdfUrl?: string | null;

  // Lifecycle
  createdById?: string | null;
  sentAt?: string | null;
  viewedAt?: string | null;
  paidAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;

  // Relations
  customer?: {
    id: string;
    name: string;
    company?: string | null;
    email?: string | null;
  } | null;
  company?: {
    id: string;
    name: string;
  } | null;
  deal?: {
    id: string;
    title: string;
  } | null;
  items?: InvoiceItemType[];
  payments?: InvoicePaymentType[];
  timelineEvents?: InvoiceTimelineEventType[];
}

export interface InvoicesListResponse {
  success: boolean;
  invoices: InvoiceType[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  currency?: string;
}
