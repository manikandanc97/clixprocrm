/**
 * @file shared/lib/api/quotations.api.ts
 * Quotations and invoices API endpoints.
 */
import axios from "axios";
import client from "./client";
import { ApiResponseType } from "@/shared/types/api";
import { QuotationsDataType, QuotationType } from "@/shared/types/quotation";
import { InvoiceType, InvoicesListResponse } from "@/shared/types/invoice";

async function unwrapResponse<T>(request: Promise<{ data: ApiResponseType<T> }>) {
  try {
    const response = await request;
    if (!response.data?.success || response.data.data === undefined) {
      throw new Error(response.data?.message || "Invalid API response.");
    }
    return response.data.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const msg = error.response?.data?.message;
      if (msg) {
        if (typeof msg === 'string') throw new Error(msg);
        else if (typeof msg === 'object' && msg !== null) {
          throw new Error((msg as { message?: string }).message || JSON.stringify(msg));
        }
      }
    }
    throw error;
  }
}

export function fetchQuotationsData() {
  return unwrapResponse<QuotationsDataType>(client.get("/crm/quotations"));
}

export function createQuotation(data: Partial<QuotationType>) {
  return unwrapResponse<QuotationType>(client.post("/crm/quotations", data));
}

export function updateQuotation(id: string, data: Partial<QuotationType>) {
  return unwrapResponse<QuotationType>(client.patch(`/crm/quotations/${id}`, data));
}

export function deleteQuotation(id: string) {
  return unwrapResponse<{ id: string }>(client.delete(`/crm/quotations/${id}`));
}

export function updateQuotationStatus(id: string, status: string) {
  return unwrapResponse<QuotationType>(client.patch(`/crm/quotations/${id}/status`, { status }));
}

export function fetchInvoicesData(params?: Record<string, unknown>) {
  const query = params
    ? "?" +
      new URLSearchParams(
        Object.entries(params).reduce((acc, [k, v]) => {
          if (v !== undefined && v !== null) acc[k] = String(v);
          return acc;
        }, {} as Record<string, string>)
      ).toString()
    : "";
  return unwrapResponse<InvoicesListResponse>(client.get(`/crm/invoices${query}`));
}

export function createInvoice(data: Record<string, unknown>) {
  return unwrapResponse<InvoiceType>(client.post("/crm/invoices", data));
}

export function updateInvoice(id: string, data: Record<string, unknown>) {
  return unwrapResponse<InvoiceType>(client.patch(`/crm/invoices/${id}`, data));
}

export function updateInvoiceStatus(id: string, status: string) {
  return unwrapResponse<InvoiceType>(client.patch(`/crm/invoices/${id}`, { status }));
}

export function deleteInvoice(id: string) {
  return unwrapResponse<{ id: string }>(client.delete(`/crm/invoices/${id}`));
}

