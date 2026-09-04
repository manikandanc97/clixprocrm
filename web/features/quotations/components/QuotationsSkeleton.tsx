import React from "react";
import { CRMPageContainer, CRMPageHeader } from "@/shared/components/crm";
import { 
  ToolbarSkeleton, 
  TableSkeleton 
} from "@/shared/components/skeletons";
import { FileText, Plus, Settings } from "lucide-react";

export function QuotationsSkeleton() {
  return (
    <CRMPageContainer twoStageScroll>
      <CRMPageHeader
        title="Quotations"
        description="Generate and manage sales quotes with real-time tracking and conversion status."
        icon={FileText}
        secondaryActions={[
          {
            label: "Customize",
            icon: Settings,
            onClick: () => {},
            disabled: true,
            variant: "outline",
          },
        ]}
        primaryAction={{
          label: "Create Quote",
          icon: Plus,
          onClick: () => {},
          disabled: true,
        }}
      />

      <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0 mt-4">
        <div className="shrink-0">
          <ToolbarSkeleton />
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <TableSkeleton rows={10} cols={7} showPagination={true} />
        </div>
      </div>
    </CRMPageContainer>
  );
}

