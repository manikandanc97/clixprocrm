"use client";

import React from "react";
import { User, CheckCircle2, FileText, ArrowRight, LucideIcon } from "lucide-react";
import { ActivityType } from "@/shared/types/dashboard";

interface ActivityItemProps {
  activity: ActivityType;
  index: number;
  onClick: (title: string) => void;
}

const COLOR_VARIANTS = [
  {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600",
    border: "border-emerald-500/20",
    glow: "shadow-emerald-500/20",
    badge: "bg-emerald-500/5 text-emerald-600 border-emerald-500/10"
  },
  {
    bg: "bg-blue-500/10",
    text: "text-blue-600",
    border: "border-blue-500/20",
    glow: "shadow-blue-500/20",
    badge: "bg-blue-500/5 text-blue-600 border-blue-500/10"
  },
  {
    bg: "bg-orange-500/10",
    text: "text-orange-600",
    border: "border-orange-500/20",
    glow: "shadow-orange-500/20",
    badge: "bg-orange-500/5 text-orange-600 border-orange-500/10"
  },
  {
    bg: "bg-purple-500/10",
    text: "text-purple-600",
    border: "border-purple-500/20",
    glow: "shadow-purple-500/20",
    badge: "bg-purple-500/5 text-purple-600 border-purple-500/10"
  },
  {
    bg: "bg-pink-500/10",
    text: "text-pink-600",
    border: "border-pink-500/20",
    glow: "shadow-pink-500/20",
    badge: "bg-pink-500/5 text-pink-600 border-pink-500/10"
  },
  {
    bg: "bg-teal-500/10",
    text: "text-teal-600",
    border: "border-teal-500/20",
    glow: "shadow-teal-500/20",
    badge: "bg-teal-500/5 text-teal-600 border-teal-500/10"
  }
];

export const ActivityItem = ({ activity, index, onClick }: ActivityItemProps) => {
  const isLeadActivity = activity.title.toLowerCase().includes("lead");
  const isQuotationActivity = activity.title.toLowerCase().includes("quotation");
  const isTaskActivity = activity.title.toLowerCase().includes("task");
  
  const Icon: LucideIcon = isQuotationActivity ? FileText : isTaskActivity ? CheckCircle2 : User;
  const categoryLabel = isQuotationActivity ? "Quotation" : isTaskActivity ? "Task" : isLeadActivity ? "Lead" : "Activity";
  
  // Use index to rotate through color variants for a balanced look
  const variant = COLOR_VARIANTS[index % COLOR_VARIANTS.length];

  return (
    <div 
      onClick={() => onClick(activity.title)}
      className="flex items-start gap-5 group cursor-pointer relative z-10 py-2 px-3 -mx-3 rounded-xl transition-all duration-300 hover:bg-primary/[0.02] animate-in fade-in slide-in-from-left-2 duration-200"
    >
      <div className={`h-11 w-11 rounded-xl ${variant.bg} ${variant.text} ${variant.border} border flex items-center justify-center shadow-sm group-hover:shadow-lg ${variant.glow} transition-all duration-500 shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex justify-between items-start gap-2">
          <p className="font-semibold text-foreground text-sm leading-snug group-hover:text-primary transition-colors">
            {activity.title}
          </p>
          <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap pt-0.5 opacity-80 group-hover:opacity-100">
            {activity.time}
          </span>
        </div>
        
        <div className="mt-2 flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border transition-all duration-300 ${variant.badge} group-hover:shadow-sm`}>
            {categoryLabel}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">View Detail</span>
            <ArrowRight className="w-3 h-3 text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
};
