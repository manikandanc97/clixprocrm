"use client";

import * as React from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  isLoading?: boolean;
  shortcut?: string;
  containerClassName?: string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      containerClassName,
      value,
      onChange,
      onClear,
      isLoading = false,
      shortcut,
      placeholder = "Search...",
      disabled,
      ...props
    },
    ref
  ) => {
    const hasValue = value !== undefined && value !== null && String(value).length > 0;

    const handleClear = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (onClear) {
        onClear();
      } else if (onChange) {
        const syntheticEvent = {
          target: { value: "" },
          currentTarget: { value: "" },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    return (
      <div className={cn("relative flex items-center w-full min-w-0", containerClassName)}>
        <Search className="absolute left-3 size-4 text-muted-foreground pointer-events-none shrink-0" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "h-9 w-full rounded-md border border-border bg-background pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground/70 shadow-xs transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
            shortcut && !hasValue && "pr-12",
            className
          )}
          {...props}
        />
        <div className="absolute right-2.5 flex items-center gap-1 shrink-0">
          {isLoading ? (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
          ) : hasValue && !disabled ? (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="p-0.5 rounded-xs text-muted-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-3.5" />
            </button>
          ) : shortcut ? (
            <kbd className="hidden sm:inline-flex h-4 items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[9px] font-medium text-muted-foreground select-none pointer-events-none">
              {shortcut}
            </kbd>
          ) : null}
        </div>
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
export { SearchInput as CRMSearchInput };
