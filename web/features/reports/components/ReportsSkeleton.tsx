import { CRMPageContainer, CRMMetricsGrid } from "@/shared/components/crm";
import { 
  PageHeaderSkeleton, 
  MetricCardSkeleton, 
  CardSkeleton,
  TableSkeleton
} from "@/shared/components/skeletons";
import { Skeleton } from "@/shared/ui/skeleton";

export function ReportsSkeleton() {
  return (
    <CRMPageContainer twoStageScroll className="space-y-6">
      <PageHeaderSkeleton />
      
      {/* 4 Metric Cards */}
      <CRMMetricsGrid cols={4} className="gap-4">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </CRMMetricsGrid>

      {/* Row 2: Revenue Trend & Goal Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 min-h-[340px] flex flex-col crm-card p-6">
          <Skeleton className="h-6 w-36 mb-4" />
          <Skeleton className="flex-1 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-5 min-h-[340px] flex flex-col crm-card p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4 flex-1">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
      </div>

      {/* Row 3: Lead Sources & Sales Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        <div className="min-h-[260px] flex flex-col crm-card p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="flex-1 w-full rounded-xl" />
        </div>
        <div className="min-h-[260px] flex flex-col crm-card p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4 flex-1 justify-center flex flex-col">
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-full rounded-full" />
          </div>
        </div>
      </div>

      {/* Row 4: Top Customers, Recent Activity, Upcoming Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        <div className="min-h-[250px] flex flex-col crm-card p-6">
          <Skeleton className="h-5 w-28 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
        <div className="min-h-[250px] flex flex-col crm-card p-6">
          <Skeleton className="h-5 w-28 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
        <div className="min-h-[250px] flex flex-col crm-card p-6">
          <Skeleton className="h-5 w-28 mb-4" />
          <div className="flex-1 flex flex-col items-center justify-center space-y-2">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      </div>

      {/* Row 5: Team Performance */}
      <div className="w-full">
        <TableSkeleton rows={5} cols={5} />
      </div>
    </CRMPageContainer>
  );
}

