"use client";

import { LeadType } from "@/shared/types/lead";

export * from "./use-invoices";

import { useQuery } from "@tanstack/react-query";
import { 
  fetchCustomersData,
  fetchCompaniesData,
  fetchDealsData,
  fetchLeadsData,
  fetchPipelineData,
  fetchTasksData,
  fetchTaskDashboard,
  fetchTaskBoard,
  fetchTaskCalendar, 
  fetchQuotationsData,
  fetchEmployees,
  fetchReportsData,
  fetchTaskHistory,
  createLead,
  updateLead,
  deleteLead,
  createCustomer,
  updateCustomer,
  createDeal,
  updateDeal,
  createCompany,
  updateCompany,
  createTask,
  updateTask,
  updateTaskStatus,
  assignTask,
  completeTask,
  deleteTask,
  createQuotation,
  updateQuotation,
  updateQuotationStatus,
  updatePipelineItem,
  fetchLeadNotes,
  createLeadNote,
  fetchLeadTimeline,
  fetchLeadAttachments,
  createLeadAttachment,
  uploadLeadAttachment,
  deleteLeadAttachment,
  fetchLeadMeetings,
  createLeadMeeting,
  fetchInvoicesData,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  createTaskTimelineEvent,
  updateTaskProgressAPI,
  resolveTaskBlocker
} from "@/shared/lib/api/crm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/components/auth-provider";

export function useCustomers() {
  const { isAuthenticated, isHydrated } = useAuth();
  return useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomersData,
    enabled: isHydrated && isAuthenticated,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

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

export function useLeads() {
  const { isAuthenticated, isHydrated } = useAuth();
  return useQuery({
    queryKey: ["leads"],
    queryFn: fetchLeadsData,
    enabled: isHydrated && isAuthenticated,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

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

export function useTasks(params?: Record<string, ReturnType<typeof JSON.parse>>) {
  const { isAuthenticated, isHydrated } = useAuth();
  return useQuery({
    queryKey: params && Object.keys(params).length > 0 ? ["tasks", params] : ["tasks"],
    queryFn: () => fetchTasksData(params),
    enabled: isHydrated && isAuthenticated,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useTaskDashboard() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["tasks-dashboard"],
    queryFn: fetchTaskDashboard,
    enabled: isAuthenticated,
    staleTime: 3 * 60 * 1000,
  });
}

export function useTaskBoard(search?: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["tasks-board", search],
    queryFn: () => fetchTaskBoard(search),
    enabled: isAuthenticated,
    staleTime: 3 * 60 * 1000,
  });
}

export function useTaskHistory(taskId: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["tasks-history", taskId],
    queryFn: () => fetchTaskHistory(taskId),
    enabled: isAuthenticated && !!taskId,
    staleTime: 1 * 60 * 1000,
  });
}

export function useTaskCalendar(startDate?: string, endDate?: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["tasks-calendar", startDate, endDate],
    queryFn: () => fetchTaskCalendar(startDate, endDate),
    enabled: isAuthenticated,
    staleTime: 3 * 60 * 1000,
  });
}

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

export function useQuotations() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["quotations"],
    queryFn: fetchQuotationsData,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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
export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Lead created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create lead");
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<Partial<LeadType>, "notes"> & { wonReason?: string; lostReason?: string; wonDate?: string; actualRevenue?: number; competitor?: string; notes?: string | unknown[] } }) => updateLead(id, data as Partial<LeadType>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Lead updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update lead");
    },
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
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
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

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLead,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["leads"] });
      const previousLeadsData = queryClient.getQueriesData({ queryKey: ["leads"] });

      queryClient.setQueriesData({ queryKey: ["leads"] }, (old: unknown) => {
        if (!old || typeof old !== 'object' || !('leads' in old)) return old;
        const cache = old as { leads: { id: string }[]; summary?: { total: number }; pagination?: { total: number } };
        return {
          ...cache,
          leads: cache.leads.filter((lead) => lead.id !== id),
          summary: { ...cache.summary, total: Math.max(0, (cache.summary?.total || 1) - 1) },
          pagination: { ...cache.pagination, total: Math.max(0, (cache.pagination?.total || 1) - 1) }
        };
      });

      return { previousLeadsData };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousLeadsData) {
        context.previousLeadsData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || "Failed to delete lead");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    }
  });
}

export function useBulkDeleteLeads() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => import("@/shared/lib/api/crm").then(m => m.bulkDeleteLeads(ids)),
    onMutate: async (ids: string[]) => {
      await queryClient.cancelQueries({ queryKey: ["leads"] });
      const previousLeadsData = queryClient.getQueriesData({ queryKey: ["leads"] });

      queryClient.setQueriesData({ queryKey: ["leads"] }, (old: unknown) => {
        if (!old || typeof old !== 'object' || !('leads' in old)) return old;
        const cache = old as { leads: { id: string }[]; summary?: { total: number }; pagination?: { total: number } };
        return {
          ...cache,
          leads: cache.leads.filter((lead) => !ids.includes(lead.id)),
          summary: { ...cache.summary, total: Math.max(0, (cache.summary?.total || 1) - ids.length) },
          pagination: { ...cache.pagination, total: Math.max(0, (cache.pagination?.total || 1) - ids.length) }
        };
      });

      return { previousLeadsData };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousLeadsData) {
        context.previousLeadsData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || "Failed to delete leads");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    }
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
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
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
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
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
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
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
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
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
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-board"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Task created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create task");
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<import('@/shared/types/task').TaskType> }) => updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-board"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Task updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update task");
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-board"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Task deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete task");
    },
  });
}

