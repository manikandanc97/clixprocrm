"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface TimelineItem {
  id: string | number;
  title: string;
  description: string;
  time: string;
  icon?: LucideIcon | React.ElementType;
  iconBg?: string;
  iconColor?: string;
}

interface ActivityTimelineProps {
  items: TimelineItem[];
  className?: string;
}

export const ActivityTimeline = ({ items, className }: ActivityTimelineProps) => {
  return (
    <div className={cn("relative space-y-8", className)}>
      {/* Vertical Line */}
      <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border/50" />

      {items.map((item, index) => {
        const Icon = item.icon || (() => <div className="w-2 h-2 rounded-full bg-current" />);
        return (
          <div
            key={item.id}
            style={{ animationDelay: `${index * 100}ms` }}
            className="relative flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300 fill-mode-both"
          >
            {/* Icon Container */}
            <div 
              className={cn(
                "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-background shadow-sm",
                item.iconBg,
                item.iconColor
              )}
            >
              <Icon className="size-4" />
            </div>

            {/* Content */}
            <div className="flex flex-col gap-1 pt-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold tracking-tight text-foreground">
                  {item.title}
                </h4>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
                  • {item.time}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};











