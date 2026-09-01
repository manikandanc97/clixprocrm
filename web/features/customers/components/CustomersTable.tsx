"use client";

import { useState } from "react";
import {
  MoreVertical, 
  Mail, 
  ExternalLink,
  User,
  TrendingUp,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { CustomerType } from "@/shared/types/customer";
import { Checkbox } from "@/shared/ui/checkbox";
import { DataTable } from "@/shared/components/DataTable";
import { StatusBadge, StatusVariant } from "@/shared/components/StatusBadge";
import { CRMPagination, TruncatedText, CRMActionMenu } from "@/shared/components/crm";
import { useCustomers } from "../hooks/useCustomers";
import { useBulkDeleteCustomers } from "@/shared/hooks/use-crm";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface CustomersTableProps {
  customers: CustomerType[];
  onEdit?: (customer: CustomerType) => void;
  onDelete?: (id: string) => void;
}

const statusVariantMap: Record<string, StatusVariant> = {
  "ACTIVE": "emerald",
  "PREMIUM": "indigo",
  "INACTIVE": "neutral",
};

export const CustomersTable = ({ customers, onEdit, onDelete }: CustomersTableProps) => {
  const {
    sortedCustomers,
    selectedIds,
    handleSort,
    setSort,
    sortConfig,
    toggleSelectAll,
    toggleSelect,
  } = useCustomers(customers);
  const { mutate: bulkDelete } = useBulkDeleteCustomers();

  const columns = [
    {
      header: (
        <Checkbox 
          checked={selectedIds.length === customers.length && customers.length > 0}
          onCheckedChange={toggleSelectAll}
        />
      ),
      cell: (customer: CustomerType) => (
        <Checkbox 
          checked={selectedIds.includes(customer.id)}
          onCheckedChange={() => toggleSelect(customer.id)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      className: "w-[50px]",
    },
    {
      header: "Customer",
      sortable: true,
      sortDirection: sortConfig?.key === "name" ? (sortConfig.direction as "asc" | "desc") : null,
      onSort: (dir: import("@/shared/components/DataTableColumnHeader").SortDirection) => setSort("name", dir),
      cell: (customer: CustomerType) => (
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9 rounded-xl border border-border">
            <AvatarImage src={""} />
            <AvatarFallback className="font-bold text-[10px]">{customer.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 max-w-[200px]">
            <TruncatedText
              text={customer.name}
              lines={1}
              onClick={() => onEdit?.(customer)}
              className="text-sm font-bold text-foreground leading-none mb-1 hover:text-primary cursor-pointer transition-colors"
            />
            <TruncatedText
              text={customer.company}
              lines={1}
              className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider"
            />
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (customer: CustomerType) => (
        <StatusBadge 
          status={customer.status} 
          variant={statusVariantMap[customer.status]} 
        />
      ),
    },
    {
      header: "Revenue (LTV)",
      align: "right" as const,
      sortable: true,
      sortDirection: sortConfig?.key === "revenueValue" ? (sortConfig.direction as "asc" | "desc") : null,
      onSort: (dir: import("@/shared/components/DataTableColumnHeader").SortDirection) => setSort("revenueValue", dir),
      cell: (customer: CustomerType) => {
        const revenueNum = typeof customer.revenueValue === "number" ? customer.revenueValue : (parseFloat(String(customer.revenue || "0")) || 0);
        const formatted = revenueNum >= 1_00_000
          ? `₹${(revenueNum / 1_00_000).toFixed(1)}L`
          : revenueNum >= 1000
          ? `₹${(revenueNum / 1000).toFixed(1)}K`
          : `₹${revenueNum.toLocaleString("en-IN")}`;
        return (
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-foreground">{revenueNum > 0 ? formatted : <span className="text-muted-foreground text-xs">—</span>}</span>
            {revenueNum > 0 && (
              <div className="flex items-center justify-end gap-1 text-[9px] font-black text-emerald-600 uppercase">
                <TrendingUp className="size-3" /> Lifetime Value
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: "Account Health",
      cell: (customer: CustomerType) => {
        const statusScore: Record<string, number> = { "PREMIUM": 90, "ACTIVE": 65, "INACTIVE": 25 };
        const score = customer.healthScore ?? statusScore[customer.status] ?? 50;
        const color = score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-rose-500";
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground">{score}%</span>
          </div>
        );
      },
    },
    {
      header: "Actions",
      align: "right" as const,
      headerClassName: "text-right",
      cell: (customer: CustomerType) => (
        <CRMActionMenu
          items={[
            {
              label: "Edit Customer",
              icon: "edit",
              onClick: () => onEdit?.(customer),
            },
            ...(customer.email
              ? [
                  {
                    label: "Send Email",
                    icon: "mail",
                    onClick: () => window.open(`mailto:${customer.email}`),
                  },
                ]
              : []),
            {
              label: "Open Portal",
              icon: "externalLink",
            },
            {
              label: "Delete",
              icon: "trash",
              variant: "destructive" as const,
              separatorBefore: true,
              onClick: () => onDelete?.(customer.id),
            },
          ]}
        />
      ),
      className: "text-right",
    },
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const totalPages = Math.ceil(sortedCustomers.length / rowsPerPage);
  const paginatedCustomers = sortedCustomers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col w-full relative gap-3.5 sm:gap-4">
      <div className="flex flex-col min-h-0 flex-1">
        <DataTable 
          data={paginatedCustomers}
          columns={columns}
          rowClassName="h-16 hover:bg-muted/30 transition-colors"
          onRowClick={() => {}}
          hasPagination={sortedCustomers.length > rowsPerPage}
        />
      </div>

      <CRMPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={sortedCustomers.length}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={(size) => {
          setRowsPerPage(size);
          setCurrentPage(1);
        }}
        itemName="Customers"
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
                    <span className="text-xs font-bold whitespace-nowrap">Customers Selected</span>
                  </div>
               </div>
               <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   className="hover:bg-background/10 h-9 whitespace-nowrap text-rose-400 hover:text-rose-300 gap-1.5" 
                   onClick={() => {
                     if (confirm(`Are you sure you want to delete ${selectedIds.length} customers?`)) {
                       bulkDelete(selectedIds, {
                         onSuccess: () => {
                           toast.success(`${selectedIds.length} customers deleted.`);
                           toggleSelectAll();
                         }
                       });
                     }
                   }}
                 >
                   <AppIcon name="trash" size={15} className="text-rose-400" /> <span>Delete</span>
                 </Button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};




