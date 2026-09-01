"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { DashboardSkeleton } from "@/features/dashboard/components/DashboardSkeleton";
import { DashboardWidgetSkeleton } from "@/shared/components/skeletons";
import { 
  useDashboardInitializer,
  useDashboardData,
  useMeetings,
  useTasks,
  useHotLeads,
  useCustomers,
  useLeads,
  usePipeline,
} from "@/shared/hooks/use-dashboard";
import { useAnalytics } from "@/shared/hooks/use-analytics";
import { Button } from "@/shared/ui/button";
import { CRMPageContainer } from "@/shared/components/crm";
import { useCRMStore } from "@/shared/store/useCRMStore";

// Standard dynamic imports
const RecentActivities = dynamic(() => import("@/features/dashboard/components/RecentActivities"));
const UpcomingMeetings = dynamic(() => import("@/features/dashboard/components/UpcomingMeetings"));
const HotLeads = dynamic(() => import("@/features/dashboard/components/HotLeads"));
const PendingFollowups = dynamic(() => import("@/features/dashboard/components/PendingFollowups"));
const CalendarWidget = dynamic(() => import("@/features/dashboard/components/CalendarWidget"));
import WelcomeBanner from "@/features/dashboard/components/WelcomeBanner";
import { DashboardWidgetWrapper } from "@/features/dashboard/components/DashboardWidgetWrapper";
import CreateNewMenu from "@/features/dashboard/components/CreateNewMenu";
import DashboardKPIs from "@/features/dashboard/components/DashboardKPIs";
import DashboardFilterMenu from "@/features/dashboard/components/DashboardFilterMenu";
import DashboardOnboardingHub from "@/features/dashboard/components/DashboardOnboardingHub";

const AIInsights = dynamic(() => import("@/features/reports/components/AIInsights"));
const RevenueTarget = dynamic(() => import("@/features/reports/components/RevenueTarget"));
const RevenueChart = dynamic(() => import("@/features/reports/components/RevenueChart"));
const RecentCustomers = dynamic(() => import("@/features/dashboard/components/RecentCustomers"));

// Specific Widget Components
const RevenueChartWidget = () => {
  const { data: analyticsData, isLoading, isError, refetch } = useAnalytics();
  return (
    <DashboardWidgetWrapper id="revenueChart" title="Revenue Chart" skeletonType="chart" isLoading={isLoading} isError={isError} onRetry={refetch} delay={1.2}>
      <div className="h-[350px]">
        <RevenueChart data={analyticsData?.revenueOverview?.map(r => ({ name: r.name, total: r.revenue })) || []} />
      </div>
    </DashboardWidgetWrapper>
  );
};

const UpcomingMeetingsWidget = () => {
  const { isLoading, isError, refetch } = useMeetings();
  return (
    <DashboardWidgetWrapper id="upcomingMeetings" title="Upcoming Meetings" isLoading={isLoading} isError={isError} onRetry={refetch} delay={0.7}>
      <UpcomingMeetings />
    </DashboardWidgetWrapper>
  );
};

const PendingFollowupsWidget = () => {
  const { isLoading, isError, refetch } = useTasks();
  return (
    <DashboardWidgetWrapper id="pendingFollowups" title="Pending Tasks" isLoading={isLoading} isError={isError} onRetry={refetch} delay={0.8}>
      <PendingFollowups />
    </DashboardWidgetWrapper>
  );
};

const HotLeadsWidget = () => {
  const { isLoading, isError, refetch } = useHotLeads();
  return (
    <DashboardWidgetWrapper id="hotLeads" title="Hot Leads" isLoading={isLoading} isError={isError} onRetry={refetch} delay={0.9}>
      <HotLeads />
    </DashboardWidgetWrapper>
  );
};

const RecentActivitiesWidget = () => {
  const { isLoading, isError, refetch } = useDashboardData();
  return (
    <DashboardWidgetWrapper id="recentActivities" title="Recent Activities" isLoading={isLoading} isError={isError} onRetry={refetch} delay={1.1}>
      <RecentActivities />
    </DashboardWidgetWrapper>
  );
};

