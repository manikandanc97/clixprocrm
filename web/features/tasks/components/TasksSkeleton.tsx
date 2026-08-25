import { CRMPageContainer, CRMMetricsGrid, CRMCard } from "@/shared/components/crm";
import { 
  PageHeaderSkeleton, 
  MetricCardSkeleton, 
  ToolbarSkeleton, 
  TableSkeleton,
  KanbanSkeleton
} from "@/shared/components/skeletons";
import { Skeleton } from "@/shared/ui/skeleton";

function TaskCardSkeleton() {
  return (
    <CRMCard className="group relative flex flex-col justify-between h-full">
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-5 h-5 rounded-md" />
            <Skeleton className="h-4 w-12 rounded-sm" />
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>

        <div className="space-y-2 mb-4">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>

        <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border/40">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
    </CRMCard>
  );
}

export function TasksSkeleton({ viewMode = "list" }: { viewMode?: string }) {
  const isKanban = viewMode === "kanban";
  const isGrid = viewMode === "grid" || viewMode === "cards";

  return (
    <CRMPageContainer>
      <PageHeaderSkeleton />
      <div className="shrink-0">
        <CRMMetricsGrid cols={4}>
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </CRMMetricsGrid>
      </div>
      
      <div className="flex-1 flex flex-col gap-4">
        <div className="shrink-0 mb-2 py-4">
          <ToolbarSkeleton />
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          {isKanban ? (
            <KanbanSkeleton />
          ) : isGrid ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <TaskCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="p-1">
              <TableSkeleton rows={10} cols={6} showPagination={true} />
            </div>
          )}
        </div>
      </div>
    </CRMPageContainer>
  );
}
