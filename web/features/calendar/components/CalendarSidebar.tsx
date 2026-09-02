"use client";

import React, { useState } from "react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, isSameMonth, isSameDay, addMonths, subMonths
} from "date-fns";
import { ChevronLeft, ChevronRight, Users, Phone, CheckSquare } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { motion } from "framer-motion";

interface Summary {
  meetings: number;
  calls: number;
  tasks: number;
}

interface CalendarSidebarProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  summary: Summary;
}

function MiniCalendar({ selected, onSelect }: { selected: Date; onSelect: (d: Date) => void }) {
  const [viewDate, setViewDate] = useState(new Date(selected));
  const today = new Date();

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const rows: Date[][] = [];
  let row: Date[] = [];
  let day = gridStart;
  while (day <= gridEnd) {
    row.push(day);
    if (row.length === 7) { rows.push(row); row = []; }
    day = addDays(day, 1);
  }

  return (
    <div className="select-none">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setViewDate(subMonths(viewDate, 1))}
          className="w-6 h-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs font-semibold text-foreground">
          {format(viewDate, "MMMM yyyy")}
        </span>
        <button
          onClick={() => setViewDate(addMonths(viewDate, 1))}
          className="w-6 h-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-muted-foreground/60 uppercase py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Date grid */}
      {rows.map((week, ri) => (
        <div key={ri} className="grid grid-cols-7">
          {week.map((d, di) => {
            const isSelected = isSameDay(d, selected);
            const isToday = isSameDay(d, today);
            const inMonth = isSameMonth(d, viewDate);
            return (
              <button
                key={di}
                onClick={() => { onSelect(d); setViewDate(d); }}
                className={cn(
                  "aspect-square w-7 h-7 mx-auto flex items-center justify-center text-[11px] font-medium rounded-full transition-all",
                  isSelected
                    ? "bg-primary text-primary-foreground font-bold"
                    : isToday
                    ? "text-primary font-bold ring-1 ring-primary/30"
                    : inMonth
                    ? "text-foreground hover:bg-muted"
                    : "text-muted-foreground/30"
                )}
              >
                {format(d, "d")}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function CalendarSidebar({ currentDate, onDateSelect, summary }: CalendarSidebarProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="hidden lg:flex w-[300px] xl:w-[320px] flex-shrink-0 flex-col bg-card rounded-xl shadow-sm border border-border/50 p-6 space-y-6 overflow-y-auto"
    >
      {/* Mini Calendar */}
      <div>
        <MiniCalendar selected={currentDate} onSelect={onDateSelect} />
      </div>

      <div className="space-y-6">
        {/* Today's Summary */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground/60 mb-3">
            {"Today's Overview"}
          </p>
          <div className="space-y-4">
            {[
              { icon: Users, label: "Meetings", value: summary.meetings, bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", iconBg: "bg-emerald-100 dark:bg-emerald-900/30", iconText: "text-emerald-600 dark:text-emerald-400" },
              { icon: Phone, label: "Calls", value: summary.calls, bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-700 dark:text-orange-400", iconBg: "bg-orange-100 dark:bg-orange-900/30", iconText: "text-orange-600 dark:text-orange-400" },
              { icon: CheckSquare, label: "Tasks Due", value: summary.tasks, bg: "bg-indigo-50 dark:bg-indigo-950/30", text: "text-indigo-700 dark:text-indigo-400", iconBg: "bg-indigo-100 dark:bg-indigo-900/30", iconText: "text-indigo-600 dark:text-indigo-400" },
            ].map(({ icon: Icon, label, value, bg, text, iconBg, iconText }) => (
              <div key={label} className={cn("flex items-center gap-3 rounded-xl px-3 py-2 border border-transparent", bg)}>
                <div className={cn("w-6 h-6 rounded flex items-center justify-center flex-shrink-0", iconBg)}>
                  <Icon className={cn("w-3 h-3", iconText)} />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground flex-1">{label}</span>
                <span className={cn("text-sm font-bold tabular-nums", text)}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
