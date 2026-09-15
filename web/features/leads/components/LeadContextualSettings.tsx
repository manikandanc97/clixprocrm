"use client";

import React, { useState } from "react";
import {
  ContextualSettingsDrawer,
  ContextualSettingSection,
} from "@/shared/components/crm/ContextualSettingsDrawer";
import { toast } from "sonner";
import {
  Layers,
  ListOrdered,
  UserCheck,
  Flame,
  CopyX,
  SlidersHorizontal,
} from "lucide-react";

import {
  LeadSourcesSection,
  LeadSource,
} from "./lead-sections/LeadSourcesSection";
import {
  LeadStatusesSection,
  LeadStatusDef,
} from "./lead-sections/LeadStatusesSection";
import { LeadFieldsSection } from "./lead-sections/LeadFieldsSection";
import { LeadAssignmentSection } from "./lead-sections/LeadAssignmentSection";
import { LeadScoringSection } from "./lead-sections/LeadScoringSection";
import { LeadDuplicatesSection } from "./lead-sections/LeadDuplicatesSection";
import { LeadDefaultsSection } from "./lead-sections/LeadDefaultsSection";

// ─── Default Data ────────────────────────────────────────────────────────────

const DEFAULT_SOURCES: LeadSource[] = [
  { id: "1", name: "Website Contact Form", category: "Inbound Web", active: true, totalLeads: 245 },
  { id: "2", name: "Google Search Ads (PPC)", category: "Paid Media", active: true, totalLeads: 189 },
  { id: "3", name: "LinkedIn InMail & Outreach", category: "Outbound", active: true, totalLeads: 112 },
  { id: "4", name: "Customer Referrals", category: "Word of Mouth", active: true, totalLeads: 78 },
  { id: "5", name: "Webinar & Events", category: "Events", active: true, totalLeads: 64 },
  { id: "6", name: "Cold Email Campaign", category: "Outbound", active: false, totalLeads: 32 },
];

const DEFAULT_STATUSES: LeadStatusDef[] = [
  { id: "1", name: "New Lead", key: "NEW", color: "bg-blue-500", slaDays: 1, isDefault: true },
  { id: "2", name: "Contacted", key: "CONTACTED", color: "bg-indigo-500", slaDays: 3 },
  { id: "3", name: "Proposal Sent", key: "PROPOSAL_SENT", color: "bg-amber-500", slaDays: 5 },
  { id: "4", name: "Qualified Won", key: "WON", color: "bg-emerald-500", slaDays: 0 },
  { id: "5", name: "Disqualified / Lost", key: "LOST", color: "bg-rose-500", slaDays: 0 },
];

// ─── Component Props ─────────────────────────────────────────────────────────