export function useBulkDeleteTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => deleteTask(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-board"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete tasks");
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-board"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Task status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update task status");
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => completeTask(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-board"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Task marked as completed");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to complete task");
    },
  });
}

export function useAddTaskTimelineEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { action: string; description?: string; metadata?: any } }) => createTaskTimelineEvent(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Event added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add event");
    },
  });
}

export function useUpdateTaskProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, progress }: { id: string; progress: number }) => updateTaskProgressAPI(id, progress),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update progress");
    },
  });
}

export function useResolveTaskBlocker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resolveTaskBlocker(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", id] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Blocker resolved successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to resolve blocker");
    },
  });
}

export function useAssignTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assignedToId }: { id: string; assignedToId: string }) => assignTask(id, assignedToId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-board"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Task reassigned successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reassign task");
    },
  });
}



export function useCreateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createQuotation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Quotation created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create quotation");
    },
  });
}

export function useUpdateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<import('@/shared/types/quotation').QuotationType> }) => updateQuotation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Quotation updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update quotation");
    },
  });
}

export function useUpdateQuotationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateQuotationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Quotation status updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update quotation status");
    },
  });
}

export function useDeleteQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => import("@/shared/lib/api/crm").then(m => m.deleteQuotation(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Quotation deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete quotation");
    },
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
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
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
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ─── Lead Details Hooks ──────────────────────────────────────────────────────────

export function useLeadNotes(leadId: string) {
  const { isAuthenticated, token } = useAuth();
  return useQuery({
    queryKey: ["leadNotes", leadId, token],
    queryFn: () => fetchLeadNotes(leadId),
    enabled: isAuthenticated && !!leadId,
  });
}

export function useCreateLeadNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, data }: { leadId: string; data: ReturnType<typeof JSON.parse> }) => createLeadNote(leadId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leadNotes", variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leadTimeline", variables.leadId] });
      toast.success("Note added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add note");
    },
  });
}

export function useLeadTimeline(leadId: string) {
  const { isAuthenticated, token } = useAuth();
  return useQuery({
    queryKey: ["leadTimeline", leadId, token],
    queryFn: () => fetchLeadTimeline(leadId),
    enabled: isAuthenticated && !!leadId,
  });
}

export function useLeadAttachments(leadId: string) {
  const { isAuthenticated, token } = useAuth();
  return useQuery({
    queryKey: ["leadAttachments", leadId, token],
    queryFn: () => fetchLeadAttachments(leadId),
    enabled: isAuthenticated && !!leadId,
  });
}

export function useCreateLeadAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, data }: { leadId: string; data: ReturnType<typeof JSON.parse> }) => createLeadAttachment(leadId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leadAttachments", variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ["leadTimeline", variables.leadId] });
      toast.success("Attachment added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add attachment");
    },
  });
}

export function useUploadLeadAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      leadId,
      file,
    }: {
      leadId: string;
      file: File | { fileData: string; fileName: string; fileType?: string };
    }) => uploadLeadAttachment(leadId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leadAttachments", variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ["leadTimeline", variables.leadId] });
      toast.success("File uploaded to storage successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload file to storage");
    },
  });
}

export function useDeleteLeadAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, attachmentId }: { leadId: string; attachmentId: string }) =>
      deleteLeadAttachment(leadId, attachmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leadAttachments", variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ["leadTimeline", variables.leadId] });
      toast.success("Attachment deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete attachment");
    },
  });
}

export function useLeadMeetings(leadId: string) {
  const { isAuthenticated, token } = useAuth();
  return useQuery({
    queryKey: ["leadMeetings", leadId, token],
    queryFn: () => fetchLeadMeetings(leadId),
    enabled: isAuthenticated && !!leadId,
  });
}

export function useCreateLeadMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, data }: { leadId: string; data: ReturnType<typeof JSON.parse> }) => createLeadMeeting(leadId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leadMeetings", variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leadTimeline", variables.leadId] });
      toast.success("Meeting scheduled successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to schedule meeting");
    },
  });
}

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
export function useInvoices(params?: Record<string, ReturnType<typeof JSON.parse>>) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["invoices", token, params],
    queryFn: () => fetchInvoicesData(params),
    enabled: !!token,
    staleTime: 30_000,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, ReturnType<typeof JSON.parse>>) => createInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Invoice created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create invoice");
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, ReturnType<typeof JSON.parse>> }) => updateInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Invoice updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update invoice");
    },
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateInvoiceStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Invoice status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update invoice status");
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Invoice deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete invoice");
    },
  });
}
