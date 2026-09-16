"use client";

import React from "react";
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays, Plus, Search } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/utils";

type ViewType = "month" | "week" | "day" | "agenda";

interface CalendarHeaderProps {
  currentDate: Date;
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  onDateChange: (date: Date) => void;
  onNewEvent: () => void;
}

const VIEWS: { id: ViewType; label: string }[] = [
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
  { id: "agenda", label: "Agenda" },
];

export function CalendarHeader({ currentDate, view, onViewChange, onDateChange, onNewEvent }: CalendarHeaderProps) {
  const handlePrev = () => {
    if (view === "month") onDateChange(subMonths(currentDate, 1));
    else if (view === "week") onDateChange(subWeeks(currentDate, 1));
    else onDateChange(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (view === "month") onDateChange(addMonths(currentDate, 1));
    else if (view === "week") onDateChange(addWeeks(currentDate, 1));
    else onDateChange(addDays(currentDate, 1));
  };

  return (
    <div
      className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-1 duration-200"
    >
      {/* Left: icon + title + nav */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="crm-icon-box text-primary flex-shrink-0">
          <CalendarDays className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-bold text-foreground leading-none truncate">
            {view === "day"
              ? format(currentDate, "EEEE, MMMM d")
              : format(currentDate, "MMMM yyyy")}
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">Scheduling Hub</p>
        </div>

        {/* Nav pills */}
        <div className="flex items-center bg-muted/60 rounded-lg p-0.5 ml-1 flex-shrink-0">
          <Button variant="ghost" size="icon-xs" onClick={handlePrev} className="h-7 w-7 rounded-md hover:bg-background">
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDateChange(new Date())}
            className="h-7 px-2.5 text-[11px] font-semibold rounded-md hover:bg-background"
          >
            Today
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={handleNext} className="h-7 w-7 rounded-md hover:bg-background">
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Right: search + view toggle + CTA */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search events…"
            className="w-44 pl-8 h-8 bg-muted/40 border-transparent shadow-none focus-visible:border-primary focus-visible:bg-background text-xs"
          />
        </div>

        {/* View toggle segment */}
        <div className="crm-segment">
          {VIEWS.map(({ id, label }) => (
            <Button
              key={id}
              variant={view === id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onViewChange(id)}
              className={cn(
                "h-8 px-2.5 text-[11px] font-semibold",
                view === id ? "text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              {label}
            </Button>
          ))}
        </div>

        <Button onClick={onNewEvent} size="sm" className="gap-1.5 h-8 text-[11px] font-semibold flex-shrink-0">
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Event</span>
        </Button>
      </div>
    </div>
  );
}
