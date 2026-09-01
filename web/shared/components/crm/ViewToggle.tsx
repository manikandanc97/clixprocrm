"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { motion } from "framer-motion";

export interface ViewOption {
  id: string;
  icon: LucideIcon;
  label: string;
}

interface ViewToggleProps {
  viewMode: string;
  setViewMode: (mode: string) => void;
  options?: readonly ViewOption[] | ViewOption[];
  className?: string;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
  viewMode,
  setViewMode,
  options,
  className,
}) => {
  if (!options || options.length < 2) return null;

  const normalizedMode = viewMode === "table" ? "list" : viewMode;

  return (
    <div className={cn("crm-segment flex items-center gap-0.5 p-1 bg-muted/50 rounded-xl border border-border/50", className)}>
      {options.map(({ id, icon: Icon, label }) => {
        const isActive =
          normalizedMode === id ||
          (id === "list" && normalizedMode === "table");

        return (
          <Button
            key={id}
            variant={isActive ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode(id)}
            title={`${label} View`}
            aria-label={`${label} View`}
            className={cn(
              "relative h-8 px-2.5 rounded-lg text-xs font-semibold transition-all duration-200 gap-1.5",
              isActive
                ? "bg-background text-foreground shadow-sm font-bold border border-border/40"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline-block">{label}</span>
            {isActive && (
              <motion.div
                layoutId="viewToggleActive"
                className="absolute inset-0 rounded-lg pointer-events-none"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
          </Button>
        );
      })}
    </div>
  );
};
