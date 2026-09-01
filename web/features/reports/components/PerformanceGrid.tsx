"use client";

import React, { useState } from "react";
import { Badge } from "@/shared/ui/badge";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { 
  TrendingDown, 
  TrendingUp, 
  Trophy, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { PerformanceType } from "@/shared/types/report";
import { Progress } from "@/shared/ui/progress";
import { CRMCard, CRMPagination } from "@/shared/components/crm";
import { cn } from "@/shared/lib/utils";
import { useCurrency } from "@/shared/hooks/use-currency";

interface PerformanceGridProps {
  performance: PerformanceType[];
}

export const PerformanceGrid: React.FC<PerformanceGridProps> = ({ performance }) => {
  const { formatCurrency } = useCurrency();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  const totalPages = Math.ceil(performance.length / rowsPerPage);
  const paginatedPerformance = performance.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-6">
        {paginatedPerformance.map((item, idx) => (
          <CRMCard
            key={item.id}
            delay={idx * 0.04}
            className="group relative flex flex-col justify-between p-5"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12 rounded-xl border border-border bg-muted flex items-center justify-center font-bold text-xs">
                      <AvatarFallback className="font-bold text-sm bg-primary/10 text-primary">
                        {item.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {idx === 0 && (
                      <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-1 rounded-full shadow-sm">
                        <Trophy className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-base tracking-tight">
                      {item.name}
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Senior Executive</p>
                  </div>
                </div>

                <Badge variant="outline" className="border-none bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider">
                  {item.conversionRate}
                </Badge>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 space-y-3 mb-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Deals Closed</span>
                  <span className="text-sm font-bold text-foreground">{item.dealsClosed} Deals</span>
                </div>

                <div className="h-px w-full bg-border/50" />

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-foreground">{formatCurrency(item.revenueValue)}</span>
                    <span className="text-muted-foreground">85% Target</span>
                  </div>
                  <Progress value={85} className="h-1.5" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Trend</span>
              <div className={cn(
                "flex items-center gap-1 font-bold text-xs",
                item.trendPositive ? "text-success" : "text-destructive"
              )}>
                {item.trendPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {item.trend}
              </div>
            </div>
          </CRMCard>
        ))}
      </div>

      <CRMPagination
        currentPage={currentPage}
        totalPages={totalPages || 1}
        totalItems={performance.length}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={(size) => {
          setRowsPerPage(size);
          setCurrentPage(1);
        }}
        itemName="Performers"
        pageSizeOptions={[12, 24, 48, 96]}
      />
    </div>
  );
};
