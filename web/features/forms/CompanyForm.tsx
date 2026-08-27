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
import { useCreateCompany, useUpdateCompany } from "@/shared/hooks/use-crm";

const companySchema = z.object({
  name: z.string().min(2, "Company Name must be at least 2 characters"),
  industry: z.string().optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

interface CompanyFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CompanyForm = ({ initialData, onSuccess, onCancel }: CompanyFormProps) => {
  const { mutateAsync: createMutate, isPending: isCreating } = useCreateCompany();
  const { mutateAsync: updateMutate, isPending: isUpdating } = useUpdateCompany();

  const isPending = isCreating || isUpdating;

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: initialData?.name || "",
      industry: initialData?.industry || "",
      website: initialData?.website || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      status: initialData?.status || "ACTIVE",
    },
  });

  const { isDirty, resetDirty } = useDirtyForm(form, form.formState.defaultValues);

  const onSubmit: SubmitHandler<CompanyFormValues> = async (data) => {
    try {
      if (initialData) {
        await updateMutate({ id: initialData.id, data });
      } else {
        await createMutate(data);
      }
      resetDirty(form.getValues());
      onSuccess?.();
    } catch {
      // Error handled by hook
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
        <FormInput name="name" label="Company Name" placeholder="Enter company name" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput name="industry" label="Industry" placeholder="Enter industry" />
          <FormInput name="website" label="Website" placeholder="https://example.com" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput name="email" label="Email Address" placeholder="Enter email address" />
          <FormInput name="phone" label="Phone Number" placeholder="Enter phone number" />
        </div>

        <FormSelect 
          name="status" 
          label="Status" 
          placeholder="Select status"
          options={[
            { label: "Active", value: "ACTIVE" },
            { label: "Inactive", value: "INACTIVE" },
          ]} 
        />

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
            {initialData ? "Update Company" : "Create Company"}
          </FormSubmitButton>
        </div>
      </form>
    </Form>
  );
};
