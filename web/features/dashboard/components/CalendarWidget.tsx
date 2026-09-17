"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CRMCard } from "@/shared/components/crm/CRMCard";
import { CardContent } from "@/shared/ui/card";
import { Calendar } from "@/shared/ui/calendar";
import { format, isSameDay, addMonths, subMonths, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { useMeetings } from "@/shared/hooks/use-dashboard";
import { Skeleton } from "@/shared/ui/skeleton";

export default function CalendarWidget() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [month, setMonth] = useState<Date>(new Date());
  const { data, isLoading: loading } = useMeetings();
  
  const events = useMemo(() => {
    if (!data?.meetings) return [];
    return data.meetings.map(m => ({
      ...m,
      date: parseISO(m.date),
      color: m.color === 'emerald' ? 'bg-emerald-500' : 
             m.color === 'blue' ? 'bg-blue-500' : 'bg-primary'
    }));
  }, [data]);

  const handlePrevMonth = () => setMonth((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setMonth((prev) => addMonths(prev, 1));

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      const dayEvents = events.filter((e) => isSameDay(e.date, selectedDate));
      if (dayEvents.length > 0) {
        toast.info(`Schedule for ${format(selectedDate, "MMM d")}`, {
          description: `You have ${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""} scheduled: ${dayEvents.map((e) => e.title).join(", ")}`,
        });
      } else {
        toast.info(`No events for ${format(selectedDate, "MMM d")}`, {
          description: "Click + to schedule a new meeting.",
        });
      }
    }
  };

  const handleToday = () => {
    const today = new Date();
    setDate(today);
    setMonth(today);
    handleDateSelect(today);
  };

  const selectedDayEvents = useMemo(() => {
    return events.filter((e) => date && isSameDay(e.date, date));
  }, [events, date]);


  if (loading) {
    return (
      <div className="w-full h-[400px] rounded-xl border border-border/60 bg-card p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
        <Skeleton className="flex-1 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <CRMCard
        animate={false}
        accentSeed="Calendar"
        noPadding
        className="relative overflow-hidden border border-border/60 bg-card shadow-sm"
      >
        {/* Subtle decorative gradient */}
        <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 -translate-y-1/4 translate-x-1/4 rounded-full bg-primary/4 blur-3xl" />

        <CardContent className="relative z-10 flex flex-col gap-0 p-0">

          {/* ── Header ── */}
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
            {/* Left: Icon + Title */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 border border-primary/15">
                <CalendarIcon className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 leading-none mb-0.5">
                  Schedule
                </p>
                <h3 className="truncate font-semibold text-[13px] text-foreground leading-none">
                  {format(month, "MMMM yyyy")}
                </h3>
              </div>
            </div>

            {/* Right: Nav + Today */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Month navigation */}
              <div className="flex items-center rounded-md border border-border/60 bg-muted/30 overflow-hidden">
                <button
                  onClick={handlePrevMonth}
                  className="flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
                  aria-label="Previous Month"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <div className="h-4 w-px bg-border/60" />
                <button
                  onClick={handleNextMonth}
                  className="flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
                  aria-label="Next Month"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Today button */}
              <button
                onClick={handleToday}
                className="h-7 rounded-md border border-border/60 bg-muted/30 px-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/8 hover:text-primary active:scale-95"
              >
                Today
              </button>
            </div>
          </div>

          {/* ── Calendar Grid ── */}
          <div className="px-4 pt-3 pb-2">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              month={month}
              onMonthChange={setMonth}
              showOutsideDays
              className="w-full p-0 [--cell-size:34px]"
              classNames={{
                root: "w-full",
                months: "w-full",
                month: "w-full flex flex-col gap-0",
                month_caption: "hidden",
                table: "w-full border-collapse",
                caption_label: "hidden",
                nav: "hidden",
                weekdays: "flex w-full mb-1",
                weekday:
                  "flex-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 text-center py-1",
                week: "flex w-full mt-0.5",
                day: "relative flex-1 aspect-square rounded-md p-0 text-center select-none transition-colors hover:bg-muted/70 group/day",
                selected:
                  "bg-primary text-primary-foreground rounded-md shadow-sm [&_button]:text-primary-foreground [&_button]:font-bold",
                today:
                  "bg-primary/8 text-primary font-semibold [&_button]:font-semibold",
                outside: "text-muted-foreground/25 [&_button]:text-muted-foreground/25",
              }}
            />
          </div>

          {/* ── Divider ── */}
          <div className="mx-5 border-t border-border/40" />

          {/* ── Events Section ── */}
          <div className="flex flex-col gap-2.5 px-5 py-4">

            {/* Events header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Events
                </span>
                {date && (
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                    {format(date, "MMM d")}
                  </span>
                )}
              </div>
              {selectedDayEvents.length > 0 && (
                <span className="text-[9px] font-medium text-muted-foreground/50">
                  {selectedDayEvents.length} scheduled
                </span>
              )}
            </div>

            {/* Event list */}
            <AnimatePresence mode="wait">
              <motion.div
                key={date?.toISOString() || "no-date"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-2"
              >
                {selectedDayEvents.length > 0 ? (
                  selectedDayEvents.map((event, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07, duration: 0.2 }}
                      className="group flex cursor-pointer items-center gap-3 rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5 transition-all hover:border-border/70 hover:bg-muted/50"
                    >
                      {/* Color dot */}
                      <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${event.color}`} />

                      {/* Event info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
                          {event.title}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1 text-[9px] font-medium text-muted-foreground/70">
                          <Clock className="h-2.5 w-2.5" />
                          <span>{event.time}</span>
                        </div>
                      </div>

                      {/* Arrow icon */}
                      <ArrowUpRight className="h-3 w-3 shrink-0 text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100" />
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/40 bg-muted/10 py-5">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground/20" />
                    <p className="text-[9px] font-medium text-muted-foreground/40">
                      No events for this day
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

        </CardContent>
      </CRMCard>
    </div>
  );
}












