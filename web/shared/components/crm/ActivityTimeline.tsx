"use client";

import * as React from "react";
import {
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  UserPlus,
  Sparkles,
  HelpCircle,
  ShieldAlert,
  MessageSquare,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { EmptyState } from "@/shared/components/EmptyState";
import { Skeleton } from "@/shared/ui/skeleton";

export type ActivityType =
  | "CALL"
  | "EMAIL"
  | "MEETING"
  | "NOTE"
  | "TASK"
  | "STATUS_CHANGE"
  | "ASSIGNMENT"
  | "BLOCKER_REPORTED"
  | "BLOCKER_RESOLVED"
  | "PROGRESS_UPDATED"
  | "TASK_COMPLETED"
  | "SYSTEM_EVENT"
  | "CUSTOM";

export interface TimelineItem {
  id: string | number;
  title: string;
  description: string | React.ReactNode;
  time: string;
  type?: ActivityType;
  actor?: string;
  icon?: LucideIcon | React.ElementType | React.ComponentType<{ className?: string }>;
  iconBg?: string;
  iconColor?: string;
  meta?: Record<string, unknown>;
}

export interface ActivityTimelineProps {
  items: TimelineItem[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  showFilters?: boolean;
  className?: string;
}

const TYPE_CONFIG: Record<
  string,
  {
    icon: LucideIcon;
    iconBg: string;
    iconColor: string;
    category: "all" | "communication" | "tasks" | "system";
  }
> = {
  CALL: {
    icon: Phone,
    iconBg: "bg-info/10 border-info/20",
    iconColor: "text-info",
    category: "communication",
  },
  EMAIL: {
    icon: Mail,
    iconBg: "bg-primary/10 border-primary/20",
    iconColor: "text-primary",
    category: "communication",
  },
  MEETING: {
    icon: Calendar,
    iconBg: "bg-warning/10 border-warning/20",
    iconColor: "text-warning",
    category: "communication",
  },
  NOTE: {
    icon: FileText,
    iconBg: "bg-muted border-border",
    iconColor: "text-muted-foreground",
    category: "all",
  },
  TASK: {
    icon: Clock,
    iconBg: "bg-info/10 border-info/20",
    iconColor: "text-info",
    category: "tasks",
  },
  STATUS_CHANGE: {
    icon: Activity,
    iconBg: "bg-warning/10 border-warning/20",
    iconColor: "text-warning",
    category: "system",
  },
  ASSIGNMENT: {
    icon: UserPlus,
    iconBg: "bg-info/10 border-info/20",
    iconColor: "text-info",
    category: "system",
  },
  BLOCKER_REPORTED: {
    icon: ShieldAlert,
    iconBg: "bg-destructive/10 border-destructive/20",
    iconColor: "text-destructive",
    category: "tasks",
  },
  BLOCKER_RESOLVED: {
    icon: CheckCircle2,
    iconBg: "bg-success/10 border-success/20",
    iconColor: "text-success",
    category: "tasks",
  },
  PROGRESS_UPDATED: {
    icon: CheckCircle2,
    iconBg: "bg-info/10 border-info/20",
    iconColor: "text-info",
    category: "tasks",
  },
  TASK_COMPLETED: {
    icon: Sparkles,
    iconBg: "bg-success/10 border-success/20",
    iconColor: "text-success",
    category: "tasks",
  },
  SYSTEM_EVENT: {
    icon: Activity,
    iconBg: "bg-muted border-border",
    iconColor: "text-muted-foreground",
    category: "system",
  },
  QUESTION: {
    icon: HelpCircle,
    iconBg: "bg-warning/10 border-warning/20",
    iconColor: "text-warning",
    category: "communication",
  },
};

export function ActivityTimelineSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="relative space-y-6">
      <div className="absolute left-[17px] top-2 bottom-2 w-px bg-border/40" />
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="relative flex gap-3.5 items-start">
          <Skeleton className="size-9 rounded-full shrink-0" />
          <div className="space-y-2 flex-1 pt-1">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivityTimeline({
  items,
  isLoading = false,
  emptyTitle = "No activities recorded",
  emptyDescription = "Recent activities and updates will appear here.",
  showFilters = false,
  className,
}: ActivityTimelineProps) {
  const [activeFilter, setActiveFilter] = React.useState<"all" | "communication" | "tasks" | "system">("all");

  const filteredItems = React.useMemo(() => {
    if (activeFilter === "all") return items;
    return items.filter((item) => {
      const typeKey = (item.type || "").toUpperCase();
      const config = TYPE_CONFIG[typeKey];
      return config ? config.category === activeFilter : false;
    });
  }, [items, activeFilter]);

  if (isLoading) {
    return <ActivityTimelineSkeleton />;
  }

  if (!items || items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        className="p-6 border-none bg-transparent shadow-none min-h-[160px]"
      />
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {showFilters && (
        <div className="flex items-center gap-1 border-b border-border/60 pb-2 text-xs">
          {(
            [
              { key: "all", label: "All Activity" },
              { key: "communication", label: "Communications" },
              { key: "tasks", label: "Tasks" },
              { key: "system", label: "System" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-colors text-xs",
                activeFilter === tab.key
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="relative space-y-6 pt-1">
        {/* Continuous Vertical Timeline Line */}
        <div className="absolute left-[17px] top-3 bottom-3 w-px bg-border/60" />

        {filteredItems.map((item, index) => {
          const typeKey = (item.type || "").toUpperCase();
          const config = TYPE_CONFIG[typeKey] || {
            icon: item.icon || MessageSquare,
            iconBg: item.iconBg || "bg-muted border-border",
            iconColor: item.iconColor || "text-foreground",
          };

          const Icon = item.icon || config.icon;
          const bgClass = item.iconBg || config.iconBg;
          const colorClass = item.iconColor || config.iconColor;

          return (
            <div
              key={item.id || index}
              style={{ animationDelay: `${index * 50}ms` }}
              className="relative flex gap-3.5 items-start animate-in fade-in slide-in-from-left-1 duration-200"
            >
              {/* Timeline Node Icon */}
              <div
                className={cn(
                  "relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border shadow-xs transition-transform duration-150",
                  bgClass,
                  colorClass
                )}
              >
                <Icon className="size-4" />
              </div>

              {/* Event Content */}
              <div className="flex flex-col gap-1 pt-0.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <h4 className="text-xs font-bold tracking-tight text-foreground truncate">
                      {item.title}
                    </h4>
                    {item.actor && (
                      <span className="text-[11px] text-muted-foreground font-medium truncate">
                        by {item.actor}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground shrink-0">
                    {item.time}
                  </span>
                </div>

                {item.description && (
                  <div className="text-xs leading-relaxed text-muted-foreground break-words">
                    {item.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
