"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Label } from "@/shared/ui/label";
import { FileUploader, FileWithPreview } from "./FileUploader";
import { toast } from "sonner";
import {
  CheckCircle2,
  Copy,
  Plus,
  Loader2,
  Bug,
  Sparkles,
  Layers,
  FileText,
  ShieldCheck,
  CreditCard,
  Zap,
  HelpCircle,
  Clock,
  Check,
  Eye,
  Send,
  TriangleAlert,
  ClockAlert,
} from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { useAuth } from "@/features/auth/components/auth-provider";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import client from "@/shared/lib/api/client";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 10;

const ticketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters").max(120, "Subject must be under 120 characters"),
  category: z.string().min(1, "Please select an issue category"),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  description: z.string().min(20, "Please provide a detailed description (minimum 20 characters)"),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

const CATEGORIES = [
  { label: "Bug Report (UI / Functionality)", value: "Bug Report", icon: Bug, color: "text-rose-500" },
  { label: "Feature Request / Enhancement", value: "Feature Request", icon: Sparkles, color: "text-amber-500" },
  { label: "Sales & Deals Pipeline", value: "Sales Pipeline", icon: Layers, color: "text-blue-500" },
  { label: "Quotations, Invoices & Billing", value: "Billing & Invoicing", icon: CreditCard, color: "text-emerald-500" },
  { label: "Leads & Customer Management", value: "Leads & Customers", icon: FileText, color: "text-indigo-500" },
  { label: "Roles, Permissions & Security", value: "Security & Permissions", icon: ShieldCheck, color: "text-violet-500" },
  { label: "API, Integrations & Webhooks", value: "Integrations & API", icon: Zap, color: "text-sky-500" },
  { label: "General Inquiry / How-To", value: "General Inquiry", icon: HelpCircle, color: "text-slate-500" },
];

