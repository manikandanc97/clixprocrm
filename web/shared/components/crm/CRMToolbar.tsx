"use client";

import { useEffect, useRef } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { motion } from "framer-motion";
import { ViewToggle, ViewOption } from "./ViewToggle";
import { AppIcon } from "@/shared/components/icons/icon-registry";

interface CRMToolbarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  viewMode?: string;
  setViewMode?: (mode: ReturnType<typeof JSON.parse>) => void;
  viewOptions?: readonly ViewOption[] | ViewOption[];
  onFilterClick?: () => void;
  children?: React.ReactNode;
  placeholder?: string;
  className?: string;
  sticky?: boolean;
}

export const CRMToolbar = ({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  viewOptions,
  onFilterClick,
  children,
  placeholder = "Search...",
  className,
  sticky = true,
}: CRMToolbarProps) => {
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toolbarRef.current) return;
    const updateHeight = () => {
      if (toolbarRef.current) {
        const height = toolbarRef.current.offsetHeight;
        document.documentElement.style.setProperty("--crm-toolbar-h", `${height}px`);
      }
    };
    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(toolbarRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <motion.div 
      ref={toolbarRef}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "crm-toolbar",
        sticky && "sticky top-0 z-30 bg-card/95 backdrop-blur-md shadow-sm",
        className
      )}
    >
      <div className="flex w-full flex-1 items-center gap-3 sm:w-auto">
        <div className="relative flex-1 sm:max-w-md group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none">
            <AppIcon icon={Search} name="search" size={16} />
          </div>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            className={cn("h-10 border-transparent bg-muted/40 pl-9 shadow-none focus-visible:border-primary focus-visible:bg-background", searchQuery && "pr-9")}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
            >
              <AppIcon icon={X} name="close" size={14} />
              <span className="sr-only">Clear search</span>
            </button>
          )}
        </div>
        
        {onFilterClick && (
          <Button variant="outline" size="sm" onClick={onFilterClick} className="gap-2">
            <AppIcon icon={Filter} name="filter" size={15} />
            <span>Filters</span>
          </Button>
        )}
      </div>

      <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
        {children}
        
        {viewMode && setViewMode && (
          <ViewToggle
            viewMode={viewMode}
            setViewMode={setViewMode}
            options={viewOptions}
          />
        )}
      </div>
    </motion.div>
  );
};