export interface LeadContextualSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSection?: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LeadContextualSettings({
  open,
  onOpenChange,
  defaultSection = "sources",
}: LeadContextualSettingsProps) {
  // Sources
  const [sources, setSources] = useState<LeadSource[]>(DEFAULT_SOURCES);
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceCat, setNewSourceCat] = useState("Inbound Web");

  // Statuses
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
  const markChanged = () => setHasChanges(true);

  // ─── Source Handlers ──────────────────────────────────────────────────────
  const handleToggleSourceActive = (id: string) => {
    setSources((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
    markChanged();
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
    markChanged();
    toast.success(`Lead source "${newSource.name}" added`);
  };

  const handleDeleteSource = (id: string) => {
    setSources(sources.filter((s) => s.id !== id));
    markChanged();
    toast.success("Lead source removed");
  };

  // ─── Status Handlers ──────────────────────────────────────────────────────
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
    markChanged();
    toast.success(`Status "${newStatus.name}" added`);
  };

  const handleDeleteStatus = (id: string) => {
    if (statuses.length <= 2) {
      toast.error("You must have at least 2 lead statuses");
      return;
    }
    setStatuses(statuses.filter((s) => s.id !== id));
    markChanged();
    toast.success("Status removed");
  };

  const handleChangeSla = (id: string, val: number) => {
    setStatuses((prev) => prev.map((s) => (s.id === id ? { ...s, slaDays: val } : s)));
    markChanged();
  };

  // ─── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSaving(false);
    setHasChanges(false);
    toast.success("Lead configuration saved successfully");
    onOpenChange(false);
  };

  // ─── Sections ─────────────────────────────────────────────────────────────
  const sections: ContextualSettingSection[] = [
    {
      id: "sources",
      label: "Lead Sources",
      icon: Layers,
      badge: `${sources.filter((s) => s.active).length} Active`,
      component: (
        <LeadSourcesSection
          sources={sources}
          newSourceName={newSourceName}
          newSourceCat={newSourceCat}
          setNewSourceName={setNewSourceName}
          setNewSourceCat={setNewSourceCat}
          onToggleActive={handleToggleSourceActive}
          onDelete={handleDeleteSource}
          onAdd={handleAddSource}
        />
      ),
    },
    {
      id: "statuses",
      label: "Lead Statuses",
      icon: ListOrdered,
      badge: `${statuses.length} Stages`,
      component: (
        <LeadStatusesSection
          statuses={statuses}
          newStatusName={newStatusName}
          setNewStatusName={setNewStatusName}
          onChangeSla={handleChangeSla}
          onDelete={handleDeleteStatus}
          onAdd={handleAddStatus}
        />
      ),
    },
    {
      id: "fields",
      label: "Lead Fields",
      icon: SlidersHorizontal,
      component: (
        <LeadFieldsSection
          requireCompany={requireCompany}
          setRequireCompany={setRequireCompany}
          requirePhone={requirePhone}
          setRequirePhone={setRequirePhone}
          enableCustomFields={enableCustomFields}
          setEnableCustomFields={setEnableCustomFields}
          trackUTMParameters={trackUTMParameters}
          setTrackUTMParameters={setTrackUTMParameters}
          onChanged={markChanged}
        />
      ),
    },
    {
      id: "assignment",
      label: "Assignment Rules",
      icon: UserCheck,
      component: (
        <LeadAssignmentSection
          autoAssignRoundRobin={autoAssignRoundRobin}
          setAutoAssignRoundRobin={setAutoAssignRoundRobin}
          notifyAssigneeEmail={notifyAssigneeEmail}
          setNotifyAssigneeEmail={setNotifyAssigneeEmail}
          reassignInactiveDays={reassignInactiveDays}
          setReassignInactiveDays={setReassignInactiveDays}
          onChanged={markChanged}
        />
      ),
    },
    {
      id: "scoring",
      label: "Lead Scoring",
      icon: Flame,
      component: (
        <LeadScoringSection
          enableAiLeadScoring={enableAiLeadScoring}
          setEnableAiLeadScoring={setEnableAiLeadScoring}
          minHotScore={minHotScore}
          setMinHotScore={setMinHotScore}
          decayDays={decayDays}
          setDecayDays={setDecayDays}
          onChanged={markChanged}
        />
      ),
    },
    {
      id: "duplicates",
      label: "Duplicate Rules",
      icon: CopyX,
      component: (
        <LeadDuplicatesSection
          preventEmailDuplicates={preventEmailDuplicates}
          setPreventEmailDuplicates={setPreventEmailDuplicates}
          preventPhoneDuplicates={preventPhoneDuplicates}
          setPreventPhoneDuplicates={setPreventPhoneDuplicates}
          duplicateAction={duplicateAction}
          setDuplicateAction={setDuplicateAction}
          onChanged={markChanged}
        />
      ),
    },
    {
      id: "defaults",
      label: "Default Values",
      icon: SlidersHorizontal,
      component: (
        <LeadDefaultsSection
          defaultPriority={defaultPriority}
          setDefaultPriority={setDefaultPriority}
          defaultCurrency={defaultCurrency}
          setDefaultCurrency={setDefaultCurrency}
          onChanged={markChanged}
        />
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
