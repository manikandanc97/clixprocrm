"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { motion } from "framer-motion";
import { Target, Settings, ArrowUpRight } from "lucide-react";
import { RevenueTargetType } from "@/shared/types/report";
import { useCurrency } from "@/shared/hooks/use-currency";
import { Button } from "@/shared/ui/button";
import { AppIcon } from "@/shared/components/icons/icon-registry";

interface RevenueTargetProps {
  data: RevenueTargetType | null;
  onOpenSettings?: () => void;
}

const RevenueTarget = ({ data, onOpenSettings }: RevenueTargetProps) => {
  const { currencySymbol, CurrencyIcon } = useCurrency();
  
  const currentRevenue = data?.revenue ?? 0;
  const targetRevenue = data?.target ?? 0;
  const percentage = targetRevenue > 0 ? Math.round((currentRevenue / targetRevenue) * 100) : (currentRevenue > 0 ? 100 : 0);
  const remaining = targetRevenue > 0 ? Math.max(0, targetRevenue - currentRevenue) : 0;
  const isPositive = data ? data.positive : false;
  const changeText = targetRevenue > 0 ? (data?.change ?? `${percentage}%`) : "0%";

  const CurrencyBgIcon = CurrencyIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="min-w-0 h-full flex flex-col"
    >
      <Card className="relative bg-primary text-primary-foreground rounded-2xl border border-primary/20 shadow-md overflow-hidden group min-w-0 h-full flex-1 flex flex-col justify-between select-none">
        {/* Large Decorative Translucent Currency Icon in Background */}
        <CurrencyBgIcon className="absolute -right-8 -bottom-8 w-60 h-60 text-primary-foreground/[0.08] -rotate-12 pointer-events-none select-none" />
        
        {/* Subtle Ambient Radial Highlight */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/15 pointer-events-none" />

        <CardHeader className="relative z-10 flex flex-row items-center justify-between p-5 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-foreground/20 text-primary-foreground rounded-2xl flex items-center justify-center shadow-inner border border-primary-foreground/20 backdrop-blur-md shrink-0 transition-transform duration-300 group-hover:scale-110">
              <AppIcon name="target" icon={Target} size={18} className="text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="font-bold text-primary-foreground text-base tracking-tight">Goal Progress</CardTitle>
              <CardDescription className="text-primary-foreground/80 text-xs mt-0.5">Revenue target progress</CardDescription>
            </div>
          </div>
          {onOpenSettings && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onOpenSettings}
              className="w-8 h-8 rounded-lg text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/20 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
            </Button>
          )}
        </CardHeader>
        
        <CardContent className="relative z-10 p-5 pt-2 flex flex-col justify-between space-y-5 min-w-0 flex-1">
          <div className="space-y-4 min-w-0">
            {/* Revenue Numbers */}
            <div className="flex items-end justify-between min-w-0 pt-1">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-primary-foreground/80 uppercase tracking-wider mb-1">Current Revenue</p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-primary-foreground tracking-tight">
                  {currencySymbol}{currentRevenue >= 1000 ? `${(currentRevenue / 1000).toFixed(0)}k` : currentRevenue}
                </h3>
              </div>
              <div className="text-right min-w-0">
                <p className="text-[11px] font-bold text-primary-foreground/80 uppercase tracking-wider mb-1">Target</p>
                <h4 className="text-lg sm:text-xl font-bold text-primary-foreground/90 tracking-tight">
                  {currencySymbol}{targetRevenue >= 1000 ? `${(targetRevenue / 1000).toFixed(0)}k` : targetRevenue}
                </h4>
              </div>
            </div>

            {/* Progress Bar & Status */}
            <div className="space-y-2 min-w-0">
              <div className="relative h-2.5 w-full bg-black/25 rounded-full overflow-hidden shadow-inner border border-primary-foreground/15">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(percentage, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-primary-foreground rounded-full shadow-[0_0_12px_rgba(255,255,255,0.7)]"
                />
              </div>

              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-primary-foreground">{percentage}% Achieved</span>
                <span className={`flex items-center gap-0.5 ${isPositive ? "text-primary-foreground/90" : "text-rose-200"}`}>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {isPositive ? "On track" : "Needs attention"}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom stats cards */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-black/20 backdrop-blur-md rounded-xl border border-primary-foreground/10 space-y-0.5">
              <p className="text-[10px] font-bold text-primary-foreground/75 uppercase tracking-wider">Remaining</p>
              <p className="text-base sm:text-lg font-extrabold text-primary-foreground">
                {currencySymbol}{remaining >= 1000 ? `${(remaining / 1000).toFixed(0)}k` : remaining}
              </p>
            </div>
            <div className="p-3 bg-primary-foreground/15 backdrop-blur-md rounded-xl border border-primary-foreground/20 space-y-0.5">
              <p className="text-[10px] font-bold text-primary-foreground/85 uppercase tracking-wider">Change</p>
              <p className="text-base sm:text-lg font-extrabold text-primary-foreground">{changeText}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RevenueTarget;



