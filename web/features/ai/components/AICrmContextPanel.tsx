'use client';

import React from 'react';
import {
  X,
  Building2,
  Users,
  Briefcase,
  Calendar,
  FileText,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Database,
} from 'lucide-react';
import { CrmContextData } from '../types';
import { Button } from '@/shared/ui/button';

interface AICrmContextPanelProps {
  activeContext: CrmContextData | null;
  onClearContext: () => void;
  onSelectPrompt: (prompt: string) => void;
  onClose: () => void;
  hideHeader?: boolean;
}

export function AICrmContextPanel({
  activeContext,
  onClearContext,
  onSelectPrompt,
  onClose,
  hideHeader = false,
}: AICrmContextPanelProps) {
  const contextName = activeContext?.name || 'Global CRM Workspace';

  const contextualPrompts = [
    {
      label: activeContext
        ? `Summarize ${activeContext.name}`
        : 'Summarize recent CRM activity',
      prompt: activeContext
        ? `Summarize all contacts, recent deals, and active tasks related to ${activeContext.name}.`
        : 'Summarize all recent activities, active deals, and upcoming tasks.',
    },
    {
      label: activeContext
        ? `Open deals for ${activeContext.name}`
        : 'Show high-priority deals',
      prompt: activeContext
        ? `List all open deals, stages, and estimated revenue for ${activeContext.name}.`
        : 'List all high-priority deals in negotiation or proposal stage.',
    },
    {
      label: activeContext
        ? `Draft follow-up email`
        : 'Find overdue follow-ups',
      prompt: activeContext
        ? `Draft a professional follow-up email for the primary contact at ${activeContext.name}.`
        : 'Show all overdue lead follow-ups and pending customer touchpoints.',
    },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-card/60 select-none">
      {/* Panel Header */}
      {!hideHeader && (
        <div className="h-14 px-4 border-b border-border/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <span className="font-semibold text-xs text-foreground tracking-tight uppercase">
              CRM Context
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            title="Close context panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Active Context Card */}
        <div className="p-3.5 rounded-2xl border border-primary/30 bg-primary/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Active Context
            </span>
            {activeContext && (
              <button
                onClick={onClearContext}
                className="text-[10px] text-muted-foreground hover:text-destructive transition-colors font-medium flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="font-semibold text-xs text-foreground truncate">
              {contextName}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {activeContext
              ? `AI queries will automatically focus on records and activities matching "${activeContext.name}".`
              : 'AI queries have access to all authorized CRM workspace records.'}
          </p>
        </div>

        {/* Available Live Data Sources */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            Connected CRM Data
          </span>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-background border border-border/60">
              <div className="flex items-center gap-2 text-foreground/80">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Contacts & Leads</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                Live
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-background border border-border/60">
              <div className="flex items-center gap-2 text-foreground/80">
                <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Deals & Pipeline</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                Live
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-background border border-border/60">
              <div className="flex items-center gap-2 text-foreground/80">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Tasks & Activities</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                Live
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-background border border-border/60">
              <div className="flex items-center gap-2 text-foreground/80">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Quotations</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                Live
              </span>
            </div>
          </div>
        </div>

        {/* Contextual Suggestions */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            Suggested Inquiries
          </span>
          <div className="space-y-2">
            {contextualPrompts.map((cp, idx) => (
              <button
                key={idx}
                onClick={() => onSelectPrompt(cp.prompt)}
                className="w-full p-2.5 rounded-xl border border-border/60 bg-background hover:bg-muted/60 hover:border-primary/30 text-left transition-all text-xs group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                    {cp.label}
                  </span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
