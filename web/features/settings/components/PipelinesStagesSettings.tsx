"use client";

import React, { useState } from "react";
import {
  Kanban,
  Plus,
  GripVertical,
  Trash2,
  Save,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { CRMCard } from "@/shared/components/crm";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { toast } from "sonner";
import Link from "next/link";

interface Stage {
  id: string;
  name: string;
  probability: number;
  slaDays: number;
  color: string;
}

const DEFAULT_STAGES: Stage[] = [
  { id: "lead_in", name: "Lead In / Discovery", probability: 10, slaDays: 3, color: "bg-blue-500" },
  { id: "qualified", name: "Contact Made / Qualified", probability: 30, slaDays: 5, color: "bg-indigo-500" },
  { id: "proposal", name: "Proposal Sent", probability: 60, slaDays: 7, color: "bg-amber-500" },
  { id: "negotiation", name: "Negotiation", probability: 80, slaDays: 4, color: "bg-purple-500" },
  { id: "won", name: "Closed Won", probability: 100, slaDays: 0, color: "bg-emerald-500" },
  { id: "lost", name: "Closed Lost", probability: 0, slaDays: 0, color: "bg-rose-500" },
];

export default function PipelinesStagesSettings() {
  const [stages, setStages] = useState<Stage[]>(DEFAULT_STAGES);
  const [newStageName, setNewStageName] = useState("");
  const [newStageProb, setNewStageProb] = useState("50");

  const handleUpdateProbability = (id: string, prob: number) => {
    setStages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, probability: Math.min(100, Math.max(0, prob)) } : s))
    );
  };

  const handleUpdateSla = (id: string, days: number) => {
    setStages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, slaDays: Math.max(0, days) } : s))
    );
  };

  const handleAddStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim()) return;
    const newStage: Stage = {
      id: `stage_${Date.now()}`,
      name: newStageName.trim(),
      probability: parseInt(newStageProb) || 50,
      slaDays: 7,
      color: "bg-primary",
    };
    setStages([...stages, newStage]);
    setNewStageName("");
    toast.success(`Stage "${newStage.name}" added`);
  };

  const handleDeleteStage = (id: string) => {
    if (stages.length <= 2) {
      toast.error("Pipeline must have at least 2 stages");
      return;
    }
    setStages(stages.filter((s) => s.id !== id));
    toast.success("Stage removed");
  };

  const handleSaveAll = () => {
    toast.success("Pipeline stages saved successfully");
  };

  return (
    <div className="space-y-6">
      <CRMCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/50">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Kanban className="w-4 h-4 text-primary" />
              Deal Pipelines & Sales Stages
            </h3>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Customize pipeline stages, default win probabilities, and stage SLA target durations.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            asChild
            className="text-xs font-semibold gap-1.5 h-9"
          >
            <Link href="/deals">
              <ExternalLink className="w-3.5 h-3.5" />
              View Deals Board
            </Link>
          </Button>
        </div>

        {/* Stage List */}
        <div className="mt-4 space-y-2.5">
          <div className="grid grid-cols-12 px-3 py-2 text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.05em] leading-tight bg-card border border-border/60 rounded-lg h-10 sm:h-11 items-center">
            <span className="col-span-6">Stage Name</span>
            <span className="col-span-3 text-center">Win Probability (%)</span>
            <span className="col-span-2 text-center">SLA (Days)</span>
            <span className="col-span-1 text-right">Action</span>
          </div>

          {stages.map((stage) => (
            <div
              key={stage.id}
              className="grid grid-cols-12 items-center px-3 py-2.5 border rounded-lg bg-card hover:border-border transition-colors text-xs"
            >
              <div className="col-span-6 flex items-center gap-2.5">
                <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0 cursor-grab" />
                <div className={`w-2.5 h-2.5 rounded-full ${stage.color} shrink-0`} />
                <span className="font-semibold text-foreground truncate">{stage.name}</span>
              </div>

              <div className="col-span-3 flex justify-center">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={stage.probability}
                  onChange={(e) => handleUpdateProbability(stage.id, parseInt(e.target.value) || 0)}
                  className="w-20 h-8 text-center text-xs font-semibold"
                />
              </div>

              <div className="col-span-2 flex justify-center">
                <Input
                  type="number"
                  min="0"
                  max="60"
                  value={stage.slaDays}
                  onChange={(e) => handleUpdateSla(stage.id, parseInt(e.target.value) || 0)}
                  className="w-16 h-8 text-center text-xs"
                />
              </div>

              <div className="col-span-1 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteStage(stage.id)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Stage Form */}
        <form onSubmit={handleAddStage} className="mt-5 p-3.5 rounded-xl border border-dashed flex flex-col sm:flex-row items-center gap-3">
          <Input
            placeholder="Enter new stage name..."
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            className="text-xs h-9 flex-1"
          />
          <Input
            type="number"
            placeholder="Probability %"
            value={newStageProb}
            onChange={(e) => setNewStageProb(e.target.value)}
            className="text-xs h-9 w-28 text-center"
          />
          <Button type="submit" size="sm" variant="secondary" className="text-xs font-semibold gap-1.5 h-9 shrink-0">
            <Plus className="w-3.5 h-3.5" /> Add Stage
          </Button>
        </form>

        <div className="mt-5 pt-4 border-t border-border/50 flex justify-end">
          <Button onClick={handleSaveAll} className="gap-2 text-xs font-semibold">
            <Save className="w-3.5 h-3.5" /> Save Pipeline Changes
          </Button>
        </div>
      </CRMCard>
    </div>
  );
}
