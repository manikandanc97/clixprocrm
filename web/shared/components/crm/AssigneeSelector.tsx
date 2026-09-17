"use client";

import * as React from "react";
import { User, Check, ChevronsUpDown, UserX, Loader2, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover";
import { cn } from "@/shared/lib/utils";

export interface AssigneeOption {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
  role?: string;
}

export interface AssigneeSelectorProps {
  value?: string | null;
  onChange: (value: string | null, assignee?: AssigneeOption | null) => void;
  assignees?: AssigneeOption[];
  placeholder?: string;
  allowUnassign?: boolean;
  unassignLabel?: string;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export function AssigneeSelector({
  value,
  onChange,
  assignees = [],
  placeholder = "Select assignee...",
  allowUnassign = true,
  unassignLabel = "Unassigned",
  disabled = false,
  isLoading = false,
  className,
  size = "default",
}: AssigneeSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const selected = React.useMemo(
    () => assignees.find((a) => a.id === value) || null,
    [assignees, value]
  );

  const filteredAssignees = React.useMemo(() => {
    if (!searchQuery.trim()) return assignees;
    const query = searchQuery.toLowerCase();
    return assignees.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        (a.email && a.email.toLowerCase().includes(query)) ||
        (a.role && a.role.toLowerCase().includes(query))
    );
  }, [assignees, searchQuery]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || "U";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          size={size === "sm" ? "sm" : size === "lg" ? "lg" : "default"}
          className={cn(
            "w-full justify-between font-normal text-left px-3 h-9 bg-background border-border hover:bg-muted/40",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate min-w-0">
            {isLoading ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground shrink-0" />
            ) : selected ? (
              <>
                <Avatar className="size-5 shrink-0">
                  {selected.avatarUrl && (
                    <AvatarImage src={selected.avatarUrl} alt={selected.name} />
                  )}
                  <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                    {getInitials(selected.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-foreground font-medium text-xs">
                  {selected.name}
                </span>
                {selected.role && (
                  <span className="hidden sm:inline text-[10px] text-muted-foreground uppercase font-semibold">
                    ({selected.role})
                  </span>
                )}
              </>
            ) : (
              <>
                <User className="size-4 text-muted-foreground shrink-0" />
                <span className="truncate text-muted-foreground text-xs">
                  {placeholder}
                </span>
              </>
            )}
          </div>
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-50 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 shadow-elevated border-border bg-popover" align="start">
        <div className="flex items-center border-b border-border px-2.5 py-1.5 gap-2">
          <Search className="size-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member..."
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
            autoFocus
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
          {allowUnassign && (
            <button
              type="button"
              onClick={() => {
                onChange(null, null);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between text-xs py-2 px-2.5 rounded-md text-left transition-colors",
                !value ? "bg-muted/80 text-foreground font-medium" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                <UserX className="size-4 text-muted-foreground" />
                <span>{unassignLabel}</span>
              </div>
              {!value && <Check className="size-3.5 text-primary" />}
            </button>
          )}

          {filteredAssignees.length === 0 ? (
            <div className="py-3 text-center text-xs text-muted-foreground">
              No members found
            </div>
          ) : (
            filteredAssignees.map((assignee) => {
              const isSelected = assignee.id === value;
              return (
                <button
                  type="button"
                  key={assignee.id}
                  onClick={() => {
                    onChange(assignee.id, assignee);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between text-xs py-2 px-2.5 rounded-md text-left transition-colors",
                    isSelected ? "bg-primary/10 text-foreground font-medium" : "hover:bg-muted/60 text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="size-6 shrink-0">
                      {assignee.avatarUrl && (
                        <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />
                      )}
                      <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                        {getInitials(assignee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-foreground truncate">
                        {assignee.name}
                      </span>
                      {assignee.email && (
                        <span className="text-[10px] text-muted-foreground truncate">
                          {assignee.email}
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check className="size-3.5 text-primary shrink-0 ml-2" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
