import React from "react";
import { CRMPageContainer, CRMMetricsGrid, CRMPageHeader } from "@/shared/components/crm";
import {
  MetricCardSkeleton,
  ToolbarSkeleton,
  TableSkeleton,
} from "@/shared/components/skeletons";
import { Receipt } from "lucide-react";

export function InvoicesSkeleton() {
  return (
    <CRMPageContainer>
      <CRMPageHeader
        title="Invoices"
        subtitle="Generate, send, and track client invoices and payment status in real-time."
        icon={Receipt}
        badge="Billing & Revenue"
      />

      <div className="shrink-0">
        <CRMMetricsGrid cols={4} className="gap-4">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </CRMMetricsGrid>
      </div>

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
