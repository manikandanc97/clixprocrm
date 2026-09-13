"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/components/auth-provider";
import {
  fetchDealsData,
  createDeal,
  updateDeal,
} from "@/shared/lib/api/crm";

export function useDeals() {
  const { isAuthenticated, isHydrated } = useAuth();
  return useQuery({
    queryKey: ["deals"],
    queryFn: fetchDealsData,
    enabled: isHydrated && isAuthenticated,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => import("@/shared/lib/api/crm").then(m => m.deleteDeal(id)),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["deals"] });
      await queryClient.cancelQueries({ queryKey: ["pipeline"] });
      
      const previousDeals = queryClient.getQueriesData({ queryKey: ["deals"] });
      const previousPipeline = queryClient.getQueriesData({ queryKey: ["pipeline"] });

      queryClient.setQueriesData({ queryKey: ["deals"] }, (old: unknown) => {
        if (!old || typeof old !== 'object' || !('deals' in old)) return old;
        const cache = old as { deals: { id: string }[]; pagination?: { total: number } };
        return {
          ...cache,
          deals: cache.deals.filter((deal) => deal.id !== id),
          pagination: { ...cache.pagination, total: Math.max(0, (cache.pagination?.total || 1) - 1) }
        };
      });
      
      queryClient.setQueriesData({ queryKey: ["pipeline"] }, (old: unknown) => {
        if (!old || typeof old !== 'object' || !('items' in old)) return old;
        const cache = old as { items: { id: string }[] };
        return {
          ...cache,
          items: cache.items.filter((item) => item.id !== id)
        };
      });

      return { previousDeals, previousPipeline };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousDeals) {
        context.previousDeals.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
      }
      if (context?.previousPipeline) {
        context.previousPipeline.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
      }
      toast.error(error.message || "Failed to delete deal");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    },
  });
}

export function useBulkDeleteDeals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => import("@/shared/lib/api/crm").then(m => m.bulkDeleteDeals(ids)),
    onMutate: async (ids: string[]) => {
      await queryClient.cancelQueries({ queryKey: ["deals"] });
      await queryClient.cancelQueries({ queryKey: ["pipeline"] });
      
      const previousDeals = queryClient.getQueriesData({ queryKey: ["deals"] });
      const previousPipeline = queryClient.getQueriesData({ queryKey: ["pipeline"] });
      const idSet = new Set(ids);

      queryClient.setQueriesData({ queryKey: ["deals"] }, (old: unknown) => {
        if (!old || typeof old !== 'object' || !('deals' in old)) return old;
        const cache = old as { deals: { id: string }[]; pagination?: { total: number } };
        return {
          ...cache,
          deals: cache.deals.filter((deal) => !idSet.has(deal.id)),
          pagination: { ...cache.pagination, total: Math.max(0, (cache.pagination?.total || 1) - ids.length) }
        };
      });
      
      queryClient.setQueriesData({ queryKey: ["pipeline"] }, (old: unknown) => {
        if (!old || typeof old !== 'object' || !('items' in old)) return old;
        const cache = old as { items: { id: string }[] };
        return {
          ...cache,
          items: cache.items.filter((item) => !idSet.has(item.id))
        };
      });

      return { previousDeals, previousPipeline };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousDeals) {
        context.previousDeals.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
      }
      if (context?.previousPipeline) {
        context.previousPipeline.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
      }
      toast.error(error.message || "Failed to delete deals");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    },
  });
}

// ─── Lead Details Hooks ──────────────────────────────────────────────────────────


export function useCreateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createDeal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });
      toast.success("Deal created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create deal");
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateDeal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });
      toast.success("Deal updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update deal");
    },
  });
}

