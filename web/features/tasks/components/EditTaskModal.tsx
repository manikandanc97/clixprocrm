"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { FormSubmitButton } from "@/shared/components/form-submit-button";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { UnsavedWarning } from "@/shared/components/unsaved-warning";
import { useDirtyForm } from "@/shared/hooks/use-dirty-form";
import { useUpdateTask, useEmployees } from "@/shared/hooks/use-crm";
import { useAuth } from "@/features/auth/components/auth-provider";
import { TaskType } from "@/shared/types/task";
import { AlertCircle } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { TaskRelatedRecordPicker, RelatedRecord } from "./TaskRelatedRecordPicker";
import { TaskChecklistTab } from "./TaskChecklistTab";

// ─── Schema (essential fields only) ───

const taskFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional().default(""),
  assignedToId: z.string().min(1, "Please assign this task"),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  dueDate: z.string().min(1, "Due date is required"),
  checklist: z
    .array(z.object({ id: z.string(), title: z.string().min(1), completed: z.boolean().default(false) }))
    .default([]),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

// ─── Constants ───

const PRIORITY_OPTIONS = [
  { value: "HIGH", label: "High", dot: "bg-rose-500" },
  { value: "MEDIUM", label: "Medium", dot: "bg-amber-500" },
  { value: "LOW", label: "Low", dot: "bg-blue-500" },
] as const;

// ─── Component ───

interface EditTaskModalProps {
  task: TaskType | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { mutate: updateTask, isPending } = useUpdateTask();
  const { data: employeesData } = useEmployees();

  const employees = useMemo(() => employeesData?.employees || [], [employeesData?.employees]);

