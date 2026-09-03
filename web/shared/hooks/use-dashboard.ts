"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { 
  fetchDashboardData, 
  fetchHotLeads, 
  fetchMeetings, 
  fetchNotifications, 
  fetchAiInsights,
  fetchLeadsData,
  fetchTasksData,
  fetchPipelineData,
  fetchCustomersData,
  fetchRevenueGrowth,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  SearchService,
} from "@/shared/lib/api/crm";
import { useAuth } from "@/features/auth/components/auth-provider";
import { useCRMStore } from "@/shared/store/useCRMStore";

export function useDashboardData(timeframeProp?: string) {
  const storeTimeframe = useCRMStore((state) => state.activeTimeframe);
  const timeframe = timeframeProp || storeTimeframe;
  const { isAuthenticated, isHydrated } = useAuth();
  return useQuery({
    queryKey: ["dashboardData", timeframe],
    queryFn: () => fetchDashboardData(timeframe),
    enabled: isHydrated && isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
}

export function useRevenueGrowth(filter: string = "Year") {
  const { isAuthenticated, isHydrated } = useAuth();
  return useQuery({
    queryKey: ["revenueGrowth", filter],
    queryFn: () => fetchRevenueGrowth(filter),
    enabled: isHydrated && isAuthenticated,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useHotLeads() {
  const { isAuthenticated, isHydrated } = useAuth();
  return useQuery({
    queryKey: ["hotLeads"],
    queryFn: fetchHotLeads,
    enabled: isHydrated && isAuthenticated,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useMeetings() {
  const { isAuthenticated, isHydrated } = useAuth();
  return useQuery({
    queryKey: ["meetings"],
    queryFn: fetchMeetings,
    enabled: isHydrated && isAuthenticated,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useNotifications() {
  const { isAuthenticated, isHydrated } = useAuth();
  return useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    enabled: isHydrated && isAuthenticated,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => import("@/shared/lib/api/dashboard.api").then((m) => m.deleteNotification(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
}

export function useClearAllReadNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => import("@/shared/lib/api/dashboard.api").then((m) => m.clearAllReadNotifications()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
}

export function useCreateTestNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => import("@/shared/lib/api/dashboard.api").then((m) => m.createTestNotification()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
}

export function useAiInsights() {
  const { isAuthenticated, isHydrated } = useAuth();
  return useQuery({
    queryKey: ["aiInsights"],
    queryFn: fetchAiInsights,
    enabled: isHydrated && isAuthenticated,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// ─── Entity Hooks ────────────────────────────────────────────────────────────

export function useLeads(
  params?: import("@/shared/lib/api/crm").LeadsQueryParams,
  options?: { enabled?: boolean }
) {
  const { isAuthenticated, isHydrated } = useAuth();
  const isEnabled = (options?.enabled !== undefined ? options.enabled : true) && isHydrated && isAuthenticated;
  return useQuery({
    queryKey: params && Object.keys(params).length > 0 ? ["leads", params] : ["leads"],
    queryFn: () => fetchLeadsData(params),
    enabled: isEnabled,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useTasks() {
  const { isAuthenticated, isHydrated } = useAuth();
  return useQuery({
    queryKey: ["tasks"],
    queryFn: () => fetchTasksData(),
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

/**
 * Hook to manage core dashboard data initialization.
 * Only fetches primary dashboard summary data while allowing individual
 * widgets to own their respective server state cleanly.
 */
export function useDashboardInitializer(timeframeProp?: string) {
  const storeTimeframe = useCRMStore((state) => state.activeTimeframe);
  const timeframe = timeframeProp || storeTimeframe;
  const { isAuthenticated, isHydrated, isInitializing: isAuthInitializing } = useAuth();
  
  // Primary dashboard data
  const dashboard = useDashboardData(timeframe);

  const isInitializing =
    !isHydrated ||
    isAuthInitializing ||
    (isAuthenticated && (dashboard.isLoading || dashboard.isPending) && !dashboard.data);

  return {
    isAuthenticated,
    isAuthInitializing,
    isInitializing,
    dashboard,
  };
}

export function useGlobalSearch(query: string) {
  const { isAuthenticated, isHydrated } = useAuth();
  return useQuery({
    queryKey: ["globalSearch", query],
    queryFn: () => SearchService.fetchGlobalSearch(query),
    enabled: isHydrated && isAuthenticated && query.length >= 2,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
