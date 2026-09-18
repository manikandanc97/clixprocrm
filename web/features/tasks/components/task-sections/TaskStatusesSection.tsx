"use client";

import React from "react";
import {
  SettingsSection,
} from "@/shared/components/crm/ContextualSettingsComponents";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  CheckSquare,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Check,
  X,
} from "lucide-react";
import type { TaskStatusDef } from "../../constants/task-settings.constants";
import { TASK_COLOR_PRESETS as COLOR_PRESETS } from "../../constants/task-settings.constants";
import { AdminPermissionBanner } from "./AdminPermissionBanner";
import { cn } from "@/shared/lib/utils";

export interface TaskStatusesSectionProps {
  isAdmin: boolean;
  statuses: TaskStatusDef[];
  newStatusName: string;
  setNewStatusName: (v: string) => void;
  newStatusColor: string;
  setNewStatusColor: (v: string) => void;
  newStatusIsTerminal: boolean;
  setNewStatusIsTerminal: (v: boolean) => void;
  editingStatusId: string | null;
  setEditingStatusId: (v: string | null) => void;
  editingStatusName: string;
  setEditingStatusName: (v: string) => void;
  editingStatusColor: string;
  setEditingStatusColor: (v: string) => void;
  getStatusUsageCount: (key: string) => number;
  onAddStatus: (e: React.FormEvent) => void;
  onMoveStatus: (index: number, direction: "up" | "down") => void;
  onToggleStatusActive: (id: string) => void;
  onStartRenameStatus: (st: TaskStatusDef) => void;
  onSaveRenameStatus: () => void;
  onRequestDeleteStatus: (st: TaskStatusDef) => void;
}

export function TaskStatusesSection({
  isAdmin,
  statuses,
  newStatusName,
  setNewStatusName,
  newStatusColor,
  setNewStatusColor,
  newStatusIsTerminal: _newStatusIsTerminal,
  setNewStatusIsTerminal: _setNewStatusIsTerminal,
  editingStatusId,
  setEditingStatusId,
  editingStatusName,
  setEditingStatusName,
  editingStatusColor,
  setEditingStatusColor,
  getStatusUsageCount,
  onAddStatus,
  onMoveStatus,
  onToggleStatusActive,
  onStartRenameStatus,
  onSaveRenameStatus,
  onRequestDeleteStatus,
}: TaskStatusesSectionProps) {
  return (
    <div className="space-y-5">
      <AdminPermissionBanner isAdmin={isAdmin} />

      <SettingsSection
        title="Execution Statuses & Governance"
        description="Configure workflow lifecycle states tasks progress through from pending through terminal completion."
        icon={CheckSquare}
      >
        <div className="space-y-2">
          {statuses.map((st, idx) => {
            const isEditing = editingStatusId === st.id;
            const usage = getStatusUsageCount(st.key);

            return (
              <div
                key={st.id}
                className={cn(
                  "flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-card hover:bg-muted/20 transition-all duration-150 gap-2",
                  !st.active && "opacity-60 bg-muted/10"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={!isAdmin || idx === 0}
                      onClick={() => onMoveStatus(idx, "up")}
                      className="h-4 w-5 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={!isAdmin || idx === statuses.length - 1}
                      onClick={() => onMoveStatus(idx, "down")}
                      className="h-4 w-5 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                  </div>

                  <span className={`w-3 h-3 rounded-full shrink-0 ${st.color}`} />

                  {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <Input
                        value={editingStatusName}
                        onChange={(e) => setEditingStatusName(e.target.value)}
                        className="text-xs h-7 flex-1"
                        autoFocus
                      />
                      <Select value={editingStatusColor} onValueChange={setEditingStatusColor}>
                        <SelectTrigger className="w-24 h-7 text-[11px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COLOR_PRESETS.map((c) => (
                            <SelectItem key={c.value} value={c.value} className="text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${c.value}`} />
                                <span>{c.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="icon-xs" variant="ghost" onClick={onSaveRenameStatus} className="h-7 w-7 text-primary hover:text-primary">
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon-xs" variant="ghost" onClick={() => setEditingStatusId(null)} className="h-7 w-7">
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-semibold text-foreground truncate">{st.name}</span>
                      {st.isTerminal && (
                        <Badge variant="outline" className="text-[9.5px] py-0 px-1.5 border-success/30 bg-success/10 text-success shrink-0 font-medium">
                          Terminal
                        </Badge>
                      )}
                      {st.isSystem ? (
                        <Badge variant="outline" className="text-[9.5px] py-0 px-1.5 border-info/30 bg-info/10 text-info shrink-0 font-medium">
                          System Core
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9.5px] py-0 px-1.5 border-primary/30 bg-primary/10 text-primary shrink-0 font-medium">
                          Custom
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground/70 font-mono hidden md:inline">[{st.key}]</span>
                      {usage > 0 && (
                        <span className="text-[10.5px] text-muted-foreground">
                          ({usage} {usage === 1 ? "task" : "tasks"})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isAdmin && !isEditing && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onStartRenameStatus(st)}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="Edit Status"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  )}
                  <div className="flex items-center gap-1.5 pl-1 border-l border-border/50">
                    <span className="text-[11px] text-muted-foreground hidden sm:inline">
                      {st.active ? "Active" : "Archived"}
                    </span>
                    <Switch
                      checked={st.active}
                      disabled={!isAdmin || (st.isSystem && st.key === "PENDING")}
                      onCheckedChange={() => onToggleStatusActive(st.id)}
                      className="data-[state=checked]:bg-primary scale-90"
                    />
                  </div>
                  {isAdmin && !st.isSystem && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onRequestDeleteStatus(st)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Delete Custom Status"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {isAdmin && (
          <form onSubmit={onAddStatus} className="mt-3.5 p-3 rounded-xl border border-border/60 bg-muted/20 space-y-2.5">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Add Custom Status
            </div>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <Input
                placeholder="New status name (e.g. Waiting on Client)..."
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                className="text-xs h-9 flex-1"
              />
              <Select value={newStatusColor} onValueChange={setNewStatusColor}>
                <SelectTrigger className="w-32 h-9 text-xs">
                  <SelectValue placeholder="Color" />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_PRESETS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`w-2.5 h-2.5 rounded-full ${c.value}`} />
                        <span>{c.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                disabled={!newStatusName.trim()}
                className="text-xs font-semibold h-9 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Status
              </Button>
            </div>
          </form>
        )}
      </SettingsSection>
    </div>
  );
}