  const [activeTab, setActiveTab] = useState<"general" | "checklist">("general");
  const [attachments, setAttachments] = useState<{ id: string; fileName: string; fileSize: number }[]>([]);
  const [relatedRecord, setRelatedRecord] = useState<RelatedRecord | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  const defaultDueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      assignedToId: user?.id || "",
      priority: "MEDIUM",
      dueDate: defaultDueDate,
      checklist: [],
    },
  });

  const { isDirty, resetDirty } = useDirtyForm(form, form.formState.defaultValues as TaskFormValues, {
    externalOriginalValues: {
      attachments: task?.attachments || [],
      relatedRecord: (() => {
        if (!task) return null;
        if (task.relatedLead) return { type: "lead", id: task.relatedLead.id, label: task.relatedLead.name, sub: task.relatedLead.company || "" };
        if (task.relatedCustomer) return { type: "customer", id: task.relatedCustomer.id, label: task.relatedCustomer.name, sub: task.relatedCustomer.company || "" };
        if (task.relatedQuotation) return { type: "quotation", id: task.relatedQuotation.id, label: `#${task.relatedQuotation.quoteNumber}`, sub: (task.relatedQuotation as any).client };
        return null;
      })(),
    },
    externalValues: { attachments, relatedRecord },
  });

  useEffect(() => {
    if (task && isOpen) {
      let formattedDueDate = defaultDueDate;
      if (task.dueDate) {
        const parsedDate = new Date(task.dueDate);
        if (!isNaN(parsedDate.getTime())) {
          formattedDueDate = parsedDate.toISOString().slice(0, 16);
        }
      }

      form.reset({
        title: task.title,
        description: task.description || "",
        assignedToId: task.assignedTo?.id || user?.id || "",
        priority: task.priority as any,
        dueDate: formattedDueDate,
        checklist: task.checklist || [],
      });

      if (task.relatedLead) {
        setRelatedRecord({ type: "lead", id: task.relatedLead.id, label: task.relatedLead.name, sub: task.relatedLead.company || "" });
      } else if (task.relatedCustomer) {
        setRelatedRecord({ type: "customer", id: task.relatedCustomer.id, label: task.relatedCustomer.name, sub: task.relatedCustomer.company || "" });
      } else if (task.relatedQuotation) {
        setRelatedRecord({ type: "quotation", id: task.relatedQuotation.id, label: `#${task.relatedQuotation.quoteNumber}`, sub: (task.relatedQuotation as any).client });
      } else {
        setRelatedRecord(null);
      }

      setAttachments(
        task.attachments?.map((a: any) => ({
          id: a.id || String(Math.random()),
          fileName: a.fileName || "file",
          fileSize: a.fileSize || 0,
        })) || [],
      );

      resetDirty();
    }
  }, [task, isOpen]);

  const { fields: checklistFields, append: appendChecklist, remove: removeChecklist } = useFieldArray({
    control: form.control,
    name: "checklist",
  });

  const handleAddChecklist = (title: string) => {
    appendChecklist({ id: String(Date.now()), title, completed: false });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAtts = Array.from(files).map((f) => ({
      id: `${Date.now()}-${Math.random()}`,
      fileName: f.name,
      fileSize: f.size,
    }));
    setAttachments((prev) => [...prev, ...newAtts]);
    e.target.value = "";
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const resetForm = () => {
    form.reset();
    setRelatedRecord(null);
    setAttachments([]);
    setActiveTab("general");
    resetDirty();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (isDirty) {
        setShowWarning(true);
      } else {
        resetForm();
        onClose();
      }
    }
  };

  const onSubmit = async (values: TaskFormValues) => {
    if (!task) return;
    try {
      const payload: any = {
        title: values.title.trim(),
        description: values.description?.trim() || "",
        assignedToId: values.assignedToId,
        priority: values.priority,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : new Date().toISOString(),
        checklist: values.checklist,
      };

      if (relatedRecord) {
        if (relatedRecord.type === "lead") payload.leadId = relatedRecord.id;
        else if (relatedRecord.type === "customer") payload.customerId = relatedRecord.id;
        else if (relatedRecord.type === "quotation") payload.quotationId = relatedRecord.id;
      }

      updateTask(
        { id: task.id, data: payload },
        {
          onSuccess: () => {
            resetForm();
            onSuccess?.();
            onClose();
          },
        },
      );
    } catch {
      // Error handled by mutation hook
    }
  };

  const dueDateValue = form.watch("dueDate");
  const isPastDue = dueDateValue ? new Date(dueDateValue) < new Date() : false;
  const hasErrors = Object.keys(form.formState.errors).length > 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg p-0 overflow-hidden flex flex-col max-h-[90vh]">
          {/* ── HEADER ── */}
          <div className="shrink-0 bg-muted/20 border-b border-border p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <AppIcon name="tasks" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base font-bold text-foreground tracking-tight">
                  Edit Task
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Update task details and progress.
                </DialogDescription>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
              <Tabs
                value={activeTab}
                onValueChange={(val) => setActiveTab(val as "general" | "checklist")}
                className="flex-1 flex flex-col min-h-0"
              >
                {/* ── TAB BAR ── */}
                <TabsList className="w-full justify-start rounded-none border-b border-border bg-background px-6 h-auto p-0 gap-0 shrink-0">
                  <TabsTrigger
                    value="general"
                    className="flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest border-b-2 rounded-none bg-transparent shadow-none transition-colors border-transparent text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <AppIcon name="file" size={14} />
                    General
                  </TabsTrigger>
                  <TabsTrigger
                    value="checklist"
                    className="flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest border-b-2 rounded-none bg-transparent shadow-none transition-colors border-transparent text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <AppIcon name="tasks" size={14} />
                    Checklist
                    {checklistFields.length > 0 && (
                      <span className="ml-1 text-[9px] font-bold bg-primary/10 text-primary rounded-full size-4 inline-flex items-center justify-center">
                        {checklistFields.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* ── BODY ── */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* ===== GENERAL TAB ===== */}
                  <TabsContent
                    value="general"
                    className="mt-0 space-y-4 focus-visible:outline-none"
                  >
                    {/* Title */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                            Task Title <span className="text-destructive">*</span>
                          </Label>
                          <FormControl>
                            <Input
                              placeholder="Enter task title"
                              className="h-10 text-sm font-medium"
                              autoFocus
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                            Description
                          </Label>
                          <FormControl>
                            <Textarea
                              placeholder="Enter task description or context..."
                              className="resize-none min-h-[72px] text-sm"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Assign To + Priority — side by side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="assignedToId"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                              Assign To <span className="text-destructive">*</span>
                            </Label>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-10 w-full text-sm font-medium">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {employees.map((emp: any) => (
                                  <SelectItem key={emp.id} value={emp.id || emp.userId}>
                                    {emp.name}
                                  </SelectItem>
                                ))}
                                {employees.length === 0 && user?.id && (
                                  <SelectItem value={user.id}>{user.name || "Me"}</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                              Priority
                            </Label>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-10 w-full text-sm font-medium">
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {PRIORITY_OPTIONS.map((p) => (
                                  <SelectItem key={p.value} value={p.value}>
                                    {p.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Due Date */}
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                            Due Date <span className="text-destructive">*</span>
                          </Label>
                          <FormControl>
                            <Input type="datetime-local" className="h-10 text-sm" {...field} />
                          </FormControl>
                          {isPastDue && (
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-semibold">
                              <AlertCircle className="size-3" />
                              This date is in the past
                            </p>
                          )}
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    {/* Related Record */}
                    <TaskRelatedRecordPicker
                      relatedRecord={relatedRecord}
                      onSelectRecord={setRelatedRecord}
                    />
                  </TabsContent>

                  {/* ===== CHECKLIST TAB ===== */}
                  <TabsContent
                    value="checklist"
                    className="mt-0 focus-visible:outline-none"
                  >
                    <TaskChecklistTab
                      checklistFields={checklistFields as any}
                      onAddChecklist={handleAddChecklist}
                      onRemoveChecklist={removeChecklist}
                      attachments={attachments}
                      onFileUpload={handleFileUpload}
                      onRemoveAttachment={handleRemoveAttachment}
                    />
                  </TabsContent>
                </div>
              </Tabs>

              {/* ── FOOTER ── */}
              <div className="shrink-0 px-6 py-4 border-t border-border bg-muted/10 flex items-center justify-between">
                <div>
                  {hasErrors && (
                    <p className="text-xs text-destructive font-semibold flex items-center gap-1">
                      <AlertCircle className="size-3.5" />
                      Check required fields
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenChange(false)}
                    disabled={isPending}
                    className="h-9 px-4 text-xs font-semibold"
                  >
                    <AppIcon name="close" size={15} className="mr-1.5" />
                    Cancel
                  </Button>
                  <FormSubmitButton
                    isDirty={isDirty}
                    isPending={isPending}
                    size="sm"
                    className="h-9 px-6 text-xs font-bold rounded-lg shadow-sm min-w-28"
                    loadingText="Saving..."
                  >
                    Save Changes
                  </FormSubmitButton>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <UnsavedWarning
        open={showWarning}
        onOpenChange={setShowWarning}
        onConfirm={() => {
          setShowWarning(false);
          resetForm();
          onClose();
        }}
        onCancel={() => setShowWarning(false)}
      />
    </>
  );
};
