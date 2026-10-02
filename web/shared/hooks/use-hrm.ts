"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  fetchEmployees, 
  updateEmployee,
  toggleEmployeeStatus,
  deleteEmployee
} from "@/shared/lib/api/crm";
import { useAuth } from "@/features/auth/components/auth-provider";

export function useEmployees() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["employees"],
    queryFn: fetchEmployees,
    enabled: isAuthenticated,
    refetchInterval: 30000,
    staleTime: 30000,
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useToggleEmployeeStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "INACTIVE" | "SUSPENDED" }) => toggleEmployeeStatus(id, status as "ACTIVE" | "INACTIVE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

}
