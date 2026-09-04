import { CRMPageContainer, CRMPageHeader } from "@/shared/components/crm";
import { KanbanSkeleton } from "@/shared/components/skeletons";
import { Handshake, Plus, Settings } from "lucide-react";

export function DealsSkeleton() {
  return (
    <CRMPageContainer>
      <CRMPageHeader
        title="Deals & Pipeline"
        description="Track sales opportunities, manage stages, and forecast revenue."
        icon={Handshake}
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
          label: "Create Deal",
          icon: Plus,
          onClick: () => {},
          disabled: true,
        }}
      />
      
      <div className="flex-1 min-h-0 flex flex-col mt-4">
        <KanbanSkeleton />
      </div>
    </CRMPageContainer>
  );
}

