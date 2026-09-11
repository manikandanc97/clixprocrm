import React from "react";
import { Building2, Plus, Settings } from "lucide-react";
import { PageLoadingState } from "@/shared/components/crm";

export function CompaniesSkeleton() {
  return (
    <PageLoadingState
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
      rows={10}
      cols={7}
      hasAvatar={true}
    />
  );
}


