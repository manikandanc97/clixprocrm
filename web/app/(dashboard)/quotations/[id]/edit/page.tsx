"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuotations } from "@/shared/hooks/use-crm";
import { QuoteForm } from "@/features/forms/QuoteForm";
import { QuotationType } from "@/shared/types/quotation";
import { CRMPageContainer, CRMPageHeader } from "@/shared/components/crm";
import { FileText } from "lucide-react";
import { Button } from "@/shared/ui/button";

import { QuoteFormSkeleton } from "@/shared/components/skeletons";

export default function EditQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;
  const { data, isLoading } = useQuotations();
  const [quotation, setQuotation] = useState<QuotationType | null>(null);

  useEffect(() => {
    if (data?.quotations) {
      const q = data.quotations.find((q) => q.id === quoteId || q.quoteId === quoteId);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (q) setQuotation(q);
    }
  }, [data, quoteId]);

  if (isLoading) {
    return (
      <CRMPageContainer>
        <CRMPageHeader 
          title="Edit Quotation"
          subtitle="Update the details of your existing quotation."
          icon={FileText}
          badge="Editing"
        />
        <div className="bg-card border border-border/80 rounded-xl p-4 sm:p-6 md:p-8 max-w-4xl shadow-xs">
          <QuoteFormSkeleton />
        </div>
      </CRMPageContainer>
    );
  }

  if (!quotation) {
    return (
      <CRMPageContainer>
        <div className="p-6 sm:p-8 text-center bg-card rounded-xl border border-border/80 shadow-xs max-w-4xl">
          <h2 className="text-xl font-bold mb-4">Quotation Not Found</h2>
          <Button onClick={() => router.push("/quotations")}>Back to Quotations</Button>
        </div>
      </CRMPageContainer>
    );
  }

  return (
    <CRMPageContainer>
      <CRMPageHeader 
        title={`Edit Quotation: ${quotation.quoteId}`}
        subtitle="Update the details of your existing quotation."
        icon={FileText}
        badge="Editing"
      />
      
      <div className="bg-card border border-border/80 rounded-xl p-4 sm:p-6 md:p-8 max-w-4xl shadow-xs">
        <QuoteForm 
          initialData={quotation} 
          onSuccess={() => router.push("/quotations")}
          onCancel={() => router.push("/quotations")}
        />
      </div>
    </CRMPageContainer>
  );
}
