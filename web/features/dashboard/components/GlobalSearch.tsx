"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Command as CommandIcon, Search, User, Building, CheckSquare, KanbanSquare, Loader2, X } from "lucide-react";
import { useGlobalSearch } from "@/shared/hooks/use-dashboard";
import { GlobalSearchResult } from "@/shared/lib/api/crm";
import { AppIcon } from "@/shared/components/icons/icon-registry";

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  const { data: searchResults, isFetching } = useGlobalSearch(debouncedQuery);
  const results = searchResults || [];

  // Handle Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset selected index when results change
  useEffect(() => {
    (() => setSelectedIndex(0))();
  }, [debouncedQuery]);

  // Handle Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && results.length > 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const handleSelect = (result: GlobalSearchResult) => {
    setIsOpen(false);
    setQuery("");
    setDebouncedQuery("");
    router.push(result.url);
  };

  // Open search input manually
  const openSearch = () => {
    setIsOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  return (
    <div ref={containerRef} className="relative flex flex-1 max-w-full md:max-w-[450px]">
      {!isOpen ? (
        <button 
          onClick={openSearch}
          className="w-full flex items-center justify-between bg-sidebar-accent/40 hover:bg-sidebar-accent/70 border border-sidebar-border/60 hover:border-sidebar-border px-3 h-9 rounded-lg transition-all duration-200 group outline-none cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <AppIcon 
              name="search" 
              size={15} 
              className="text-sidebar-foreground/50 group-hover:text-primary transition-colors shrink-0" 
            />
            <span className="text-sidebar-foreground/60 group-hover:text-sidebar-foreground text-xs md:text-sm font-medium tracking-tight truncate">Search leads, customers, tasks...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-sidebar-foreground/50 bg-background/60 rounded-md border border-sidebar-border/60">
            <CommandIcon className="w-2.5 h-2.5" /> K
          </kbd>
        </button>
      ) : (
        <div className="w-full flex items-center bg-background border border-primary px-3 h-9 rounded-lg shadow-[0_0_0_3px_rgba(var(--primary),0.12)] outline-none relative z-50">
          <AppIcon name="search" size={15} className="text-primary shrink-0" />
          <input
            ref={inputRef}
            autoFocus
            className="flex-1 bg-transparent border-none outline-none px-2.5 text-xs md:text-sm font-medium placeholder:text-muted-foreground"
            placeholder="Type to search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {isFetching && query.length >= 2 && (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
          )}
          {query && !isFetching && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="text-muted-foreground hover:text-foreground focus:outline-none shrink-0"
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Clear search</span>
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted/50 rounded-md ml-2 cursor-pointer hover:bg-muted" onClick={() => setIsOpen(false)}>
            ESC
          </kbd>
        </div>
      )}

      {/* Dropdown Results */}
      {isOpen && query && (
        <div className="absolute top-[48px] left-0 w-full bg-popover/95 backdrop-blur-xl border border-border shadow-elevated rounded-xl overflow-hidden z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {isFetching && results.length === 0 ? (
            <div className="space-y-1 p-2">
              <div className="h-4 w-16 bg-muted/50 rounded animate-pulse mb-2" />
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-muted animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                    <div className="h-2 w-1/3 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-12 bg-muted/50 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Results
              </div>
              {results.map((result, idx) => {
                const isSelected = idx === selectedIndex;
                
                let Icon = Search;
                if (result.type === "Lead") Icon = User;
                if (result.type === "Customer") Icon = Building;
                if (result.type === "Deal") Icon = KanbanSquare;
                if (result.type === "Task") Icon = CheckSquare;
                
                // Highlight matching text (simple implementation)
                const highlightText = (text: string) => {
                  if (!debouncedQuery) return text;
                  const parts = text.split(new RegExp(`(${debouncedQuery})`, 'gi'));
                  return parts.map((part, i) => 
                    part.toLowerCase() === debouncedQuery.toLowerCase() ? <span key={i} className="text-primary font-bold bg-primary/10 rounded px-0.5">{part}</span> : part
                  );
                };

                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => handleSelect(result)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${isSelected ? 'bg-accent/80' : 'hover:bg-accent/50'}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-background shadow-sm' : 'bg-muted'}`}>
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">
                        {highlightText(result.title)}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {highlightText(result.subtitle)}
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase bg-muted/50 px-1.5 py-0.5 rounded">
                      {result.type}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            !isFetching && query.length >= 2 && (
              <div className="p-6 text-center flex flex-col items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-semibold text-foreground">No matching records found.</p>
                <p className="text-xs text-muted-foreground mt-1">Try searching with a different keyword</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
