"use client";

import React, { useState } from "react";
import {
  LifeBuoy,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Headphones,
} from "lucide-react";
import { CRMCard } from "@/shared/components/crm";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Badge } from "@/shared/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/components/auth-provider";

export default function ContactSupportSettings() {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("technical");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in subject and description");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success("Support ticket #SR-8924 submitted successfully. Our team will respond shortly.");
      setSubject("");
      setMessage("");
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Support Ticket Form */}
        <div className="lg:col-span-2 space-y-6">
          <CRMCard>
            <div className="pb-4 border-b border-border/50">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-primary" />
                Submit a Support Ticket
              </h3>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Our dedicated support engineers respond to enterprise inquiries within 2 hours.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Subject / Issue Summary</Label>
                <Input
                  placeholder="Brief description of the problem..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical Bug / Issue</SelectItem>
                      <SelectItem value="billing">Subscription & Billing</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="integration">API & Integrations</SelectItem>
                      <SelectItem value="security">Security & Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Urgency / Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (General question)</SelectItem>
                      <SelectItem value="medium">Medium (Standard priority)</SelectItem>
                      <SelectItem value="high">High (Workflow blocked)</SelectItem>
                      <SelectItem value="urgent">Critical (Production outage)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Detailed Description</Label>
                <Textarea
                  placeholder="Please provide steps to reproduce, expected vs actual result, or quotation/deal reference IDs..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  required
                  className="text-xs resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="text-xs font-semibold gap-1.5 h-9"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </Button>
              </div>
            </form>
          </CRMCard>
        </div>

        {/* Support SLA & Contact Cards */}
        <div className="space-y-6">
          <CRMCard>
            <div className="pb-3 border-b border-border/50">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Headphones className="w-4 h-4 text-primary" />
                Support SLA & Channels
              </h3>
            </div>

            <div className="space-y-3.5 pt-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Response SLA</span>
                <span className="font-semibold text-foreground">&lt; 2 Hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Support Tier</span>
                <Badge variant="outline" className="text-[10px] font-bold text-primary bg-primary/10 border-primary/20">
                  Priority Enterprise
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Operating Hours</span>
                <span className="font-medium text-foreground">24/7 Global</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Direct Email</span>
                <span className="font-mono text-primary">support@clixprocrm.com</span>
              </div>
            </div>
          </CRMCard>

          <CRMCard>
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div>
                <p className="text-xs font-bold text-foreground">All Systems Operational</p>
                <p className="text-[11px] text-muted-foreground">99.98% uptime in past 90 days</p>
              </div>
            </div>
          </CRMCard>
        </div>
      </div>
    </div>
  );
}
