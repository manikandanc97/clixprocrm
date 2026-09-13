"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/components/auth-provider";
import {
  fetchPipelineData,
  updatePipelineItem,
} from "@/shared/lib/api/crm";

export function usePipeline() {
  const { isAuthenticated, isHydrated } = useAuth();
  return useQuery({
    queryKey: ["pipeline"],
    queryFn: fetchPipelineData,
    enabled: isHydrated && isAuthenticated,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useUpdatePipelineItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, ReturnType<typeof JSON.parse>> }) => updatePipelineItem(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["pipeline"] });
      const previousPipeline = queryClient.getQueryData(["pipeline"]);

      queryClient.setQueryData(["pipeline"], (old: ReturnType<typeof JSON.parse>) => {
        if (!old || !old.items) return old;
        return {
          ...old,
          items: old.items.map((item: ReturnType<typeof JSON.parse>) => 
            item.id === id 
              ? { ...item, ...data } 
              : item
          )
        };
      });

      return { previousPipeline };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousPipeline) {
        queryClient.setQueryData(["pipeline"], context.previousPipeline);
      }
      toast.error(error.message || "Failed to update pipeline stage");
    },
    onSettled: (_data, _error, _variables) => {
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onSuccess: () => {
      // Toast is handled in the component
    },
  });
}

