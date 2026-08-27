"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useBulkDeleteCompanies } from "@/shared/hooks/use-crm";
import {
  MoreVertical,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit,
  X,
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
import { CRMPagination } from "@/shared/components/crm";
import { useCompanies } from "../hooks/useCompanies";

interface CompaniesTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  companies: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEdit?: (company: any) => void;
  onDelete?: (id: string) => void;
}

const statusVariantMap: Record<string, StatusVariant> = {
  "ACTIVE": "emerald",
  "INACTIVE": "neutral",
  "LEAD": "blue"
};

export const CompaniesTable = ({ companies, onEdit, onDelete }: CompaniesTableProps) => {
  const {
    sortedCompanies,
    selectedIds,
    handleSort,
    setSort,
    sortConfig,
    toggleSelectAll,
    toggleSelect,
  } = useCompanies(companies);

  const { mutate: bulkDelete } = useBulkDeleteCompanies();

  const columns = [
    {
      header: (
        <Checkbox 
          checked={selectedIds.length === companies.length && companies.length > 0}
          onCheckedChange={toggleSelectAll}
        />
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: (company: any) => (
        <Checkbox 
          checked={selectedIds.includes(company.id)}
          onCheckedChange={() => toggleSelect(company.id)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      className: "w-[50px]",
    },
    {
      header: "Company",
      sortable: true,
      sortDirection: sortConfig?.key === "name" ? (sortConfig.direction as "asc" | "desc") : null,
      onSort: (dir: import("@/shared/components/DataTableColumnHeader").SortDirection) => setSort("name", dir),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: (company: any) => (
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9 rounded-xl border border-border bg-muted">
            <AvatarFallback className="font-bold text-[10px]">
              {company.name ? company.name.substring(0, 2).toUpperCase() : "CO"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span
              onClick={() => onEdit?.(company)}
              className="text-sm font-bold text-foreground leading-none mb-1 hover:text-primary cursor-pointer transition-colors"
            >
              {company.name}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{company.industry || "No Industry"}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      align: "left" as const,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: (company: any) => (
        <StatusBadge 
          status={company.status || "ACTIVE"} 
          variant={statusVariantMap[company.status] || "emerald"} 
        />
      ),
    },
    {
      header: "Customers",
      align: "right" as const,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: (company: any) => {
        const count = company._count?.customers || 0;
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{count}</span>
          </div>
        );
      },
    },
    {
      header: "Deals",
      align: "right" as const,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: (company: any) => {
        const count = company._count?.deals || 0;
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{count}</span>
          </div>
        );
      },
    },
    {
      header: "Actions",
      align: "right" as const,
      headerClassName: "text-right",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: (company: any) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                <MoreVertical className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEdit?.(company)}>
                <AppIcon name="edit" size={14} className="mr-2" /> Edit Company
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-rose-600 focus:text-rose-600"
                onClick={() => onDelete?.(company.id)}
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

  const totalPages = Math.ceil(sortedCompanies.length / rowsPerPage);
  const paginatedCompanies = sortedCompanies.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="flex-auto flex flex-col min-h-0 relative gap-3.5 sm:gap-4">
      <div className="flex flex-col min-h-0 flex-1">
        <DataTable 
          data={paginatedCompanies}
          columns={columns}
          rowClassName="h-16 hover:bg-muted/30 transition-colors"
          onRowClick={(row) => onEdit?.(row)}
          hasPagination={sortedCompanies.length > rowsPerPage}
        />
      </div>

      <CRMPagination
        currentPage={currentPage}
        totalPages={totalPages || 1}
        totalItems={sortedCompanies.length}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={(size) => {
          setRowsPerPage(size);
          setCurrentPage(1);
        }}
        itemName="Companies"
        pageSizeOptions={[10, 25, 50, 100]}
      />

      {/* Bulk Action Toolbar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 50, opacity: 0, x: "-50%" }}
            animate={{ y: 0, opacity: 1, x: "-50%" }}
            exit={{ y: 50, opacity: 0, x: "-50%" }}
            className="fixed bottom-8 left-1/2 z-50 w-[90%] md:w-auto"
          >
            <div className="bg-foreground text-background rounded-xl px-6 py-4 shadow-premium flex flex-col md:flex-row items-center gap-4 md:gap-6 border border-border/10 backdrop-blur-xl">
               <div className="flex items-center gap-3 md:pr-6 md:border-r border-background/20 w-full md:w-auto justify-between md:justify-start">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground text-xs shadow-sm">
                      {selectedIds.length}
                    </div>
                    <span className="text-xs font-bold whitespace-nowrap">Companies Selected</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="h-8 w-8 p-0 md:hidden text-muted hover:text-background"
                  >
                    <AppIcon name="close" size={16} />
                  </Button>
               </div>
               <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-background/10 h-9 whitespace-nowrap text-rose-400 hover:text-rose-300 gap-1.5"
                    onClick={() => {
                      bulkDelete(selectedIds, {
                        onSuccess: () => {
                          toast.success("Companies deleted successfully");
                          toggleSelectAll();
                        }
                      });
                    }}
                  >
                    <AppIcon name="trash" size={16} className="text-rose-400" /> <span>Delete Selected</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="h-9 w-9 p-0 hidden md:flex text-muted hover:text-background"
                  >
                    <AppIcon name="close" size={16} />
                  </Button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
