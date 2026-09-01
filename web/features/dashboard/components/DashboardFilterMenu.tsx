"use client";

import React, { useState, useEffect } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/shared/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function DashboardFilterMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [region, setRegion] = useState(searchParams.get("region") || "all");
  const [agent, setAgent] = useState(searchParams.get("agent") || "all");
  const [timeframe, setTimeframe] = useState(searchParams.get("timeframe") || "this-month");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRegion(searchParams.get("region") || "all");
    setAgent(searchParams.get("agent") || "all");
    setTimeframe(searchParams.get("timeframe") || "this-month");
  }, [searchParams]);

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("region", region);
    params.set("agent", agent);
    params.set("timeframe", timeframe);
    
    router.push(`${pathname}?${params.toString()}`);

    toast.success("Filters applied", {
      description: `Filtering by region: ${region}, agent: ${agent}, timeframe: ${timeframe}`,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full h-9 px-3 sm:px-4 text-xs font-bold gap-2 group">
          <AppIcon icon={Filter} name="filter" size={14} />
          <span className="hidden sm:inline">Filters</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl">
        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
          Filter Dashboard
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs font-semibold text-foreground/80">Timeframe</div>
        <DropdownMenuCheckboxItem checked={timeframe === "this-month"} onCheckedChange={() => setTimeframe("this-month")} className="text-xs rounded-md">
          This Month
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={timeframe === "last-month"} onCheckedChange={() => setTimeframe("last-month")} className="text-xs rounded-md">
          Last Month
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={timeframe === "quarter"} onCheckedChange={() => setTimeframe("quarter")} className="text-xs rounded-md">
          This Quarter
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={timeframe === "year"} onCheckedChange={() => setTimeframe("year")} className="text-xs rounded-md">
          This Year
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs font-semibold text-foreground/80">Region</div>
        <DropdownMenuCheckboxItem checked={region === "all"} onCheckedChange={() => setRegion("all")} className="text-xs rounded-md">
          All Regions
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={region === "na"} onCheckedChange={() => setRegion("na")} className="text-xs rounded-md">
          North America
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={region === "emea"} onCheckedChange={() => setRegion("emea")} className="text-xs rounded-md">
          EMEA
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs font-semibold text-foreground/80">Agent</div>
        <DropdownMenuCheckboxItem checked={agent === "all"} onCheckedChange={() => setAgent("all")} className="text-xs rounded-md">
          All Agents
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={agent === "me"} onCheckedChange={() => setAgent("me")} className="text-xs rounded-md">
          My Leads Only
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />
        
        <div className="p-1">
          <Button size="sm" className="w-full h-8 text-xs font-bold" onClick={handleApply}>
            Apply Filters
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
