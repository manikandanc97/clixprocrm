"use client";

import React from "react";
import { Bot, Brain, Loader2 } from "lucide-react";
import { Switch } from "@/shared/ui/switch";
import { CRMCard } from "@/shared/components/crm";
import { EmptyStateCard, PageErrorState } from "@/shared/components/page-states";
import { useAiSettings, useUpdateAiSettings } from "@/shared/hooks/use-settings";
import { AISettingsSkeleton } from "./SettingsSkeletons";

const AISettings = () => {
  const { data, isLoading, error, refetch } = useAiSettings();
  const mutation = useUpdateAiSettings();

  if (isLoading) {
    return <AISettingsSkeleton />;
  }

  if (error) {
    return <PageErrorState title="AI settings unavailable" message={(error as Error).message} onRetry={() => { void refetch(); }} />;
  }

  const features = data?.features ?? [];

  const handleToggle = (id: string, checked: boolean) => {
    if (!data) return;
    const newFeatures = features.map(f => f.id === id ? { ...f, enabled: checked } : f);
    mutation.mutate({ ...data, features: newFeatures });
  };

  return (
    <div className="space-y-5">
      <CRMCard className="relative overflow-hidden border-primary/15 group">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
              <Brain className="w-3 h-3" />
              AI Configuration
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Backend-driven intelligence settings</h2>
            <p className="text-muted-foreground max-w-md text-sm font-medium">
              Manage your AI-powered business features like Smart Reply and Lead Scoring.
            </p>
          </div>
          <div className="w-20 h-20 rounded-xl bg-card border border-border shadow-[var(--crm-card-shadow)] flex items-center justify-center">
            <Bot className="w-10 h-10 text-primary" />
          </div>
        </div>
      </CRMCard>

      <CRMCard>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-primary" />
            </div>
            <h3 className="text-sm font-bold tracking-tight text-foreground">Intelligence Features</h3>
          </div>
          {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        
        {features.length === 0 ? (
          <EmptyStateCard title="No AI features" message="AI feature settings will appear when the backend provides them." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature) => (
              <div key={feature.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-transparent hover:border-border/50">
                <div>
                  <h4 className="font-semibold text-sm text-foreground tracking-tight">{feature.label}</h4>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">{feature.description ?? "No description provided."}</p>
                </div>
                <Switch 
                  checked={feature.enabled} 
                  onCheckedChange={(checked) => handleToggle(feature.id, checked)}
                  disabled={mutation.isPending} 
                />
              </div>
            ))}
          </div>
        )}
      </CRMCard>
    </div>
  );
};

export default AISettings;
