"use client";

import React from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
} from "recharts";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { RevenueChartPointType } from "@/shared/types/report";
import { motion } from "framer-motion";
import { ChartContainer } from "@/shared/components/charts/ChartContainer";
import { useCurrency } from "@/shared/hooks/use-currency";

import { AppIcon } from "@/shared/components/icons/icon-registry";

interface RevenueChartProps {
  data: RevenueChartPointType[];
  loading?: boolean;
}

const RevenueChart = ({ data, loading }: RevenueChartProps) => {
  const { formatCurrency, currencySymbol } = useCurrency();

  const hasData = Boolean(data && data.some((d) => (d.total || 0) > 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-w-0 h-full flex flex-col"
    >
      <Card className="bg-card rounded-2xl border-border/80 shadow-xs overflow-hidden group min-w-0 h-full flex-1 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between p-5 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-110">
              <AppIcon name="trendingUp" icon={TrendingUp} size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle className="font-bold text-foreground text-base tracking-tight">Revenue Trend</CardTitle>
              <CardDescription className="text-muted-foreground text-xs mt-0.5">Monthly revenue from live CRM data</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-2 min-w-0 flex-1 flex flex-col justify-between">
          <div className="flex-1 min-h-[260px] w-full">
            <ChartContainer 
              height="100%" 
              loading={loading}
              hasData={hasData}
              emptyMessage="No revenue recorded for this period"
              className="flex-1 min-h-[260px]"
            >
              <AreaChart data={data} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRevenueTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-muted/30" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} 
                  tickFormatter={(value) => `${currencySymbol}${value >= 1000 ? `${value / 1000}k` : value}`}
                />
                <Tooltip 
                  cursor={{ 
                    stroke: '#10b981', 
                    strokeWidth: 1.5, 
                    strokeDasharray: '4 4' 
                  }} 
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                    padding: "10px 14px",
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    backdropFilter: "blur(8px)",
                    color: "white",
                  }}
                  itemStyle={{
                    color: "#34d399",
                    fontWeight: 700,
                    fontSize: "14px",
                  }}
                  labelStyle={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontWeight: 600,
                    fontSize: "11px",
                    marginBottom: "4px",
                  }}
                  formatter={(value) => [formatCurrency(value as number), "Revenue"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorRevenueTrend)" 
                  animationDuration={1200}
                  activeDot={{ 
                    r: 5, 
                    fill: "#10b981", 
                    stroke: "white", 
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ChartContainer>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground font-medium">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span>Revenue ({currencySymbol})</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default React.memo(RevenueChart);

