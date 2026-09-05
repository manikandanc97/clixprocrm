"use client";

import React, { useState } from "react";
import {
  ContextualSettingsDrawer,
  ContextualSettingSection,
} from "@/shared/components/crm/ContextualSettingsDrawer";
import {
  SettingsSection,
  SettingsRow,
  SettingsToggleRow,
  SettingsField,
} from "@/shared/components/crm/ContextualSettingsComponents";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import { Badge } from "@/shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { toast } from "sonner";
import {
  Layers,
  ListOrdered,
  UserCheck,
  Flame,
  CopyX,
  SlidersHorizontal,
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react";

interface LeadSource {
  id: string;
  name: string;
  category: string;
  active: boolean;
  totalLeads: number;
}

const DEFAULT_SOURCES: LeadSource[] = [
  { id: "1", name: "Website Contact Form", category: "Inbound Web", active: true, totalLeads: 245 },
  { id: "2", name: "Google Search Ads (PPC)", category: "Paid Media", active: true, totalLeads: 189 },
  { id: "3", name: "LinkedIn InMail & Outreach", category: "Outbound", active: true, totalLeads: 112 },
  { id: "4", name: "Customer Referrals", category: "Word of Mouth", active: true, totalLeads: 78 },
  { id: "5", name: "Webinar & Events", category: "Events", active: true, totalLeads: 64 },
  { id: "6", name: "Cold Email Campaign", category: "Outbound", active: false, totalLeads: 32 },
];

interface LeadStatusDef {
  id: string;
  name: string;
  key: string;
  color: string;
  slaDays: number;
  isDefault?: boolean;
}

const DEFAULT_STATUSES: LeadStatusDef[] = [
  { id: "1", name: "New Lead", key: "NEW", color: "bg-blue-500", slaDays: 1, isDefault: true },
  { id: "2", name: "Contacted", key: "CONTACTED", color: "bg-indigo-500", slaDays: 3 },
  { id: "3", name: "Proposal Sent", key: "PROPOSAL_SENT", color: "bg-amber-500", slaDays: 5 },
  { id: "4", name: "Qualified Won", key: "WON", color: "bg-emerald-500", slaDays: 0 },
  { id: "5", name: "Disqualified / Lost", key: "LOST", color: "bg-rose-500", slaDays: 0 },
];

export interface LeadContextualSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSection?: string;
}

