"use client";

import { motion } from "framer-motion";
import { CRMCard, EmptyState } from "@/shared/components/crm";
import { CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { toast } from "sonner";
import { useRouter } from "next/navigation";


import { useMeetings } from "@/shared/hooks/use-dashboard";

export default function UpcomingMeetings() {
  const router = useRouter();
  const { data } = useMeetings();
  const meetings = data?.meetings ?? [];
  const hasMeetings = meetings.length > 0;

  const handleJoin = (e: React.MouseEvent, title: string) => {
    e.stopPropagation();
    toast.success(`Joining: ${title}`, {
      description: "Initializing secure video connection...",
    });
    window.open("https://zoom.us", "_blank");
  };

  const handleSchedule = () => {
    toast.info("Schedule Meeting", {
      description: "Opening smart scheduling assistant...",
    });
    router.push('/calendar');
  };

  const handleViewCalendar = () => {
    toast.info("Navigating to Calendar", {
      description: "Loading full-screen schedule view.",
    });
    router.push('/calendar');
  };

  const handleMeetingClick = (title: string) => {
    toast.info(`Meeting Details: ${title}`, {
      description: "Opening meeting workspace and shared notes.",
    });
  };


  return (
    <div className="w-full">
      <CRMCard 
        animate={false}
        accentSeed="Upcoming Meetings"
        noPadding
        className="bg-gradient-to-br from-card to-background/50 h-[420px] flex flex-col"
      >
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-info/10 text-info rounded-xl shadow-sm border border-info/20">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <CardTitle>Upcoming Meetings</CardTitle>
              <p className="text-muted-foreground text-sm font-medium">
                You have {data?.meetings?.filter((m) => m.isToday).length || 0} meetings
                scheduled for today
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleViewCalendar}
              className="hidden sm:flex rounded-xl border-border bg-background/50 backdrop-blur-md h-10 font-bold text-xs uppercase tracking-wider hover:bg-muted"
            >
              View Calendar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0 flex-1 flex flex-col">
          {!hasMeetings ? (
            <EmptyState 
              icon={Calendar}
              title="No meetings scheduled"
              description="No upcoming meetings scheduled."
              action={{ label: "Schedule Meeting", onClick: handleSchedule }}
              className="border-none bg-transparent shadow-none"
            />
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar">
              {meetings.slice(0, 3).map((meeting, index) => (
                <motion.div
                  key={meeting.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
                  onClick={() => handleMeetingClick(meeting.title)}
                  className={`group relative flex flex-col sm:flex-row items-center sm:items-center gap-4 p-4 rounded-xl border transition-all duration-500 cursor-pointer overflow-hidden
                    ${
                      meeting.isToday
                        ? "bg-gradient-to-br from-card to-info/5 border-info/20 shadow-premium-sm hover:shadow-premium hover:border-info/40"
                        : "bg-muted/10 border-transparent hover:border-border hover:bg-muted/20"
                    }`}
                >
                  {/* Status Indicator Bar */}
                  {meeting.isToday && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-info/80 to-info shadow-[0_0_15px_rgba(14,165,233,0.3)]" />
                  )}

                  {/* Time Block - Modern Integrated Style */}
                  <div className="flex flex-col items-start justify-center min-w-[100px] border-r border-border/30 pr-4 group-hover:border-info/20 transition-colors duration-500">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${meeting.isToday ? 'bg-info shadow-[0_0_8px_rgba(14,165,233,0.5)] animate-pulse' : 'bg-muted-foreground/30'}`} />
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
                        {meeting.isToday ? "Today" : "Scheduled"}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-black text-2xl text-foreground tracking-tighter group-hover:text-info transition-colors duration-500">
                        {meeting.time.split(" - ")[0].split(" ")[0]}
                      </span>
                      <span className="text-[10px] font-black text-muted-foreground/60 uppercase">
                        {meeting.time.split(" - ")[0].split(" ")[1]}
                      </span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h4 className="font-bold text-foreground text-base sm:text-lg tracking-tight truncate group-hover:text-info transition-colors duration-300">
                        {meeting.title}
                      </h4>
                      {meeting.isOnline && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          Live
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground/80">
                        <div className="p-1 bg-muted rounded-md group-hover:bg-info/10 transition-colors">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground group-hover:text-info" />
                        </div>
                        {meeting.time.split(" - ")[1]}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground/80">
                        <div className="p-1 bg-muted rounded-md group-hover:bg-warning/10 transition-colors">
                          {meeting.isOnline ? (
                            <Video className="w-3.5 h-3.5 text-info" />
                          ) : (
                            <MapPin className="w-3.5 h-3.5 text-warning" />
                          )}
                        </div>
                        {meeting.location}
                      </div>
                    </div>
                  </div>

                  {/* Attendees & Actions */}
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex -space-x-3 hover:space-x-1 transition-all duration-300">
                      <TooltipProvider>
                        {meeting.attendees.map((person, i) => (
                          <Tooltip key={i}>
                            <TooltipTrigger asChild>
                              <div className="w-9 h-9 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shadow-sm transition-all hover:scale-110 hover:z-20 relative ring-1 ring-border/30 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-info/5 to-transparent" />
                                {person.name[0]}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-foreground text-background border-none rounded-lg font-bold">
                              {person.name}
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </TooltipProvider>
                    </div>

                    <div className="flex items-center gap-2">
                      {meeting.isOnline && meeting.isToday ? (
                        <Button 
                          variant="default"
                          size="sm"
                          onClick={(e) => handleJoin(e, meeting.title)}
                          className="h-10 px-5 rounded-xl font-bold shadow-[0_8px_16px_-6px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_20px_-8px_rgba(16,185,129,0.4)]"
                        >
                          Join Now
                          <ExternalLink className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMeetingClick(meeting.title);
                          }}
                          className="rounded-xl w-10 h-10 hover:bg-muted"
                        >
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </CRMCard>
    </div>
  );
}













