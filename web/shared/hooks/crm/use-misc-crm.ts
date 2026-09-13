"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/components/auth-provider";
import {
  fetchEmployees,
  fetchReportsData,
} from "@/shared/lib/api/crm";

export function useEmployees() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["employees"],
    queryFn: fetchEmployees,
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useReports(params?: Record<string, ReturnType<typeof JSON.parse>>) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["reports", params],
    queryFn: () => fetchReportsData(params),
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,  // Reports are heavy — cache for 2 min
    gcTime: 10 * 60 * 1000,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReturnType<typeof JSON.parse>) => import("@/shared/lib/api/crm").then(m => m.createMeeting(data)),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      if (variables.taskId) {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] });
      }
      if (variables.leadId) {
        queryClient.invalidateQueries({ queryKey: ["leadMeetings", variables.leadId] });
        queryClient.invalidateQueries({ queryKey: ["leadTimeline", variables.leadId] });
      }
      toast.success("Meeting scheduled successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to schedule meeting");
    },
  });
}
