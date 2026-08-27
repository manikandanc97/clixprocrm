"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/shared/ui/form";
import { FormInput, FormDatePicker, FormTextarea } from "@/shared/components/form-fields";
import { Button } from "@/shared/ui/button";
import { FormSubmitButton } from "@/shared/components/form-submit-button";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { useDirtyForm } from "@/shared/hooks/use-dirty-form";
import { useCreateMeeting } from "@/shared/hooks/use-crm";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { scheduleMeetingSchema, logMeetingSchema } from "@/shared/validations";

interface MeetingFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultLeadId?: string;
  defaultCustomerId?: string;
  defaultQuotationId?: string;
  defaultTaskId?: string;
}

export const MeetingForm = ({ 
  onSuccess, 
  onCancel, 
  defaultLeadId, 
  defaultCustomerId, 
  defaultQuotationId, 
  defaultTaskId 
}: MeetingFormProps) => {
  const [activeTab, setActiveTab] = useState<"schedule" | "log">("schedule");
  const { mutate: createMeeting, isPending } = useCreateMeeting();

  const hasCrmRelation = !!(defaultLeadId || defaultCustomerId || defaultQuotationId);

  // We maintain a single form with a superset schema for UI simplicity, 
  // but use the correct resolver based on the active tab.
  const schema = activeTab === "schedule" ? scheduleMeetingSchema : logMeetingSchema;

  const form = useForm<ReturnType<typeof JSON.parse>>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      time: "10:00 AM",
      notes: "",
      outcome: "",
      duration: 30,
      leadId: defaultLeadId,
      customerId: defaultCustomerId,
      quotationId: defaultQuotationId,
      taskId: defaultTaskId,
    },
  });

  const { isDirty, resetDirty } = useDirtyForm(form, form.formState.defaultValues);

  const onSubmit = (data: ReturnType<typeof JSON.parse>) => {
    // Combine date and time into a single Date object for startTime
    const [timeStr, period] = data.time.split(" ");
    const [hours, minutes] = (timeStr || "10:00").split(":");
    let hoursInt = parseInt(hours || "10");
    if (period === "PM" && hoursInt !== 12) hoursInt += 12;
    if (period === "AM" && hoursInt === 12) hoursInt = 0;
    
    const startTime = new Date(data.date);
    startTime.setHours(hoursInt, parseInt(minutes || "0"), 0, 0);
    
    const isLog = activeTab === "log";
    const duration = isLog ? Number(data.duration) : 30;

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + duration);

    // Date/Time validation for today's past times
    if (!isLog) {
      const now = new Date();
      if (startTime.toDateString() === now.toDateString() && startTime < now) {
        form.setError("time", { message: "Cannot schedule a meeting in the past." });
        return;
      }
    }

    createMeeting({
      title: data.title,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      location: null,
      type: "MEETING",
      description: data.notes,
      leadId: data.leadId,
      customerId: data.customerId,
      quotationId: data.quotationId,
      taskId: data.taskId,
      isLog: isLog,
      duration: duration,
      notes: data.notes,
    }, {
      onSuccess: () => {
        resetDirty(form.getValues());
        onSuccess?.();
      }
    });
  };

  if (!hasCrmRelation) {
    return (
      <div className="p-4 mb-4 text-sm text-amber-800 rounded-lg bg-amber-50">
        <p className="font-medium">No CRM Relation Found</p>
        <p>This task or context is not linked to a Lead, Customer, or Deal. Please link a CRM record before scheduling a meeting.</p>
        <div className="mt-4 flex justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>Close</Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={(val) => {
          setActiveTab(val as "schedule" | "log");
          form.clearErrors();
        }}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="schedule">Schedule Meeting</TabsTrigger>
            <TabsTrigger value="log">Log Meeting</TabsTrigger>
          </TabsList>
          
          <div className="mt-6 space-y-6">
            <FormInput name="title" label="Meeting Title" placeholder="Enter meeting title" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeTab === "schedule" ? (
                <FormDatePicker 
                  name="date" 
                  label="Date" 
                  placeholder="Select meeting date"
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today; // Disable past dates
                  }} 
                />
              ) : (
                <FormDatePicker 
                  name="date" 
                  label="Date" 
                  placeholder="Select meeting date"
                  disabled={(date) => {
                    const tomorrow = new Date();
                    tomorrow.setHours(24, 0, 0, 0);
                    return date >= tomorrow; // Disable future dates
                  }} 
                />
              )}
              
              <FormInput name="time" label="Time" placeholder="Select or enter time" />
            </div>

            {activeTab === "log" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput name="duration" label="Duration (minutes)" placeholder="Enter duration in minutes" />
                <FormInput name="outcome" label="Outcome" placeholder="Enter meeting outcome" />
              </div>
            )}
            
            <FormTextarea 
              name="notes" 
              label="Notes" 
              placeholder={activeTab === "schedule" ? "Agenda or any additional details..." : "Meeting notes..."} 
            />
          </div>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            <AppIcon name="close" size={15} className="mr-1.5" />
            Cancel
          </Button>
          <FormSubmitButton
            isDirty={isDirty}
            isPending={isPending}
            loadingText={activeTab === "schedule" ? "Scheduling..." : "Logging..."}
          >
            {activeTab === "schedule" ? "Schedule Meeting" : "Log Meeting"}
          </FormSubmitButton>
        </div>
      </form>
    </Form>
  );
};
