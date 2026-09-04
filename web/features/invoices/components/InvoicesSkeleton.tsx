import React from "react";
import { CRMPageContainer, CRMPageHeader } from "@/shared/components/crm";
import {
  ToolbarSkeleton,
  TableSkeleton,
} from "@/shared/components/skeletons";
import { Receipt, Plus, Settings } from "lucide-react";

export function InvoicesSkeleton() {
  return (
    <CRMPageContainer twoStageScroll>
      <CRMPageHeader
        title="Invoices"
        description="Manage billing, tax breakdowns, track payments, and download PDF receipts."
        icon={Receipt}
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
          label: "Create Invoice",
          icon: Plus,
          onClick: () => {},
          disabled: true,
        }}
      />

      <div className="flex-1 flex flex-col gap-4 min-h-0 mt-4">
        <div className="shrink-0">
          <ToolbarSkeleton />
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <TableSkeleton rows={8} cols={6} showPagination={true} hasAvatar={false} />
        </div>
      </div>
    </CRMPageContainer>
  );
}

