"use client";

import React from "react";
import {
  SettingsSection,
  SettingsRow,
  SettingsToggleRow,
} from "@/shared/components/crm/ContextualSettingsComponents";
import { Badge } from "@/shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { BarChart3, TrendingUp, Filter, Calendar, Layers } from "lucide-react";

export interface DealForecastSectionProps {
  weightedForecast: boolean;
  setWeightedForecast: (v: boolean) => void;
  includeOmittedInFunnel: boolean;
  setIncludeOmittedInFunnel: (v: boolean) => void;
  fiscalYearStartMonth: string;
  setFiscalYearStartMonth: (v: string) => void;
  triggerAutoSave: () => void;
}

export function DealForecastSection({
  weightedForecast,
  setWeightedForecast,
  includeOmittedInFunnel,
  setIncludeOmittedInFunnel,
  fiscalYearStartMonth,
  setFiscalYearStartMonth,
  triggerAutoSave,
}: DealForecastSectionProps) {
  return (
    <div className="space-y-5">
      <SettingsSection
        title="Revenue Forecasting Parameters"
        description="Configure probability weighting calculations, quota definitions, and fiscal year boundaries."
        icon={BarChart3}
      >
        <div className="divide-y divide-border/40">
          <SettingsToggleRow
            label="Weighted Revenue Forecasting"
            description="Multiply deal values by stage win probability percentages in reports, executive dashboards, and pipeline analytics."
            icon={TrendingUp}
            checked={weightedForecast}
            onCheckedChange={(c) => { setWeightedForecast(c); triggerAutoSave(); }}
          />
          <SettingsToggleRow
            label="Include Omitted Deals in Funnel"
            description="Show deals marked as omitted from forecast in high-level conversion funnel and pipeline velocity analysis."
            icon={Filter}
            checked={includeOmittedInFunnel}
            onCheckedChange={(c) => { setIncludeOmittedInFunnel(c); triggerAutoSave(); }}
          />
          <SettingsRow label="Fiscal Year Starting Month" description="Sets the financial year boundary for target and quota tracking across the workspace." icon={Calendar}>
            <Select value={fiscalYearStartMonth} onValueChange={(val) => { setFiscalYearStartMonth(val); triggerAutoSave(); }}>
              <SelectTrigger className="w-44 h-8 text-xs font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">January (Calendar FY)</SelectItem>
                <SelectItem value="4">April (India FY)</SelectItem>
                <SelectItem value="7">July (Mid-Year FY)</SelectItem>
                <SelectItem value="10">October (Q4 FY)</SelectItem>
              </SelectContent>
            </Select>
          </SettingsRow>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Forecast Categories Mapping"
        description="Standard deal progression tiers used in quarterly commit and revenue projection models."
        icon={Layers}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {[
            { label: "Pipeline", range: "10% - 40%", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", desc: "Early stage exploration, discovery calls, and qualified opportunities with active engagement." },
            { label: "Best Case", range: "50% - 75%", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", desc: "Proposals submitted and active budget evaluation with high likelihood of closing within cycle." },
            { label: "Commit", range: "80% - 99%", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400", desc: "Final terms agreed and contract in legal or signatory sign-off; guaranteed for quarterly quota." },
            { label: "Closed", range: "100% / 0%", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", desc: "Terminal state deals formally booked as Won Revenue or marked as Closed Lost." },
          ].map((cat) => (
            <div key={cat.label} className="p-3 rounded-lg border border-border/70 bg-card space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground">{cat.label}</span>
                <Badge variant="secondary" className={`text-[10px] ${cat.color}`}>{cat.range}</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{cat.desc}</p>
            </div>
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}
