"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import {
  FileText,
  Download,
  Clock,
  User,
  Printer,
  Copy,
  Trash2,
  Edit,
  Building,
  X,
  ChevronDown,
} from "lucide-react";
import { QuotationType } from "@/shared/types/quotation";
import { buildQuotationDuplicatePayload } from "@/features/quotations/utils/quotation-duplicate";
import { Separator } from "@/shared/ui/separator";
import { useCurrency } from "@/shared/hooks/use-currency";
import { useRouter } from "next/navigation";
import {
  useCreateQuotation,
  useDeleteQuotation,
  useUpdateQuotationStatus,
} from "@/shared/hooks/use-crm";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { useState, useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { StatusBadge } from "@/shared/components/StatusBadge";
import { getQuotationStatusVariant } from "@/features/quotations/utils/quotation-status";

// ─── Status options (drives the single dropdown implementation) ───────────────
const STATUS_OPTIONS = [
  { value: "DRAFT"    as const, label: "Draft",    dotClass: "bg-muted-foreground"                           },
  { value: "SENT"     as const, label: "Sent",     dotClass: "bg-info"                                       },
  { value: "ACCEPTED" as const, label: "Accepted", dotClass: "bg-success",     itemClass: "text-emerald-600" },
  { value: "REJECTED" as const, label: "Rejected", dotClass: "bg-destructive", itemClass: "text-rose-600"   },
  { value: "EXPIRED"  as const, label: "Expired",  dotClass: "bg-muted-foreground"                           },
] satisfies { value: QuotationType["status"]; label: string; dotClass: string; itemClass?: string }[];

// ─── Local status-change dropdown — rendered in two positions ─────────────────
interface QuotationStatusDropdownProps {
  status: QuotationType["status"];
  onSelect: (status: QuotationType["status"]) => void;
}

function QuotationStatusDropdown({ status, onSelect }: QuotationStatusDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Change quotation status"
          className="inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity select-none rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <StatusBadge status={status} variant={getQuotationStatusVariant(status)} />
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-36 z-50">
        {STATUS_OPTIONS.map(({ value, label, dotClass, itemClass }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => onSelect(value)}
            className={cn("text-xs font-semibold cursor-pointer", itemClass)}
          >
            <span className={cn("w-2 h-2 rounded-full shrink-0 mr-2", dotClass)} />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface QuotationPreviewProps {
  quotation: QuotationType | null;
  isOpen: boolean;
  onClose: () => void;
}

const QuotationPreview = ({ quotation, isOpen, onClose }: QuotationPreviewProps) => {
  const { formatCurrency } = useCurrency();
  const router = useRouter();
  const { mutate: createQuotation } = useCreateQuotation();
  const { mutate: deleteQuotationMutation } = useDeleteQuotation();
  const { mutate: updateStatusMutation } = useUpdateQuotationStatus();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  // ── Optimistic-display status (updates instantly on dropdown selection) ──────
  // Kept in sync with the incoming prop using the "previous prop" render-phase pattern
  // (no useEffect — avoids the setState-in-effect lint warning and cascading renders).
  const [localStatus, setLocalStatus] = useState<QuotationType["status"]>(
    quotation?.status ?? "DRAFT"
  );
  const prevQuotationKey = useRef<string | null>(null);
  const quotationKey = quotation ? `${quotation.id}:${quotation.status}` : null;
  if (quotationKey !== prevQuotationKey.current) {
    prevQuotationKey.current = quotationKey;
    if (quotation?.status) {
      setLocalStatus(quotation.status);
    }
  }

  if (!quotation) return null;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleEdit = () => {
    onClose();
    router.push(`/quotations?edit=${quotation.id}`);
  };

  const handleDuplicate = () => {
    setIsDuplicating(true);
    const payload = buildQuotationDuplicatePayload(quotation);

    createQuotation(payload, {
      onSuccess: (newQuote: ReturnType<typeof JSON.parse>) => {
        toast.success("Quotation duplicated successfully.");
        setIsDuplicating(false);
        onClose();
        if (newQuote && newQuote.id) {
          router.push(`/quotations?edit=${newQuote.id}`);
        }
      },
      onError: () => {
        setIsDuplicating(false);
      },
    });
  };

  const handleDelete = () => {
    setIsDeleting(true);
    deleteQuotationMutation(quotation.id, {
      onSuccess: () => {
        // Toast is owned by useDeleteQuotation in use-crm.ts — do not fire a second one here.
        setIsDeleting(false);
        setShowDeleteConfirm(false);
        onClose();
      },
      onError: () => {
        setIsDeleting(false);
      },
    });
  };

  const handleStatusChange = (newStatus: QuotationType["status"]) => {
    setLocalStatus(newStatus);
    updateStatusMutation({ id: quotation.id, status: newStatus });
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-2xl p-0 bg-muted border-none shadow-2xl overflow-y-auto max-h-[90vh] rounded-2xl sm:rounded-2xl"
        >
          {/* Accessible title — visually hidden, read by screen readers */}
          <DialogHeader className="sr-only">
            <DialogTitle>Quotation Preview: {quotation.quoteId}</DialogTitle>
            <DialogDescription>
              Detailed preview of quotation {quotation.quoteId} for {quotation.client}
            </DialogDescription>
          </DialogHeader>

          {/* ── Sticky header ──────────────────────────────────────────────── */}
          <div className="bg-card p-8 border-b border-border sticky top-0 z-20">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-100">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  {/*
                   * Visible quote-ID heading. Not a DialogTitle to avoid duplicate
                   * aria-level="2" landmarks — the sr-only DialogTitle above covers
                   * accessibility requirements.
                   */}
                  <p className="text-2xl font-black text-foreground tracking-tighter">
                    {quotation.quoteId}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <QuotationStatusDropdown
                      status={localStatus}
                      onSelect={handleStatusChange}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-xl text-muted-foreground hover:text-foreground"
                  onClick={() => window.print()}
                  title="Print"
                >
                  <Printer className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-xl text-muted-foreground hover:text-foreground"
                  onClick={onClose}
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Primary action — uses canonical default variant (bg-primary) */}
              <Button
                variant="default"
                className="rounded-xl h-12 font-bold"
                onClick={() => window.open(`/quotations/${quotation.id}/pdf`, "_blank")}
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button
                variant="outline"
                className="rounded-xl border-border h-12 font-bold text-foreground"
                onClick={handleEdit}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Quotation
              </Button>
            </div>
          </div>

          {/* ── Scrollable body ────────────────────────────────────────────── */}
          <div className="p-8 space-y-8">

            {/* Quotation Details */}
            <section className="bg-card rounded-xl p-6 border border-border shadow-sm">
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-emerald-500" />
                Quotation Details
              </h4>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Customer Name</p>
                  <p className="text-sm font-semibold text-foreground">{quotation.client}</p>
                </div>
                {quotation.leadName && quotation.leadName !== quotation.client && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Company / Deal</p>
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3 h-3 text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground">{quotation.leadName}</p>
                    </div>
                  </div>
                )}
                {quotation.lastActivity && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Created Date</p>
                    <p className="text-sm font-semibold text-foreground">{quotation.lastActivity}</p>
                  </div>
                )}
                {quotation.validTill && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Valid Until</p>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <p className="text-sm font-semibold text-foreground">{quotation.validTill}</p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                  <QuotationStatusDropdown
                    status={localStatus}
                    onSelect={handleStatusChange}
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Prepared By</p>
                  <p className="text-sm font-semibold text-foreground">System</p>
                </div>
              </div>

              {quotation.notes && (
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Notes</p>
                  {/* text-foreground replaces the previous theme-unaware text-slate-700 */}
                  <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{quotation.notes}</p>
                </div>
              )}
            </section>

            {/* Itemized Breakdown */}
            <section className="bg-card rounded-xl p-6 border border-border shadow-sm">
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-6">Line Items</h4>
              <div className="space-y-4">
                {quotation.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground font-bold text-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground font-medium">
                          Qty: {item.quantity} x {formatCurrency(item.price)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-black text-foreground">
                      {formatCurrency(item.quantity * item.price)}
                    </p>
                  </div>
                ))}

                <Separator className="my-4 bg-muted" />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground font-medium">
                    <span>Subtotal</span>
                    <span>{formatCurrency(quotation.amountValue)}</span>
                  </div>
                  {quotation.tax !== undefined && quotation.tax > 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground font-medium">
                      <span>Tax</span>
                      <span>+{formatCurrency(quotation.tax)}</span>
                    </div>
                  )}
                  {quotation.discount !== undefined && quotation.discount > 0 && (
                    /* text-destructive replaces the previous theme-unaware text-rose-500 */
                    <div className="flex justify-between text-sm text-destructive font-medium">
                      <span>Discount</span>
                      <span>-{formatCurrency(quotation.discount)}</span>
                    </div>
                  )}
                  <Separator className="my-2 bg-muted" />
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-base font-black text-foreground">Total Amount</span>
                    {/* text-success replaces the previous theme-unaware text-emerald-600 */}
                    <span className="text-2xl font-black text-success">
                      {formatCurrency(
                        quotation.amountValue + (quotation.tax || 0) - (quotation.discount || 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Footer Actions */}
            <div className="grid grid-cols-3 gap-4 pb-8">
              {/* hover:bg-muted replaces the previous dark-mode-broken hover:bg-white */}
              <Button
                variant="outline"
                className="rounded-xl border-border h-14 font-bold text-foreground hover:bg-muted shadow-sm transition-all group"
                onClick={handleDuplicate}
                disabled={isDuplicating}
              >
                <Copy className="w-4 h-4 mr-2 text-muted-foreground group-hover:text-muted-foreground" />
                {isDuplicating ? "Duplicating..." : "Duplicate"}
              </Button>
              <Button
                variant="outline"
                className="rounded-xl border-border h-14 font-bold text-foreground hover:bg-muted shadow-sm transition-all group"
                onClick={handleEdit}
              >
                <Edit className="w-4 h-4 mr-2 text-muted-foreground group-hover:text-muted-foreground" />
                Edit
              </Button>
              {/*
               * Redundant bg-rose-600 / hover:bg-rose-700 / text-white / hover:text-white
               * removed — variant="destructive" already provides correct styling.
               */}
              <Button
                variant="destructive"
                className="rounded-xl h-14 font-bold shadow-sm transition-all"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quotation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this quotation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            {/*
             * Redundant bg-rose-600 / hover:bg-rose-700 / focus:ring-rose-600 removed —
             * variant="destructive" owns those styles.
             */}
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default QuotationPreview;
