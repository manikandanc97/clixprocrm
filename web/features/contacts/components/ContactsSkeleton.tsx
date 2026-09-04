import React from "react";
import { CRMPageContainer, CRMPageHeader } from "@/shared/components/crm";
import { ToolbarSkeleton, TableSkeleton } from "@/shared/components/skeletons";
import { Users, UserPlus, Settings, Upload } from "lucide-react";

export function ContactsSkeleton() {
  return (
    <CRMPageContainer twoStageScroll>
      <CRMPageHeader
        title="Contacts"
        description="Manage leads and customers in one unified view with AI-powered insights."
        icon={Users}
        secondaryActions={[
          {
            label: "Customize",
            icon: Settings,
            onClick: () => {},
            disabled: true,
            variant: "outline",
          },
          {
            label: "Bulk Upload",
            icon: Upload,
            onClick: () => {},
            disabled: true,
            variant: "outline",
          },
        ]}
        primaryAction={{
          label: "Add Contact",
          icon: UserPlus,
          onClick: () => {},
          disabled: true,
        }}
      />

      <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0 mt-4">
        <div className="shrink-0">
          <ToolbarSkeleton />
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <TableSkeleton rows={10} cols={8} showPagination={true} />
        </div>
      </div>
    </CRMPageContainer>
  );
}

