"use client";

import React, { useState } from "react";
import { QuotationType } from "@/shared/types/quotation";
import { Badge } from "@/shared/ui/badge";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { 
  MoreHorizontal, 
  FileText, 
  Send, 
  Download, 
  ExternalLink, 
  Trash2, 
  Copy,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit
} from "lucide-react";
import { useRouter } from "next/navigation";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/shared/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { CRMCard, CRMPagination } from "@/shared/components/crm";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";
import { useDeleteQuotation, useUpdateQuotationStatus } from "@/shared/hooks/use-crm";
import { useCurrency } from "@/shared/hooks/use-currency";
import QuotationPreview from "./QuotationPreview";

interface QuotationsGridProps {
  quotations: QuotationType[];
}

export const QuotationsGrid: React.FC<QuotationsGridProps> = ({ quotations }) => {
  const [selectedQuote, setSelectedQuote] = useState<QuotationType | null>(null);
  const [deletingQuote, setDeletingQuote] = useState<QuotationType | null>(null);
  const { mutate: deleteQuotationMutation } = useDeleteQuotation();
  const { mutate: updateStatusMutation } = useUpdateQuotationStatus();
  const { formatCurrency } = useCurrency();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const router = useRouter();

  const totalPages = Math.ceil(quotations.length / rowsPerPage);
  const paginatedQuotations = quotations.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleDelete = (quote: QuotationType) => {
    setDeletingQuote(quote);
  };

  const handleAction = (action: string, quote: QuotationType) => {
    if (action === "Download") {
      window.open(`/quotations/${quote.id}/pdf`, '_blank');
      return;
    }
    toast.info(`${action}: ${quote.quoteId}`, {
      description: `Initiating ${action.toLowerCase()} for ${quote.client}.`,
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-6">
        {paginatedQuotations.map((quote, idx) => (
          <CRMCard
            key={quote.id}
            delay={idx * 0.04}
            className="group relative flex flex-col justify-between p-5"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center border border-border">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-base tracking-tight cursor-pointer" onClick={() => setSelectedQuote(quote)}>
                      {quote.quoteId}
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{quote.client}</p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Badge variant="outline" className={cn(
                      "border-none px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-widest shadow-sm cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1 select-none",
                      quote.status === "DRAFT" && "bg-slate-500/10 text-slate-600 border-slate-500/20",
                      quote.status === "SENT" && "bg-blue-500/10 text-blue-600 border-blue-500/20",
                      quote.status === "ACCEPTED" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                      quote.status === "REJECTED" && "bg-rose-500/10 text-rose-600 border-rose-500/20",
                      quote.status === "EXPIRED" && "bg-slate-800/10 text-slate-700 border-slate-800/20",
                      !['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'].includes(quote.status) && 'bg-muted text-muted-foreground'
                    )}>
                      {quote.status}
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </Badge>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem onClick={() => updateStatusMutation({ id: quote.id, status: "DRAFT" })} className="text-xs font-semibold cursor-pointer">
                      <span className="w-2 h-2 rounded-full bg-slate-500 mr-2" /> Draft
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateStatusMutation({ id: quote.id, status: "SENT" })} className="text-xs font-semibold cursor-pointer">
                      <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" /> Sent
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateStatusMutation({ id: quote.id, status: "ACCEPTED" })} className="text-xs font-semibold cursor-pointer text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" /> Accepted
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateStatusMutation({ id: quote.id, status: "REJECTED" })} className="text-xs font-semibold cursor-pointer text-rose-600">
                      <span className="w-2 h-2 rounded-full bg-rose-500 mr-2" /> Rejected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateStatusMutation({ id: quote.id, status: "EXPIRED" })} className="text-xs font-semibold cursor-pointer">
                      <span className="w-2 h-2 rounded-full bg-slate-800 mr-2" /> Expired
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 space-y-3 mb-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Deal Value</span>
                  <span className="text-sm font-bold text-foreground">{formatCurrency(quote.amountValue)}</span>
                </div>

                <div className="h-px w-full bg-border/50" />

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-0.5">Deal</span>
                    <span className="text-xs font-bold text-foreground">{quote.leadName || quote.client}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-0.5">Expiry</span>
                    <span className="text-xs font-bold text-muted-foreground">{quote.validTill}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                  <Avatar className="w-5 h-5 border border-border">
                    <AvatarFallback className="text-[9px]">OS</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-semibold text-muted-foreground">System</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                  <DropdownMenuItem onClick={() => setSelectedQuote(quote)} className="text-xs font-medium cursor-pointer">
                    <ExternalLink className="w-3.5 h-3.5 mr-2" /> View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAction("Email", quote)} className="text-xs font-medium cursor-pointer">
                    <Send className="w-3.5 h-3.5 mr-2" /> Send to Client
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAction("Download", quote)} className="text-xs font-medium cursor-pointer">
                    <Download className="w-3.5 h-3.5 mr-2" /> Download PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(`?edit=${quote.id}`)} className="text-xs font-medium cursor-pointer">
                    <Edit className="w-3.5 h-3.5 mr-2" /> Edit Quote
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleAction("Duplicate", quote)} className="text-xs font-medium cursor-pointer">
                    <Copy className="w-3.5 h-3.5 mr-2" /> Duplicate Quote
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(quote)} className="text-xs font-medium cursor-pointer text-destructive focus:text-destructive">
                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Quote
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CRMCard>
        ))}
      </div>

      <CRMPagination
        currentPage={currentPage}
        totalPages={totalPages || 1}
        totalItems={quotations.length}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={(size) => {
          setRowsPerPage(size);
          setCurrentPage(1);
        }}
        itemName="Quotes"
        pageSizeOptions={[12, 24, 48, 96]}
      />

      <QuotationPreview 
        quotation={selectedQuote}
        isOpen={!!selectedQuote}
        onClose={() => setSelectedQuote(null)}
      />

      <AlertDialog open={!!deletingQuote} onOpenChange={(open) => !open && setDeletingQuote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the quotation <strong>{deletingQuote?.quoteId}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              variant="destructive" 
              onClick={() => {
                if (deletingQuote) {
                  deleteQuotationMutation(deletingQuote.id);
                  setDeletingQuote(null);
                }
              }}
            >
              Delete Quotation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
