"use client";

import React, { useState } from "react";
import { PipelineLeadType } from "@/shared/types/pipeline";
import { 
  MoreHorizontal,
  Clock, 
  MessageSquare, 
  UserPlus, 
  Zap,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/shared/ui/dropdown-menu";
import { 
  CRMDataTable, 
  CRMTableHeader, 
  CRMTableBody, 
  CRMTableRow, 
  CRMTableCell, 
  CRMTableHeaderCell,
  CRMPagination,
} from "@/shared/components/crm";
import { DataTableColumnHeader, SortDirection } from "@/shared/components/DataTableColumnHeader";
import { useCurrency } from "@/shared/hooks/use-currency";
import { cn } from "@/shared/lib/utils";

interface PipelineTableProps {
  items: PipelineLeadType[];
  onSelectDeal?: (deal: PipelineLeadType) => void;
}

export const PipelineTable: React.FC<PipelineTableProps> = ({ items, onSelectDeal }) => {
  const { formatCurrency } = useCurrency();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({
    key: "",
    direction: null,
  });

  const handleSort = (key: string, direction: SortDirection) => {
    setSortConfig({ key, direction });
  };

  const sortedItems = [...items].sort((a, b) => {
    if (!sortConfig.direction) return 0;
    const dir = sortConfig.direction === "asc" ? 1 : -1;

    if (sortConfig.key === "name") {
      return (a.name || "").localeCompare(b.name || "") * dir;
    }
    if (sortConfig.key === "company") {
      return (a.company || "").localeCompare(b.company || "") * dir;
    }
    if (sortConfig.key === "stage") {
      return (a.stage || "").localeCompare(b.stage || "") * dir;
    }
    if (sortConfig.key === "priority") {
      const priorityWeight: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
      const weightA = priorityWeight[a.priority] || 0;
      const weightB = priorityWeight[b.priority] || 0;
      return (weightA - weightB) * dir;
    }
    if (sortConfig.key === "value") {
      const valA = a.valueAmount ?? (Number(String(a.value || "0").replace(/[^0-9.-]+/g, "")) || 0);
      const valB = b.valueAmount ?? (Number(String(b.value || "0").replace(/[^0-9.-]+/g, "")) || 0);
      return (valA - valB) * dir;
    }
    if (sortConfig.key === "winProbability") {
      return ((a.probability || 0) - (b.probability || 0)) * dir;
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedItems.length / rowsPerPage);
  const paginatedItems = sortedItems.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "High": return "bg-destructive/10 text-destructive border-destructive/20";
      case "Medium": return "bg-primary/10 text-primary border-primary/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="flex-auto flex flex-col min-h-0 relative gap-3.5 sm:gap-4">
      <div className="flex flex-col bg-card rounded-xl border border-border shadow-sm overflow-hidden flex-1">
        <CRMDataTable hasPagination={sortedItems.length > rowsPerPage} containerClassName="border-0 shadow-none rounded-none flex-auto h-full overflow-auto" className="w-full">
          <CRMTableHeader className="sticky top-0 z-20 bg-card border-b border-border/60">
            <CRMTableRow className="h-10 sm:h-11">
              <CRMTableHeaderCell className="bg-card">
                <DataTableColumnHeader
                  title="Deal Name"
                  sortable
                  sortDirection={sortConfig.key === "name" ? sortConfig.direction : null}
                  onSort={(dir) => handleSort("name", dir)}
                />
              </CRMTableHeaderCell>
              <CRMTableHeaderCell className="bg-card">
                <DataTableColumnHeader
                  title="Company"
                  sortable
                  sortDirection={sortConfig.key === "company" ? sortConfig.direction : null}
                  onSort={(dir) => handleSort("company", dir)}
                />
              </CRMTableHeaderCell>
              <CRMTableHeaderCell className="bg-card">
                <DataTableColumnHeader
                  title="Stage"
                  sortable
                  sortDirection={sortConfig.key === "stage" ? sortConfig.direction : null}
                  onSort={(dir) => handleSort("stage", dir)}
                />
              </CRMTableHeaderCell>
              <CRMTableHeaderCell className="bg-card">
                <DataTableColumnHeader
                  title="Priority"
                  sortable
                  sortDirection={sortConfig.key === "priority" ? sortConfig.direction : null}
                  onSort={(dir) => handleSort("priority", dir)}
                />
              </CRMTableHeaderCell>
              <CRMTableHeaderCell className="bg-card">
                <DataTableColumnHeader
                  title="Value"
                  sortable
                  sortDirection={sortConfig.key === "value" ? sortConfig.direction : null}
                  onSort={(dir) => handleSort("value", dir)}
                />
              </CRMTableHeaderCell>
              <CRMTableHeaderCell className="bg-card">
                <DataTableColumnHeader
                  title="Win Probability"
                  sortable
                  sortDirection={sortConfig.key === "winProbability" ? sortConfig.direction : null}
                  onSort={(dir) => handleSort("winProbability", dir)}
                />
              </CRMTableHeaderCell>
              <CRMTableHeaderCell className="text-right bg-card">Actions</CRMTableHeaderCell>
            </CRMTableRow>
          </CRMTableHeader>

          <CRMTableBody>
            {paginatedItems.map((item) => {
              const val = item.valueAmount ? formatCurrency(item.valueAmount) : formatCurrency(Number(String(item.value || "0").replace(/[^0-9.-]+/g,"")));

              return (
                <CRMTableRow 
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => onSelectDeal?.(item)}
                >
                  <CRMTableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-sm">{item.name}</span>
                      {item.isStuck && (
                        <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4 font-bold flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> Stuck
                        </Badge>
                      )}
                    </div>
                  </CRMTableCell>

                  <CRMTableCell>
                    <span className="text-xs font-semibold text-muted-foreground">{item.company || "—"}</span>
                  </CRMTableCell>

                  <CRMTableCell>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-muted/50">
                      {item.stage || "Lead"}
                    </Badge>
                  </CRMTableCell>

                  <CRMTableCell>
                    <Badge variant="outline" className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0 h-4", getPriorityColor(item.priority || "Low"))}>
                      {item.priority || "Low"}
                    </Badge>
                  </CRMTableCell>

                  <CRMTableCell>
                    <span className="font-bold text-foreground text-sm text-success">{val}</span>
                  </CRMTableCell>

                  <CRMTableCell>
                    <div className="flex items-center gap-2 max-w-[140px]">
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full",
                            item.probability > 70 ? 'bg-success' : item.probability > 30 ? 'bg-primary' : 'bg-muted-foreground'
                          )}
                          style={{ width: `${item.probability}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground">{item.probability}%</span>
                    </div>
                  </CRMTableCell>

                  <CRMTableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onSelectDeal?.(item)}>
                          <MessageSquare className="w-3.5 h-3.5 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <UserPlus className="w-3.5 h-3.5 mr-2" /> Assign Owner
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-primary focus:text-primary">
                          <Zap className="w-3.5 h-3.5 mr-2" /> AI Summary
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CRMTableCell>
                </CRMTableRow>
              );
            })}
          </CRMTableBody>
        </CRMDataTable>
      </div>

      <CRMPagination
        currentPage={currentPage}
        totalPages={totalPages || 1}
        totalItems={items.length}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={(size) => {
          setRowsPerPage(size);
          setCurrentPage(1);
        }}
        itemName="Deals"
        pageSizeOptions={[10, 25, 50, 100]}
      />
    </div>
  );
};
