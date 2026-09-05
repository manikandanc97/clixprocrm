/**
 * @file shared/lib/api/companies.api.ts
 * Companies-related API endpoints.
 */
import client from "./client";
import { ApiResponseType } from "@/shared/types/api";

async function unwrapResponse<T>(request: Promise<{ data: ApiResponseType<T> }>) {
  try {
    const response = await request;
    if (!response.data?.success || response.data.data === undefined) {
      throw new Error(response.data?.message || "Invalid API response.");
    }
    return response.data.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: unknown } } };
    const msg = err?.response?.data?.message;
    if (msg) {
      if (typeof msg === 'string') throw new Error(msg);
      else if (typeof msg === 'object' && msg !== null) {
        throw new Error((msg as { message?: string }).message || JSON.stringify(msg));
      }
    }
    throw error;
  }
}

export function fetchCompaniesData() {
  return unwrapResponse<{ companies: unknown[] }>(client.get("/crm/companies"));
}

export function createCompany(data: Record<string, unknown>) {
  return unwrapResponse<{ id: string }>(client.post("/crm/companies", data));
}

export function updateCompany(id: string, data: Record<string, unknown>) {
  return unwrapResponse<{ id: string }>(client.patch(`/crm/companies/${id}`, data));
}

export function deleteCompany(id: string) {
  return unwrapResponse<{ id: string }>(client.delete(`/crm/companies/${id}`));
}

export function bulkDeleteCompanies(ids: string[]) {
  return unwrapResponse<{ count: number }>(client.post("/crm/companies/bulk", { ids }));
}

export function reassignIndustry(oldIndustry: string, newIndustry: string) {
  return unwrapResponse<{ count: number }>(
    client.post("/crm/companies/reassign-industry", { oldIndustry, newIndustry })
  );
}

export function mergeCompanies(primaryId: string, secondaryId: string) {
  return unwrapResponse<{ success: boolean; primaryId: string; secondaryId: string }>(
    client.post("/crm/companies/merge", { primaryId, secondaryId })
  );
}

