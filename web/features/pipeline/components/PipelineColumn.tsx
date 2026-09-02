"use client";

import { PipelineLeadType } from "@/shared/types/pipeline";
import PipelineCard from "./PipelineCard";
import { Plus, MoreHorizontal, TrendingUp, IndianRupee, Target } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/shared/lib/utils";
import { useCurrency } from "@/shared/hooks/use-currency";
import { PIPELINE_STAGE_LABELS } from "@/lib/crm-formatters";
import { CRMActionMenu } from "@/shared/components/crm";

interface Props {
  title: string;
  items: PipelineLeadType[];
  onSelectDeal?: (deal: PipelineLeadType) => void;
  onAddDeal?: (stage: string) => void;
}

const PipelineColumn = ({ title, items, onSelectDeal, onAddDeal }: Props) => {
  const { setNodeRef, isOver } = useDroppable({
    id: title,
    data: { type: 'Column', title }
  });

  const totalValue = items.reduce((sum, item) => sum + (item.valueAmount || 0), 0);
  const { formatCurrency, CurrencyIcon } = useCurrency();
  const formattedTotal = formatCurrency(totalValue);
  const displayTitle = PIPELINE_STAGE_LABELS[title] || title;

  const getStageColor = (t: string) => {
    switch (t) {
      case "NEW": return { 
        dot: "bg-blue-500", 
        bg: "bg-blue-500/10", 
        text: "text-blue-600 dark:text-blue-400", 
        hoverBg: "hover:bg-blue-500/20", 
        hoverText: "hover:text-blue-600", 
        solidBg: "hover:bg-blue-500", 
        solidText: "hover:text-white", 
        ring: "ring-blue-500/40",
        badgeBg: "bg-blue-500/15 dark:bg-blue-500/25",
        badgeText: "text-blue-700 dark:text-blue-300",
        badgeBorder: "border-blue-500/30",
        cardBg: "bg-gradient-to-br from-blue-500/[0.08] to-blue-500/[0.03] dark:from-blue-500/[0.15] dark:to-blue-500/[0.05]",
        cardBorder: "border-blue-500/25",
        labelColor: "text-blue-700/80 dark:text-blue-300/80",
      };
      case "QUALIFIED": return { 
        dot: "bg-purple-500", 
        bg: "bg-purple-500/10", 
        text: "text-purple-600 dark:text-purple-400", 
        hoverBg: "hover:bg-purple-500/20", 
        hoverText: "hover:text-purple-600", 
        solidBg: "hover:bg-purple-500", 
        solidText: "hover:text-white", 
        ring: "ring-purple-500/40",
        badgeBg: "bg-purple-500/15 dark:bg-purple-500/25",
        badgeText: "text-purple-700 dark:text-purple-300",
        badgeBorder: "border-purple-500/30",
        cardBg: "bg-gradient-to-br from-purple-500/[0.08] to-purple-500/[0.03] dark:from-purple-500/[0.15] dark:to-purple-500/[0.05]",
        cardBorder: "border-purple-500/25",
        labelColor: "text-purple-700/80 dark:text-purple-300/80",
      };
      case "PROPOSAL": return { 
        dot: "bg-orange-500", 
        bg: "bg-orange-500/10", 
        text: "text-orange-600 dark:text-orange-400", 
        hoverBg: "hover:bg-orange-500/20", 
        hoverText: "hover:text-orange-600", 
        solidBg: "hover:bg-orange-500", 
        solidText: "hover:text-white", 
        ring: "ring-orange-500/40",
        badgeBg: "bg-orange-500/15 dark:bg-orange-500/25",
        badgeText: "text-orange-700 dark:text-orange-300",
        badgeBorder: "border-orange-500/30",
        cardBg: "bg-gradient-to-br from-orange-500/[0.08] to-orange-500/[0.03] dark:from-orange-500/[0.15] dark:to-orange-500/[0.05]",
        cardBorder: "border-orange-500/25",
        labelColor: "text-orange-700/80 dark:text-orange-300/80",
      };
      case "NEGOTIATION": return { 
        dot: "bg-amber-500", 
        bg: "bg-amber-500/10", 
        text: "text-amber-600 dark:text-amber-400", 
        hoverBg: "hover:bg-amber-500/20", 
        hoverText: "hover:text-amber-600", 
        solidBg: "hover:bg-amber-500", 
        solidText: "hover:text-white", 
        ring: "ring-amber-500/40",
        badgeBg: "bg-amber-500/15 dark:bg-amber-500/25",
        badgeText: "text-amber-700 dark:text-amber-300",
        badgeBorder: "border-amber-500/30",
        cardBg: "bg-gradient-to-br from-amber-500/[0.08] to-amber-500/[0.03] dark:from-amber-500/[0.15] dark:to-amber-500/[0.05]",
        cardBorder: "border-amber-500/25",
        labelColor: "text-amber-700/80 dark:text-amber-300/80",
      };
      case "WON": return { 
        dot: "bg-emerald-500", 
        bg: "bg-emerald-500/10", 
        text: "text-emerald-600 dark:text-emerald-400", 
        hoverBg: "hover:bg-emerald-500/20", 
        hoverText: "hover:text-emerald-600", 
        solidBg: "hover:bg-emerald-500", 
        solidText: "hover:text-white", 
        ring: "ring-emerald-500/40",
        badgeBg: "bg-emerald-500/15 dark:bg-emerald-500/25",
        badgeText: "text-emerald-700 dark:text-emerald-300",
        badgeBorder: "border-emerald-500/30",
        cardBg: "bg-gradient-to-br from-emerald-500/[0.08] to-emerald-500/[0.03] dark:from-emerald-500/[0.15] dark:to-emerald-500/[0.05]",
        cardBorder: "border-emerald-500/25",
        labelColor: "text-emerald-700/80 dark:text-emerald-300/80",
      };
      case "LOST": return { 
        dot: "bg-rose-500", 
        bg: "bg-rose-500/10", 
        text: "text-rose-600 dark:text-rose-400", 
        hoverBg: "hover:bg-rose-500/20", 
        hoverText: "hover:text-rose-600", 
        solidBg: "hover:bg-rose-500", 
        solidText: "hover:text-white", 
        ring: "ring-rose-500/40",
        badgeBg: "bg-rose-500/15 dark:bg-rose-500/25",
        badgeText: "text-rose-700 dark:text-rose-300",
        badgeBorder: "border-rose-500/30",
        cardBg: "bg-gradient-to-br from-rose-500/[0.08] to-rose-500/[0.03] dark:from-rose-500/[0.15] dark:to-rose-500/[0.05]",
        cardBorder: "border-rose-500/25",
        labelColor: "text-rose-700/80 dark:text-rose-300/80",
      };
      default: return { 
        dot: "bg-muted-foreground", 
        bg: "bg-muted-foreground/10", 
        text: "text-muted-foreground", 
        hoverBg: "hover:bg-muted-foreground/20", 
        hoverText: "hover:text-foreground", 
        solidBg: "hover:bg-muted-foreground", 
        solidText: "hover:text-white", 
        ring: "ring-muted-foreground/40",
        badgeBg: "bg-muted",
        badgeText: "text-muted-foreground",
        badgeBorder: "border-border",
        cardBg: "bg-background/50",
        cardBorder: "border-border",
        labelColor: "text-muted-foreground",
      };
    }
  };

  const colors = getStageColor(title);

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "flex flex-col bg-muted/30 rounded-xl min-w-[340px] max-w-[340px] h-full border border-border transition-all duration-300 overflow-hidden shrink-0",
        isOver && cn("ring-2 bg-muted/50 shadow-lg", colors.ring)
      )}
    >
      {/* Column Header */}
      <div className="shrink-0 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={cn("w-2 h-2 rounded-full", colors.dot)} />
            <h2 className="font-bold text-foreground tracking-tight text-sm uppercase tracking-wider">{displayTitle}</h2>
            <Badge variant="secondary" className={cn("rounded-full h-5 px-1.5 min-w-[20px] justify-center text-[10px] font-bold border shadow-xs transition-colors", colors.badgeBg, colors.badgeText, colors.badgeBorder)}>
              {items.length}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onAddDeal?.(title)} className={cn("p-1 text-muted-foreground rounded-md transition-colors", colors.hoverText, colors.hoverBg)} title="Add deal to this stage">
              <Plus className="w-4 h-4" />
            </button>
            <CRMActionMenu
              triggerOrientation="horizontal"
              triggerClassName="h-7 w-7 p-0"
              items={[
                {
                  label: "Add Deal to Stage",
                  icon: Plus,
                  onClick: () => onAddDeal?.(title),
                },
              ]}
            />
          </div>
        </div>
        
        <div className={cn("flex items-center justify-between rounded-xl p-3 border shadow-xs transition-all", colors.cardBg, colors.cardBorder)}>
           <div className="flex flex-col">
              <span className={cn("text-[9px] font-bold uppercase tracking-widest leading-none mb-1", colors.labelColor)}>Total Value</span>
              <span className="text-sm font-bold text-foreground tabular-nums leading-none">{formattedTotal}</span>
           </div>
           <div className="flex flex-col items-end">
              <span className={cn("text-[9px] font-bold uppercase tracking-widest leading-none mb-1", colors.labelColor)}>Efficiency</span>
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] leading-none">
                 <TrendingUp className="w-3 h-3" />
                 84%
              </div>
           </div>
        </div>
      </div>

      {/* Cards Area */}
      <div className="flex-1 min-h-0 px-3 pt-3 space-y-4 overflow-y-auto kanban-board-scroll pb-4">
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.length > 0 ? (
            <div className="flex flex-col gap-3 min-h-[50px]">
              {items.map((item) => (
                <PipelineCard key={item.id} item={item} onSelect={() => onSelectDeal?.(item)} />
              ))}
            </div>
          ) : (
             <div className="h-48 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border rounded-xl bg-background/20 group transition-all">
                <div className="w-10 h-10 rounded-xl bg-background shadow-sm flex items-center justify-center text-muted-foreground mb-3">
                   <Target className="w-5 h-5" />
                </div>
                <p className="text-[11px] font-bold text-muted-foreground">No deals in this stage</p>
                <p className="text-[9px] text-muted-foreground/60 mt-1 uppercase tracking-wider mb-4">Drag deals here</p>
                <button onClick={() => onAddDeal?.(title)} className={cn("px-4 py-2 rounded-lg font-bold text-[11px] flex items-center gap-2 transition-colors", colors.bg, colors.text, colors.solidBg, colors.solidText)}>
                  <Plus className="w-3 h-3" /> Add Deal
                </button>
             </div>
           )}
         </SortableContext>
       </div>

      {/* Column Footer Analytics */}
      <div className="shrink-0 px-5 py-3 bg-background/40 border-t border-border flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className={cn("w-5 h-5 rounded-md flex items-center justify-center", colors.bg, colors.text)}>
               <CurrencyIcon className="w-3 h-3" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Avg: <span className="text-foreground">{formatCurrency(items.length ? Math.floor(totalValue/items.length) : 0)}</span></span>
         </div>
      </div>
    </div>
  );
};

export default PipelineColumn;












