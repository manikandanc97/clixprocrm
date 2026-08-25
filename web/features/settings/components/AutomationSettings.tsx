"use client";

import React, { useState } from "react";
import {
  Zap,
  Plus,
  Play,
  CheckCircle2,
  Mail,
  Users,
  Bell,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { CRMCard } from "@/shared/components/crm";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import { Badge } from "@/shared/ui/badge";
import { toast } from "sonner";

interface WorkflowRule {
  id: string;
  title: string;
  trigger: string;
  action: string;
  enabled: boolean;
  runCount: number;
}

const DEFAULT_WORKFLOWS: WorkflowRule[] = [
  {
    id: "1",
    title: "New Lead Welcome & Assignment",
    trigger: "When a new lead is created from website form",
    action: "Send welcome email and assign to available sales rep",
    enabled: true,
    runCount: 342,
  },
  {
    id: "2",
    title: "Deal Won Celebration & Invoice Trigger",
    trigger: "When deal stage changes to 'Closed Won'",
    action: "Create draft invoice and notify executive team",
    enabled: true,
    runCount: 89,
  },
  {
    id: "3",
    title: "Stale Deal Activity Reminder",
    trigger: "When no activity recorded for 7 days in 'Proposal Sent'",
    action: "Create follow-up task and alert deal owner",
    enabled: true,
    runCount: 156,
  },
  {
    id: "4",
    title: "AI Meeting Follow-up Summarizer",
    trigger: "When a calendar meeting ends with customer",
    action: "Generate AI summary and populate meeting notes",
    enabled: false,
    runCount: 45,
  },
];

export default function AutomationSettings() {
  const [workflows, setWorkflows] = useState<WorkflowRule[]>(DEFAULT_WORKFLOWS);

  const handleToggle = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    );
    toast.success("Automation rule updated");
  };

  return (
    <div className="space-y-6">
      <CRMCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/50">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Automated Workflows & Triggers
            </h3>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Execute routine actions, notifications, and assignments when CRM events occur.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => toast.info("Custom workflow builder is active")}
            className="text-xs font-semibold gap-1.5 h-9"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Workflow
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              className={`p-4 rounded-xl border transition-all ${
                wf.enabled ? "bg-card border-border shadow-sm" : "bg-muted/30 border-border/40 opacity-70"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-foreground">{wf.title}</p>
                    {wf.enabled && (
                      <Badge variant="outline" className="text-[10px] font-bold text-primary bg-primary/10 border-primary/20">
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground/80">Trigger:</span> {wf.trigger}
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className="font-medium text-foreground/80">Action:</span> {wf.action}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {wf.runCount} executions
                  </span>
                  <Switch
                    checked={wf.enabled}
                    onCheckedChange={() => handleToggle(wf.id)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CRMCard>
    </div>
  );
}