const RecentCustomersWidget = () => {
  const { isLoading, isError, refetch } = useCustomers();
  return (
    <DashboardWidgetWrapper id="recentCustomers" title="Recent Customers" isLoading={isLoading} isError={isError} onRetry={refetch} delay={1.3}>
      <div className="h-[350px]">
        <RecentCustomers />
      </div>
    </DashboardWidgetWrapper>
  );
};

const RevenueTargetWidget = () => {
  const { data, isLoading, isError, refetch } = useDashboardData();
  return (
    <DashboardWidgetWrapper id="revenueTarget" title="Revenue Target" skeletonType="donut" isLoading={isLoading} isError={isError} onRetry={refetch} delay={1.2}>
      <RevenueTarget data={data?.revenueTarget ?? null} />
    </DashboardWidgetWrapper>
  );
};

const DashboardPage = () => {
  const activeTimeframe = useCRMStore(state => state.activeTimeframe);
  const setActiveTimeframe = useCRMStore(state => state.setActiveTimeframe);

  const { isInitializing } = useDashboardInitializer(activeTimeframe);
  const { data: dashboardData, isLoading: isDashboardLoading } = useDashboardData();
  const { data: leadsData, isLoading: isLeadsLoading } = useLeads();
  const { data: pipelineData, isLoading: isPipelineLoading } = usePipeline();

  const isWorkspaceEmpty = useMemo(() => {
    if (!dashboardData || isDashboardLoading || isLeadsLoading || isPipelineLoading) return false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const leads = (leadsData as any)?.leads || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalLeadsCount = (leadsData as any)?.total ?? leads.length;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipelineItems = (pipelineData as any)?.items || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalDealsCount = (pipelineData as any)?.totalDeals ?? pipelineItems.length;

    const stats = dashboardData?.stats || [];
    const revenueVal = stats.find(s => s.title === "Revenue")?.valueAmount || 0;
    const activitiesCount = dashboardData?.recentActivities?.length || 0;

    return (
      totalLeadsCount === 0 &&
      totalDealsCount === 0 &&
      revenueVal === 0 &&
      activitiesCount === 0
    );
  }, [
    isDashboardLoading,
    isLeadsLoading,
    isPipelineLoading,
    leadsData,
    pipelineData,
    dashboardData,
  ]);

  if (isInitializing) {
    return (
      <CRMPageContainer>
        <DashboardSkeleton />
      </CRMPageContainer>
    );
  }

  if (isWorkspaceEmpty) {
    return (
      <CRMPageContainer>
        <DashboardOnboardingHub />
      </CRMPageContainer>
    );
  }

  return (
    <CRMPageContainer>
      <div className="flex flex-col gap-6">
        {/* Row 1: Hero Banner */}
        <WelcomeBanner />

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {(['today', 'week', 'month', 'year'] as const).map((t) => (
              <Button
                key={t}
                variant={activeTimeframe === t ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTimeframe(t)}
                className="capitalize h-8 px-4 rounded-full text-xs font-semibold tracking-wide shadow-sm transition-all"
              >
                {t}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <DashboardFilterMenu />
            <div className="hidden sm:block h-4 w-px bg-border mx-1" />
            <CreateNewMenu />
          </div>
        </div>

        {/* Row 2: KPI Grid */}
        <DashboardKPIs />

        {/* Row 4 & 5: Operational Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-6">
              <RevenueChartWidget />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <UpcomingMeetingsWidget />
              <PendingFollowupsWidget />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <HotLeadsWidget />
              <RecentActivitiesWidget />
            </div>

            <div className="grid grid-cols-1 gap-6">
              <RecentCustomersWidget />
            </div>
          </div>

          {/* Right Sidebar (Sticky) */}
          <div className="flex flex-col gap-6 w-full xl:sticky xl:top-24 self-start">
            <RevenueTargetWidget />

            <React.Suspense fallback={<DashboardWidgetSkeleton />}>
              <AIInsights />
            </React.Suspense>

            <DashboardWidgetWrapper id="calendarWidget" title="Calendar" skeletonType="calendar" delay={1.3}>
              <CalendarWidget />
            </DashboardWidgetWrapper>
          </div>
        </div>
      </div>
    </CRMPageContainer>
  );
};

export default DashboardPage;