export function LeadContextualSettings({
  open,
  onOpenChange,
  defaultSection = "sources",
}: LeadContextualSettingsProps) {
  const [sources, setSources] = useState<LeadSource[]>(DEFAULT_SOURCES);
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceCat, setNewSourceCat] = useState("Inbound Web");

  const [statuses, setStatuses] = useState<LeadStatusDef[]>(DEFAULT_STATUSES);
  const [newStatusName, setNewStatusName] = useState("");

  // Lead Fields
  const [requirePhone, setRequirePhone] = useState(false);
  const [requireCompany, setRequireCompany] = useState(true);
  const [enableCustomFields, setEnableCustomFields] = useState(true);
  const [trackUTMParameters, setTrackUTMParameters] = useState(true);

  // Assignment Rules
  const [autoAssignRoundRobin, setAutoAssignRoundRobin] = useState(true);
  const [reassignInactiveDays, setReassignInactiveDays] = useState("7");
  const [notifyAssigneeEmail, setNotifyAssigneeEmail] = useState(true);

  // Lead Scoring
  const [enableAiLeadScoring, setEnableAiLeadScoring] = useState(true);
  const [decayDays, setDecayDays] = useState("14");
  const [minHotScore, setMinHotScore] = useState("75");

  // Duplicate Rules
  const [preventEmailDuplicates, setPreventEmailDuplicates] = useState(true);
  const [preventPhoneDuplicates, setPreventPhoneDuplicates] = useState(true);
  const [duplicateAction, setDuplicateAction] = useState("warn");

  // Default Values
  const [defaultCurrency, setDefaultCurrency] = useState("INR");
  const [defaultPriority, setDefaultPriority] = useState("MEDIUM");

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Source handlers
  const handleToggleSourceActive = (id: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
    setHasChanges(true);
  };

  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName.trim()) return;
    const newSource: LeadSource = {
      id: Date.now().toString(),
      name: newSourceName.trim(),
      category: newSourceCat,
      active: true,
      totalLeads: 0,
    };
    setSources([...sources, newSource]);
    setNewSourceName("");
    setHasChanges(true);
    toast.success(`Lead source "${newSource.name}" added`);
  };

  const handleDeleteSource = (id: string) => {
    setSources(sources.filter((s) => s.id !== id));
    setHasChanges(true);
    toast.success("Lead source removed");
  };

  // Status handlers
  const handleAddStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatusName.trim()) return;
    const newStatus: LeadStatusDef = {
      id: Date.now().toString(),
      name: newStatusName.trim(),
      key: newStatusName.trim().toUpperCase().replace(/\s+/g, "_"),
      color: "bg-primary",
      slaDays: 3,
    };
    setStatuses([...statuses, newStatus]);
    setNewStatusName("");
    setHasChanges(true);
    toast.success(`Status "${newStatus.name}" added`);
  };

  const handleDeleteStatus = (id: string) => {
    if (statuses.length <= 2) {
      toast.error("You must have at least 2 lead statuses");
      return;
    }
    setStatuses(statuses.filter((s) => s.id !== id));
    setHasChanges(true);
    toast.success("Status removed");
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSaving(false);
    setHasChanges(false);
    toast.success("Lead configuration saved successfully");
    onOpenChange(false);
  };

  const sections: ContextualSettingSection[] = [
    {
      id: "sources",
      label: "Lead Sources",
      icon: Layers,
      badge: `${sources.filter((s) => s.active).length} Active`,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Lead Acquisition Sources & Channels"
            description="Manage inbound channels, attribution sources, and marketing tracking."
            icon={Layers}
          >
            <div className="space-y-2">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/70 bg-card hover:border-border transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {source.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{source.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {source.category} • {source.totalLeads} leads tracked
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        {source.active ? "Active" : "Disabled"}
                      </span>
                      <Switch
                        checked={source.active}
                        onCheckedChange={() => handleToggleSourceActive(source.id)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSource(source.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Channel Form */}
            <form
              onSubmit={handleAddSource}
              className="mt-3 p-3 rounded-xl border border-dashed border-border/80 flex flex-col sm:flex-row items-center gap-2.5"
            >
              <Input
                placeholder="Channel name (e.g., Webinar, Google Ads)..."
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
                className="text-xs h-9 flex-1"
              />
              <Input
                placeholder="Category (e.g., Paid Media)..."
                value={newSourceCat}
                onChange={(e) => setNewSourceCat(e.target.value)}
                className="text-xs h-9 w-full sm:w-40"
              />
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                className="text-xs font-semibold gap-1.5 h-9 w-full sm:w-auto shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add Channel
              </Button>
            </form>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "statuses",
      label: "Lead Statuses",
      icon: ListOrdered,
      badge: `${statuses.length} Stages`,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Lead Lifecycle Stages & Statuses"
            description="Customize qualification statuses, follow-up SLA targets, and progression flow."
            icon={ListOrdered}
          >
            <div className="space-y-2.5">
              {statuses.map((status) => (
                <div
                  key={status.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/70 bg-card hover:border-border transition-colors text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                    <div className={`w-2.5 h-2.5 rounded-full ${status.color} shrink-0`} />
                    <div>
                      <p className="font-semibold text-foreground flex items-center gap-1.5">
                        {status.name}
                        {status.isDefault && (
                          <Badge variant="outline" className="text-[9px] py-0 px-1 font-normal">
                            Default
                          </Badge>
                        )}
                      </p>
                      <p className="text-[10.5px] text-muted-foreground font-mono">
                        Key: {status.key}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground">SLA:</span>
                      <Input
                        type="number"
                        min="0"
                        max="30"
                        value={status.slaDays}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setStatuses((prev) =>
                            prev.map((s) => (s.id === status.id ? { ...s, slaDays: val } : s))
                          );
                          setHasChanges(true);
                        }}
                        className="w-14 h-7 text-xs text-center"
                      />
                      <span className="text-[11px] text-muted-foreground">days</span>
                    </div>

                    {!status.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStatus(status.id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleAddStatus}
              className="mt-3 p-3 rounded-xl border border-dashed border-border/80 flex items-center gap-2"
            >
              <Input
                placeholder="New stage name (e.g., Demo Scheduled)..."
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                className="text-xs h-9 flex-1"
              />
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                className="text-xs font-semibold gap-1.5 h-9 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add Status
              </Button>
            </form>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "fields",
      label: "Lead Fields",
      icon: SlidersHorizontal,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Lead Capture & Standard Fields"
            description="Configure which fields are enabled, required, or tracked during lead creation."
            icon={SlidersHorizontal}
          >
            <div className="divide-y divide-border/40">
              <SettingsToggleRow
                label="Require Company Name"
                description="Make the Company / Organization field mandatory on lead entry."
                checked={requireCompany}
                onCheckedChange={(c) => {
                  setRequireCompany(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Require Phone Number"
                description="Require a valid phone contact before saving new leads."
                checked={requirePhone}
                onCheckedChange={(c) => {
                  setRequirePhone(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Enable Custom Attributes"
                description="Allow team members to attach arbitrary key-value custom fields to leads."
                checked={enableCustomFields}
                onCheckedChange={(c) => {
                  setEnableCustomFields(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Capture UTM & Referrer Parameters"
                description="Automatically parse utm_source, utm_medium, and campaign tags from form submissions."
                checked={trackUTMParameters}
                onCheckedChange={(c) => {
                  setTrackUTMParameters(c);
                  setHasChanges(true);
                }}
              />
            </div>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "assignment",
      label: "Assignment Rules",
      icon: UserCheck,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Lead Routing & Assignment Rules"
            description="Distribute captured prospects across sales representatives automatically."
            icon={UserCheck}
          >
            <div className="divide-y divide-border/40">
              <SettingsToggleRow
                label="Round-Robin Distribution"
                description="Evenly distribute newly created inbound leads among active sales agents."
                checked={autoAssignRoundRobin}
                onCheckedChange={(c) => {
                  setAutoAssignRoundRobin(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Notify Assignee on Dispatch"
                description="Send an instant email and push notification when a lead is assigned."
                checked={notifyAssigneeEmail}
                onCheckedChange={(c) => {
                  setNotifyAssigneeEmail(c);
                  setHasChanges(true);
                }}
              />
              <SettingsRow
                label="Inactive Lead Reassignment"
                description="Reassign leads to pool if left uncontacted for more than threshold days."
              >
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={reassignInactiveDays}
                    onChange={(e) => {
                      setReassignInactiveDays(e.target.value);
                      setHasChanges(true);
                    }}
                    className="w-16 h-8 text-xs text-center"
                  />
                  <span className="text-muted-foreground text-xs">days</span>
                </div>
              </SettingsRow>
            </div>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "scoring",
      label: "Lead Scoring",
      icon: Flame,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="AI & Behavioral Lead Scoring"
            description="Calculate lead engagement scores and flag hot prospects automatically."
            icon={Flame}
          >
            <div className="divide-y divide-border/40">
              <SettingsToggleRow
                label="Enable Smart Lead Scoring"
                description="Score leads from 0-100 based on profile completeness, activity velocity, and deal size."
                checked={enableAiLeadScoring}
                onCheckedChange={(c) => {
                  setEnableAiLeadScoring(c);
                  setHasChanges(true);
                }}
              />
              <SettingsRow
                label="Hot Lead Threshold"
                description="Minimum score required to badge a lead with the Hot priority indicator."
              >
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min="50"
                    max="99"
                    value={minHotScore}
                    onChange={(e) => {
                      setMinHotScore(e.target.value);
                      setHasChanges(true);
                    }}
                    className="w-16 h-8 text-xs text-center"
                  />
                  <span className="text-muted-foreground text-xs">points</span>
                </div>
              </SettingsRow>
              <SettingsRow
                label="Inactivity Score Decay Window"
                description="Reduce score gradually if no touchpoints or activities are logged within this period."
              >
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min="3"
                    max="90"
                    value={decayDays}
                    onChange={(e) => {
                      setDecayDays(e.target.value);
                      setHasChanges(true);
                    }}
                    className="w-16 h-8 text-xs text-center"
                  />
                  <span className="text-muted-foreground text-xs">days</span>
                </div>
              </SettingsRow>
            </div>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "duplicates",
      label: "Duplicate Rules",
      icon: CopyX,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Deduplication & Merge Policies"
            description="Prevent duplicate lead entries and maintain clean CRM records."
            icon={CopyX}
          >
            <div className="divide-y divide-border/40">
              <SettingsToggleRow
                label="Match Exact Email Address"
                description="Flag potential duplicates when an identical email address is entered."
                checked={preventEmailDuplicates}
                onCheckedChange={(c) => {
                  setPreventEmailDuplicates(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Match Phone Number"
                description="Flag duplicate leads matching normalized mobile/landline numbers."
                checked={preventPhoneDuplicates}
                onCheckedChange={(c) => {
                  setPreventPhoneDuplicates(c);
                  setHasChanges(true);
                }}
              />
              <SettingsRow
                label="Duplicate Detection Policy"
                description="Choose whether to warn the user or completely block duplicate lead creation."
              >
                <Select
                  value={duplicateAction}
                  onValueChange={(val) => {
                    setDuplicateAction(val);
                    setHasChanges(true);
                  }}
                >
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warn">Warn & Allow Override</SelectItem>
                    <SelectItem value="block">Strict Block</SelectItem>
                    <SelectItem value="automerge">Auto-merge to existing</SelectItem>
                  </SelectContent>
                </Select>
              </SettingsRow>
            </div>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "defaults",
      label: "Default Values",
      icon: SlidersHorizontal,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Lead Defaults & Pre-fills"
            description="Preset initial currency, priority, and channel for new lead dialogs."
            icon={SlidersHorizontal}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SettingsField label="Default Priority">
                <Select
                  value={defaultPriority}
                  onValueChange={(val) => {
                    setDefaultPriority(val);
                    setHasChanges(true);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium (Recommended)</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              </SettingsField>

              <SettingsField label="Default Currency">
                <Select
                  value={defaultCurrency}
                  onValueChange={(val) => {
                    setDefaultCurrency(val);
                    setHasChanges(true);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹) - Indian Rupee</SelectItem>
                  </SelectContent>
                </Select>
              </SettingsField>
            </div>
          </SettingsSection>
        </div>
      ),
    },
  ];

  return (
    <ContextualSettingsDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Lead Settings"
      subtitle="Configure lead acquisition channels, qualification statuses, scoring rules, and routing."
      icon={Layers}
      badge="Leads Module"
      sections={sections}
      defaultSection={defaultSection}
      isSaving={isSaving}
      hasUnsavedChanges={hasChanges}
      onSave={handleSave}
    />
  );
}
