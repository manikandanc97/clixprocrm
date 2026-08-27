"use client";

import { useState } from "react";
import { Edit, Trash2, Mail, ExternalLink, Calendar, Building2, Banknote } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { StatusBadge, StatusVariant } from "@/shared/components/StatusBadge";
import { CRMPagination } from "@/shared/components/crm";
import { motion } from "framer-motion";
import { formatCurrency, formatDate } from "@/lib/crm-formatters";
import { useCRMStore } from "@/shared/store/useCRMStore";

interface DealsGridProps {
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

export const DealsGrid = ({ deals, onEdit, onDelete }: DealsGridProps) => {
  const currency = useCRMStore((state) => state.currency);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  const totalPages = Math.ceil(deals.length / rowsPerPage) || 1;
  const paginatedDeals = deals.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-3.5 sm:gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 lg:p-6 bg-muted/20">
        {paginatedDeals.map((deal, i) => {
          const stage = deal.stage || "NEW";
          
          return (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative bg-card rounded-xl border border-border p-5 hover:shadow-md transition-all hover:border-primary/20 flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 rounded-xl border border-border shadow-sm bg-muted/50">
                    <AvatarFallback className="font-bold text-sm">
                      {deal.name ? deal.name.substring(0, 2).toUpperCase() : "DL"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{deal.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span className="truncate">{deal.company?.name || "No Company"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between">
                <StatusBadge status={stage} variant={stageVariantMap[stage] || "blue"} />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5 mt-auto">
                <div className="bg-muted/50 rounded-lg p-2.5 flex flex-col">
                  <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Value</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{formatCurrency(deal.value, currency)}</span>
                </div>
                <div className="bg-muted/50 rounded-lg p-2.5 flex flex-col">
                  <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Expected</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : "-"}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                    <Mail className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="h-8 text-xs font-semibold"
                    onClick={() => onEdit?.(deal)}
                  >
                    <Edit className="w-3 h-3 mr-1.5" /> Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete?.(deal.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <CRMPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={deals.length}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={(size) => {
          setRowsPerPage(size);
          setCurrentPage(1);
        }}
        itemName="Deals"
        pageSizeOptions={[12, 24, 48, 96]}
      />
    </div>
  );
};
