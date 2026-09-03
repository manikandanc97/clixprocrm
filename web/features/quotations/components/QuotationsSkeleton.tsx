import { CRMPageContainer } from "@/shared/components/crm";
import { 
  PageHeaderSkeleton, 
  ToolbarSkeleton, 
  TableSkeleton 
} from "@/shared/components/skeletons";

export function QuotationsSkeleton() {
  return (
    <CRMPageContainer>
      <PageHeaderSkeleton />
      <div className="flex-1 flex flex-col gap-4">
        <div className="shrink-0 mb-2 py-4">
          <ToolbarSkeleton />
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <div className="p-1">
            <TableSkeleton rows={10} cols={7} showPagination={true} />
          </div>
        </div>
      </div>
    </CRMPageContainer>
  );
}

