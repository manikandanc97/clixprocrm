/**
 * @file shared/lib/api/customers.api.ts
 * Customers-related API endpoints.
 */
import client from "./client";
import { ApiResponseType } from "@/shared/types/api";
import { CustomersDataType, CustomerType } from "@/shared/types/customer";

async function unwrapResponse<T>(request: Promise<{ data: ApiResponseType<T> }>) {
  try {
    const response = await request;
    if (!response.data?.success || response.data.data === undefined) {
      throw new Error(response.data?.message || "Invalid API response.");
    }
    return response.data.data;
  } catch (error: any) {
    const msg = error.response?.data?.message;
    if (msg) {
      if (typeof msg === 'string') throw new Error(msg);
      else if (typeof msg === 'object') throw new Error(msg.message || JSON.stringify(msg));
    }
    throw error;
  }
}

export interface CustomersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export function fetchCustomersData(params?: CustomersQueryParams) {
  return unwrapResponse<CustomersDataType>(client.get("/crm/customers", { params }));
}

export function createCustomer(data: Partial<CustomerType>) {
  return unwrapResponse<CustomerType>(client.post("/crm/customers", data));
}

export function updateCustomer(id: string, data: Partial<CustomerType>) {
  return unwrapResponse<CustomerType>(client.patch(`/crm/customers/${id}`, data));
}

export function deleteCustomer(id: string) {
  return unwrapResponse<{ id: string }>(client.delete(`/crm/customers/${id}`));
}

export function bulkDeleteCustomers(ids: string[]) {
  return unwrapResponse<{ count: number }>(client.post("/crm/customers/bulk", { ids }));
}

