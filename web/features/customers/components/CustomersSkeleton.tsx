import React from "react";
import { Users, UserPlus, Settings, Upload } from "lucide-react";
import { PageLoadingState } from "@/shared/components/crm";

export function CustomersSkeleton() {
  return (
    <PageLoadingState
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
      rows={10}
      cols={8}
      hasAvatar={true}
    />
  );
}

