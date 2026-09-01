"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/shared/ui/badge";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { TrendingDown, TrendingUp, Trophy, ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Users } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { PerformanceType } from "@/shared/types/report";
import { Progress } from "@/shared/ui/progress";
import { 
  CRMDataTable, 
  CRMTableHeader, 
  CRMTableBody, 
  CRMTableRow, 
  CRMTableCell, 
  CRMTableHeaderCell,
  CRMSortIndicator,
  CRMPagination,
} from "@/shared/components/crm";
import { cn } from "@/shared/lib/utils";
import { useCurrency } from "@/shared/hooks/use-currency";

interface PerformanceTableProps {
  performance: PerformanceType[];
}

type SortConfig = {
  key: keyof PerformanceType;
  direction: "asc" | "desc";
} | null;

const PerformanceTable = ({ performance }: PerformanceTableProps) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const { formatCurrency } = useCurrency();

  const sortedPerformance = useMemo(() => {
    if (!sortConfig) return performance;
    return [...performance].sort((a, b) => {
      const aVal = a[sortConfig.key] ?? "";
      const bVal = b[sortConfig.key] ?? "";
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [performance, sortConfig]);

  const handleSort = (key: keyof PerformanceType) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        return null;
      }
      return { key, direction: "asc" };
    });
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const totalPages = Math.ceil(sortedPerformance.length / rowsPerPage);
  const paginatedPerformance = sortedPerformance.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col w-full relative gap-3.5 sm:gap-4">
      <div className="flex flex-col bg-card rounded-xl border border-border shadow-sm overflow-hidden flex-1 min-h-0">
        <CRMDataTable hasPagination={sortedPerformance.length > rowsPerPage} containerClassName="border-0 shadow-none rounded-none w-full flex-1 min-h-0 h-full" className="w-full">
          <CRMTableHeader className="sticky top-0 z-20 bg-card border-b border-border/60">
            <CRMTableRow className="h-10 sm:h-11">
              <CRMTableHeaderCell 
                className="cursor-pointer group select-none bg-card"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-1.5">
                  Team Member <CRMSortIndicator active={sortConfig?.key === "name"} direction={sortConfig?.direction} />
                </div>
              </CRMTableHeaderCell>
              <CRMTableHeaderCell 
                className="cursor-pointer group select-none"
                onClick={() => handleSort("dealsClosed")}
              >
                <div className="flex items-center gap-1.5">
                  Deals Closed <CRMSortIndicator active={sortConfig?.key === "dealsClosed"} direction={sortConfig?.direction} />
                </div>
              </CRMTableHeaderCell>
              <CRMTableHeaderCell className="bg-card">Revenue Target</CRMTableHeaderCell>
              <CRMTableHeaderCell 
                className="cursor-pointer group select-none bg-card"
                onClick={() => handleSort("conversionRate")}
              >
                <div className="flex items-center gap-1.5">
                  Conversion <CRMSortIndicator active={sortConfig?.key === "conversionRate"} direction={sortConfig?.direction} />
                </div>
              </CRMTableHeaderCell>
              <CRMTableHeaderCell className="text-right bg-card">Trend</CRMTableHeaderCell>
            </CRMTableRow>
          </CRMTableHeader>

          <CRMTableBody>
            {paginatedPerformance.length === 0 ? (
              <CRMTableRow>
                <CRMTableCell colSpan={5} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground space-y-1">
                    <Users className="h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">No team performance data available</p>
                    <p className="text-xs text-slate-400">Assign leads to team members to see their performance here.</p>
                  </div>
                </CRMTableCell>
              </CRMTableRow>
            ) : (
              paginatedPerformance.map((item, idx) => (
                <CRMTableRow key={item.id}>
                  <CRMTableCell>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="w-10 h-10 rounded-lg border border-border bg-muted flex items-center justify-center font-bold text-xs">
                          <AvatarFallback>
                            {item.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {idx === 0 && (
                          <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-0.5 rounded-full shadow-sm">
                            <Trophy className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground transition-colors text-sm">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Sales Representative</p>
                      </div>
                    </div>
                  </CRMTableCell>

                  <CRMTableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-foreground">{item.dealsClosed}</span>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Deals</span>
                    </div>
                  </CRMTableCell>

                  <CRMTableCell>
                    <div className="w-48 space-y-2">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-foreground">{formatCurrency(item.revenueValue)}</span>
                      </div>
                      <Progress value={item.revenueValue > 0 ? 100 : 0} className="h-1.5" />
                    </div>
                  </CRMTableCell>

                  <CRMTableCell>
                    <Badge variant="outline" className="border-none bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider">
                      {item.conversionRate}
                    </Badge>
                  </CRMTableCell>

                  <CRMTableCell className="text-right">
                    <div className={cn(
                      "flex items-center justify-end gap-1.5 font-bold text-xs",
                      item.trendPositive ? "text-success" : "text-destructive"
                    )}>
                      {item.trendPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {item.trend}
                      <div className={cn(
                        "p-1 rounded-md ml-1",
                        item.trendPositive ? "bg-success/10" : "bg-destructive/10"
                      )}>
                        <ArrowUpRight className={cn("w-3 h-3", !item.trendPositive && "rotate-90")} />
                      </div>
                    </div>
                  </CRMTableCell>
                </CRMTableRow>
              ))
            )}
          </CRMTableBody>
        </CRMDataTable>
      </div>

      <CRMPagination
        currentPage={currentPage}
        totalPages={totalPages || 1}
        totalItems={sortedPerformance.length}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={(size) => {
          setRowsPerPage(size);
          setCurrentPage(1);
        }}
        itemName="Performers"
        pageSizeOptions={[10, 25, 50, 100]}
      />
    </div>
  );
};

export default PerformanceTable;
