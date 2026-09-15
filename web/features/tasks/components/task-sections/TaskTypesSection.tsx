"use client";

import React from "react";
import {
  SettingsSection,
  SettingsRow,
  SettingsToggleRow,
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
  ListTodo,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Check,
  X,
} from "lucide-react";
import type { TaskTypeDef } from "../../constants/task-settings.constants";
import { AdminPermissionBanner } from "./AdminPermissionBanner";

export interface TaskTypesSectionProps {
  isAdmin: boolean;
  taskTypes: TaskTypeDef[];
  newTypeName: string;
  setNewTypeName: (v: string) => void;
  editingTypeId: string | null;
  setEditingTypeId: (v: string | null) => void;
  editingTypeName: string;
  setEditingTypeName: (v: string) => void;
  getTypeUsageCount: (name: string) => number;
  onAddType: (e: React.FormEvent) => void;
  onToggleTypeActive: (id: string) => void;
  onMoveType: (index: number, direction: "up" | "down") => void;
  onStartRenameType: (t: TaskTypeDef) => void;
  onSaveRenameType: () => void;
  onRequestDeleteType: (t: TaskTypeDef) => void;
}

export function TaskTypesSection({
  isAdmin,
  taskTypes,
  newTypeName,
  setNewTypeName,
  editingTypeId,
  setEditingTypeId,
  editingTypeName,
  setEditingTypeName,
  getTypeUsageCount,
  onAddType,
  onToggleTypeActive,
  onMoveType,
  onStartRenameType,
  onSaveRenameType,
  onRequestDeleteType,
}: TaskTypesSectionProps) {
  return (
    <div className="space-y-5">
      <AdminPermissionBanner isAdmin={isAdmin} />

      <SettingsSection
        title="Activity & Task Classifications"
        description="Manage predefined task categories for structured touchpoints, sales follow-ups, and action items."
        icon={ListTodo}
      >
        <div className="space-y-2">
          {taskTypes.map((type, idx) => {
            const isEditing = editingTypeId === type.id;
            const usage = getTypeUsageCount(type.name);

            return (
              <div
                key={type.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors text-xs ${
                  type.active
                    ? "border-border/70 bg-card hover:border-border"
                    : "border-border/40 bg-muted/30 opacity-70"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={!isAdmin || idx === 0}
                      onClick={() => onMoveType(idx, "up")}
                      className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={!isAdmin || idx === taskTypes.length - 1}
                      onClick={() => onMoveType(idx, "down")}
                      className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-1 max-w-sm">
                      <Input
                        value={editingTypeName}
                        onChange={(e) => setEditingTypeName(e.target.value)}
                        className="h-7 text-xs"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") onSaveRenameType();
                          if (e.key === "Escape") setEditingTypeId(null);
                        }}
                      />
                      <Button size="icon-xs" variant="default" onClick={onSaveRenameType} className="h-7 w-7">
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon-xs" variant="ghost" onClick={() => setEditingTypeId(null)} className="h-7 w-7">
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-semibold text-foreground truncate">{type.name}</span>
                      {type.isSystem ? (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 shrink-0 font-medium">
                          Standard
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 shrink-0 font-medium">
                          Custom
                        </Badge>
                      )}
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
                      onClick={() => onStartRenameType(type)}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="Rename Task Type"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  )}
                  <div className="flex items-center gap-1.5 pl-1 border-l border-border/50">
                    <span className="text-[11px] text-muted-foreground hidden sm:inline">
                      {type.active ? "Active" : "Inactive"}
                    </span>
                    <Switch
                      checked={type.active}
                      disabled={!isAdmin}
                      onCheckedChange={() => onToggleTypeActive(type.id)}
                      className="data-[state=checked]:bg-emerald-600 scale-90"
                    />
                  </div>
                  {isAdmin && !type.isSystem && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onRequestDeleteType(type)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Delete Custom Task Type"
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
          <form onSubmit={onAddType} className="mt-3 flex items-center gap-2">
            <Input
              placeholder="New task type (e.g., Onsite Assessment, Tech Review)..."
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              className="text-xs h-9 flex-1"
            />
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              disabled={!newTypeName.trim()}
              className="text-xs font-semibold h-9 shrink-0"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Type
            </Button>
          </form>
        )}
      </SettingsSection>
    </div>
  );
}
