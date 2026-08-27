"use client";

import { PipelineLeadType } from "@/shared/types/pipeline";
import { 
  MoreHorizontal, 
  IndianRupee,
  Clock, 
  MessageSquare, 
  UserPlus, 
  Zap
} from "lucide-react";
// import {  } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/shared/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";
import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/shared/lib/utils";
import { useCurrency } from "@/shared/hooks/use-currency";

interface Props {
  item: PipelineLeadType;
  isOverlay?: boolean;
  onSelect?: () => void;
}

const PipelineCard = ({ item, isOverlay, onSelect }: Props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id, data: { type: 'Card', item } });
  
  const { formatCurrency, CurrencyIcon } = useCurrency();

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const getPriorityColor = (p?: string) => {
    if (!p) return "bg-muted text-muted-foreground border-border";
    switch (p.toUpperCase()) {
      case "URGENT": return "bg-purple-500/10 text-purple-700 border-purple-500/25";
      case "HIGH": return "bg-rose-500/10 text-rose-700 border-rose-500/25";
      case "MEDIUM": return "bg-amber-500/10 text-amber-700 border-amber-500/25";
      case "LOW": return "bg-blue-500/10 text-blue-700 border-blue-500/25";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  if (isDragging && !isOverlay) {
    return (
      <div 
        ref={setNodeRef}
        style={style}
        className="bg-muted/50 rounded-xl border-2 border-dashed border-border h-[100px] w-full"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex flex-col gap-2 rounded-xl border bg-card p-3 text-card-foreground shadow-sm transition-all duration-200 cursor-pointer",
        isDragging && "opacity-50 ring-2 ring-primary ring-offset-2 scale-95",
        isOverlay && "opacity-100 ring-2 ring-primary scale-105 shadow-xl rotate-2 cursor-grabbing",
        !isDragging && !isOverlay && "hover:shadow-md hover:border-primary/50"
      )}
      {...attributes}
      {...listeners}
    >
      {/* Stuck Alert */}
      {item.isStuck && (
        <div className="absolute -top-1.5 -left-1.5 z-10">
           <TooltipProvider>
             <Tooltip>
               <TooltipTrigger asChild>
                 <div className="w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg animate-bounce">
                   <Clock className="w-3 h-3" />
                 </div>
               </TooltipTrigger>
               <TooltipContent>
                 <p className="text-[10px] font-bold">STUCK: No activity for 10 days</p>
               </TooltipContent>
             </Tooltip>
           </TooltipProvider>
        </div>
      )}

      {/* Header: Priority & Options */}
      <div className="flex justify-between items-center">
        <Badge variant="outline" className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0 h-4", getPriorityColor(item.priority || "Low"))}>
          {item.priority || "Low"}
        </Badge>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button onPointerDown={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-foreground transition-colors p-1 -mr-1">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
             <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect?.(); }}>
               <MessageSquare className="w-3.5 h-3.5 mr-2" /> Edit / Quick Note
             </DropdownMenuItem>
             <DropdownMenuItem>
               <UserPlus className="w-3.5 h-3.5 mr-2" /> Assign Owner
             </DropdownMenuItem>
             <DropdownMenuSeparator />
             <DropdownMenuItem className="text-primary focus:text-primary">
               <Zap className="w-3.5 h-3.5 mr-2" /> AI Summary
             </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Title & Company */}
      <div className="flex flex-col gap-0.5 mt-0.5">
        <h3
          onClick={(e) => { e.stopPropagation(); onSelect?.(); }}
          className="font-bold text-foreground group-hover:text-primary transition-colors text-sm truncate cursor-pointer"
        >
          {item.name}
        </h3>
        {item.company && item.company !== item.name && (
          <p className="text-xs text-muted-foreground truncate">{item.company}</p>
        )}
      </div>

      {/* Metrics */}
      <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-border/50">
        <div className="flex items-center gap-1 text-sm font-bold text-foreground">
          <span className="text-success"><CurrencyIcon className="w-3.5 h-3.5" /></span>
          {item.valueAmount ? formatCurrency(item.valueAmount) : formatCurrency(Number(String(item.value || "0").replace(/[^0-9.-]+/g,"")))}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${item.probability}%` }}
              className={cn(
                "h-full rounded-full",
                item.probability > 70 ? 'bg-success' : item.probability > 30 ? 'bg-primary' : 'bg-muted-foreground'
              )}
            />
          </div>
          <span className="text-[10px] font-bold text-muted-foreground">{item.probability}%</span>
        </div>
      </div>
    </div>
  );
};

export default PipelineCard;
