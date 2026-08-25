import React from "react";
import { useLeadTimeline } from "@/shared/hooks/use-crm";
import { formatDistanceToNow, format } from "date-fns";
import { Clock, CheckCircle2, User, Mail, Phone, Calendar, ArrowRight, FileText, Settings, Target } from "lucide-react";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { EmptyState } from "@/shared/components/EmptyState";
import { TimelineSkeleton } from "@/shared/components/skeletons";

const getIconForAction = (action: string) => {
  const a = action.toLowerCase();
  if (a.includes("note")) return <FileText className="w-4 h-4" />;
  if (a.includes("email")) return <Mail className="w-4 h-4" />;
  if (a.includes("call")) return <Phone className="w-4 h-4" />;
  if (a.includes("meeting") || a.includes("schedul")) return <Calendar className="w-4 h-4" />;
  if (a.includes("stage") || a.includes("mov")) return <ArrowRight className="w-4 h-4" />;
  if (a.includes("creat")) return <User className="w-4 h-4" />;
  if (a.includes("won") || a.includes("lost")) return <Target className="w-4 h-4" />;
  if (a.includes("updat")) return <Settings className="w-4 h-4" />;
  return <CheckCircle2 className="w-4 h-4" />;
};

export function TimelineTab({ leadId }: { leadId: string }) {
  const { data: timelineResp, isLoading } = useLeadTimeline(leadId);
  const events = timelineResp?.data || [];

  if (isLoading) {
    return (
      <div className="pt-2">
        <TimelineSkeleton items={3} />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No activity recorded"
        description="No activities have been recorded for this lead yet."
        size="sm"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative pl-6">
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border -z-10" />

        <div className="space-y-6">
          {events.map((event: ReturnType<typeof JSON.parse>) => (
            <div key={event.id} className="relative">
              <div className="absolute -left-6 mt-0.5 w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center text-primary shadow-sm z-10">
                {getIconForAction(event.action)}
              </div>
              
              <div className="bg-card border rounded-xl p-3 shadow-sm ml-4">
                <div className="flex items-center justify-between gap-4 mb-1">
                  <h4 className="text-sm font-bold text-foreground">{event.action}</h4>
                  <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                  </span>
                </div>
                
                {event.description && (
                  <p className="text-xs text-foreground/80 mb-2">{event.description}</p>
                )}
                
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                  <Avatar className="w-5 h-5">
                    <AvatarFallback className="bg-muted text-[8px] font-bold">
                      {event.user?.name ? event.user.name.substring(0, 2).toUpperCase() : "SY"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {event.user?.name || "System"} • {format(new Date(event.createdAt), "MMM d, h:mm a")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
