"use client";

import { Sparkles, TrendingUp, Users, Target, ArrowRight, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import { motion } from "framer-motion";
import { EmptyStateCard } from "@/shared/components/crm/PageFeedbackStates";
import { ReportInsightType } from "@/shared/types/report";
import { useRouter } from "next/navigation";

const iconMap = {
  revenue: TrendingUp,
  leads: Target,
  team: Users,
};

const colorMap = {
  revenue: "blue",
  leads: "emerald",
  team: "amber",
};

const AnalyticsSummary = ({ insights }: { insights: ReportInsightType[] }) => {
  const router = useRouter();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-xl tracking-tight">AI Insights</h2>
            <p className="text-muted-foreground text-sm">Automated analysis of your CRM data</p>
          </div>
        </div>
        <button onClick={() => router.push("/ai-insights")} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
          View all insights
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.length === 0 ? (
          <div className="md:col-span-3">
            <EmptyStateCard icon={Sparkles} title="No insights yet" message="Insights will appear when there is enough CRM activity in the database." />
          </div>
        ) : insights.map((insight) => {
          const Icon = iconMap[insight.type];
          const color = colorMap[insight.type];
          return (
          <Card key={insight.id} className="group relative overflow-hidden bg-card rounded-xl border-border shadow-sm hover:shadow-elevated transition-all duration-500 border-l-4" style={{ borderLeftColor: color === 'blue' ? '#3b82f6' : color === 'emerald' ? '#10b981' : '#f59e0b' }}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${
                  color === 'blue' ? 'bg-blue-50 text-blue-600' : 
                  color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 
                  'bg-amber-50 text-amber-600'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-foreground">{insight.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider">Recommendation</span>
                </div>
                <button className="text-[10px] font-bold text-muted-foreground hover:text-muted-foreground uppercase tracking-wider">Dismiss</button>
              </div>
            </CardContent>
          </Card>
        )})}
      </div>
    </motion.div>
  );
};

export default AnalyticsSummary;












