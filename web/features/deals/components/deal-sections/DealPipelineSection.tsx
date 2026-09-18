"use client";

import React from "react";
import {
  SettingsSection,
} from "@/shared/components/crm/ContextualSettingsComponents";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/shared/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import {
  Kanban,
  Clock,
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type { Stage } from "../../constants/deal-settings.constants";
import { COLOR_PRESETS } from "../../constants/deal-settings.constants";

export interface DealPipelineSectionProps {
  stages: Stage[];
  newStageName: string;
  setNewStageName: (v: string) => void;
  newStageProb: string;
  setNewStageProb: (v: string) => void;
  newStageSla: string;
  setNewStageSla: (v: string) => void;
  newStageColor: string;
  setNewStageColor: (v: string) => void;
  totalOpenSlaDays: number;
  onUpdateProbability: (id: string, prob: number) => void;
  onUpdateSla: (id: string, days: number) => void;
  onMoveStage: (index: number, direction: "up" | "down") => void;
  onAddStage: (e: React.FormEvent) => void;
  onDeleteStage: (id: string) => void;
}

export function DealPipelineSection({
  stages,
  newStageName,
  setNewStageName,
  newStageProb,
  setNewStageProb,
  newStageSla,
  setNewStageSla,
  newStageColor,
  setNewStageColor,
  totalOpenSlaDays,
  onUpdateProbability,
  onUpdateSla,
  onMoveStage,
  onAddStage,
  onDeleteStage,
}: DealPipelineSectionProps) {
  return (
    <div className="space-y-5">
      <SettingsSection
        title="Deal Pipeline & Progression Stages"
        description="Configure sales pipeline stages, probability weighting, target SLA cycle duration, and terminal milestones."
        icon={Kanban}
        headerAction={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-semibold bg-primary/5 text-primary border-primary/20">
              Default Sales Pipeline
            </Badge>
          </div>
        }
      >
        <div className="space-y-2">
          <div className="grid grid-cols-12 px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40 border border-border/60 rounded-lg items-center">
            <span className="col-span-5">Stage Name & Type</span>
            <span className="col-span-3 text-center">Probability (%)</span>
            <span className="col-span-2 text-center">SLA (Days)</span>
            <span className="col-span-2 text-right pr-1">Order / Actions</span>
          </div>

          <div className="space-y-1.5">
            {stages.map((stage, idx) => {
              const isTerminalWon = stage.type === "WON" || stage.id === "won";
              const isTerminalLost = stage.type === "LOST" || stage.id === "lost";
              const isTerminal = isTerminalWon || isTerminalLost;

              return (
                <div
                  key={stage.id}
                  className="grid grid-cols-12 items-center px-3 py-2.5 border border-border/70 rounded-lg bg-card hover:border-border transition-colors text-xs gap-2"
                >
                  <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                    <div className={`w-2.5 h-2.5 rounded-full ${stage.color} shrink-0`} />
                    <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-foreground truncate">{stage.name}</span>
                      {isTerminalWon ? (
                        <Badge variant="outline" className="text-[9px] py-0 px-1 font-semibold border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">Closed Won</Badge>
                      ) : isTerminalLost ? (
                        <Badge variant="outline" className="text-[9px] py-0 px-1 font-semibold border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">Closed Lost</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[9px] py-0 px-1 font-normal bg-muted text-muted-foreground shrink-0">Open</Badge>
                      )}
                    </div>
                  </div>

                  <div className="col-span-3 flex justify-center">
                    <div className="relative flex items-center">
                      <Input
                        type="number" min="0" max="100"
                        value={stage.probability}
                        disabled={isTerminalWon || isTerminalLost}
                        onChange={(e) => onUpdateProbability(stage.id, parseInt(e.target.value) || 0)}
                        className="w-18 h-7.5 text-center text-xs font-semibold pr-4"
                      />
                      <span className="absolute right-2 text-[10px] text-muted-foreground pointer-events-none">%</span>
                    </div>
                  </div>

                  <div className="col-span-2 flex justify-center">
                    {isTerminal ? (
                      <span className="text-[11px] text-muted-foreground/60 italic">—</span>
                    ) : (
                      <div className="relative flex items-center">
                        <Input
                          type="number" min="0" max="90"
                          value={stage.slaDays}
                          onChange={(e) => onUpdateSla(stage.id, parseInt(e.target.value) || 0)}
                          className="w-16 h-7.5 text-center text-xs pr-4"
                        />
                        <span className="absolute right-1.5 text-[9px] text-muted-foreground pointer-events-none">d</span>
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon-xs" disabled={idx === 0} onClick={() => onMoveStage(idx, "up")} className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30" title="Move up">
                      <ChevronUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-xs" disabled={idx === stages.length - 1} onClick={() => onMoveStage(idx, "down")} className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30" title="Move down">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </Button>
                    {isTerminal ? (
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-block">
                              <Button variant="ghost" size="icon-xs" disabled className="h-6 w-6 text-muted-foreground/30 cursor-not-allowed">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="text-[11px] max-w-xs">System terminal stages cannot be removed</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Button variant="ghost" size="icon-xs" onClick={() => onDeleteStage(stage.id)} className="h-6 w-6 text-muted-foreground hover:text-destructive cursor-pointer" title="Delete stage">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add New Stage Form */}
        <form onSubmit={onAddStage} className="mt-3 p-3.5 rounded-xl border border-dashed border-border/80 bg-muted/10 flex flex-col sm:flex-row items-center gap-2.5">
          <Input placeholder="New stage name (e.g. Technical Evaluation)..." value={newStageName} onChange={(e) => setNewStageName(e.target.value)} className="text-xs h-8.5 flex-1" />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex items-center">
              <Input type="number" min="0" max="100" placeholder="Win %" value={newStageProb} onChange={(e) => setNewStageProb(e.target.value)} className="w-20 text-xs h-8.5 text-center pr-4" />
              <span className="absolute right-2 text-[10px] text-muted-foreground pointer-events-none">%</span>
            </div>
            <div className="relative flex items-center">
              <Input type="number" min="1" max="90" placeholder="SLA" value={newStageSla} onChange={(e) => setNewStageSla(e.target.value)} className="w-18 text-xs h-8.5 text-center pr-4" />
              <span className="absolute right-1.5 text-[10px] text-muted-foreground pointer-events-none">d</span>
            </div>
            <Select value={newStageColor} onValueChange={setNewStageColor}>
              <SelectTrigger className="w-24 h-8.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${newStageColor}`} />
                  <span className="text-[11px] capitalize">Color</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {COLOR_PRESETS.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${p.value}`} />
                      <span>{p.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" size="sm" variant="secondary" className="text-xs font-semibold gap-1.5 h-8.5 shrink-0 cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Add Stage
            </Button>
          </div>
        </form>

        {/* Pipeline SLA Summary */}
        <div className="mt-3 p-3 rounded-xl border border-border/50 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>Estimated Total Pipeline Cycle SLA: <strong className="text-foreground">{totalOpenSlaDays} days</strong></span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              {stages.filter((s) => s.type === "OPEN").length} Open Stages
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              2 Terminal Stages
            </span>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
