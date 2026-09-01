import { CRMPageContainer, CRMMetricsGrid } from "@/shared/components/crm";
import { 
  PageHeaderSkeleton, 
  MetricCardSkeleton, 
  ToolbarSkeleton, 
  TableSkeleton,
  CardSkeleton
} from "@/shared/components/skeletons";

export function EmployeesSkeleton() {
  return (
    <CRMPageContainer>
      <PageHeaderSkeleton />
      
      {/* Stats Grid */}
      <CRMMetricsGrid>
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </CRMMetricsGrid>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Table Area */}
        <div className="lg:col-span-3 space-y-6">
          <ToolbarSkeleton />
          <TableSkeleton rows={10} cols={5} />
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="h-6 w-32 skeleton rounded-md" />
            <CardSkeleton className="min-h-[200px]" />
          </div>
          <div className="space-y-4">
            <div className="h-6 w-48 skeleton rounded-md" />
            <CardSkeleton className="min-h-[250px]" />
          </div>
        </div>
      </div>
    </CRMPageContainer>
  );
}
