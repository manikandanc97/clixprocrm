"use client";

import { 
  Badge 
} from "@/shared/ui/badge";
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
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit,
  Check,
  X
} from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
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
import { QuotationType } from "@/shared/types/quotation";
import { AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import QuotationPreview from "./QuotationPreview";
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
import { toast } from "sonner";
import { useDeleteQuotation, useUpdateQuotationStatus } from "@/shared/hooks/use-crm";
import { useCurrency } from "@/shared/hooks/use-currency";

interface QuotationsTableProps {
  quotations: QuotationType[];
}

type SortConfig = {
  key: keyof QuotationType;
  direction: "asc" | "desc";
} | null;

const QuotationsTable = ({ quotations }: QuotationsTableProps) => {
  const [selectedQuote, setSelectedQuote] = useState<QuotationType | null>(null);
  const [deletingQuote, setDeletingQuote] = useState<QuotationType | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const { mutate: deleteQuotationMutation } = useDeleteQuotation();
  const { mutate: updateStatusMutation } = useUpdateQuotationStatus();
  const { formatCurrency } = useCurrency();

  const sortedQuotations = useMemo(() => {
    if (!sortConfig) return quotations;
    return [...quotations].sort((a, b) => {
      let aVal: string | number = (a[sortConfig.key] as string | number) ?? "";
      let bVal: string | number = (b[sortConfig.key] as string | number) ?? "";
      
      if (sortConfig.key === "amount" as keyof QuotationType) {
        aVal = a.amountValue ?? 0;
        bVal = b.amountValue ?? 0;
      }
      
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [quotations, sortConfig]);

  const handleSort = (key: keyof QuotationType) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        return null;
      }
      return { key, direction: "asc" };
    });
  };

  const handleDelete = (e: React.MouseEvent | Event, quote: QuotationType) => {
    e.stopPropagation();
    setDeletingQuote(quote);
  };

  const handleAction = (action: string, quote: QuotationType) => {
    if (action === "Download") {
      window.open(`/quotations/${quote.id}/pdf`, '_blank');
      return;
    }
    if (action === "MarkSent") {
      updateStatusMutation({ id: quote.id, status: "SENT" });
      return;
    }
    if (action === "MarkAccepted") {
      updateStatusMutation({ id: quote.id, status: "ACCEPTED" });
      return;
    }
    if (action === "MarkRejected") {
      updateStatusMutation({ id: quote.id, status: "REJECTED" });
      return;
    }
    toast.info(`${action} clicked for ${quote.quoteId}`);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const router = useRouter();

  const totalPages = Math.ceil(sortedQuotations.length / rowsPerPage);
  const paginatedQuotations = sortedQuotations.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="flex-auto flex flex-col min-h-0 relative gap-3.5 sm:gap-4">
      <div className="flex flex-col bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <CRMDataTable containerClassName="border-0 shadow-none rounded-none w-full" className="w-full">
        <CRMTableHeader className="sticky top-0 z-20 bg-card border-b border-border/60">
          <CRMTableRow className="h-10 sm:h-11">
            <CRMTableHeaderCell 
              className="hidden sm:table-cell cursor-pointer group select-none"
              onClick={() => handleSort("quoteId")}
            >
              <div className="flex items-center gap-1.5">
                Quote No <CRMSortIndicator active={sortConfig?.key === "quoteId"} direction={sortConfig?.direction} />
              </div>
            </CRMTableHeaderCell>
            <CRMTableHeaderCell 
              className="cursor-pointer group select-none bg-card"
              onClick={() => handleSort("client")}
            >
              <div className="flex items-center gap-1.5">
                Customer <CRMSortIndicator active={sortConfig?.key === "client"} direction={sortConfig?.direction} />
              </div>
            </CRMTableHeaderCell>
            <CRMTableHeaderCell className="hidden md:table-cell bg-card">
              Related Deal
            </CRMTableHeaderCell>
            <CRMTableHeaderCell 
              className="hidden md:table-cell cursor-pointer group select-none"
              onClick={() => handleSort("amount")}
            >
              <div className="flex items-center gap-1.5">
                Quote Value <CRMSortIndicator active={sortConfig?.key === "amount"} direction={sortConfig?.direction} />
              </div>
            </CRMTableHeaderCell>
            <CRMTableHeaderCell 
              className="cursor-pointer group select-none bg-card"
              onClick={() => handleSort("status")}
            >
              <div className="flex items-center gap-1.5">
                Status <CRMSortIndicator active={sortConfig?.key === "status"} direction={sortConfig?.direction} />
              </div>
            </CRMTableHeaderCell>
            <CRMTableHeaderCell className="hidden lg:table-cell bg-card">Valid Until</CRMTableHeaderCell>
            <CRMTableHeaderCell className="hidden xl:table-cell bg-card">Owner</CRMTableHeaderCell>
            <CRMTableHeaderCell className="hidden xl:table-cell bg-card">Last Updated</CRMTableHeaderCell>
            <CRMTableHeaderCell className="text-right bg-card">Actions</CRMTableHeaderCell>
          </CRMTableRow>
        </CRMTableHeader>

        <CRMTableBody>
          <AnimatePresence mode="popLayout">
            {paginatedQuotations.map((quote) => (
              <CRMTableRow
                key={quote.id}
                onClick={() => setSelectedQuote(quote)}
              >
                <CRMTableCell className="hidden sm:table-cell">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center border border-border transition-colors">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm tracking-tight transition-colors">{quote.quoteId}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">May 2026</p>
                    </div>
                  </div>
                </CRMTableCell>

                <CRMTableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9 rounded-lg border border-border bg-muted flex items-center justify-center font-bold text-xs">
                      <AvatarFallback>
                        {quote.client.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground text-sm tracking-tight">{quote.client}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">{"System"}</span>
                        <span className="hidden sm:inline w-1 h-1 rounded-full bg-border" />
                        <span className="hidden sm:inline text-[9px] font-bold text-primary uppercase tracking-wider">VIP</span>
                      </div>
                    </div>
                  </div>
                </CRMTableCell>

                <CRMTableCell className="hidden md:table-cell">
                  <span className="font-semibold text-foreground text-sm">{quote.leadName || quote.client}</span>
                </CRMTableCell>

                <CRMTableCell className="hidden md:table-cell">
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground text-sm tracking-tight">{formatCurrency(quote.amountValue)}</span>
                  </div>
                </CRMTableCell>

                <CRMTableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Badge variant="outline" className={cn(
                        "border-none px-3 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-widest shadow-sm cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1 w-fit select-none",
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
                    <DropdownMenuContent align="start" className="w-36">
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
                </CRMTableCell>

                <CRMTableCell className="hidden lg:table-cell">
                  <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">{quote.validTill}</span>
                </CRMTableCell>

                <CRMTableCell className="hidden xl:table-cell">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6 border border-border">
                      <AvatarFallback className="text-[10px]">OS</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-muted-foreground">System</span>
                  </div>
                </CRMTableCell>

                <CRMTableCell className="hidden xl:table-cell">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium whitespace-nowrap">{quote.lastActivity}</span>
                  </div>
                </CRMTableCell>

                <CRMTableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setSelectedQuote(quote)}>
                        <AppIcon name="view" size={14} className="mr-2" /> View Details
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => router.push(`?edit=${quote.id}`)}>
                        <AppIcon name="edit" size={14} className="mr-2" /> Edit Quote
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => handleAction("Download", quote)}>
                        <AppIcon name="download" size={14} className="mr-2" /> Download PDF
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={() => handleAction("Duplicate", quote)}>
                        <AppIcon name="copy" size={14} className="mr-2" /> Duplicate
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {quote.status !== "SENT" && (
                        <DropdownMenuItem onClick={() => updateStatusMutation({ id: quote.id, status: "SENT" })}>
                          <AppIcon name="send" size={14} className="mr-2" /> Mark as Sent
                        </DropdownMenuItem>
                      )}
                      {quote.status !== "ACCEPTED" && (
                        <DropdownMenuItem onClick={() => updateStatusMutation({ id: quote.id, status: "ACCEPTED" })} className="text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50">
                          <AppIcon name="check" size={14} className="mr-2 text-emerald-600" /> Mark as Accepted
                        </DropdownMenuItem>
                      )}
                      {quote.status !== "REJECTED" && (
                        <DropdownMenuItem onClick={() => updateStatusMutation({ id: quote.id, status: "REJECTED" })} className="text-rose-600 focus:text-rose-600 focus:bg-rose-50">
                          <AppIcon name="close" size={14} className="mr-2 text-rose-600" /> Mark as Rejected
                        </DropdownMenuItem>
                      )}
                      {quote.status !== "DRAFT" && (
                        <DropdownMenuItem onClick={() => updateStatusMutation({ id: quote.id, status: "DRAFT" })}>
                          <AppIcon name="quotations" size={14} className="mr-2" /> Mark as Draft
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => handleDelete(e, quote)} variant="destructive">
                        <AppIcon name="trash" size={14} className="mr-2 text-destructive" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CRMTableCell>
              </CRMTableRow>
            ))}
          </AnimatePresence>
        </CRMTableBody>
      </CRMDataTable>
      </div>

      {/* Pagination */}
      <CRMPagination
        currentPage={currentPage}
        totalPages={totalPages || 1}
        totalItems={sortedQuotations.length}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={(size) => {
          setRowsPerPage(size);
          setCurrentPage(1);
        }}
        itemName="Quotes"
        pageSizeOptions={[10, 25, 50, 100]}
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

export default QuotationsTable;
