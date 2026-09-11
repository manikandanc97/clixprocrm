import React from "react";
import { Users, UserPlus } from "lucide-react";
import { PageLoadingState } from "@/shared/components/crm";

export function EmployeesSkeleton() {
  return (
    <PageLoadingState
      title="Employees"
      description="Manage your workforce, assign roles, monitor activity, and track staff performance."
      icon={Users}
      primaryAction={{
        label: "Add Employee",
        icon: UserPlus,
        onClick: () => {},
        disabled: true,
      }}
      rows={10}
      cols={6}
      hasAvatar={true}
    />
  );
}

