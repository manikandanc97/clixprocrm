import React from "react";
import { Receipt, Plus, Settings } from "lucide-react";
import { PageLoadingState } from "@/shared/components/crm";

export function InvoicesSkeleton() {
  return (
    <PageLoadingState
      title="Invoices"
      description="Manage billing, tax breakdowns, track payments, and download PDF receipts."
      icon={Receipt}
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
        label: "Create Invoice",
        icon: Plus,
        onClick: () => {},
        disabled: true,
      }}
      rows={8}
      cols={6}
      hasAvatar={false}
    />
  );
}


