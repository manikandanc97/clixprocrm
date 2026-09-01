"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { motion } from "framer-motion";
import { Target, Calendar, ArrowUpRight, Settings, IndianRupee } from "lucide-react";
import { EmptyStateCard } from "@/shared/components/page-states";
import { RevenueTargetType } from "@/shared/types/report";
import { useCurrency } from "@/shared/hooks/use-currency";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";

const RevenueTarget = ({ data }: { data: RevenueTargetType | null }) => {
  const router = useRouter();
  const { currencySymbol, CurrencyIcon } = useCurrency();
  
  if (!data) {
    return (
      <EmptyStateCard 
        icon={Target} 
        title="No revenue target" 
        message="Revenue target data will appear when it is available from the backend." 
        action={{ label: "Set Target", onClick: () => router.push("/settings?section=targets"), icon: Settings }}
      />
    );
  }

  const currentRevenue = data.revenue;
  const targetRevenue = data.target;
  const percentage = targetRevenue > 0 ? Math.round((currentRevenue / targetRevenue) * 100) : (currentRevenue > 0 ? 100 : 0);
  const remaining = targetRevenue > 0 ? targetRevenue - currentRevenue : 0;
  
  const CurrencyBgIcon = CurrencyIcon;

  return (
    <Card className="relative bg-primary text-primary-foreground rounded-xl border-transparent shadow-lg overflow-hidden flex flex-col transition-all duration-300 min-w-0">
      {/* Decorative Background SVG */}
      <CurrencyBgIcon className="absolute -right-8 -bottom-8 w-64 h-64 text-white/10 -rotate-12 pointer-events-none" />
      
      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

      <CardHeader className="relative z-10 p-6 pb-2 flex flex-row items-center justify-between min-w-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center shadow-inner shrink-0 backdrop-blur-md">
            <Target className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <CardTitle className="font-bold text-white text-lg tracking-tight truncate">Goal Progress</CardTitle>
            <div className="flex items-center gap-2 text-primary-foreground/70 text-[10px] font-medium truncate">
              <Calendar className="w-3 h-3" />
              Database target
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push("/settings?section=targets")}
            className="w-8 h-8 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10 p-6 pt-4 flex flex-col space-y-6 min-w-0">
        <div className="space-y-6 min-w-0">
          <div className="flex items-end justify-between min-w-0">
            <div className="min-w-0">
              <p className="text-[10px] font-black text-primary-foreground/70 uppercase tracking-wider mb-1 truncate">Current Revenue</p>
              <h3 className="text-3xl font-bold text-white tracking-tight truncate">{currencySymbol}{(currentRevenue/1000).toFixed(0)}k</h3>
            </div>
            <div className="text-right min-w-0">
              <p className="text-[10px] font-black text-primary-foreground/70 uppercase tracking-wider mb-1 truncate">Target</p>
              <h4 className="text-lg font-bold text-primary-foreground/90 tracking-tight truncate">{currencySymbol}{(targetRevenue/1000).toFixed(0)}k</h4>
            </div>
          </div>

          <div className="space-y-3 min-w-0">
            <div className="flex justify-between items-center mb-1 min-w-0">
              <span className="text-xs font-bold text-white truncate">{percentage}% Achieved</span>
              <div className={`flex items-center gap-1 font-bold text-[10px] uppercase shrink-0 ${data.positive ? "text-emerald-300" : "text-rose-300"}`}>
                <ArrowUpRight className="w-3 h-3" />
                {data.positive ? "On Track" : "Needs Attention"}
              </div>
            </div>
            <div className="relative h-3 w-full bg-black/20 rounded-full overflow-hidden shadow-inner min-w-0">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(percentage, 100)}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] relative"
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,.1)_25%,transparent_25%,transparent_50%,rgba(0,0,0,.1)_50%,rgba(0,0,0,.1)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress-bar-stripes_1s_linear_infinite]" />
              </motion.div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 min-w-0">
          <div className="p-4 bg-black/10 backdrop-blur-sm rounded-xl space-y-0.5 min-w-0 border border-white/5">
            <p className="text-[9px] font-bold text-primary-foreground/70 uppercase tracking-wider truncate">Remaining</p>
            <p className="text-base font-bold text-white truncate">{currencySymbol}{(remaining/1000).toFixed(0)}k</p>
          </div>
          <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl space-y-0.5 min-w-0 border border-white/10">
            <p className="text-[9px] font-bold text-primary-foreground/90 uppercase tracking-wider truncate">Change</p>
            <p className="text-base font-bold text-white truncate">{data.change}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueTarget;
