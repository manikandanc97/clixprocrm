"use client";

import * as React from "react";
import { Tag, X, Plus } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";

export interface TagSelectorProps {
  value?: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
  className?: string;
}

export function TagSelector({
  value = [],
  onChange,
  suggestions = [],
  placeholder = "Add a tag...",
  maxTags,
  disabled = false,
  className,
}: TagSelectorProps) {
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim().replace(/^#/, "");
    if (!trimmed) return;
    if (value.includes(trimmed)) {
      setInputValue("");
      return;
    }
    if (maxTags && value.length >= maxTags) return;

    onChange([...value, trimmed]);
    setInputValue("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(value.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      e.preventDefault();
      handleRemoveTag(value[value.length - 1]);
    }
  };

  const availableSuggestions = React.useMemo(() => {
    return suggestions.filter((s) => !value.includes(s));
  }, [suggestions, value]);

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          "flex flex-wrap items-center gap-1.5 min-h-9 px-2.5 py-1.5 rounded-md border border-border bg-background shadow-xs transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 cursor-text",
          disabled && "opacity-50 pointer-events-none bg-muted/40"
        )}
      >
        <Tag className="size-3.5 text-muted-foreground shrink-0" />
        {value.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-muted/80 hover:bg-muted text-foreground border border-border/60"
          >
            <span>{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTag(tag);
                }}
                aria-label={`Remove tag ${tag}`}
                className="rounded-xs hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-3" />
              </button>
            )}
          </Badge>
        ))}

        {(!maxTags || value.length < maxTags) && !disabled && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (inputValue.trim()) {
                handleAddTag(inputValue);
              }
            }}
            placeholder={value.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[80px] bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
          />
        )}
      </div>

      {availableSuggestions.length > 0 && !disabled && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] uppercase font-bold text-muted-foreground/70 tracking-wider">
            Suggested:
          </span>
          {availableSuggestions.slice(0, 5).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleAddTag(suggestion)}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border border-dashed border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
            >
              <Plus className="size-2.5" />
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
