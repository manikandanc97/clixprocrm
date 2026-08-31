"use client";

import React, { useState, useEffect, useMemo } from "react";
import client from "@/shared/lib/api/client";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, addDays, subDays } from "date-fns";
import { CalendarDays, Users, Phone, CheckSquare } from "lucide-react";
import { CalendarHeader } from "@/features/calendar/components/CalendarHeader";
import { CalendarSidebar } from "@/features/calendar/components/CalendarSidebar";
import { CalendarGrid } from "@/features/calendar/components/CalendarGrid";
import { EventModal } from "@/features/calendar/components/EventModal";
import { CRMMetricCard, CRMMetricsGrid, CRMPageContainer } from "@/shared/components/crm";
import { toast } from "sonner";
import { CalendarSkeleton } from "@/features/calendar/components/CalendarSkeleton";

type ViewType = "month" | "week" | "day" | "agenda";

interface Filters {
  meetings: boolean;
  calls: boolean;
  tasks: boolean;
  leaves: boolean;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>("month");
  const [events, setEvents] = useState<ReturnType<typeof JSON.parse>[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<ReturnType<typeof JSON.parse> | null>(null);
  const [filters, setFilters] = useState<Filters>({ meetings: true, calls: true, tasks: true, leaves: true });

  const fetchEvents = async () => {
    try {
      setLoading(true);
      let start: Date, end: Date;
      if (view === "month") {
        start = startOfWeek(startOfMonth(currentDate));
        end = endOfWeek(endOfMonth(currentDate));
      } else if (view === "agenda") {
        start = currentDate;
        end = addMonths(currentDate, 3);
      } else {
        start = subDays(currentDate, 7);
        end = addDays(currentDate, 30);
      }

      const res = await client.get(`/crm/calendar?start=${start.toISOString()}&end=${end.toISOString()}`);
      const data = res.data?.data || res.data;
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Could not load calendar events.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, view]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (e.type === "MEETING" && !filters.meetings) return false;
      if ((e.type === "CALL" || e.type === "FOLLOW_UP") && !filters.calls) return false;
      if (e.type === "TASK" && !filters.tasks) return false;
      if ((e.type === "HOLIDAY" || e.type === "LEAVE" || e.type === "BIRTHDAY") && !filters.leaves) return false;
      return true;
    });
  }, [events, filters]);

  const today = new Date().toDateString();
  const summary = useMemo(() => ({
    meetings: events.filter(e => e.type === "MEETING" && new Date(e.startTime).toDateString() === today).length,
    calls: events.filter(e => (e.type === "CALL" || e.type === "FOLLOW_UP") && new Date(e.startTime).toDateString() === today).length,
    tasks: events.filter(e => e.type === "TASK" && new Date(e.startTime).toDateString() === today).length,
    total: events.length,
  }), [events, today]);

  const handleDelete = async (id: string) => {
    try {
      await client.delete(`/crm/calendar/${id}`);
      toast.success("Event deleted");
      setSelectedEvent(null);
      fetchEvents();
    } catch {
      toast.error("Failed to delete event.");
    }
  };

  if (loading && events.length === 0) {
    return <CalendarSkeleton />;
  }

  return (
    <CRMPageContainer>
      {/* ── HEADER ── */}
        <CalendarHeader
          currentDate={currentDate}
          view={view}
          onViewChange={setView}
          onDateChange={setCurrentDate}
          onNewEvent={() => toast.info("Event creation coming soon!")}
        />

        {/* ── METRIC CARDS ── */}
        <div>
          <CRMMetricsGrid className="gap-3 md:gap-4">
          <CRMMetricCard
            title="Today's Meetings"
            value={summary.meetings}
            loading={loading}
            hideBottomSkeletons={true}
            icon={Users}
            color="emerald"
            trend="neutral"
            delay={0}
          />
          <CRMMetricCard
            title="Calls Today"
            value={summary.calls}
            loading={loading}
            hideBottomSkeletons={true}
            icon={Phone}
            color="orange"
            trend="neutral"
            delay={0.05}
          />
          <CRMMetricCard
            title="Tasks Due"
            value={summary.tasks}
            loading={loading}
            hideBottomSkeletons={true}
            icon={CheckSquare}
            color="indigo"
            trend="neutral"
            delay={0.1}
          />
          <CRMMetricCard
            title="Total Events"
            value={summary.total}
            loading={loading}
            hideBottomSkeletons={true}
            icon={CalendarDays}
            color="violet"
            trend="neutral"
            delay={0.15}
          />
        </CRMMetricsGrid>
        </div>

        {/* ── MAIN: Sidebar + Grid ── */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          <CalendarSidebar
            currentDate={currentDate}
            onDateSelect={setCurrentDate}
            filters={filters}
            onFilterChange={(key, val) => setFilters(prev => ({ ...prev, [key]: val }))}
            summary={summary}
          />

          <div className="flex-1 min-w-0 w-full">
            <CalendarGrid
              events={filteredEvents}
              currentDate={currentDate}
              view={view}
              onEventClick={setSelectedEvent}
              onViewChange={(v) => setView(v)}
              onNewEvent={() => toast.info("Event creation coming soon!")}
            />
          </div>
        </div>
      <EventModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={() => toast.info("Event edit coming soon!")}
        onDelete={handleDelete}
      />
    </CRMPageContainer>
  );
}
