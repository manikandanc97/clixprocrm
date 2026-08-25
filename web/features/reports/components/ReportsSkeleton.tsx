import { CRMPageContainer, CRMMetricsGrid } from "@/shared/components/crm";
import { 
  PageHeaderSkeleton, 
  MetricCardSkeleton, 
  ChartSkeleton, 
  CardSkeleton,
  TableSkeleton
} from "@/shared/components/skeletons";
import { Skeleton } from "@/shared/ui/skeleton";

export function ReportsSkeleton() {
  return (
    <CRMPageContainer>
      <PageHeaderSkeleton />
      
      <CRMMetricsGrid cols={4} className="gap-4">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </CRMMetricsGrid>

      <CardSkeleton />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
        <div className="xl:col-span-2 space-y-5 h-full flex flex-col">
          <div className="flex-1 min-h-[400px] flex flex-col crm-card p-6">
            <Skeleton className="h-6 w-32 mb-6" />
            <ChartSkeleton height={300} type="area" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
            <div className="min-h-[350px] flex flex-col crm-card p-6">
              <Skeleton className="h-6 w-32 mb-6" />
              <ChartSkeleton height={200} type="bar" />
            </div>
            <div className="min-h-[350px] flex flex-col crm-card p-6">
              <Skeleton className="h-6 w-32 mb-6" />
              <ChartSkeleton height={200} type="donut" />
            </div>
          </div>
        </div>
        
        <div className="space-y-5 h-full flex flex-col">
          <CardSkeleton className="min-h-[250px]" />
          <div className="flex-1 min-h-[300px] flex flex-col crm-card p-6">
            <Skeleton className="h-6 w-32 mb-6" />
            <ChartSkeleton height={200} type="pie" />
          </div>
          <div className="flex-1 min-h-[300px] flex flex-col crm-card p-6">
            <Skeleton className="h-6 w-32 mb-6" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Row: Customers, Activities, Follow-ups, Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="min-h-[400px] flex flex-col h-full crm-card p-6">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
        <div className="min-h-[400px] flex flex-col h-full crm-card p-6">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
        <div className="min-h-[400px] flex flex-col h-full crm-card p-6">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
        <div className="min-h-[400px] flex flex-col h-full crm-card p-6">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <TableSkeleton rows={5} cols={5} />
      </div>
    </CRMPageContainer>
  );
}
