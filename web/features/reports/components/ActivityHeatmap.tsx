"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { EmptyStateCard } from "@/shared/components/crm/PageFeedbackStates";
import { ActivityHeatmapPointType } from "@/shared/types/report";

const ActivityHeatmap = ({ data }: { data: ActivityHeatmapPointType[] }) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hours = ["9am", "11am", "1pm", "3pm", "5pm", "7pm"];
  const valueFor = (day: string, hourIndex: number) => data.find((item) => item.day === day && item.hour === String(9 + hourIndex))?.value ?? 0;

  const getColor = (value: number) => {
    if (value === 0) return "bg-muted";
    if (value < 3) return "bg-blue-100";
    if (value < 6) return "bg-blue-300";
    if (value < 8) return "bg-blue-500";
    return "bg-blue-700";
  };

  return (
    <Card className="bg-card rounded-xl border-border shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
      <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
        <CardTitle className="font-bold text-foreground tracking-tight">Sales Activity</CardTitle>
        <Info className="w-4 h-4 text-slate-300" />
      </CardHeader>
      <CardContent className="p-8 pt-4">
        {data.length === 0 ? (
          <EmptyStateCard icon={Info} title="No activity data" message="Sales activity will appear after leads, tasks, or quotations are recorded." />
        ) : (
        <>
        <div className="flex flex-col gap-2">
          {days.map((day, dayIdx) => (
            <div key={day} className="flex items-center gap-3">
              <span className="text-[10px] font-black text-muted-foreground uppercase w-8 tracking-wider">{day}</span>
              <div className="flex-1 flex gap-1.5">
                {Array.from({ length: 12 }).map((_, hourIdx) => {
                  const val = valueFor(day, hourIdx);
                  return (
                    <motion.div
                      key={hourIdx}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: (dayIdx * 12 + hourIdx) * 0.005 }}
                      className={`h-6 flex-1 rounded-sm ${getColor(val)} transition-all hover:scale-125 cursor-pointer shadow-sm`}
                      title={`${val} activities at ${day} ${9 + hourIdx}:00`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-muted" />
                <div className="w-3 h-3 rounded-sm bg-blue-100" />
                <div className="w-3 h-3 rounded-sm bg-blue-300" />
                <div className="w-3 h-3 rounded-sm bg-blue-500" />
                <div className="w-3 h-3 rounded-sm bg-blue-700" />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">More</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {hours.map(hour => (
              <span key={hour} className="text-[9px] font-bold text-slate-300 uppercase">{hour}</span>
            ))}
          </div>
        </div>

        </>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityHeatmap;












