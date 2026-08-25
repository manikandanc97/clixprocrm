import React from "react";
import { CRMMetricsGrid } from "@/shared/components/crm";
import {
  MetricCardSkeleton,
  ToolbarSkeleton,
  TableSkeleton,
} from "@/shared/components/skeletons";

export function RoleManagementSkeleton() {
  return (
    <div className="space-y-6">
      {/* 3 Metric Cards */}
      <CRMMetricsGrid cols={3}>
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </CRMMetricsGrid>

      {/* Toolbar */}
      <ToolbarSkeleton />

      {/* Roles Table (6 columns: Role, Priority, Permissions, Users, Status, Actions) */}
      <TableSkeleton rows={6} cols={6} showPagination={true} hasAvatar={true} />
    </div>
  );
}
