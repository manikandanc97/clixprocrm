"use client";

import React, { useState, useEffect } from "react";
import {
  ContextualSettingsDrawer,
  ContextualSettingSection,
} from "@/shared/components/crm/ContextualSettingsDrawer";
import {
  SettingsSection,
  SettingsToggleRow,
  SettingsField,
} from "@/shared/components/crm/ContextualSettingsComponents";
import { Textarea } from "@/shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { toast } from "sonner";
import {
  Sparkles,
  Brain,
  Sliders,
  MessageSquareCode,
} from "lucide-react";
import { useAiSettings, useUpdateAiSettings } from "@/shared/hooks/use-settings";

export interface AIContextualSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSection?: string;
}

export function AIContextualSettings({
  open,
  onOpenChange,
  defaultSection = "features",
}: AIContextualSettingsProps) {
  const { data: aiData } = useAiSettings();
  const mutation = useUpdateAiSettings();

  // Feature toggles
  const [smartReply, setSmartReply] = useState(true);
  const [leadScoring, setLeadScoring] = useState(true);
  const [dealWinRate, setDealWinRate] = useState(true);
  const [sentimentAnalysis, setSentimentAnalysis] = useState(true);
  const [meetingSummarizer, setMeetingSummarizer] = useState(true);

  // Model & Reasoning Preferences
  const [defaultModel, setDefaultModel] = useState("gemini-2.5-flash");
  const [creativityLevel, setCreativityLevel] = useState("balanced");
  const [responseLength, setResponseLength] = useState("concise");

  // Context & Persona
  const [systemPrompt, setSystemPrompt] = useState(
    "You are ClixPro AI, an expert enterprise CRM sales advisor. Provide actionable, concise recommendations on deals, leads, and customer interactions."
  );
  const [autoInjectCrmContext, setAutoInjectCrmContext] = useState(true);
  const [enableActionConfirmations, setEnableActionConfirmations] = useState(true);

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (aiData?.features) {
      const getFeat = (id: string, def = true) => {
        const found = aiData.features.find((f: any) => f.id === id);
        return found ? found.enabled : def;
      };
      setSmartReply(getFeat("smart_reply", true));
      setLeadScoring(getFeat("lead_scoring", true));
      setDealWinRate(getFeat("deal_win_rate", true));
      setSentimentAnalysis(getFeat("sentiment_analysis", true));
      setMeetingSummarizer(getFeat("meeting_summarizer", true));
    }
  }, [aiData]);

  const handleSave = async () => {
    try {
      const updatedFeatures = [
        {
          id: "smart_reply",
          label: "Smart Reply Suggestions",
          description: "Generate instant contextual email and message responses for customer inquiries.",
          enabled: smartReply,
        },
        {
          id: "lead_scoring",
          label: "Predictive Lead Scoring",
          description: "Automatically evaluate lead conversion likelihood based on engagement and demographic signals.",
          enabled: leadScoring,
        },
        {
          id: "deal_win_rate",
          label: "Deal Win Probability",
          description: "Analyze opportunity stage velocity and calculate win probability percentages.",
          enabled: dealWinRate,
        },
        {
          id: "sentiment_analysis",
          label: "Customer Sentiment Analysis",
          description: "Analyze tone of communications to flag at-risk accounts or high-intent buyers.",
          enabled: sentimentAnalysis,
        },
        {
          id: "meeting_summarizer",
          label: "Meeting & Note Summarization",
          description: "Distill lengthy meeting notes into structured action items and follow-ups.",
          enabled: meetingSummarizer,
        },
      ];

      await mutation.mutateAsync({
        ...(aiData || {}),
        features: updatedFeatures,
      });

      setHasChanges(false);
      toast.success("AI workspace settings updated successfully");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update AI settings");
    }
  };

  const sections: ContextualSettingSection[] = [
    {
      id: "features",
      label: "Intelligence Features",
      icon: Brain,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="CRM Intelligence Engines"
            description="Toggle autonomous AI capabilities and automated reasoning across your CRM workspace."
            icon={Brain}
          >
            <div className="divide-y divide-border/40">
              <SettingsToggleRow
                label="Smart Reply & Email Drafting"
                description="Generate instant contextual email and message responses for customer inquiries."
                checked={smartReply}
                onCheckedChange={(c) => {
                  setSmartReply(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Predictive Lead Scoring"
                description="Automatically evaluate lead conversion likelihood based on engagement and demographic signals."
                checked={leadScoring}
                onCheckedChange={(c) => {
                  setLeadScoring(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Deal Win-Rate Probability Estimator"
                description="Analyze opportunity stage velocity and calculate win probability percentages."
                checked={dealWinRate}
                onCheckedChange={(c) => {
                  setDealWinRate(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Customer Sentiment & Urgency Detection"
                description="Analyze tone of communications to flag at-risk accounts or high-intent buyers."
                checked={sentimentAnalysis}
                onCheckedChange={(c) => {
                  setSentimentAnalysis(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="AI Call & Meeting Summarizer"
                description="Distill lengthy meeting notes into structured action items and follow-ups."
                checked={meetingSummarizer}
                onCheckedChange={(c) => {
                  setMeetingSummarizer(c);
                  setHasChanges(true);
                }}
              />
            </div>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "reasoning",
      label: "Model & Tone Preferences",
      icon: Sliders,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Reasoning Engine & Tone Parameters"
            description="Configure the default foundation model and communication style for assistant responses."
            icon={Sliders}
          >
            <div className="space-y-4">
              <SettingsField label="Default Reasoning Engine">
                <Select
                  value={defaultModel}
                  onValueChange={(val) => {
                    setDefaultModel(val);
                    setHasChanges(true);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Fast & Real-Time)</SelectItem>
                    <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Reasoning)</SelectItem>
                    <SelectItem value="claude-3.7-sonnet">Claude 3.7 Sonnet (Advanced Coding & Analysis)</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o Omnichannel</SelectItem>
                  </SelectContent>
                </Select>
              </SettingsField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SettingsField label="Creativity / Temperature">
                  <Select
                    value={creativityLevel}
                    onValueChange={(val) => {
                      setCreativityLevel(val);
                      setHasChanges(true);
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="analytical">Strict & Analytical (Temperature 0.2)</SelectItem>
                      <SelectItem value="balanced">Balanced Professional (Temperature 0.7)</SelectItem>
                      <SelectItem value="creative">Creative & Brainstorming (Temperature 1.0)</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingsField>

                <SettingsField label="Response Brevity">
                  <Select
                    value={responseLength}
                    onValueChange={(val) => {
                      setResponseLength(val);
                      setHasChanges(true);
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concise">Concise & Direct (Executive Summary)</SelectItem>
                      <SelectItem value="detailed">Detailed & Step-by-Step Breakdown</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingsField>
              </div>
            </div>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "persona",
      label: "Custom Persona & Guardrails",
      icon: MessageSquareCode,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="System Instructions & Context Injection"
            description="Customize how the AI assistant interprets your business domain and CRM data."
            icon={MessageSquareCode}
          >
            <div className="space-y-4">
              <SettingsField label="Workspace Custom System Instructions">
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => {
                    setSystemPrompt(e.target.value);
                    setHasChanges(true);
                  }}
                  rows={4}
                  className="text-xs resize-none"
                  placeholder="Define custom persona guidelines, brand tone, or industry terminology..."
                />
              </SettingsField>

              <div className="divide-y divide-border/40 pt-2">
                <SettingsToggleRow
                  label="Auto-Inject Active CRM Record Context"
                  description="When viewing a contact, deal, or invoice, automatically ground AI answers with record data."
                  checked={autoInjectCrmContext}
                  onCheckedChange={(c) => {
                    setAutoInjectCrmContext(c);
                    setHasChanges(true);
                  }}
                />
                <SettingsToggleRow
                  label="Require Confirmation Before CRM Mutations"
                  description="Show interactive confirmation card before AI creates or deletes CRM records."
                  checked={enableActionConfirmations}
                  onCheckedChange={(c) => {
                    setEnableActionConfirmations(c);
                    setHasChanges(true);
                  }}
                />
              </div>
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
      title="AI Workspace Settings"
      subtitle="Configure CRM intelligence feature toggles, reasoning models, tone parameters, and custom personas."
      icon={Sparkles}
      badge="AI Intelligence"
      sections={sections}
      defaultSection={defaultSection}
      isSaving={mutation.isPending}
      hasUnsavedChanges={hasChanges}
      onSave={handleSave}
    />
  );
}
