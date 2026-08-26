import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface CRMSortIndicatorProps {
  active: boolean;
  direction?: "asc" | "desc";
  className?: string;
}

export function CRMSortIndicator({ active, direction, className }: CRMSortIndicatorProps) {
  if (!active) {
    return (
      <ChevronsUpDown
        className={cn(
          "h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0",
          className
        )}
        aria-hidden="true"
      />
    );
  }

  return direction === "asc" ? (
    <ArrowUp className={cn("h-3.5 w-3.5 text-primary shrink-0", className)} aria-hidden="true" />
  ) : (
    <ArrowDown className={cn("h-3.5 w-3.5 text-primary shrink-0", className)} aria-hidden="true" />
  );
}
