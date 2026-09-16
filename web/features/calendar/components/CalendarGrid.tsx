"use client";

import React from "react";
import {
  format, startOfWeek, addDays, startOfMonth, endOfMonth,
  endOfWeek, isSameMonth, isSameDay, parseISO
} from "date-fns";
import { Clock } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { motion } from "framer-motion";

interface CalendarGridProps {
  events: ReturnType<typeof JSON.parse>[];
  currentDate: Date;
  view: "month" | "week" | "day" | "agenda";
  onEventClick: (event: ReturnType<typeof JSON.parse>) => void;
  onViewChange?: (view: "month") => void;
  onNewEvent: () => void;
}

const CHIP: Record<string, string> = {
  MEETING:   "bg-emerald-100 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700/40 dark:text-emerald-300",
  CALL:      "bg-orange-100 border-orange-200 text-orange-800 dark:bg-orange-900/30 dark:border-orange-700/40 dark:text-orange-300",
  TASK:      "bg-indigo-100 border-indigo-200 text-indigo-800 dark:bg-indigo-900/30 dark:border-indigo-700/40 dark:text-indigo-300",
  FOLLOW_UP: "bg-violet-100 border-violet-200 text-violet-800 dark:bg-violet-900/30 dark:border-violet-700/40 dark:text-violet-300",
  HOLIDAY:   "bg-rose-100 border-rose-200 text-rose-800 dark:bg-rose-900/30 dark:border-rose-700/40 dark:text-rose-300",
  LEAVE:     "bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300",
  BIRTHDAY:  "bg-pink-100 border-pink-200 text-pink-800 dark:bg-pink-900/30 dark:border-pink-700/40 dark:text-pink-300",
};

