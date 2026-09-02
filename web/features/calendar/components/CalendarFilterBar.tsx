"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Phone, CheckSquare, Sparkles, Check, Filter } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export interface CalendarFilters {
  meetings: boolean;
  calls: boolean;
  tasks: boolean;
  leaves: boolean;
}

interface FilterCounts {
  meetings?: number;
  calls?: number;
  tasks?: number;
  leaves?: number;
}

interface CalendarFilterBarProps {
  filters: CalendarFilters;
  onFilterChange: (key: keyof CalendarFilters, value: boolean) => void;
  onSelectAll?: () => void;
  counts?: FilterCounts;
  className?: string;
}

const FILTER_ITEMS = [
  {
    key: "meetings" as const,
    label: "Meetings",
    icon: Users,
    color: "emerald",
    activeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/15 shadow-sm shadow-emerald-500/5",
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  {
    key: "calls" as const,
    label: "Calls & Follow-ups",
    icon: Phone,
    color: "orange",
    activeClass: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30 hover:bg-orange-500/15 shadow-sm shadow-orange-500/5",
    dotClass: "bg-orange-500",
    badgeClass: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  },
  {
    key: "tasks" as const,
    label: "Tasks Due",
    icon: CheckSquare,
    color: "indigo",
    activeClass: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/15 shadow-sm shadow-indigo-500/5",
    dotClass: "bg-indigo-500",
    badgeClass: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  },
  {
    key: "leaves" as const,
    label: "Holidays & Leave",
    icon: Sparkles,
    color: "rose",
    activeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/15 shadow-sm shadow-rose-500/5",
    dotClass: "bg-rose-500",
    badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  },
];

export function CalendarFilterBar({
  filters,
  onFilterChange,
  onSelectAll,
  counts,
  className,
}: CalendarFilterBarProps) {
  const allSelected = Object.values(filters).every(Boolean);

  const toggleAll = () => {
    if (onSelectAll) {
      onSelectAll();
      return;
    }
    const nextState = !allSelected;
    (Object.keys(filters) as (keyof CalendarFilters)[]).forEach((k) => {
      onFilterChange(k, nextState);
    });
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2.5 p-2 rounded-xl bg-card border border-border/60 shadow-xs",
        className
      )}
    >
      {/* Left: Filter label + Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider select-none">
          <Filter className="w-3.5 h-3.5 text-muted-foreground/70" />
          <span>Calendars</span>
        </div>

        <div className="h-4 w-px bg-border/60 hidden sm:block" />

        <div className="flex flex-wrap items-center gap-1.5">
          {FILTER_ITEMS.map((item) => {
            const isActive = filters[item.key];
            const count = counts?.[item.key];
            const Icon = item.icon;

            return (
              <motion.button
                key={item.key}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => onFilterChange(item.key, !isActive)}
                className={cn(
                  "group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 cursor-pointer select-none",
                  isActive
                    ? item.activeClass
                    : "bg-background/50 text-muted-foreground/60 border-border/40 hover:border-border hover:text-muted-foreground hover:bg-muted/40"
                )}
              >
                {/* Checkbox indicator */}
                <div
                  className={cn(
                    "w-3.5 h-3.5 rounded flex items-center justify-center transition-all duration-150",
                    isActive
                      ? cn("text-white shadow-xs", item.dotClass)
                      : "border border-muted-foreground/30 bg-transparent"
                  )}
                >
                  {isActive && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>

                {/* Icon */}
                <Icon
                  className={cn(
                    "w-3.5 h-3.5 transition-colors",
                    isActive ? "opacity-90" : "opacity-40"
                  )}
                />

                {/* Label */}
                <span>{item.label}</span>

                {/* Optional count pill */}
                {count !== undefined && count > 0 && (
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums leading-tight transition-colors",
                      isActive
                        ? item.badgeClass
                        : "bg-muted text-muted-foreground/50"
                    )}
                  >
                    {count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Right: Quick Toggle / Reset */}
      <button
        type="button"
        onClick={toggleAll}
        className="text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted/50 transition-colors ml-auto sm:ml-0 select-none"
      >
        {allSelected ? "Hide all" : "Show all"}
      </button>
    </div>
  );
}
