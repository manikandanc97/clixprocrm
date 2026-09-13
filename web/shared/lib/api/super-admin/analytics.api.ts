import client from "../client";

export interface PlatformAnalyticsData {
  dateRange?: {
    range: string;
    startDate: string;
    endDate: string;
  };
  kpis?: {
    mrr: {
      value: number;
      prevValue: number;
      changePercent: number;
      trend: "up" | "down" | "neutral";
      comparisonText: string;
    };
    activeWorkspaces: {
      count: number;
      totalRegistered: number;
      newInPeriod: number;
      growthPercent: number;
      trend: "up" | "down" | "neutral";
      comparisonText: string;
    };
    paidConversion: {
      ratePercent: number;
      paidCount: number;
      activeCount: number;
      trend: "up" | "down" | "neutral";
      comparisonText: string;
    };
    churn: {
      ratePercent: number;
      cancellationsCount: number;
      trend: "up" | "down" | "neutral";
      comparisonText: string;
    };
  };
  secondaryKpis?: {
    newWorkspaces: {
      count: number;
      prevCount: number;
      growthPercent: number;
      trend: "up" | "down" | "neutral";
      comparisonText: string;
    };
    paidWorkspaces: {
      count: number;
      percentageOfActive: number;
      comparisonText: string;
    };
    arpu: {
      value: number;
      comparisonText: string;
    };
  };
  growthTrends?: Array<{
    month: string;
    newWorkspaces: number;
    activeWorkspaces: number;
  }>;
  subscriptionMix?: Array<{
    planId: string;
    name: string;
    badge: string;
    count: number;
    percentage: number;
  }>;
  workspaceHealth?: {
    active: { count: number; percentage: number };
    trialing: { count: number; percentage: number };
    pastDue: { count: number; percentage: number };
    suspended: { count: number; percentage: number };
    total: number;
  };
  totals?: {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    totalLeads: number;
    totalDeals: number;
    totalCustomers: number;
    totalQuotations: number;
    estimatedMRR: number;
    estimatedARR: number;
  };
  monthlyTrends?: Array<{
    month: string;
    organizations: number;
    users: number;
  }>;
  planBreakdown?: Array<{
    plan: string;
    count: number;
    price: number;
    monthlyRevenue: number;
  }>;
}


export const fetchPlatformAnalytics = async (params?: {
  range?: string;
  startDate?: string;
  endDate?: string;
}): Promise<PlatformAnalyticsData> => {
  const response = await client.get<{ success: boolean; data: PlatformAnalyticsData }>(
    "/super-admin/analytics",
    { params }
  );
  return response.data.data;
};

