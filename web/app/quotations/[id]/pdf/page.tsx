"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuotations } from "@/shared/hooks/use-crm";
import { useWorkspace } from "@/shared/hooks/use-settings";
import { useCurrency } from "@/shared/hooks/use-currency";
import { QuotationType } from "@/shared/types/quotation";
import { Button } from "@/shared/ui/button";
import { Printer, Download, X, ZoomIn, ZoomOut, Maximize, FileText } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";

export default function QuotationPdfPage() {
  const params = useParams();
  const quoteId = params.id as string;
  
  const { data, isLoading } = useQuotations();
  const { data: workspaceData, isLoading: isWorkspaceLoading } = useWorkspace();
  const { formatCurrency } = useCurrency();
  
  const [quotation, setQuotation] = useState<QuotationType | null>(null);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (data?.quotations) {
      const q = data.quotations.find((q) => q.id === quoteId || q.quoteId === quoteId);
      if (q) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setQuotation(q);
        document.title = `Quotation-${q.quoteId}.pdf`;
      }
    }
  }, [data, quoteId]);

  if (isLoading || isWorkspaceLoading || !quotation) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground font-bold animate-pulse">Loading Document...</p>
        </div>
      </div>
    );
  }

  const items = quotation.items || [];
  // Use explicit Number() coercion to handle Prisma Decimal and JSON storage safely
  const subtotal = items.reduce((sum: number, item: ReturnType<typeof JSON.parse>) => sum + (Number(item.quantity || 0) * Number(item.price || 0)), 0);
  const taxRaw = Number(quotation.tax || 0);
  const discountRaw = Number(quotation.discount || 0);
  // Tax stored as absolute amount per database; if > 1 assume it is percentage and compute
  const taxAmount = taxRaw > 1 ? (subtotal * taxRaw) / 100 : taxRaw;
  const discountAmount = discountRaw > 1 ? (subtotal * discountRaw) / 100 : discountRaw;
  const total = Math.round((subtotal + taxAmount - discountAmount) * 100) / 100;

  const handlePrint = () => {
    window.print();
  };

  const workspace = (workspaceData || {}) as ReturnType<typeof JSON.parse>;

  return (
    <div className="min-h-screen bg-slate-900/40 flex flex-col items-center print:min-h-0 print:bg-white print:block">
      
      {/* Interactive Toolbar (Hidden during print) */}
      <div className="print:hidden sticky top-0 w-full bg-slate-900 text-white shadow-xl z-50 flex flex-wrap items-center justify-between px-6 py-3 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.close()} aria-label="Close" className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-full h-9 w-9">
            <X className="w-5 h-5" />
          </Button>
          <div className="h-6 w-px bg-slate-700" />
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-wide">Quotation-{quotation.quoteId}.pdf</span>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{quotation.client}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          <div className="flex items-center bg-slate-800 rounded-lg p-1 mr-4">
            <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(50, z - 10))} aria-label="Zoom out" className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-700">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs font-bold w-12 text-center text-slate-200">{zoom}%</span>
            <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(200, z + 10))} aria-label="Zoom in" className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-700">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <div className="w-px h-4 bg-slate-600 mx-1" />
            <Button variant="ghost" size="icon" onClick={() => setZoom(100)} aria-label="Fit width" className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-700" title="Fit Width">
              <Maximize className="w-4 h-4" />
            </Button>
          </div>

          <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-5 rounded-lg shadow-sm">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={handlePrint} variant="outline" className="border-slate-700 text-slate-900 bg-white hover:bg-slate-100 font-bold h-10 px-5 rounded-lg shadow-sm hidden sm:flex">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* A4 Canvas Container */}
      <div 
        className="print:p-0 print:m-0 print:w-full print:bg-white overflow-auto flex-1 w-full flex justify-center p-8 pb-[100px] print:pb-0 print:block"
      >
        
        {/* The PDF Page */}
        <div 
          className="bg-white text-slate-900 shadow-2xl relative transition-transform duration-200 origin-top print:!transform-none print:!shadow-none print:!w-full print:!min-h-[296mm]"
          style={{ 
            width: '210mm', 
            minHeight: '297mm', 
            transform: `scale(${zoom / 100})`,
            padding: '20mm',
            boxSizing: 'border-box'
          }}
        >
          {/* Header */}
          <header className="flex justify-between items-start mb-12 border-b-2 border-slate-900 pb-8 break-inside-avoid">
            <div className="max-w-[50%]">
              {workspace.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={workspace.logo} alt="Company Logo" className="h-12 object-contain mb-4" />
              )}
              {workspace.name && (
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{workspace.name}</h1>
              )}
              <h2 className="text-3xl font-black text-primary tracking-tight mt-6 uppercase">Quotation</h2>
              <p className="text-sm font-bold text-slate-500 tracking-widest mt-1">#{quotation.quoteId}</p>
            </div>
            
            <div className="text-right text-sm text-slate-600 space-y-1">
              {workspace.address && (
                <div className="whitespace-pre-wrap leading-relaxed">{workspace.address}</div>
              )}
              {(workspace as ReturnType<typeof JSON.parse>).phone && (
                <p className="font-medium text-slate-900">{(workspace as ReturnType<typeof JSON.parse>).phone}</p>
              )}
              {(workspace as ReturnType<typeof JSON.parse>).email && (
                <p className="font-medium text-slate-900">{(workspace as ReturnType<typeof JSON.parse>).email}</p>
              )}
              {(workspace as ReturnType<typeof JSON.parse>).website && (
                <p className="font-medium text-slate-900">{(workspace as ReturnType<typeof JSON.parse>).website}</p>
              )}
              {workspace.taxId && (
                <div className="pt-2">
                  <span className="font-bold text-slate-400 text-xs uppercase tracking-wider">TAX ID / GST</span>
                  <p className="font-medium text-slate-900">{workspace.taxId}</p>
                </div>
              )}
            </div>
          </header>

          {/* Info Blocks (Dates & Customer) */}
          <div className="grid grid-cols-2 gap-12 mb-12 break-inside-avoid">
            
            {/* Customer Details */}
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-200 pb-2">Billed To</p>
              
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                {quotation.leadDetails?.name || quotation.client}
              </h3>
              
              {quotation.leadDetails?.company && quotation.leadDetails.company !== quotation.leadDetails.name && (
                <p className="font-semibold text-slate-700">{quotation.leadDetails.company}</p>
              )}
              
              {quotation.leadDetails?.email && (
                <p className="text-slate-600 text-sm mt-1">{quotation.leadDetails.email}</p>
              )}
              
              {quotation.leadDetails?.phone && (
                <p className="text-slate-600 text-sm">{quotation.leadDetails.phone}</p>
              )}
            </div>

            {/* Quote Details */}
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-200 pb-2">Quotation Details</p>
              
              <div className="grid grid-cols-2 gap-y-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Issue Date</p>
                  <p className="text-sm font-bold text-slate-900">
                    {new Date(quotation.validTill || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Valid Until</p>
                  <p className="text-sm font-bold text-slate-900">
                    {quotation.validTill}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                  <Badge variant="outline" className={cn(
                    "border-none px-2 py-0.5 rounded-sm font-bold text-[10px] uppercase tracking-widest bg-slate-100 text-slate-600",
                    quotation.status === "DRAFT" && "bg-slate-100 text-slate-700",
                    quotation.status === "ACCEPTED" && "bg-emerald-50 text-emerald-700",
                    quotation.status === "SENT" && "bg-blue-50 text-blue-700",
                    quotation.status === "REJECTED" && "bg-rose-50 text-rose-700",
                    quotation.status === "EXPIRED" && "bg-slate-800/10 text-slate-800"
                  )}>
                    {quotation.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Prepared By</p>
                  <p className="text-sm font-semibold text-slate-700">System</p>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-12 rounded-lg overflow-hidden border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 text-left font-black text-slate-500 uppercase tracking-widest text-[10px] w-12">#</th>
                  <th className="py-3 px-4 text-left font-black text-slate-500 uppercase tracking-widest text-[10px]">Description</th>
                  <th className="py-3 px-4 text-right font-black text-slate-500 uppercase tracking-widest text-[10px] w-24">Qty</th>
                  <th className="py-3 px-4 text-right font-black text-slate-500 uppercase tracking-widest text-[10px] w-32">Unit Price</th>
                  <th className="py-3 px-4 text-right font-black text-slate-500 uppercase tracking-widest text-[10px] w-32">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={idx} className="break-inside-avoid">
                    <td className="py-4 px-4 text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-4 px-4 font-semibold text-slate-900 break-words max-w-[200px]">{item.name}</td>
                    <td className="py-4 px-4 text-right font-medium text-slate-600">{item.quantity}</td>
                    <td className="py-4 px-4 text-right font-medium text-slate-600">{formatCurrency(item.price)}</td>
                    <td className="py-4 px-4 text-right font-bold text-slate-900">{formatCurrency(item.quantity * item.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end mb-16 break-inside-avoid">
            <div className="w-80 space-y-3">
              <div className="flex justify-between items-center text-sm px-2">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-xs">Subtotal</span>
                <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
              
              {taxAmount > 0 && (
                <div className="flex justify-between items-center text-sm px-2">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-xs">Tax</span>
                  <span className="font-bold text-slate-900">+{formatCurrency(taxAmount)}</span>
                </div>
              )}
              
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-sm px-2 text-rose-500">
                  <span className="font-bold uppercase tracking-wider text-xs">Discount</span>
                  <span className="font-bold">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              
              <div className="h-0.5 w-full bg-slate-900 my-4" />
              
              <div className="flex justify-between items-center px-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-base font-black text-slate-900 uppercase tracking-widest">Total</span>
                <span className="text-2xl font-black text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          {quotation.notes && (
            <div className="break-inside-avoid bg-slate-50 p-6 rounded-xl border border-slate-200 mb-12">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                Terms & Conditions
              </p>
              <div className="text-xs text-slate-700 leading-loose whitespace-pre-wrap font-medium">
                {quotation.notes}
              </div>
            </div>
          )}

          {/* Footer */}
          <footer className="absolute bottom-0 left-0 right-0 p-[20mm] pt-0">
            <div className="border-t-2 border-slate-100 pt-6 flex justify-between items-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Generated by {workspace.name || "CRM System"}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Thank you for your business.
              </p>
            </div>
          </footer>

        </div>
      </div>
      
      {/* Global Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            background-color: white !important;
          }
        }
      `}} />
    </div>
  );
}
