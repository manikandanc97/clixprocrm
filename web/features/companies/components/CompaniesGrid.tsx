"use client";

import { useState } from "react";
import { Building2, Edit, Trash2, Mail, ExternalLink, Users, Briefcase } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { StatusBadge, StatusVariant } from "@/shared/components/StatusBadge";
import { CRMPagination } from "@/shared/components/crm";
import { motion } from "framer-motion";

interface CompaniesGridProps {
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

export const CompaniesGrid = ({ companies, onEdit, onDelete }: CompaniesGridProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  const totalPages = Math.ceil(companies.length / rowsPerPage) || 1;
  const paginatedCompanies = companies.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-3.5 sm:gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 lg:p-6 bg-muted/20">
        {paginatedCompanies.map((company, i) => {
          const status = company.status || "ACTIVE";
          const customerCount = company._count?.customers || 0;
          const dealCount = company._count?.deals || 0;
          
          return (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative bg-card rounded-xl border border-border p-5 hover:shadow-md transition-all hover:border-primary/20 flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 rounded-xl border border-border shadow-sm bg-muted/50">
                    <AvatarFallback className="font-bold text-sm">
                      {company.name ? company.name.substring(0, 2).toUpperCase() : "CO"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{company.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span className="truncate">{company.industry || "No Industry"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <StatusBadge status={status} variant={statusVariantMap[status] || "emerald"} />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5 mt-auto">
                <div className="bg-muted/50 rounded-lg p-2.5 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground font-medium">Customers</span>
                    <span className="text-sm font-bold text-foreground">{customerCount}</span>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-2.5 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-purple-500/10 flex items-center justify-center">
                    <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground font-medium">Deals</span>
                    <span className="text-sm font-bold text-foreground">{dealCount}</span>
                  </div>
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
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                    onClick={() => onDelete?.(company.id)}
                  >
                    <Trash2 className="w-3 h-3 mr-1.5" /> Delete
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="h-8 text-xs font-semibold"
                    onClick={() => onEdit?.(company)}
                  >
                    <Edit className="w-3 h-3 mr-1.5" /> Edit
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
        totalItems={companies.length}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={(size) => {
          setRowsPerPage(size);
          setCurrentPage(1);
        }}
        itemName="Companies"
        pageSizeOptions={[12, 24, 48, 96]}
      />
    </div>
  );
};
