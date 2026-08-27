"use client";

import React, { useEffect, useMemo } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { FormInput, FormSelect } from "@/shared/components/form-fields";
import { Button } from "@/shared/ui/button";
import { FormSubmitButton } from "@/shared/components/form-submit-button";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { useDirtyForm } from "@/shared/hooks/use-dirty-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEmployee, updateEmployee } from "@/shared/lib/api/crm";
import client from "@/shared/lib/api/client";
import { toast } from "sonner";
import { Key, Building2 } from "lucide-react";
import { useWorkspace } from "@/shared/hooks/use-settings";
import { useAuth } from "@/features/auth/components/auth-provider";

const basePasswordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[!@#$%^&*(),.?":{}|<>_\+\-\=]/, "Password must contain at least one special character");

const employeeSchemaCreate = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: basePasswordSchema,
  role: z.string().min(1, "Role is required"),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
});

const employeeSchemaEdit = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: basePasswordSchema.optional().or(z.literal("")),
  role: z.string().min(1, "Role is required"),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchemaEdit>;

interface EmployeeInitialData {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

interface EmployeeFormProps {
  initialData?: EmployeeInitialData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const EmployeeForm = ({ initialData, onSuccess, onCancel }: EmployeeFormProps) => {
  const queryClient = useQueryClient();
  const isEditing = !!initialData;

  const { data: rolesData } = useQuery<{
    success: boolean;
    data: Array<{ id: string; name: string; isActive?: boolean }>;
  }>({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await client.get("/crm/roles");
      return res.data;
    },
  });

  const roleOptions = useMemo(() => {
    const list = rolesData?.data || [];
    if (list.length > 0) {
      return list
        .filter((r) => r.isActive !== false)
        .map((r) => ({
          label: r.name,
          value: r.name,
        }));
    }
    return [{ label: "Admin", value: "ADMIN" }];
  }, [rolesData]);
  
  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      if (data.temporaryPassword) {
        toast.success("Employee created!", {
          description: `Temporary Password: ${data.temporaryPassword} - COPY THIS NOW!`,
          duration: 15000,
        });
      } else {
        toast.success("Employee created successfully");
      }
      resetDirty(form.getValues());
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create employee");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: EmployeeFormValues) => updateEmployee(initialData?.id as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee updated successfully");
      resetDirty(form.getValues());
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update employee");
    },
  });

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(isEditing ? employeeSchemaEdit : employeeSchemaCreate),
    mode: "onChange",
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      password: "",
      role: initialData?.role || "ADMIN",
      status: initialData?.status || "ACTIVE",
    },
  });

  const { isDirty, resetDirty } = useDirtyForm(form, form.formState.defaultValues);

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        email: initialData.email || "",
        password: "",
        role: initialData.role || "ADMIN",
        status: initialData.status || "ACTIVE",
      });
    }
  }, [initialData, form]);

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const nums = "0123456789";
    const special = "!@#$%^&*";
    
    let password = "";
    password += chars[Math.floor(Math.random() * chars.length)];
    password += upper[Math.floor(Math.random() * upper.length)];
    password += nums[Math.floor(Math.random() * nums.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    const all = chars + upper + nums + special;
    for (let i = 0; i < 10; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }
    
    password = password.split('').sort(() => 0.5 - Math.random()).join('');
    
    form.setValue("password", password, { shouldValidate: true, shouldDirty: true });
    toast.success("Enterprise password generated");
  };

  const onSubmit: SubmitHandler<EmployeeFormValues> = async (data) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const { data: workspace } = useWorkspace();
  const { user } = useAuth();
  const companyName = workspace?.name || user?.companyName || "Organization Workspace";
  const companyLogo = workspace?.logo ?? user?.companyLogo;
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-muted/40 border border-border/50 text-xs text-muted-foreground">
          <div className="w-5 h-5 rounded-md overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
            {companyLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={companyLogo} alt={companyName} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-3 h-3 text-primary" />
            )}
          </div>
          <span className="truncate">
            Company Workspace: <strong className="text-foreground">{companyName}</strong>
          </span>
        </div>

        <FormInput name="name" label="Name" placeholder="Enter full name" />
        
        <FormInput name="email" label="Email" placeholder="Enter email address" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSelect 
            name="role" 
            label="Role" 
            placeholder="Select role"
            options={roleOptions} 
          />
          <FormSelect 
            name="status" 
            label="Status" 
            placeholder="Select status"
            options={[
              { label: "Active", value: "ACTIVE" },
              { label: "Inactive", value: "INACTIVE" },
              { label: "Suspended", value: "SUSPENDED" },
            ]} 
          />
        </div>
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Temporary Password</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input type="text" placeholder="Enter or generate temporary password" className="flex-1" {...field} />
                </FormControl>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={generatePassword} 
                  className="shrink-0 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
                >
                  <AppIcon name="key" size={16} className="mr-2" />
                  Generate Password
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            <AppIcon name="close" size={15} className="mr-1.5" />
            Cancel
          </Button>
          <FormSubmitButton
            isDirty={isDirty}
            isPending={isPending}
            loadingText={isEditing ? "Updating..." : "Onboarding..."}
          >
            {isEditing ? "Update Employee" : "Create Employee"}
          </FormSubmitButton>
        </div>
      </form>
    </Form>
  );
};
