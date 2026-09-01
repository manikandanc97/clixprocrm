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
      case "NEW": return { dot: "bg-blue-500", bg: "bg-blue-500/10", text: "text-blue-500", hoverBg: "hover:bg-blue-500/20", hoverText: "hover:text-blue-600", solidBg: "hover:bg-blue-500", solidText: "hover:text-white", ring: "ring-blue-500/40" };
      case "QUALIFIED": return { dot: "bg-purple-500", bg: "bg-purple-500/10", text: "text-purple-500", hoverBg: "hover:bg-purple-500/20", hoverText: "hover:text-purple-600", solidBg: "hover:bg-purple-500", solidText: "hover:text-white", ring: "ring-purple-500/40" };
      case "PROPOSAL": return { dot: "bg-orange-500", bg: "bg-orange-500/10", text: "text-orange-500", hoverBg: "hover:bg-orange-500/20", hoverText: "hover:text-orange-600", solidBg: "hover:bg-orange-500", solidText: "hover:text-white", ring: "ring-orange-500/40" };
      case "NEGOTIATION": return { dot: "bg-amber-500", bg: "bg-amber-500/10", text: "text-amber-500", hoverBg: "hover:bg-amber-500/20", hoverText: "hover:text-amber-600", solidBg: "hover:bg-amber-500", solidText: "hover:text-white", ring: "ring-amber-500/40" };
      case "WON": return { dot: "bg-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-500", hoverBg: "hover:bg-emerald-500/20", hoverText: "hover:text-emerald-600", solidBg: "hover:bg-emerald-500", solidText: "hover:text-white", ring: "ring-emerald-500/40" };
      case "LOST": return { dot: "bg-rose-500", bg: "bg-rose-500/10", text: "text-rose-500", hoverBg: "hover:bg-rose-500/20", hoverText: "hover:text-rose-600", solidBg: "hover:bg-rose-500", solidText: "hover:text-white", ring: "ring-rose-500/40" };
      default: return { dot: "bg-muted-foreground", bg: "bg-muted-foreground/10", text: "text-muted-foreground", hoverBg: "hover:bg-muted-foreground/20", hoverText: "hover:text-foreground", solidBg: "hover:bg-muted-foreground", solidText: "hover:text-white", ring: "ring-muted-foreground/40" };
    }
  };

  const colors = getStageColor(title);

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "flex flex-col bg-muted/30 rounded-xl min-w-[340px] max-w-[340px] h-full border border-border transition-all duration-300 overflow-hidden",
        isOver && cn("ring-2 bg-muted/50 shadow-lg", colors.ring)
      )}
    >
      {/* Column Header */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={cn("w-2 h-2 rounded-full", colors.dot)} />
            <h2 className="font-bold text-foreground tracking-tight text-sm uppercase tracking-wider">{displayTitle}</h2>
            <Badge variant="secondary" className="bg-background text-muted-foreground border-border shadow-sm rounded-full h-5 px-1.5 min-w-[20px] justify-center text-[10px] font-bold">
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
        
        <div className="flex items-center justify-between bg-background/50 rounded-xl p-3 border border-border shadow-sm">
           <div className="flex flex-col">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Total Value</span>
              <span className="text-sm font-bold text-foreground tabular-nums leading-none">{formattedTotal}</span>
           </div>
           <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Efficiency</span>
              <div className="flex items-center gap-1 text-success font-bold text-[11px] leading-none">
                 <TrendingUp className="w-3 h-3" />
                 84%
              </div>
           </div>
        </div>
      </div>

      {/* Cards Area */}
      <div className="flex-1 px-3 pt-4 space-y-4 overflow-y-auto kanban-board-scroll pb-6">
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
      <div className="px-5 py-3 bg-background/40 border-t border-border flex items-center justify-between">
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












