"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/components/auth-provider";
import {
  fetchCustomersData,
  createCustomer,
  updateCustomer,
} from "@/shared/lib/api/crm";

export function useCustomers(
  params?: import("@/shared/lib/api/crm").CustomersQueryParams,
  options?: { enabled?: boolean }
) {
  const { isAuthenticated, isHydrated } = useAuth();
  const isEnabled = (options?.enabled !== undefined ? options.enabled : true) && isHydrated && isAuthenticated;
  return useQuery({
    queryKey: params && Object.keys(params).length > 0 ? ["customers", params] : ["customers"],
    queryFn: () => fetchCustomersData(params),
    enabled: isEnabled,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      toast.success("Customer created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create customer");
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<import('@/shared/types/customer').CustomerType> }) => updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      toast.success("Customer updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update customer");
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => import("@/shared/lib/api/crm").then(m => m.deleteCustomer(id)),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["customers"] });
      const previousData = queryClient.getQueriesData({ queryKey: ["customers"] });

      queryClient.setQueriesData({ queryKey: ["customers"] }, (old: unknown) => {
        if (!old || typeof old !== 'object' || !('customers' in old)) return old;
        const cache = old as { customers: { id: string }[]; pagination?: { total: number } };
        return {
          ...cache,
          customers: cache.customers.filter((customer) => customer.id !== id),
          pagination: { ...cache.pagination, total: Math.max(0, (cache.pagination?.total || 1) - 1) }
        };
      });

      return { previousData };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || "Failed to delete customer");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    }
  });
}

export function useBulkDeleteCustomers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => import("@/shared/lib/api/crm").then(m => m.bulkDeleteCustomers(ids)),
    onMutate: async (ids: string[]) => {
      await queryClient.cancelQueries({ queryKey: ["customers"] });
      const previousData = queryClient.getQueriesData({ queryKey: ["customers"] });

      queryClient.setQueriesData({ queryKey: ["customers"] }, (old: unknown) => {
        if (!old || typeof old !== 'object' || !('customers' in old)) return old;
        const cache = old as { customers: { id: string }[]; pagination?: { total: number } };
        const idsSet = new Set(ids);
        return {
          ...cache,
          customers: cache.customers.filter((customer) => !idsSet.has(customer.id)),
          pagination: { ...cache.pagination, total: Math.max(0, (cache.pagination?.total || 1) - ids.length) }
        };
      });

      return { previousData };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || "Failed to delete customers");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    }
  });
}

