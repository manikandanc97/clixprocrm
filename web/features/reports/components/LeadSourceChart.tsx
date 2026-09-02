"use client";

import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { LeadSourceType } from "@/shared/types/report";
import { motion } from "framer-motion";
import { ChartContainer } from "@/shared/components/charts/ChartContainer";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'];

interface LeadSourceChartProps {
  data: LeadSourceType[];
  loading?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomLeadSourceTooltip = ({ active, payload, total }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const color = payload[0].fill || item.color || COLORS[0];
    const percentage = total > 0 ? Math.round(((item.value || 0) / total) * 100) : 100;

    return (
      <div className="rounded-xl border border-white/10 bg-slate-950/95 text-white p-2.5 px-3.5 shadow-2xl backdrop-blur-md min-w-[130px] select-none z-50">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: color }} />
          <span className="text-xs font-bold text-white capitalize">{item.name || "Direct"}</span>
        </div>
        <div className="flex items-baseline justify-between gap-3 text-xs">
          <span className="text-slate-400 font-medium">{item.value || 0} {item.value === 1 ? 'Lead' : 'Leads'}</span>
          <span className="text-emerald-400 font-extrabold">{percentage}%</span>
        </div>
      </div>
    );
  }
  return null;
};

const LeadSourceChart = ({ data, loading }: LeadSourceChartProps) => {
  const chartData = useMemo(() => {
    if (Array.isArray(data)) {
      return data.filter((d) => (d.value || 0) > 0);
    }
    return [];
  }, [data]);

  const total = useMemo(() => chartData.reduce((acc, curr) => acc + (curr.value || 0), 0), [chartData]);
  const hasData = chartData.length > 0 && total > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="min-w-0 h-full flex flex-col"
    >
      <Card className="bg-card rounded-2xl border-border/80 shadow-xs overflow-hidden group min-w-0 h-full flex flex-col flex-1">
        <CardHeader className="flex flex-row items-center justify-between p-5 pb-2 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-110">
              <AppIcon name="leadSources" icon={PieChartIcon} size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="font-bold text-foreground text-base tracking-tight">Lead Sources</CardTitle>
              <CardDescription className="text-muted-foreground text-xs mt-0.5">Distribution by origin</CardDescription>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[11px] text-muted-foreground font-medium">Total Leads</p>
            <p className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">{total}</p>
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-0 min-w-0 flex-1 flex items-center">
          <ChartContainer 
            height="100%" 
            loading={loading}
            hasData={hasData}
            className="flex-1 min-h-[190px] w-full"
          >
            {!hasData ? (
              <div className="h-full min-h-[160px] w-full flex flex-col items-center justify-center text-center p-4">
                <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground mb-2">
                  <PieChartIcon className="w-5 h-5 opacity-60" />
                </div>
                <p className="text-xs font-semibold text-foreground">No lead sources</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Leads with sources will appear here</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between w-full h-full gap-4">
                {/* Donut Chart with Tooltip */}
                <div className="w-full sm:w-1/2 h-[180px] relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={76}
                        paddingAngle={chartData.length > 1 ? 6 : 0}
                        cornerRadius={chartData.length > 1 ? 8 : 0}
                        dataKey="value"
                        stroke="none"
                        animationDuration={1200}
                      >
                        {chartData.map((_, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                            className="transition-all duration-300 hover:opacity-85 cursor-pointer drop-shadow-xs"
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomLeadSourceTooltip total={total} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend List with Interactive Tooltip */}
                <TooltipProvider delayDuration={150}>
                  <div className="w-full sm:w-1/2 flex flex-col justify-center space-y-2.5 min-w-0 pr-2">
                    {chartData.map((entry, index) => {
                      const percentage = total > 0 ? Math.round(((entry.value || 0) / total) * 100) : 100;
                      const color = COLORS[index % COLORS.length];

                      return (
                        <Tooltip key={entry.name || index}>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-between text-xs gap-2 p-1.5 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer select-none">
                              <div className="flex items-center gap-2 min-w-0">
                                <span 
                                  className="w-2.5 h-2.5 rounded-xs shrink-0" 
                                  style={{ backgroundColor: color }} 
                                />
                                <span className="text-foreground font-medium truncate capitalize">
                                  {entry.name || "Unknown"}
                                </span>
                              </div>
                              <span className="text-muted-foreground font-medium shrink-0">
                                {entry.value} ({percentage}%)
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-slate-950 text-white border-white/10 rounded-xl px-3 py-1.5 text-xs shadow-2xl">
                            <span className="font-bold">{entry.name || "Unknown"}:</span> {entry.value} leads ({percentage}% of total)
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </TooltipProvider>
              </div>
            )}
          </ChartContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default React.memo(LeadSourceChart);



