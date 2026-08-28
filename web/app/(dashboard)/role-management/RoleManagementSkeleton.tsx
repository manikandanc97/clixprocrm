import React from "react";
import { CRMMetricsGrid } from "@/shared/components/crm";
import {
  MetricCardSkeleton,
  ToolbarSkeleton,
  TableSkeleton,
} from "@/shared/components/skeletons";

export function RoleManagementSkeleton() {
  return (
    <div className="flex-1 flex flex-col min-h-0 gap-3.5 sm:gap-4">
      {/* 3 Metric Cards */}
      <div className="shrink-0">
        <CRMMetricsGrid cols={3}>
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </CRMMetricsGrid>
      </div>

      {/* Toolbar */}
      <ToolbarSkeleton />

      {/* Roles Table (6 columns: Role, Priority, Permissions, Users, Status, Actions) */}
      <div className="flex-1 min-h-0 flex flex-col">
        <TableSkeleton rows={6} cols={6} showPagination={true} hasAvatar={true} />
      </div>
    </div>
  );
}