const DOT: Record<string, string> = {
  MEETING: "bg-emerald-500", CALL: "bg-orange-500", TASK: "bg-indigo-500",
  FOLLOW_UP: "bg-violet-500", HOLIDAY: "bg-rose-500", LEAVE: "bg-slate-400", BIRTHDAY: "bg-pink-500",
};

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarGrid({ events, currentDate, view, onEventClick, onViewChange, onNewEvent }: CalendarGridProps) {

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const weeks: Date[][] = [];
    let week: Date[] = [];
    let d = gridStart;
    while (d <= gridEnd) {
      week.push(d);
      if (week.length === 7) { weeks.push(week); week = []; }
      d = addDays(d, 1);
    }
    const today = new Date();

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Day labels */}
        <div className="grid grid-cols-7 border-b border-border/50 bg-muted/40 flex-shrink-0">
          {DAY_HEADERS.map(dh => (
            <div key={dh} className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 border-r border-border/30 last:border-r-0">
              {dh}
            </div>
          ))}
        </div>
        {/* Weeks grid — let it grow */}
        <div className="flex-1 grid" style={{ gridTemplateRows: `repeat(${weeks.length}, 1fr)` }}>
          {weeks.map((wk, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-border/30 last:border-b-0">
              {wk.map((day, di) => {
                const dayEvents = events.filter(e => { try { return isSameDay(parseISO(e.startTime), day); } catch { return false; } });
                const isToday = isSameDay(day, today);
                const inMonth = isSameMonth(day, monthStart);
                return (
                  <div
                    key={di}
                    className={cn(
                      "border-r border-border/30 last:border-r-0 p-3 overflow-hidden transition-all duration-200",
                      !inMonth ? "bg-muted/20 opacity-60" : isToday ? "bg-primary/5 ring-1 ring-inset ring-primary/20" : "bg-card hover:bg-muted/40"
                    )}
                  >
                    {/* Date number */}
                    <div className="flex justify-end mb-2">
                      <span className={cn(
                        "w-6 h-6 text-[11px] flex items-center justify-center rounded-full font-semibold transition-colors",
                        isToday ? "bg-primary text-primary-foreground shadow-sm" : inMonth ? "text-foreground" : "text-muted-foreground/50"
                      )}>
                        {format(day, "d")}
                      </span>
                    </div>
                    {/* Event chips */}
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map(ev => (
                        <button
                          key={ev.id}
                          onClick={() => onEventClick(ev)}
                          className={cn(
                            "w-full text-left text-[10px] font-semibold px-2 py-1 rounded-lg truncate border",
                            "transition-all hover:opacity-80 hover:scale-[1.02] active:scale-100",
                            CHIP[ev.type] ?? CHIP.MEETING
                          )}
                        >
                          {!ev.isAllDay && (
                            <span className="opacity-60 mr-1 font-normal">
                              {format(parseISO(ev.startTime), "H:mm")}
                            </span>
                          )}
                          {ev.title}
                        </button>
                      ))}
                      {dayEvents.length > 3 && (
                        <p className="text-[10px] text-muted-foreground font-medium px-1">
                          +{dayEvents.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAgendaView = () => {
    if (events.length === 0) return <EmptyState onNewEvent={onNewEvent} />;

    const sorted = [...events].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    const grouped: Record<string, ReturnType<typeof JSON.parse>[]> = {};
    sorted.forEach(ev => {
      const key = format(parseISO(ev.startTime), "yyyy-MM-dd");
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(ev);
    });

    return (
      <div className="overflow-y-auto h-full">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">
          {Object.entries(grouped).map(([dateStr, dayEvents], gi) => {
            const date = parseISO(dateStr);
            const isToday = isSameDay(date, new Date());
            return (
              <motion.div
                key={dateStr}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gi * 0.04 }}
                className="flex gap-5"
              >
                {/* Date stamp */}
                <div className="w-16 flex-shrink-0 text-right pt-0.5">
                  <p className={cn("text-2xl font-extrabold leading-none tabular-nums", isToday ? "text-primary" : "text-foreground/90")}>
                    {format(date, "d")}
                  </p>
                  <p className={cn("text-[10px] font-bold uppercase tracking-wider mt-1", isToday ? "text-primary" : "text-muted-foreground")}>
                    {format(date, "EEE")}
                  </p>
                  {isToday && (
                    <span className="mt-1 inline-block px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[9px] font-bold uppercase tracking-wider rounded-md">
                      Today
                    </span>
                  )}
                </div>
                {/* Events */}
                <div className="flex-1 space-y-2 relative">
                  <div className="absolute left-[-12px] top-1 bottom-1 w-px bg-border/50" />
                  {dayEvents.map(ev => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => onEventClick(ev)}
                      className="w-full text-left group hover:translate-x-0.5 transition-transform"
                    >
                      <div className={cn(
                        "absolute -left-[18px] mt-3 w-2.5 h-2.5 rounded-full border-2 border-background",
                        DOT[ev.type] ?? DOT.MEETING
                      )} />
                      <div className="bg-card border border-border/60 rounded-xl p-3.5 shadow-sm group-hover:shadow-md group-hover:border-border transition-all">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border", CHIP[ev.type] ?? CHIP.MEETING)}>
                            {ev.type.replace("_", " ")}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                            <Clock className="w-3 h-3" />
                            {ev.isAllDay ? "All Day" : `${format(parseISO(ev.startTime), "h:mm a")} – ${format(parseISO(ev.endTime), "h:mm a")}`}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                          {ev.title}
                        </p>
                        {ev.relatedLead && (
                          <p className="text-[11px] text-muted-foreground mt-1 truncate">
                            {ev.relatedLead.name} · {ev.relatedLead.company}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-card rounded-xl shadow-sm border border-border/50 p-4 lg:p-6">
      {view === "month" && renderMonthView()}
      {view === "agenda" && renderAgendaView()}
      {(view === "week" || view === "day") && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <Clock className="w-5 h-5 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-semibold text-foreground capitalize">{view} View — Coming Soon</p>
          <p className="text-xs text-muted-foreground">Switch to Month or Agenda for now</p>
          <Button variant="outline" size="sm" onClick={() => onViewChange?.("month")}>
            Month View
          </Button>
        </div>
      )}
    </div>
  );
}
