import React, { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Calendar, Clock, MapPin, Video } from "lucide-react";
import { format } from "date-fns";
import { useLeadMeetings } from "@/shared/hooks/use-crm";
import { FormModal } from "@/shared/components/crm/FormModal";
import { EmptyState } from "@/shared/components/EmptyState";
import { MeetingForm } from "@/features/forms/MeetingForm";
import { MeetingsSkeleton } from "@/shared/components/skeletons";

export function MeetingsTab({ leadId }: { leadId: string }) {
  const { data: meetingsResp, isLoading } = useLeadMeetings(leadId);
  const meetings = meetingsResp?.data || [];
  const [isScheduling, setIsScheduling] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h3 className="text-sm font-bold text-foreground">Upcoming & Past Meetings</h3>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsScheduling(true)} size="sm" className="gap-2">
            <Calendar className="w-4 h-4" /> Schedule Meeting
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="pt-2">
          <MeetingsSkeleton items={3} />
        </div>
      ) : meetings.length === 0 ? (
        <EmptyState
          module="meetings"
          description="Schedule a meeting to connect with this lead."
          action={{
            label: "Schedule Meeting",
            onClick: () => setIsScheduling(true),
            icon: Calendar,
          }}
          size="sm"
        />
      ) : (
        <div className="space-y-4 relative">
          <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-border -z-10" />

          {meetings.map((meeting: ReturnType<typeof JSON.parse>) => {
            const isUpcoming = new Date(meeting.startTime) > new Date();
            return (
              <div key={meeting.id} className="flex gap-4 relative">
                <div className="flex flex-col items-center z-10 pt-1">
                  <div className={`w-12 h-12 rounded-full flex flex-col items-center justify-center shadow-sm border-2 border-background ${isUpcoming ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <span className="text-[10px] font-bold uppercase">{format(new Date(meeting.startTime), "MMM")}</span>
                    <span className="text-sm font-bold leading-none">{format(new Date(meeting.startTime), "dd")}</span>
                  </div>
                </div>
                
                <div className={`flex-1 bg-card border rounded-xl p-4 shadow-sm relative ${isUpcoming ? 'border-primary/20' : 'border-border/60'}`}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{meeting.title}</h4>
                      <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {format(new Date(meeting.startTime), "h:mm a")} - {format(new Date(meeting.endTime), "h:mm a")}
                        </span>
                        {meeting.isOnline ? (
                          <span className="flex items-center gap-1 text-blue-600">
                            <Video className="w-3.5 h-3.5" /> Online
                          </span>
                        ) : meeting.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {meeting.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {meeting.description && (
                    <div className="text-sm text-foreground/80 mt-2 bg-muted/30 p-3 rounded-lg">
                      {meeting.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FormModal
        title="Meeting"
        description="Schedule or log a meeting with this lead."
        isOpen={isScheduling}
        onOpenChange={setIsScheduling}
        size="md"
      >
        <MeetingForm 
          onSuccess={() => setIsScheduling(false)} 
          onCancel={() => setIsScheduling(false)}
          defaultLeadId={leadId}
        />
      </FormModal>
    </div>
  );
}
