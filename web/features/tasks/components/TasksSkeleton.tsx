import React from "react";
import { CheckSquare, Plus, Settings } from "lucide-react";
import { PageLoadingState } from "@/shared/components/crm";

export function TasksSkeleton({ viewMode: _viewMode }: { viewMode?: string } = {}) {
  return (
    <PageLoadingState
      title="Tasks"
      description="Organize your workflow, track productivity, and collaborate with your team."
      icon={CheckSquare}
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
        label: "Create Task",
        icon: Plus,
        onClick: () => {},
        disabled: true,
      }}
      rows={10}
      cols={6}
      hasAvatar={true}
    />
  );
}
