"use client";

import React from "react";
import { History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { RecentActivityType } from "@/shared/types/report";
import { motion } from "framer-motion";
import { formatRelativeDate } from "@/lib/crm-formatters";
import { AppIcon } from "@/shared/components/icons/icon-registry";

interface RecentActivitiesProps {
  data: RecentActivityType[];
  loading?: boolean;
}

const RecentActivities = ({ data }: RecentActivitiesProps) => {
  const safeData = Array.isArray(data) ? data : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="h-full flex flex-col min-w-0"
    >
      <Card className="bg-card rounded-2xl border-border/80 shadow-xs overflow-hidden h-full flex flex-col flex-1">
        <CardHeader className="flex flex-row items-center justify-between p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-purple-500/10 text-purple-600 border border-purple-500/20 flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-110">
              <AppIcon name="history" icon={History} size={18} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="font-bold text-foreground text-base tracking-tight">Recent Activity</CardTitle>
              <CardDescription className="text-muted-foreground text-xs mt-0.5">Latest actions across the CRM</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-0 min-w-0 flex-1 overflow-y-auto">
          {safeData.length === 0 ? (
            <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center p-4">
              <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground mb-2">
                <History className="w-5 h-5 opacity-60" />
              </div>
              <p className="text-xs font-semibold text-foreground">No recent activity</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">CRM actions and timeline events will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {safeData.slice(0, 5).map((activity, index) => (
                <div key={activity.id || index} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-xs font-bold text-foreground truncate">
                      {activity.action || "Stage changed"}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground truncate uppercase">
                      {activity.description || (activity.leadName ? `${activity.leadName}` : "Updated record")}
                    </p>
                    <p className="text-[10px] text-muted-foreground/80">
                      {formatRelativeDate(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default React.memo(RecentActivities);

