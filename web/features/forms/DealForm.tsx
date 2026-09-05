"use client";

import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form } from "@/shared/ui/form";
import { FormInput, FormSelect } from "@/shared/components/form-fields";
import { Button } from "@/shared/ui/button";
import { FormSubmitButton } from "@/shared/components/form-submit-button";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { useDirtyForm } from "@/shared/hooks/use-dirty-form";
import { useCreateDeal, useUpdateDeal, useCompanies, useCustomers, useLeads } from "@/shared/hooks/use-crm";
import { useCurrency } from "@/shared/hooks/use-currency";
import { DealStage } from "@/shared/types/pipeline";
import { PIPELINE_STAGE_LABELS } from "@/shared/utils/formatters";

const dealSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  companyId: z.string().optional(),
  customerId: z.string().optional(),
  leadId: z.string().optional(),
  value: z.string().optional(),
  stage: z.enum([DealStage.NEW, DealStage.QUALIFIED, DealStage.PROPOSAL, DealStage.NEGOTIATION, DealStage.WON, DealStage.LOST]).optional(),
  probability: z.string().optional(),
  expectedCloseDate: z.string().optional(),
});

type DealFormValues = z.infer<typeof dealSchema>;

interface DealFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
  initialStage?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const DealForm = ({ initialData, initialStage, onSuccess, onCancel }: DealFormProps) => {
  const { mutateAsync: createMutate, isPending: isCreating } = useCreateDeal();
  const { mutateAsync: updateMutate, isPending: isUpdating } = useUpdateDeal();
  const { data: companiesData } = useCompanies();
  const { data: customersData } = useCustomers();
  const { data: leadsData } = useLeads();
  const { currencySymbol } = useCurrency();

  const isPending = isCreating || isUpdating;

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      name: initialData?.name || "",
      companyId: initialData?.companyId || "none",
      customerId: initialData?.customerId || "none",
      leadId: initialData?.leadId || "none",
      value: initialData?.value?.toString() || "",
      stage: initialData?.stage || initialStage || DealStage.NEW,
      probability: initialData?.probability?.toString() || "0",
      expectedCloseDate: initialData?.expectedCloseDate ? new Date(initialData.expectedCloseDate).toISOString().split('T')[0] : "",
    },
  });

  const { isDirty, resetDirty } = useDirtyForm(form, form.formState.defaultValues);

  const onSubmit: SubmitHandler<DealFormValues> = async (data) => {
    try {
      const payload = {
        name: data.name,
        companyId: data.companyId && data.companyId !== "none" ? data.companyId : null,
        customerId: data.customerId && data.customerId !== "none" ? data.customerId : null,
        leadId: data.leadId && data.leadId !== "none" ? data.leadId : null,
        value: parseFloat(data.value || "0"),
        stage: data.stage,
        probability: parseInt(data.probability || "0", 10),
        expectedCloseDate: data.expectedCloseDate || null,
      };

      if (initialData) {
        await updateMutate({ id: initialData.id, data: payload });
      } else {
        await createMutate(payload);
      }
      resetDirty(form.getValues());
      onSuccess?.();
    } catch {
      // Error handled by hook
    }
  };

  const companyOptions = Array.isArray(companiesData?.companies) 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? companiesData.companies.map((c: any) => ({ label: c.name, value: c.id }))
    : [];

  const customerOptions = Array.isArray(customersData?.customers) 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? customersData.customers.map((c: any) => ({ label: c.name, value: c.id }))
    : [];

  const leadOptions = Array.isArray(leadsData?.leads) 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? leadsData.leads.map((l: any) => ({ label: l.name, value: l.id }))
    : [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
        <FormInput name="name" label="Deal Name" placeholder="Enter deal name" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSelect 
            name="companyId" 
            label="Company" 
            placeholder="Select company"
            options={[{ label: "Select Company (Optional)", value: "none" }, ...companyOptions]} 
          />
          <FormSelect 
            name="customerId" 
            label="Customer" 
            placeholder="Select customer"
            options={[{ label: "Select Customer (Optional)", value: "none" }, ...customerOptions]} 
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSelect 
            name="leadId" 
            label="Lead" 
            placeholder="Select lead"
            options={[{ label: "Select Lead (Optional)", value: "none" }, ...leadOptions]} 
          />
          <FormInput name="value" label={`Deal Value (${currencySymbol})`} placeholder="Enter deal value" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSelect 
            name="stage" 
            label="Stage" 
            placeholder="Select stage"
            options={[
              { label: PIPELINE_STAGE_LABELS[DealStage.NEW], value: DealStage.NEW },
              { label: PIPELINE_STAGE_LABELS[DealStage.QUALIFIED], value: DealStage.QUALIFIED },
              { label: PIPELINE_STAGE_LABELS[DealStage.PROPOSAL], value: DealStage.PROPOSAL },
              { label: PIPELINE_STAGE_LABELS[DealStage.NEGOTIATION], value: DealStage.NEGOTIATION },
              { label: PIPELINE_STAGE_LABELS[DealStage.WON], value: DealStage.WON },
              { label: PIPELINE_STAGE_LABELS[DealStage.LOST], value: DealStage.LOST },
            ]} 
          />
          <FormInput name="probability" label="Probability (%)" placeholder="Enter win probability (%)" />
        </div>

        <FormInput type="date" name="expectedCloseDate" label="Expected Close Date" placeholder="Select expected close date" />

        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            <AppIcon name="close" size={15} className="mr-1.5" />
            Cancel
          </Button>
          <FormSubmitButton
            isDirty={isDirty}
            isPending={isPending}
            loadingText={initialData ? "Updating..." : "Creating..."}
          >
            {initialData ? "Update Deal" : "Create Deal"}
          </FormSubmitButton>
        </div>
      </form>
    </Form>
  );
};
