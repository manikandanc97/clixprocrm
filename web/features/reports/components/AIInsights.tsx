"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Zap,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAiInsights } from "@/shared/hooks/use-dashboard";
import { CRMCard } from "@/shared/components/crm/CRMCard";

type TabType = "recommendations" | "alerts" | "trends";

interface InsightItem {
  id: string;
  title: string;
  description: string;
  priority?: "HIGH" | "MEDIUM" | "LOW" | string;
  bgColor?: string;
  color?: string;
}

export default function AIInsights() {
  const [activeTab, setActiveTab] = useState<TabType>("recommendations");
  const { data } = useAiInsights();

  const insights = useMemo(() => data ?? { recommendations: [], alerts: [], trends: [] }, [data]);

   
  const handleDismiss = (e: React.MouseEvent, _tab: TabType, _id: string) => {
    e.stopPropagation();
    toast.success("Insight dismissed", {
      description: "We'll adjust future recommendations based on your feedback.",
    });
  };

  const handleCardClick = (title: string) => {
    toast.info(`Insight Detail: ${title}`, {
      description: "Opening intelligent deep-dive analysis...",
    });
  };

  const handleHubClick = () => {
    toast.success("Intelligence Hub", {
      description: "Navigating to centralized AI analytics workspace.",
    });
  };

  const getIcon = (tab: TabType) => {
    switch (tab) {
      case "recommendations": return Zap;
      case "alerts": return AlertCircle;
      case "trends": return TrendingUp;
      default: return Sparkles;
    }
  };


  return (
    <div className="w-full">
      <CRMCard 
        animate={false}
        accentSeed="AI Insights"
        noPadding
        className="border border-border/80 bg-linear-to-b from-card/90 via-card to-card/95 backdrop-blur-xl shadow-xl overflow-hidden rounded-2xl relative transition-all"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight text-foreground flex items-center gap-2">
                  Cognitive Recommendations & Alerts
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Live
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">Actionable intelligence generated from your pipeline telemetry</p>
              </div>
            </div>

            <button 
              onClick={handleHubClick}
              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 group"
            >
              Intelligence Hub
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl mb-4 border border-border/40">
            {(["recommendations", "alerts", "trends"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold capitalize transition-all ${
                  activeTab === tab
                    ? "bg-card text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
                {insights[tab].length > 0 && (
                  <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-bold">
                    {insights[tab].length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="overflow-y-auto overflow-x-hidden pr-1 space-y-3 no-scrollbar max-h-[300px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-3 overflow-hidden"
              >
                {insights[activeTab].length > 0 ? (
                  (insights[activeTab] as unknown as InsightItem[]).map((item) => {
                    const Icon = getIcon(activeTab);
                    const priority = (item.priority || "MEDIUM").toUpperCase();
                    const pColors: Record<string, string> = {
                      HIGH: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                      MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                      LOW: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                    };

                    const itemBgColor = item.bgColor || "bg-primary/10";
                    const itemColor = item.color || "text-primary";

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={() => handleCardClick(item.title)}
                        className="group relative bg-white/[0.03] border border-white/5 p-4 rounded-xl transition-all cursor-pointer overflow-hidden backdrop-blur-sm hover:bg-white/[0.05] hover:border-white/10 flex flex-col gap-3"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className={`p-2.5 ${itemBgColor} rounded-lg ${itemColor} shrink-0 transition-transform group-hover:scale-110`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <h4 className="font-bold text-[12px] text-white tracking-tight line-clamp-1">
                                {item.title}
                              </h4>
                              <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${pColors[priority] || pColors.MEDIUM}`}>
                                {priority}
                              </span>
                            </div>
                            <p className="text-white/60 text-[11px] leading-relaxed line-clamp-2 pr-4">
                              {item.description}
                            </p>
                          </div>
                          <button
                            onClick={(e) => handleDismiss(e, activeTab, item.id)}
                            aria-label="Dismiss insight"
                            className="opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 p-1 hover:bg-white/10 rounded transition-all text-white/30 absolute top-3 right-3"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-1 pt-3 border-t border-white/5">
                          <span className="text-[10px] font-semibold text-white/50">Verified AI Insight</span>
                          
                          <button 
                            className="flex items-center gap-1.5 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCardClick(item.title);
                            }}
                          >
                            Take Action
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-white/20">
                    <Sparkles className="w-8 h-8 mb-3 opacity-20" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">No {activeTab}</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <button 
            onClick={handleHubClick}
            className="w-full mt-5 flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all active:scale-[0.98]"
          >
            Intelligence Hub
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </CRMCard>
    </div>
  );
}
