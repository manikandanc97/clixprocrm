"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form } from "@/shared/ui/form";
import { FormInput, FormSelect, FormDatePicker } from "@/shared/components/form-fields";
import { Button } from "@/shared/ui/button";
import { FormSubmitButton } from "@/shared/components/form-submit-button";
import { useDirtyForm } from "@/shared/hooks/use-dirty-form";
import { useCreateLead, useUpdateLead } from "@/shared/hooks/use-crm";
import { useCurrency } from "@/shared/hooks/use-currency";
import { LeadStatus } from "@/shared/types/lead";

import { AppIcon } from "@/shared/components/icons/icon-registry";

const leadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  company: z.string().min(2, "Company must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  status: z.enum(["NEW", "CONTACTED", "PROPOSAL_SENT", "WON", "LOST"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  value: z.string().optional(),
  followUpAt: z.date().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface LeadFormProps {
  initialData?: import("@/shared/types/lead").LeadType;
  initialStage?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const LeadForm = ({ initialData, initialStage, onSuccess, onCancel }: LeadFormProps) => {
  const { mutateAsync: createMutate, isPending: isCreating } = useCreateLead();
  const { mutateAsync: updateMutate, isPending: isUpdating } = useUpdateLead();
  const { currencySymbol } = useCurrency();

  const isPending = isCreating || isUpdating;

  const stageToStatus: Record<string, string> = {
    "New Lead": "NEW",
    "Contacted": "CONTACTED",
    "Proposal Sent": "PROPOSAL_SENT",
    "Won": "WON",
    "Lost": "LOST",
  };

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: initialData?.name || "",
      company: initialData?.company || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      status: initialData?.status 
        ? (Object.values(stageToStatus).includes(initialData.status) ? initialData.status as ReturnType<typeof JSON.parse> : "NEW") 
        : ((initialStage && stageToStatus[initialStage]) ? stageToStatus[initialStage] as LeadFormValues['status'] : "NEW"),
      priority: initialData?.priority 
        ? (initialData.priority.toUpperCase() as "LOW" | "MEDIUM" | "HIGH") 
        : "MEDIUM",
      value: initialData?.value?.replace(/[^0-9.]/g, '') || "",
      followUpAt: initialData?.followUpAt ? new Date(initialData.followUpAt) : undefined,
    },
  });

  const { isDirty, resetDirty } = useDirtyForm(form, form.formState.defaultValues);

  const onSubmit = async (data: LeadFormValues) => {
    try {
      let formattedPhone = data.phone;
      if (formattedPhone && formattedPhone.trim() !== '' && !formattedPhone.trim().startsWith('+')) {
        formattedPhone = `+91 ${formattedPhone.trim()}`;
      }

      if (initialData) {
        await updateMutate({
          id: initialData.id,
          data: {
            name: data.name,
            company: data.company,
            email: data.email,
            phone: formattedPhone,
            stage: data.status as LeadStatus,
            priority: data.priority as ReturnType<typeof JSON.parse>,
            value: data.value ? data.value.replace(/[^0-9.]/g, '') : "0",
            followUpAt: data.followUpAt ? data.followUpAt.toISOString() : null,
          }
        });
      } else {
        await createMutate({
          name: data.name,
          company: data.company,
          email: data.email,
          phone: formattedPhone,
          stage: data.status as LeadStatus,
          priority: data.priority as ReturnType<typeof JSON.parse>,
          value: data.value ? data.value.replace(/[^0-9.]/g, '') : "0",
          followUpAt: data.followUpAt ? data.followUpAt.toISOString() : null,
        });
      }
      resetDirty(form.getValues());
      onSuccess?.();
     
    } catch {
      // Error handled by hook
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput name="name" label="Full Name" placeholder="Enter full name" />
          <FormInput name="company" label="Company" placeholder="Enter company name" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput name="email" label="Email Address" placeholder="Enter email address" />
          <FormInput name="phone" label="Phone Number" placeholder="Enter phone number" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSelect 
            name="status" 
            label="Status" 
            placeholder="Select status"
            options={[
              { label: "New Lead", value: "NEW" },
              { label: "Contacted", value: "CONTACTED" },
              { label: "Proposal Sent", value: "PROPOSAL_SENT" },
              { label: "Won", value: "WON" },
              { label: "Lost", value: "LOST" },
            ]} 
          />
          <FormSelect 
            name="priority" 
            label="Priority" 
            placeholder="Select priority"
            options={[
              { label: "Low", value: "LOW" },
              { label: "Medium", value: "MEDIUM" },
              { label: "High", value: "HIGH" },
            ]} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput name="value" label={`Estimated Value (${currencySymbol})`} placeholder="Enter estimated value" />
          <FormDatePicker name="followUpAt" label="Follow-up Date" placeholder="Select follow-up date" />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            <AppIcon name="close" size={15} className="mr-1.5" />
            Cancel
          </Button>
          <FormSubmitButton
            isDirty={isDirty}
            isPending={isPending}
            loadingText={initialData ? "Updating..." : "Creating..."}
          >
            {initialData ? "Update Lead" : "Create Lead"}
          </FormSubmitButton>
        </div>
      </form>
    </Form>
  );
};
