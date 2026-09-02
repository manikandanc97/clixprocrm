"use client";

import React from "react";
import { Calendar, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { UpcomingFollowUpType } from "@/shared/types/report";
import { motion } from "framer-motion";
import { formatDate } from "@/lib/crm-formatters";
import { AppIcon } from "@/shared/components/icons/icon-registry";

interface UpcomingFollowUpsProps {
  data: UpcomingFollowUpType[];
  loading?: boolean;
}

const UpcomingFollowUps = ({ data }: UpcomingFollowUpsProps) => {
  const safeData = Array.isArray(data) ? data : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.35 }}
      className="h-full flex flex-col min-w-0"
    >
      <Card className="bg-card rounded-2xl border-border/80 shadow-xs overflow-hidden h-full flex flex-col flex-1">
        <CardHeader className="flex flex-row items-center justify-between p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-110">
              <AppIcon name="calendar" icon={Calendar} size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle className="font-bold text-foreground text-base tracking-tight">Upcoming Actions</CardTitle>
              <CardDescription className="text-muted-foreground text-xs mt-0.5">Scheduled tasks and meetings</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-0 min-w-0 flex-1 overflow-y-auto flex flex-col justify-center">
          {safeData.length === 0 ? (
            <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 shadow-xs">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-foreground">All caught up</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                You have no upcoming tasks or meetings scheduled.
              </p>
            </div>
          ) : (
            <div className="space-y-3 w-full">
              {safeData.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-muted/20 border border-border/40 hover:bg-muted/40 transition-colors">
                  <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    item.type === 'TASK' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300'
                  }`}>
                    {item.type === 'TASK' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(item.date)}</p>
                  </div>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                    {item.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default React.memo(UpcomingFollowUps);

