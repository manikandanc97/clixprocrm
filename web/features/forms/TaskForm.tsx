"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form } from "@/shared/ui/form";
import { FormInput, FormSelect, FormDatePicker, FormTextarea } from "@/shared/components/form-fields";
import { Button } from "@/shared/ui/button";
import { FormSubmitButton } from "@/shared/components/form-submit-button";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { useDirtyForm } from "@/shared/hooks/use-dirty-form";
import { useCreateTask } from "@/shared/hooks/use-crm";

const taskSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]),
  assignedToId: z.string().optional(),
  reminderAt: z.date().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const TaskForm = ({ onSuccess, onCancel }: TaskFormProps) => {
  const createTask = useCreateTask();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      status: "PENDING",
    },
  });

  const { isDirty, resetDirty } = useDirtyForm(form, form.formState.defaultValues);

  const onSubmit = async (data: TaskFormValues) => {
    try {
      await createTask.mutateAsync({
        title: data.title,
        description: data.description || "",
        dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
        priority: data.priority,
        status: data.status,
        // Using any since these fields aren't in the create task payload type yet,
        // but backend might support them or they can be ignored for now.
        assignedToId: data.assignedToId === "unassigned" ? undefined : data.assignedToId,
        reminderAt: data.reminderAt ? data.reminderAt.toISOString() : undefined,
      } as ReturnType<typeof JSON.parse>);
      resetDirty(form.getValues());
      onSuccess?.();
     
    } catch {
      // Error handled by hook
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormInput name="title" label="Task Title" placeholder="Enter task title" />
        
        <FormTextarea name="description" label="Description" placeholder="Enter task description..." />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSelect 
            name="priority" 
            label="Priority" 
            placeholder="Select priority"
            options={[
              { label: "High", value: "HIGH" },
              { label: "Medium", value: "MEDIUM" },
              { label: "Low", value: "LOW" },
            ]} 
          />
          <FormDatePicker name="dueDate" label="Due Date" placeholder="Select due date" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSelect 
            name="status" 
            label="Initial Status" 
            placeholder="Select initial status"
            options={[
              { label: "Pending", value: "PENDING" },
              { label: "In Progress", value: "IN_PROGRESS" },
              { label: "Completed", value: "COMPLETED" },
            ]} 
          />
          <FormSelect 
            name="assignedToId" 
            label="Assigned To" 
            placeholder="Select assignee"
            options={[
              { label: "Unassigned", value: "unassigned" },
              { label: "Current User", value: "me" }
            ]} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormDatePicker name="reminderAt" label="Reminder" placeholder="Select reminder date" />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onCancel} disabled={createTask.isPending}>
            <AppIcon name="close" size={15} className="mr-1.5" />
            Cancel
          </Button>
          <FormSubmitButton
            isDirty={isDirty}
            isPending={createTask.isPending}
            loadingText="Creating..."
          >
            Create Task
          </FormSubmitButton>
        </div>
      </form>
    </Form>
  );
};
