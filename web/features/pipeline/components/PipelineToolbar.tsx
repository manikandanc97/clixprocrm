import { useState } from "react";
import { Search, Filter, ArrowUpDown, X } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

interface PipelineToolbarProps {
  onSearch: (value: string) => void;
  onSort: (value: string) => void;
  onFilter: (value: string) => void;
  className?: string;
}

export function PipelineToolbar({ onSearch, onSort, onFilter, className }: PipelineToolbarProps) {
  const [searchValue, setSearchValue] = useState("");
  const [sortValue, setSortValue] = useState("created_desc");
  const [filterValue, setFilterValue] = useState("all");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    onSearch(e.target.value);
  };

  const handleSort = (value: string) => {
    setSortValue(value);
    onSort(value);
  };

  const handleFilter = (value: string) => {
    setFilterValue(value);
    onFilter(value);
  };

  return (
    <div className={cn("shrink-0 flex flex-col sm:flex-row gap-2.5 mb-4 items-center justify-between", className)}>
      <div className="relative w-full sm:max-w-xs group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none">
          <Search className="w-4 h-4" />
        </div>
        <Input 
          placeholder="Search deals..." 
          value={searchValue}
          onChange={handleSearch}
          className={cn("pl-9 h-9 text-xs bg-card border-border/80 shadow-xs w-full", searchValue && "pr-8")}
        />
        {searchValue && (
          <button
            type="button"
            onClick={() => {
              setSearchValue("");
              onSearch("");
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span className="sr-only">Clear search</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 text-xs font-semibold bg-card border-border/80 shadow-xs flex-1 sm:flex-none gap-1.5 cursor-pointer">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{filterValue === "all" ? "Filter" : filterValue === "hot" ? "Filter: Hot" : "Filter: Stuck"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 text-xs">
            <DropdownMenuRadioGroup value={filterValue} onValueChange={handleFilter}>
              <DropdownMenuRadioItem value="all" className="cursor-pointer text-xs">All Deals</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="hot" className="cursor-pointer text-xs">Hot Deals</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="stuck" className="cursor-pointer text-xs">Stuck Deals</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 text-xs font-semibold bg-card border-border/80 shadow-xs flex-1 sm:flex-none gap-1.5 cursor-pointer">
              <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{sortValue === "created_desc" ? "Sort: Newest" : sortValue === "value_desc" ? "Sort: Value" : "Sort: Probability"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 text-xs">
            <DropdownMenuRadioGroup value={sortValue} onValueChange={handleSort}>
              <DropdownMenuRadioItem value="created_desc" className="cursor-pointer text-xs">Newest First</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="value_desc" className="cursor-pointer text-xs">Highest Value</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="prob_desc" className="cursor-pointer text-xs">Highest Probability</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
