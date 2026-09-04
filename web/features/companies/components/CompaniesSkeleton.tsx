import React from "react";
import { CRMPageContainer, CRMPageHeader } from "@/shared/components/crm";
import { ToolbarSkeleton, TableSkeleton } from "@/shared/components/skeletons";
import { Building2, Plus, Settings } from "lucide-react";

export function CompaniesSkeleton() {
  return (
    <CRMPageContainer twoStageScroll>
      <CRMPageHeader
        title="Companies"
        description="Manage B2B accounts, track pipeline value, and view customer health at the company level."
        icon={Building2}
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
          label: "Create Company",
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