const PRIORITY_METRICS = {
  Critical: {
    sla: "< 1 Hour Response SLA",
    desc: "Production blocker or severe data issue",
    color: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
    dot: "bg-rose-500",
  },
  High: {
    sla: "< 4 Hours Response SLA",
    desc: "Core business feature impaired",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  Medium: {
    sla: "< 12 Hours Response SLA",
    desc: "Normal workflow / non-critical issue",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  Low: {
    sla: "< 24 Hours Response SLA",
    desc: "General inquiry or minor feedback",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
};

interface SupportTicketFormProps {
  onTicketCreated?: () => void;
  onSwitchToHistory?: () => void;
}

export function SupportTicketForm({ onTicketCreated, onSwitchToHistory }: SupportTicketFormProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [successData, setSuccessData] = useState<{ id: string; time: string; subject: string } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    reset,
    watch,
    setValue,
  } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    mode: "onChange",
    defaultValues: {
      subject: "",
      category: "",
      priority: "Medium",
      description: "",
    },
  });

  const priorityValue = watch("priority") || "Medium";
  const subjectValue = watch("subject") || "";
  const categoryValue = watch("category") || "";
  const descriptionValue = watch("description") || "";

  // Submit is enabled only when all mandatory fields have valid content
  const isMandatoryFilled =
    subjectValue.trim().length >= 5 &&
    categoryValue.trim().length > 0 &&
    descriptionValue.trim().length >= 20;

  const getDiagnostics = () => {
    return {
      currentUserName: user?.name || "Workspace Member",
      email: user?.email || "user@workspace.local",
      role: user?.role || "Admin",
      tenantId: user?.id || "default",
      currentUrl: typeof window !== "undefined" ? window.location.href : "",
      currentPage: typeof window !== "undefined" ? window.location.pathname : "",
      browser: typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
      operatingSystem: typeof navigator !== "undefined" ? navigator.platform : "Unknown",
      deviceType: typeof navigator !== "undefined" && /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
      screenResolution: typeof window !== "undefined" ? `${window.screen.width}x${window.screen.height}` : "1920x1080",
      timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC",
      language: typeof navigator !== "undefined" ? navigator.language : "en-US",
      appVersion: "1.2.0",
      environment: process.env.NODE_ENV || "production",
      timestamp: new Date().toISOString(),
    };
  };

  const onSubmit = async (data: TicketFormValues) => {
    if (data.category === "Bug Report" && files.length === 0) {
      toast.info("Tip: Attaching a screenshot or error log helps our team resolve bugs faster.");
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("subject", data.subject);
      formData.append("category", data.category);
      formData.append("priority", data.priority);
      formData.append("description", data.description);
      formData.append("diagnostics", JSON.stringify(getDiagnostics()));

      files.forEach((file) => {
        formData.append("attachments", file);
      });

      const response = await client.post("/support/ticket", formData);
      const result = response.data?.data || response.data;

      setSuccessData({
        id: result.ticketId || result.id,
        time: result.estimatedResponseTime || "Within 24 hours",
        subject: data.subject,
      });

      toast.success("Support ticket created and dispatched successfully!");
      if (onTicketCreated) {
        onTicketCreated();
      }
    } catch (error: any) {
      console.error("Support ticket submission failed:", error);
      toast.error(error?.response?.data?.error?.message || "Failed to submit ticket. Please check your inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTicketId = () => {
    if (successData?.id) {
      navigator.clipboard.writeText(successData.id);
      setCopied(true);
      toast.success("Ticket ID copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (successData) {
    return (
      <Card className="w-full max-w-2xl mx-auto border border-emerald-500/20 bg-card shadow-sm rounded-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-300">
        <div className="p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/5">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-bold text-foreground">Support Ticket Created Successfully</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Your inquiry has been assigned to our dedicated technical team. We will notify you when a response is posted.
            </p>
          </div>

          <div className="bg-muted/40 p-4 rounded-xl border border-border/70 space-y-3 text-xs text-left">
            <div className="flex justify-between items-center pb-2.5 border-b border-border/50">
              <span className="font-medium text-muted-foreground">Ticket Reference</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-primary text-sm">{successData.id}</span>
                <button
                  type="button"
                  onClick={copyTicketId}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Copy Ticket ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-medium text-muted-foreground">Subject</span>
              <span className="font-semibold text-foreground truncate max-w-[280px]">{successData.subject}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-medium text-muted-foreground">Expected SLA Response</span>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                {successData.time}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {onSwitchToHistory && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSwitchToHistory}
                className="w-full sm:w-auto text-xs font-semibold h-9 gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-primary" /> View in My Tickets
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                setSuccessData(null);
                reset();
                setFiles([]);
              }}
              className="w-full sm:w-auto text-xs font-semibold h-9 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Submit Another Ticket
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const selectedPriorityInfo = PRIORITY_METRICS[priorityValue as keyof typeof PRIORITY_METRICS] || PRIORITY_METRICS.Medium;
  const selectedCategoryObj = CATEGORIES.find((c) => c.value === categoryValue);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Form Area */}
      <div className="lg:col-span-2">
        <Card className="border-border shadow-card rounded-2xl overflow-hidden">
          <CardContent className="p-6 md:p-7">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Subject */}
              <div className="space-y-1.5 group">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ticket-subject" className="text-xs font-bold text-foreground">
                    Subject / Issue Summary <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {subjectValue.length}/120
                  </span>
                </div>
                <div className="relative flex items-center w-full">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground/70 pointer-events-none z-10 transition-colors group-focus-within:text-primary">
                    <AppIcon
                      name="tasks"
                      icon={FileText}
                      size={15}
                      disableHover={true}
                      className="text-muted-foreground/70 group-focus-within:text-primary transition-colors"
                    />
                  </div>
                  <Input
                    id="ticket-subject"
                    placeholder="Briefly describe the issue or request..."
                    {...register("subject")}
                    className={`h-9 text-xs pl-9 ${errors.subject ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                </div>
                {errors.subject && (
                  <p className="text-[11px] text-destructive font-medium">{errors.subject.message}</p>
                )}
              </div>

              {/* Category & Priority 2-Column */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-1.5 group">
                  <Label className="text-xs font-bold text-foreground">
                    Issue Category <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    control={control}
                    name="category"
                    render={({ field }) => (
                      <div className="relative flex items-center w-full">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10">
                          <AppIcon
                            name={selectedCategoryObj ? "tag" : "modules"}
                            icon={selectedCategoryObj?.icon || Layers}
                            size={15}
                            disableHover={true}
                            className={`transition-colors ${selectedCategoryObj ? selectedCategoryObj.color : "text-muted-foreground/70 group-focus-within:text-primary"}`}
                          />
                        </div>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className={`h-9 text-xs pl-9 ${errors.category ? "border-destructive" : ""}`}>
                            <SelectValue placeholder="Select issue category..." />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((cat) => {
                              const IconComponent = cat.icon;
                              return (
                                <SelectItem key={cat.value} value={cat.value} className="text-xs">
                                  <div className="flex items-center gap-2">
                                    <IconComponent className={`w-3.5 h-3.5 ${cat.color}`} />
                                    <span>{cat.label}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  />
                  {errors.category && (
                    <p className="text-[11px] text-destructive font-medium">{errors.category.message}</p>
                  )}
                </div>

                {/* Priority */}
                <div className="space-y-1.5 group">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground">Urgency Level</Label>
                    <span className="text-[10px] font-semibold text-primary">{selectedPriorityInfo.sla}</span>
                  </div>
                  <Controller
                    control={control}
                    name="priority"
                    render={({ field }) => (
                      <div className="relative flex items-center w-full">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground/70 pointer-events-none z-10 transition-colors group-focus-within:text-primary">
                          <AppIcon
                            name="alert"
                            icon={ClockAlert}
                            size={15}
                            disableHover={true}
                            className="text-muted-foreground/70 group-focus-within:text-primary transition-colors"
                          />
                        </div>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="h-9 text-xs pl-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low" className="text-xs">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span>Low — General inquiry / minor note</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="Medium" className="text-xs">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                <span>Medium — Standard priority issue</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="High" className="text-xs">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                <span>High — Core workflow impaired</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="Critical" className="text-xs">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                                <span>Critical — Outage or data blocker</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5 group">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ticket-description" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    Detailed Description <span className="text-destructive">*</span>
                  </Label>
                  <AppIcon
                    name="quotations"
                    icon={FileText}
                    size={15}
                    disableHover={true}
                    className="text-muted-foreground/60 group-focus-within:text-primary transition-colors"
                  />
                </div>
                <div className="relative">
                  <Textarea
                    id="ticket-description"
                    placeholder="Describe what happened, steps to reproduce, and any relevant reference IDs..."
                    rows={6}
                    className={`text-xs resize-y ${errors.description ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    {...register("description")}
                  />
                </div>
                {errors.description && (
                  <p className="text-[11px] text-destructive font-medium">{errors.description.message}</p>
                )}
              </div>

              {/* Attachments Uploader */}
              <div className="space-y-2 pt-1">
                <Label className="text-xs font-bold text-foreground">Screenshots, Videos & Attachments</Label>
                <FileUploader
                  files={files}
                  setFiles={setFiles}
                  maxFiles={MAX_FILES}
                  maxSizeMB={MAX_FILE_SIZE / (1024 * 1024)}
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    reset();
                    setFiles([]);
                  }}
                  disabled={isSubmitting}
                  className="text-xs font-semibold h-9 px-3.5 gap-1.5"
                >
                  <AppIcon name="refresh" size={13} className="text-muted-foreground" />
                  <span>Clear Form</span>
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !isMandatoryFilled}
                  size="sm"
                  className="text-xs font-semibold h-9 px-4 gap-1.5 min-w-[130px] transition-all duration-200"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <AppIcon name="send" icon={Send} size={14} /> Submit Ticket
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Support SLA & Real-time Details */}
      <div className="space-y-5 lg:sticky lg:top-4">
        <Card className="border-border shadow-card rounded-2xl overflow-hidden">
          <CardContent className="p-5 space-y-4">
            <div className="pb-3 border-b border-border/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" /> Support SLA & Coverage
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Active SLA Target</span>
                <Badge variant="outline" className={`text-[10px] font-bold ${selectedPriorityInfo.color}`}>
                  {selectedPriorityInfo.sla}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Support Tier</span>
                <span className="font-semibold text-foreground">Priority Enterprise</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Support Window</span>
                <span className="font-semibold text-foreground">24/7 Global Dispatch</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Direct Desk</span>
                <span className="font-mono text-primary text-[11px]">support@clixprocrm.com</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority Help Card */}
        <Card className="border-border/80 bg-gradient-to-br from-primary/5 via-card to-card shadow-card rounded-2xl overflow-hidden">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-bold text-foreground">Need Urgent Live Assistance?</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              For production blocking outages or critical billing assistance, mark priority as <strong className="text-rose-500 font-semibold">Critical</strong> to trigger automatic engineer paging.
            </p>
            <div className="pt-1">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-background/80 border border-border/60 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-medium text-foreground">Helpdesk Engineers Online</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
