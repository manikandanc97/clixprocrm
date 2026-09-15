"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { Badge } from "@/shared/ui/badge";
import { Printer } from "lucide-react";

export interface InvoicePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTemplate: string;
  paperFormat: string;
  invoiceIdentifier: string;
  workspace?: { name?: string | null; logo?: string | null } | null;
  legalName: string;
  billingAddress: string;
  city: string;
  state: string;
  postalCode: string;
  gstin: string;
  pan: string;
  defaultPaymentTerms: string;
  showLogoOnPDF: boolean;
  showCustomerGstin: boolean;
  requireHsnSac: boolean;
  defaultTaxRate: string;
  showBankDetailsOnPDF: boolean;
  primaryBank?: {
    bankName?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  } | null;
  maskAccountNumber: (acc: string) => string;
  showUpiQrOnInvoice: boolean;
  showTaxBreakdownTable: boolean;
  enableRoundOff: boolean;
  defaultNotes: string;
  defaultTerms: string;
  showSignatureBlock: boolean;
}

export function InvoicePreviewModal({
  open,
  onOpenChange,
  selectedTemplate,
  paperFormat,
  invoiceIdentifier,
  workspace,
  legalName,
  billingAddress,
  city,
  state,
  postalCode,
  gstin,
  pan,
  defaultPaymentTerms,
  showLogoOnPDF,
  showCustomerGstin,
  requireHsnSac,
  defaultTaxRate,
  showBankDetailsOnPDF,
  primaryBank,
  maskAccountNumber,
  showUpiQrOnInvoice,
  showTaxBreakdownTable,
  enableRoundOff,
  defaultNotes,
  defaultTerms,
  showSignatureBlock,
}: InvoicePreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-0 rounded-2xl">
        <DialogHeader className="p-4 border-b border-border/80 bg-muted/20 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Printer className="w-4 h-4 text-primary" /> Live Invoice PDF Preview
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Layout template: <strong className="text-foreground">{selectedTemplate}</strong> • Paper: <strong className="text-foreground">{paperFormat}</strong>
            </DialogDescription>
          </div>
          <Badge variant="outline" className="text-xs font-mono text-primary border-primary/30">
            {invoiceIdentifier}
          </Badge>
        </DialogHeader>

        {/* High Fidelity Render Document */}
        <div className="p-6 bg-white text-slate-900 font-sans text-xs space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-5">
            <div className="space-y-1">
              {showLogoOnPDF && workspace?.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={workspace.logo} alt="Logo" className="h-10 object-contain mb-2" />
              )}
              <h2 className="text-base font-extrabold text-slate-950">
                {legalName || workspace?.name || "ClixPro Technologies Pvt Ltd"}
              </h2>
              <p className="text-[11px] text-slate-600 max-w-xs leading-relaxed">
                {billingAddress || "Level 4, Corporate Cyber Tower, Phase 2"}, {city || "Bengaluru"}, {state} - {postalCode || "560100"}
              </p>
              {gstin && (
                <p className="text-[11px] font-mono text-slate-700">
                  <strong>GSTIN:</strong> {gstin}
                </p>
              )}
              {pan && (
                <p className="text-[11px] font-mono text-slate-700">
                  <strong>PAN:</strong> {pan}
                </p>
              )}
            </div>

            <div className="text-right space-y-1">
              <span className="text-xl font-black uppercase tracking-tight text-slate-900 block">
                TAX INVOICE
              </span>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                ISSUED
              </span>
              <div className="pt-2 text-[11px] text-slate-600 space-y-0.5">
                <p>Invoice #: <strong className="font-mono text-slate-900">{invoiceIdentifier}</strong></p>
                <p>Invoice Date: <strong className="text-slate-900">{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong></p>
                <p>Payment Terms: <strong className="text-slate-900">{defaultPaymentTerms}</strong></p>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Billed To
              </span>
              <p className="font-bold text-slate-900 text-xs">Acme Enterprises Pvt Ltd</p>
              <p className="text-[11px] text-slate-600">77 Residency Road, Bengaluru, Karnataka - 560025</p>
            </div>
            {showCustomerGstin && (
              <div className="text-right text-[11px] text-slate-600">
                <p><strong>Customer GSTIN:</strong> 29AABCA1234F1Z1</p>
                <p><strong>State:</strong> 29 - Karnataka</p>
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px]">
                <th className="p-2 text-left rounded-l-md">#</th>
                <th className="p-2 text-left">Item & Description</th>
                {requireHsnSac && <th className="p-2 text-center">HSN/SAC</th>}
                <th className="p-2 text-center">Qty</th>
                <th className="p-2 text-right">Rate</th>
                <th className="p-2 text-right">GST</th>
                <th className="p-2 text-right rounded-r-md">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-2 text-slate-500">1</td>
                <td className="p-2">
                  <p className="font-bold text-slate-900">Enterprise Cloud CRM Subscription</p>
                  <p className="text-[11px] text-slate-500">Annual license with SLA support</p>
                </td>
                {requireHsnSac && <td className="p-2 text-center font-mono text-slate-600">998313</td>}
                <td className="p-2 text-center font-mono">1 yr</td>
                <td className="p-2 text-right font-mono">₹10,000.00</td>
                <td className="p-2 text-right font-mono text-slate-600">{defaultTaxRate}%</td>
                <td className="p-2 text-right font-mono font-bold text-slate-900">₹10,000.00</td>
              </tr>
            </tbody>
          </table>

          {/* Bottom Row: Bank + Summary */}
          <div className="flex justify-between items-start gap-6 pt-2">
            {/* Bank Details */}
            {showBankDetailsOnPDF && primaryBank && (
              <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Bank & Remittance Details
                </span>
                <p><strong>Bank:</strong> {primaryBank.bankName || "HDFC Bank"}</p>
                <p><strong>A/C Name:</strong> {primaryBank.accountHolderName || legalName}</p>
                <p><strong>A/C Number:</strong> {primaryBank.accountNumber ? maskAccountNumber(primaryBank.accountNumber) : "50200012345678"}</p>
                <p><strong>IFSC:</strong> {primaryBank.ifscCode || "HDFC0001234"}</p>
                {showUpiQrOnInvoice && primaryBank.upiId && (
                  <p className="text-primary font-bold"><strong>UPI ID:</strong> {primaryBank.upiId}</p>
                )}
              </div>
            )}

            {/* Financial Totals */}
            <div className="w-64 text-xs space-y-1.5 border-t-2 border-slate-900 pt-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold">₹10,000.00</span>
              </div>
              {showTaxBreakdownTable ? (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST (9%):</span>
                    <span className="font-mono">₹900.00</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST (9%):</span>
                    <span className="font-mono">₹900.00</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-slate-600">
                  <span>GST ({defaultTaxRate}%):</span>
                  <span className="font-mono">₹1,800.00</span>
                </div>
              )}
              {enableRoundOff && (
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Round-Off:</span>
                  <span className="font-mono">₹0.00</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm text-slate-950 border-t border-slate-300 pt-1.5">
                <span>Total Due:</span>
                <span className="font-mono">₹11,800.00</span>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          {(defaultNotes || defaultTerms) && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
              {defaultNotes && (
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Notes:</span>
                  <p className="text-slate-700 text-[11px] mt-0.5">{defaultNotes}</p>
                </div>
              )}
              {defaultTerms && (
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Terms & Conditions:</span>
                  <p className="text-slate-600 text-[10.5px] mt-0.5 whitespace-pre-line">{defaultTerms}</p>
                </div>
              )}
            </div>
          )}

          {/* Signature Block */}
          {showSignatureBlock && (
            <div className="flex justify-end pt-4">
              <div className="text-center w-48 border-t border-slate-400 pt-1">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Authorized Signatory</p>
                <p className="text-[11px] text-slate-800 font-semibold">{legalName || workspace?.name}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
