"use client";

import React from "react";
import { Flame } from "lucide-react";
import { Input } from "@/shared/ui/input";
import {
  SettingsSection,
  SettingsToggleRow,
  SettingsRow,
} from "@/shared/components/crm/ContextualSettingsComponents";

interface LeadScoringSectionProps {
  enableAiLeadScoring: boolean;
  setEnableAiLeadScoring: (v: boolean) => void;
  minHotScore: string;
  setMinHotScore: (v: string) => void;
  decayDays: string;
  setDecayDays: (v: string) => void;
  onChanged: () => void;
}

export function LeadScoringSection({
  enableAiLeadScoring,
  setEnableAiLeadScoring,
  minHotScore,
  setMinHotScore,
  decayDays,
  setDecayDays,
  onChanged,
}: LeadScoringSectionProps) {
  return (
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
            onCheckedChange={(c) => { setEnableAiLeadScoring(c); onChanged(); }}
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
                onChange={(e) => { setMinHotScore(e.target.value); onChanged(); }}
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
                onChange={(e) => { setDecayDays(e.target.value); onChanged(); }}
                className="w-16 h-8 text-xs text-center"
              />
              <span className="text-muted-foreground text-xs">days</span>
            </div>
          </SettingsRow>
        </div>
      </SettingsSection>
    </div>
  );
}
