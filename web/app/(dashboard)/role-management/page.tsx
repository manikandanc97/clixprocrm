"use client";

import { Shield } from "lucide-react";
import { 
  CRMPageContainer, 
  CRMPageHeader, 
} from "@/shared/components/crm";
import { RoleList } from "./_components/RoleList";

export default function RoleManagementPage() {
  return (
    <CRMPageContainer>
      <CRMPageHeader
        title="Role Management"
        subtitle="Manage roles and control access permissions across your organization."
        badge="Security & Access"
        icon={Shield}
      />

      <div className="flex-1 min-h-0 flex flex-col">
        <RoleList />
      </div>
    </CRMPageContainer>
  );
}
