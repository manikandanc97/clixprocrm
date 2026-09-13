"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/components/auth-provider";
import {
  fetchCompaniesData,
  createCompany,
  updateCompany,
} from "@/shared/lib/api/crm";

export function useCompanies() {
  const { isAuthenticated, isHydrated } = useAuth();
  return useQuery({
    queryKey: ["companies"],
    queryFn: fetchCompaniesData,
    enabled: isHydrated && isAuthenticated,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => import("@/shared/lib/api/crm").then(m => m.deleteCompany(id)),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["companies"] });
      const previousData = queryClient.getQueriesData({ queryKey: ["companies"] });

      queryClient.setQueriesData({ queryKey: ["companies"] }, (old: unknown) => {
        if (!old || typeof old !== 'object' || !('companies' in old)) return old;
        const cache = old as { companies: { id: string }[]; pagination?: { total: number } };
        return {
          ...cache,
          companies: cache.companies.filter((company) => company.id !== id),
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
      toast.error(error.message || "Failed to delete company");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    }
  });
}

export function useBulkDeleteCompanies() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => import("@/shared/lib/api/crm").then(m => m.bulkDeleteCompanies(ids)),
    onMutate: async (ids: string[]) => {
      await queryClient.cancelQueries({ queryKey: ["companies"] });
      const previousData = queryClient.getQueriesData({ queryKey: ["companies"] });

      queryClient.setQueriesData({ queryKey: ["companies"] }, (old: unknown) => {
        if (!old || typeof old !== 'object' || !('companies' in old)) return old;
        const cache = old as { companies: { id: string }[]; pagination?: { total: number } };
        const idsSet = new Set(ids);
        return {
          ...cache,
          companies: cache.companies.filter((company) => !idsSet.has(company.id)),
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
      toast.error(error.message || "Failed to delete companies");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    }
  });
}


export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create company");
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update company");
    },
  });
}

// ─── Invoice hooks ────────────────────────────────────────────────────────────
