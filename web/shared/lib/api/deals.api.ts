/**
 * @file shared/lib/api/deals.api.ts
 * Deals and pipeline API endpoints.
 */
import axios from "axios";
import client from "./client";
import { ApiResponseType } from "@/shared/types/api";
import { PipelineDataType, PipelineLeadType } from "@/shared/types/pipeline";

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

export function fetchDealsData() {
  return unwrapResponse<{ deals: unknown[] }>(client.get("/crm/deals"));
}

export function fetchPipelineData() {
  return unwrapResponse<PipelineDataType>(client.get("/crm/pipeline"));
}

export function createDeal(data: Record<string, unknown>) {
  return unwrapResponse<{ id: string }>(client.post("/crm/deals", data));
}

export function updateDeal(id: string, data: Record<string, unknown>) {
  return unwrapResponse<{ id: string }>(client.patch(`/crm/deals/${id}`, data));
}

export function deleteDeal(id: string) {
  return unwrapResponse<{ id: string }>(client.delete(`/crm/deals/${id}`));
}

export function bulkDeleteDeals(ids: string[]) {
  return unwrapResponse<{ count: number }>(client.post("/crm/deals/bulk", { ids }));
}

export function updatePipelineItem(id: string, data: Record<string, unknown>) {
  return unwrapResponse<PipelineLeadType | { id: string }>(client.patch(`/crm/pipeline/${id}`, data));
}

