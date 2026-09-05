"use client";

import React, { useState } from "react";
import { Plus, ChevronRight, Trash2, Paperclip, X } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";

interface ChecklistItem {
  id: string;
  title: string;
  completed?: boolean;
}

interface AttachmentItem {
  id: string;
  fileName: string;
  fileSize: number;
}

interface TaskChecklistTabProps {
  checklistFields: readonly ChecklistItem[];
  onAddChecklist: (title: string) => void;
  onRemoveChecklist: (index: number) => void;
  attachments: AttachmentItem[];
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (id: string) => void;
}

export function TaskChecklistTab({
  checklistFields,
  onAddChecklist,
  onRemoveChecklist,
  attachments,
  onFileUpload,
  onRemoveAttachment,
}: TaskChecklistTabProps) {
  const [checklistInput, setChecklistInput] = useState("");

  const handleAdd = () => {
    if (!checklistInput.trim()) return;
    onAddChecklist(checklistInput.trim());
    setChecklistInput("");
  };

  return (
    <div className="space-y-5">
      {/* Subtask Checklist */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            Subtasks
          </Label>
          <span className="text-[11px] font-bold text-muted-foreground">
            {checklistFields.length}{" "}
            {checklistFields.length === 1 ? "item" : "items"}
          </span>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Add a subtask..."
            value={checklistInput}
            onChange={(e) => setChecklistInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            className="h-9 text-sm flex-1"
            autoFocus
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            aria-label="Add subtask"
            className="h-9 px-3 text-xs font-bold"
          >
            <Plus className="size-3.5" />
          </Button>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {checklistFields.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center justify-between h-9 px-3 rounded-lg border border-border bg-muted/10 group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <ChevronRight className="size-3 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium text-foreground truncate">
                  {item.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveChecklist(idx)}
                aria-label="Delete subtask"
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
          {checklistFields.length === 0 && (
            <p className="text-[11px] text-muted-foreground italic text-center py-6">
              No subtasks yet — add one above
            </p>
          )}
        </div>
      </div>

      {/* Attachments */}
      <div className="space-y-2 pt-4 border-t border-border">
        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
          <Paperclip className="size-3" /> Attachments
        </Label>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full h-9 border-dashed text-xs text-muted-foreground gap-2 font-semibold"
          onClick={() => document.getElementById("task-file-input")?.click()}
        >
          <Paperclip className="size-3.5" /> Attach Files
        </Button>
        <input
          id="task-file-input"
          type="file"
          multiple
          onChange={onFileUpload}
          className="hidden"
        />

        {attachments.length > 0 && (
          <div className="space-y-1.5">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between h-9 px-3 rounded-lg border border-border bg-muted/10 group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Paperclip className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate">
                    {att.fileName}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {Math.round(att.fileSize / 1024)} KB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveAttachment(att.id)}
                  aria-label="Remove attachment"
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
