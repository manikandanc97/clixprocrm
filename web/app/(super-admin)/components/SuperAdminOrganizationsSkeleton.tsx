"use client";

import React from "react";
import { CRMPageContainer, CRMMetricsGrid, CRMPageHeader } from "@/shared/components/crm";
import {
  MetricCardSkeleton,
  ToolbarSkeleton,
  TableSkeleton,
} from "@/shared/components/skeletons";
import { Building2 } from "lucide-react";

export function SuperAdminOrganizationsSkeleton() {
  return (
    <CRMPageContainer>
      <CRMPageHeader
        title="Tenant Organizations"
        subtitle="Manage global multi-tenant workspaces, subscription tiers, and tenant lifecycle."
        icon={Building2}
        badge="Tenant Management"
      />

      <div className="shrink-0">
        <CRMMetricsGrid cols={4}>
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
          <TableSkeleton rows={10} cols={7} showPagination={true} hasAvatar={true} />
        </div>
      </div>
    </CRMPageContainer>
  );
}
