"use client";

import * as React from "react";
import {
  MessageSquare,
  FileText,
  Phone,
  Calendar,
  ShieldAlert,
  Send,
  Loader2,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { cn } from "@/shared/lib/utils";

export type ActivityComposerType = "NOTE" | "CALL" | "MEETING" | "UPDATE" | "BLOCKER" | "QUESTION";

export interface ActivityComposerProps {
  onSubmit: (data: { type: ActivityComposerType; content: string }) => Promise<void> | void;
  isSubmitting?: boolean;
  allowedTypes?: ActivityComposerType[];
  defaultType?: ActivityComposerType;
  placeholder?: string;
  className?: string;
}

export function ActivityComposer({
  onSubmit,
  isSubmitting = false,
  allowedTypes = ["NOTE", "CALL", "MEETING", "UPDATE", "BLOCKER"],
  defaultType = "NOTE",
  placeholder,
  className,
}: ActivityComposerProps) {
  const [activeType, setActiveType] = React.useState<ActivityComposerType>(defaultType);
  const [content, setContent] = React.useState("");

  const typeConfig: Record<
    ActivityComposerType,
    { label: string; icon: React.ComponentType<{ className?: string }>; placeholder: string }
  > = {
    NOTE: {
      label: "Note",
      icon: FileText,
      placeholder: "Write an internal note or observation...",
    },
    CALL: {
      label: "Log Call",
      icon: Phone,
      placeholder: "Log call summary, outcomes, and next steps...",
    },
    MEETING: {
      label: "Meeting",
      icon: Calendar,
      placeholder: "Log meeting minutes or discussion notes...",
    },
    UPDATE: {
      label: "Progress",
      icon: MessageSquare,
      placeholder: "Post a status or progress update...",
    },
    BLOCKER: {
      label: "Blocker",
      icon: ShieldAlert,
      placeholder: "Describe the blocker and assistance required...",
    },
    QUESTION: {
      label: "Question",
      icon: MessageSquare,
      placeholder: "Ask a question or request clarification...",
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    await onSubmit({ type: activeType, content: content.trim() });
    setContent("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "rounded-xl border border-border/80 bg-card p-3 shadow-xs transition-all duration-150 space-y-3",
        className
      )}
    >
      {/* Tab Selector */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border/60 pb-2">
        {allowedTypes.map((t) => {
          const cfg = typeConfig[t];
          const Icon = cfg.icon;
          const isSelected = activeType === t;

          return (
            <button
              key={t}
              type="button"
              onClick={() => setActiveType(t)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                isSelected
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              <span>{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {/* Input Area */}
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        placeholder={placeholder || typeConfig[activeType].placeholder}
        disabled={isSubmitting}
        rows={3}
        className="w-full text-xs resize-none border-border/60 focus-visible:ring-1 focus-visible:ring-ring"
      />

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-[10px] text-muted-foreground">
          {content.length > 0 ? `${content.length} characters` : ""}
        </span>

        <div className="flex items-center gap-2">
          {content.trim().length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setContent("")}
              disabled={isSubmitting}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          )}

          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || isSubmitting}
            className="h-8 px-3 text-xs font-semibold gap-1.5"
          >
            {isSubmitting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            <span>Log {typeConfig[activeType].label}</span>
          </Button>
        </div>
      </div>
    </form>
  );
}
