"use client";

import { Check, ChevronRight, Sparkles } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { filterPureFeatures } from "../utils/plan-features.util";

interface PlanEntitlementsListProps {
  features: string[];
}

export function PlanEntitlementsList({ features }: PlanEntitlementsListProps) {
  const cleanFeatures = filterPureFeatures(features);
  const MAX_INITIAL_VISIBLE = 8;
  const shouldTruncate = cleanFeatures.length > MAX_INITIAL_VISIBLE;
  const visibleFeatures = shouldTruncate ? cleanFeatures.slice(0, MAX_INITIAL_VISIBLE) : cleanFeatures;
  const remainingFeatures = shouldTruncate ? cleanFeatures.slice(MAX_INITIAL_VISIBLE) : [];

  return (
    <div className="pt-3 border-t border-border/50 flex flex-col space-y-2.5">
      <div>
        <div className="flex items-center justify-between mb-2 shrink-0">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-emerald-500" />
            Included Entitlements
          </p>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border/40">
            {cleanFeatures.length}
          </span>
        </div>

        <div className="space-y-1.5">
          {visibleFeatures.map((feat, fIdx) => (
            <div key={fIdx} className="flex items-center gap-2 text-xs py-0.5">
              <div className="h-4 w-4 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="h-2.5 w-2.5 stroke-[3]" />
              </div>
              <span className="text-foreground/90 font-medium leading-tight line-clamp-1">
                {feat}
              </span>
            </div>
          ))}
        </div>
      </div>

      {remainingFeatures.length > 0 && (
        <div className="pt-1 shrink-0">
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all cursor-pointer py-1 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <span>+ {remainingFeatures.length} more features included</span>
                <ChevronRight className="h-3 w-3 opacity-70" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              align="start"
              sideOffset={6}
              className="bg-zinc-950/95 backdrop-blur-md text-zinc-100 dark:bg-zinc-900/95 dark:text-zinc-100 border border-zinc-800 shadow-2xl p-3.5 rounded-xl w-72 max-w-xs space-y-2.5 z-50 animate-in fade-in-0 zoom-in-95"
            >
              <div className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-2">
                <span className="font-bold text-xs text-white">
                  Additional Entitlements
                </span>
                <Badge variant="success">
                  +{remainingFeatures.length} more
                </Badge>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {remainingFeatures.map((feat, rIdx) => (
                  <div key={rIdx} className="flex items-center gap-2 text-xs py-0.5">
                    <div className="h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                    <span className="text-zinc-200 font-medium leading-tight">
                      {feat}
                    </span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
