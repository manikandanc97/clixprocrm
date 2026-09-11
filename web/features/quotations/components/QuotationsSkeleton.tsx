import React from "react";
import { FileText, Plus, Settings } from "lucide-react";
import { PageLoadingState } from "@/shared/components/crm";

export function QuotationsSkeleton() {
  return (
    <PageLoadingState
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
      rows={10}
      cols={7}
      hasAvatar={false}
    />
  );
}


