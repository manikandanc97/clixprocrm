"use client";

import { Button } from "@/shared/ui/button";

export default function CurrencySwitcher() {
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="hidden sm:flex items-center gap-1 px-2.5 h-9 font-semibold text-xs rounded-lg hover:bg-sidebar-accent/60 text-sidebar-foreground/80 cursor-default"
    >
      <span>INR</span>
      <span className="text-sidebar-foreground/50 text-[11px] font-normal">
        (₹)
      </span>
    </Button>
  );
}
