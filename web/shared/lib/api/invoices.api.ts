import client from "./client";

export interface InvoiceItemPayload {
  id?: string;
  productId?: string;
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discountType?: "PERCENTAGE" | "FIXED";
  discountValue?: number;
  taxRate?: number;
  sortOrder?: number;
}

export interface CreateInvoicePayload {
  customerId?: string;
  companyId?: string;
  dealId?: string;
  quotationId?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  currency?: string;
  paymentTerms?: string;
  status?: string;
  items: InvoiceItemPayload[];
  discountType?: "PERCENTAGE" | "FIXED";
  discountValue?: number;
  notes?: string;
  termsAndConditions?: string;
  customerBillingAddress?: any;
  orgBillingAddress?: any;
}

export interface RecordPaymentPayload {
  amount: number;
  currency?: string;
  paymentMethod: string;
  paymentDate?: string;
  referenceNumber?: string;
  notes?: string;
  status?: "SUCCESS" | "PENDING" | "FAILED";
  sendReceiptEmail?: boolean;
}

export interface SendInvoicePayload {
  recipientEmail?: string;
  subject?: string;
  message?: string;
  cc?: string[];
}

export interface InvoiceSettingsData {
  id?: string;
  tenantId?: string;
  invoicePrefix?: string;
  nextInvoiceNumber?: number;
  financialYear?: string;
  gstin?: string;
  pan?: string;
  legalName?: string;
  billingAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  upiId?: string;
  defaultNotes?: string;
  defaultTerms?: string;
  taxType?: string;
  defaultTaxRate?: number;
}

export async function fetchInvoices(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  customerId?: string;
  companyId?: string;
  dealId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", params.page.toString());
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  if (params?.customerId) query.set("customerId", params.customerId);
  if (params?.companyId) query.set("companyId", params.companyId);
  if (params?.dealId) query.set("dealId", params.dealId);
  if (params?.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params?.dateTo) query.set("dateTo", params.dateTo);

  const res = await client.get(`/crm/invoices?${query.toString()}`);
  return res.data;
}

export async function fetchInvoiceById(id: string) {
  const res = await client.get(`/crm/invoices/${id}`);
  return res.data;
}

export async function createInvoice(payload: CreateInvoicePayload) {
  const res = await client.post("/crm/invoices", payload);
  return res.data;
}

export async function updateInvoice(id: string, payload: Partial<CreateInvoicePayload>) {
  const res = await client.patch(`/crm/invoices/${id}`, payload);
  return res.data;
}

export async function deleteInvoice(id: string) {
  const res = await client.delete(`/crm/invoices/${id}`);
  return res.data;
}

export async function sendInvoiceEmail(id: string, payload?: SendInvoicePayload) {
  const res = await client.post(`/crm/invoices/${id}/send`, payload || {});
  return res.data;
}

export async function fetchInvoicePdfHtml(id: string) {
  const res = await client.get(`/crm/invoices/${id}/pdf`, { responseType: "text" });
  return res.data;
}

export async function fetchPayments(params?: {
  page?: number;
  limit?: number;
  invoiceId?: string;
  status?: string;
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", params.page.toString());
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.invoiceId) query.set("invoiceId", params.invoiceId);
  if (params?.status) query.set("status", params.status);

  const res = await client.get(`/crm/payments?${query.toString()}`);
  return res.data;
}

export async function recordInvoicePayment(invoiceId: string, payload: RecordPaymentPayload) {
  const res = await client.post(`/crm/payments/invoice/${invoiceId}`, payload);
  return res.data;
}

export async function deletePayment(paymentId: string) {
  const res = await client.delete(`/crm/payments/${paymentId}`);
  return res.data;
}

export async function fetchInvoiceSettings() {
  const res = await client.get("/crm/invoice-settings");
  return res.data;
}

export async function updateInvoiceSettings(payload: Partial<InvoiceSettingsData>) {
  const res = await client.put("/crm/invoice-settings", payload);
  return res.data;
}
