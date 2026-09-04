import { CRMPageContainer } from "@/shared/components/crm";
import { 
  PageHeaderSkeleton, 
  ToolbarSkeleton, 
  TableSkeleton,
  KanbanSkeleton
} from "@/shared/components/skeletons";

export function TasksSkeleton({ viewMode = "list" }: { viewMode?: string }) {
  const isKanban = viewMode === "kanban";

  return (
    <CRMPageContainer>
      <PageHeaderSkeleton />
      
      <div className="flex-1 flex flex-col gap-4">
        <div className="shrink-0 mb-2 py-4">
          <ToolbarSkeleton />
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          {isKanban ? (
            <KanbanSkeleton />
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

