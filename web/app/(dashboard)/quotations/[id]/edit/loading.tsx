"use client";

import { CRMPageContainer, CRMPageHeader } from "@/shared/components/crm";
import { QuoteFormSkeleton } from "@/shared/components/skeletons";
import { FileText } from "lucide-react";

export default function Loading() {
  return (
    <CRMPageContainer>
      <CRMPageHeader 
        title="Edit Quotation"
        subtitle="Update the details of your existing quotation."
        icon={FileText}
        badge="Editing"
      />
      
      <div className="mt-8 bg-card border border-border rounded-xl p-6 md:p-8 max-w-4xl">
        <QuoteFormSkeleton />
      </div>
    </CRMPageContainer>
  );
}
