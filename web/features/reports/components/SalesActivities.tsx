"use client";

import React from "react";
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { SalesActivityType } from "@/shared/types/report";
import { motion } from "framer-motion";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";

interface SalesActivitiesProps {
  data: SalesActivityType[];
  loading?: boolean;
}

const SalesActivities = ({ data }: SalesActivitiesProps) => {
  const completedTasks = data?.find((d) => d.name.toLowerCase().includes("completed"))?.value || 0;
  const pendingTasks = data?.find((d) => d.name.toLowerCase().includes("pending"))?.value || 0;
  const meetings = data?.find((d) => d.name.toLowerCase().includes("meeting"))?.value || 0;

  const totalActions = completedTasks + pendingTasks + meetings;
  const maxVal = Math.max(completedTasks, pendingTasks, meetings, 1);

  const activities = [
    {
      name: "Completed Tasks",
      value: completedTasks,
      trackBg: "bg-cyan-500/15 dark:bg-cyan-500/20",
      barBg: "bg-cyan-400",
      pct: (completedTasks / maxVal) * 100,
      description: `${completedTasks} ${completedTasks === 1 ? 'task' : 'tasks'} successfully executed`,
    },
    {
      name: "Pending Tasks",
      value: pendingTasks,
      trackBg: "bg-indigo-500/15 dark:bg-indigo-500/20",
      barBg: "bg-indigo-500",
      pct: (pendingTasks / maxVal) * 100,
      description: `${pendingTasks} ${pendingTasks === 1 ? 'task' : 'tasks'} awaiting completion`,
    },
    {
      name: "Meetings",
      value: meetings,
      trackBg: "bg-muted",
      barBg: "bg-muted-foreground/40",
      pct: (meetings / maxVal) * 100,
      description: `${meetings} ${meetings === 1 ? 'meeting' : 'meetings'} booked with clients`,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="min-w-0 h-full flex flex-col"
    >
      <Card className="bg-card rounded-2xl border-border/80 shadow-xs overflow-hidden group min-w-0 h-full flex flex-col flex-1 justify-between">
        <CardHeader className="flex flex-row items-center justify-between p-5 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/10 text-cyan-600 border border-cyan-500/20 flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-110">
              <AppIcon name="activity" icon={Activity} size={18} className="text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <CardTitle className="font-bold text-foreground text-base tracking-tight">Sales Activities</CardTitle>
              <CardDescription className="text-muted-foreground text-xs mt-0.5">Meetings and tasks execution</CardDescription>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[11px] text-muted-foreground font-medium">Total Activities</p>
            <p className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">{totalActions}</p>
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-3 flex flex-col justify-center space-y-4 min-w-0 flex-1">
          <TooltipProvider delayDuration={150}>
            {activities.map((act) => (
              <Tooltip key={act.name}>
                <TooltipTrigger asChild>
                  <div className="group/row flex items-center justify-between gap-4 p-1.5 -mx-1.5 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer select-none">
                    <span className="text-xs font-medium text-foreground w-28 sm:w-32 shrink-0 truncate group-hover/row:text-primary transition-colors">
                      {act.name}
                    </span>
                    <div className={`relative flex-1 h-2 rounded-full overflow-hidden ${act.trackBg}`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(Math.max(act.pct, act.value > 0 ? 8 : 0), 100)}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full ${act.barBg} shadow-xs`}
                      />
                    </div>
                    <span className="text-xs font-bold text-foreground w-6 text-right shrink-0">
                      {act.value}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="rounded-xl px-3 py-1.5 text-xs shadow-2xl">
                  <span className="font-bold text-cyan-300">{act.name}:</span> {act.description}
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default React.memo(SalesActivities);


