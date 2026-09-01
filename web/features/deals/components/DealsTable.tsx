"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MoreVertical, 
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit
} from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/shared/ui/dropdown-menu";
import { Checkbox } from "@/shared/ui/checkbox";
import { DataTable } from "@/shared/components/DataTable";
import { StatusBadge, StatusVariant } from "@/shared/components/StatusBadge";
import { CRMPagination, TruncatedText } from "@/shared/components/crm";
import { useDealsLocal } from "../hooks/useDealsLocal";
import { formatCurrency, formatDate } from "@/lib/crm-formatters";
import { useCRMStore } from "@/shared/store/useCRMStore";

interface DealsTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deals: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEdit?: (deal: any) => void;
  onDelete?: (id: string) => void;
}

const stageVariantMap: Record<string, StatusVariant> = {
  "WON": "emerald",
  "LOST": "rose",
  "NEW": "blue",
  "QUALIFIED": "indigo",
  "PROPOSAL": "purple",
  "NEGOTIATION": "amber"
};

export const DealsTable = ({ deals, onEdit, onDelete }: DealsTableProps) => {
  const currency = useCRMStore((state) => state.currency);
  const {
    sortedDeals,
    selectedIds,
    handleSort,
    setSort,
    sortConfig,
    toggleSelectAll,
    toggleSelect,
  } = useDealsLocal(deals);

  const columns = [
    {
      header: (
        <Checkbox 
          checked={selectedIds.length === deals.length && deals.length > 0}
          onCheckedChange={toggleSelectAll}
        />
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: (deal: any) => (
        <Checkbox 
          checked={selectedIds.includes(deal.id)}
          onCheckedChange={() => toggleSelect(deal.id)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      className: "w-[50px]",
    },
    {
      header: "Deal Name",
      sortable: true,
      sortDirection: sortConfig?.key === "name" ? (sortConfig.direction as "asc" | "desc") : null,
      onSort: (dir: import("@/shared/components/DataTableColumnHeader").SortDirection) => setSort("name", dir),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: (deal: any) => (
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9 rounded-xl border border-border bg-muted/50">
            <AvatarFallback className="font-bold text-[10px]">
              {deal.name ? deal.name.substring(0, 2).toUpperCase() : "DL"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 max-w-[200px]">
            <TruncatedText
              text={deal.name}
              lines={1}
              onClick={() => onEdit?.(deal)}
              className="text-sm font-bold text-foreground leading-none mb-1 hover:text-primary cursor-pointer transition-colors"
            />
            <TruncatedText
              text={deal.company?.name || "No Company"}
              lines={1}
              className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider"
            />
          </div>
        </div>
      ),
    },
    {
      header: "Value",
      align: "right" as const,
      sortable: true,
      sortDirection: sortConfig?.key === "value" ? (sortConfig.direction as "asc" | "desc") : null,
      onSort: (dir: import("@/shared/components/DataTableColumnHeader").SortDirection) => setSort("value", dir),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: (deal: any) => {
        return (
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-foreground">{formatCurrency(deal.value, currency)}</span>
          </div>
        );
      },
    },
    {
      header: "Stage",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: (deal: any) => (
        <StatusBadge 
          status={deal.stage || "NEW"} 
          variant={stageVariantMap[deal.stage] || "blue"} 
        />
      ),
    },
    {
      header: "Close Date",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: (deal: any) => {
        return (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            {deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : "-"}
          </div>
        );
      },
    },
    {
      header: "Actions",
      align: "right" as const,
      headerClassName: "text-right",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: (deal: any) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                <MoreVertical className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEdit?.(deal)}>
                <AppIcon name="edit" size={14} className="mr-2" /> Edit Deal
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-rose-600 focus:text-rose-600"
                onClick={() => onDelete?.(deal.id)}
              >
                <AppIcon name="trash" size={14} className="mr-2 text-rose-600" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      className: "text-right",
    },
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const totalPages = Math.ceil(sortedDeals.length / rowsPerPage);
  const paginatedDeals = sortedDeals.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col w-full relative gap-3.5 sm:gap-4">
      <div className="flex flex-col min-h-0 flex-1">
        <DataTable 
          data={paginatedDeals}
          columns={columns}
          rowClassName="h-16 hover:bg-muted/30 transition-colors"
          onRowClick={(row) => onEdit?.(row)}
          hasPagination={sortedDeals.length > rowsPerPage}
        />
      </div>

      <CRMPagination
        currentPage={currentPage}
        totalPages={totalPages || 1}
        totalItems={sortedDeals.length}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={(size) => {
          setRowsPerPage(size);
          setCurrentPage(1);
        }}
        itemName="Deals"
        pageSizeOptions={[10, 25, 50, 100]}
      />

      {/* Bulk Action Toolbar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-foreground text-background px-4 py-3 rounded-2xl shadow-xl flex items-center gap-4 border border-border/10">
              <div className="flex items-center gap-2 px-2 border-r border-background/20">
                <div className="bg-background/20 text-background text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center">
                  {selectedIds.length}
                </div>
                <span className="text-sm font-medium mr-2">selected</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 hover:bg-background/20 hover:text-background text-background/80"
                  onClick={toggleSelectAll}
                >
                  Clear
                </Button>
                <Button 
                  size="sm" 
                  className="h-8 bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-none border-none font-semibold px-4 rounded-xl gap-1.5"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${selectedIds.length} deals?`)) {
                      onDelete?.(selectedIds.join(','));
                      toggleSelectAll();
                    }
                  }}
                >
                  <AppIcon name="trash" size={15} className="text-destructive-foreground" /> <span>Delete</span>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
