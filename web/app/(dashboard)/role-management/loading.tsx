"use client";

import { CRMPageContainer, CRMPageHeader } from "@/shared/components/crm";
import { Shield } from "lucide-react";
import { RoleManagementSkeleton } from "./RoleManagementSkeleton";

export default function Loading() {
  return (
    <CRMPageContainer>
      <CRMPageHeader
        title="Role Management"
        subtitle="Manage roles and control access permissions across your organization."
        badge="Security & Access"
        icon={Shield}
      />

      <div className="mt-6">
        <RoleManagementSkeleton />
      </div>
    </CRMPageContainer>
  );
}
