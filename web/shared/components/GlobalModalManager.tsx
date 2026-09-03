"use client";

import dynamic from "next/dynamic";
import { useGlobalModalStore } from "@/shared/store/useGlobalModalStore";
import { FormModal } from "@/shared/components/crm/FormModal";
import { FormSkeleton } from "@/shared/components/skeletons";

const LeadForm = dynamic(() => import("@/features/forms/LeadForm").then(mod => mod.LeadForm), {
  loading: () => (
    <div className="p-4">
      <FormSkeleton />
    </div>
  ),
  ssr: false,
});

const CustomerForm = dynamic(() => import("@/features/forms/CustomerForm").then(mod => mod.CustomerForm), {
  loading: () => (
    <div className="p-4">
      <FormSkeleton />
    </div>
  ),
  ssr: false,
});

export const GlobalModalManager = () => {
  const { activeModal, closeModal } = useGlobalModalStore();

  return (
    <>
      <FormModal
        title="Quick Lead Capture"
        description="Add a new lead to your pipeline."
        isOpen={activeModal === "lead"}
        onOpenChange={(open) => !open && closeModal()}
        size="lg"
      >
        <LeadForm onSuccess={closeModal} onCancel={closeModal} />
      </FormModal>

      <FormModal
        title="New Customer"
        description="Register a new customer."
        isOpen={activeModal === "customer"}
        onOpenChange={(open) => !open && closeModal()}
        size="lg"
      >
        <CustomerForm onSuccess={closeModal} onCancel={closeModal} />
      </FormModal>
    </>
  );
};
