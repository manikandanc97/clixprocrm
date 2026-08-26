import { Injectable } from '@nestjs/common';
import { formatCurrency, toNumber } from '../../common/utils/crm-formatters.util';

export interface InvoicePdfData {
  invoiceNumber: string;
  invoiceDate: string | Date;
  dueDate?: string | Date | null;
  status: string;
  currency: string;
  paymentTerms?: string | null;

  // Tenant / Company Info
  companyName: string;
  companyAddress?: string | null;
  companyCity?: string | null;
  companyState?: string | null;
  companyPostalCode?: string | null;
  companyCountry?: string | null;
  companyGstin?: string | null;
  companyPan?: string | null;
  companyLogo?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  accountHolderName?: string | null;
  upiId?: string | null;

  // Customer / Bill To Info
  customerName?: string | null;
  customerCompany?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  customerCity?: string | null;
  customerState?: string | null;
  customerPostalCode?: string | null;
  customerGstin?: string | null;
  customerPan?: string | null;

  // Line items
  items: Array<{
    name: string;
    description?: string | null;
    quantity: number;
    unit?: string | null;
    unitPrice: number;
    discountAmount?: number;
    taxRate?: number;
    taxAmount?: number;
    lineTotal: number;
  }>;

  // Financial summary
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  otherTaxAmount: number;
  roundOff: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;

  notes?: string | null;
  termsAndConditions?: string | null;
}

@Injectable()
export class InvoicePdfService {
  /**
   * Generates a self-contained, high-fidelity printable HTML document with
   * print styling, clean typography, responsive layout, and GST compliance.
   */
  generateInvoiceHtml(data: InvoicePdfData): string {
    const curr = data.currency || 'INR';
    const invDateStr = new Date(data.invoiceDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const dueDateStr = data.dueDate
      ? new Date(data.dueDate).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : 'Due upon receipt';

    const isPaid = data.status === 'PAID';
    const isOverdue = data.status === 'OVERDUE';
    const isPartial = data.status === 'PARTIALLY_PAID';

    const statusBadgeColor = isPaid
      ? '#059669'
      : isOverdue
      ? '#dc2626'
      : isPartial
      ? '#d97706'
      : '#4f46e5';

    const statusBgColor = isPaid
      ? '#ecfdf5'
      : isOverdue
      ? '#fef2f2'
      : isPartial
      ? '#fffbeb'
      : '#eef2ff';

    const itemsRows = data.items
      .map(
        (it, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 8px; text-align: center; color: #64748b; font-size: 12px;">${idx + 1}</td>
          <td style="padding: 12px 8px;">
            <div style="font-weight: 600; color: #0f172a; font-size: 13px;">${escapeHtml(it.name)}</div>
            ${it.description ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${escapeHtml(it.description)}</div>` : ''}
          </td>
          <td style="padding: 12px 8px; text-align: center; color: #334155; font-size: 13px;">${it.quantity} ${it.unit || ''}</td>
          <td style="padding: 12px 8px; text-align: right; color: #334155; font-size: 13px;">${formatCurrency(toNumber(it.unitPrice), curr)}</td>
          <td style="padding: 12px 8px; text-align: right; color: #64748b; font-size: 12px;">${it.taxRate ? `${it.taxRate}%` : '0%'}</td>
          <td style="padding: 12px 8px; text-align: right; font-weight: 600; color: #0f172a; font-size: 13px;">${formatCurrency(toNumber(it.lineTotal), curr)}</td>
        </tr>
      `,
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${escapeHtml(data.invoiceNumber)} - ${escapeHtml(data.companyName)}</title>
  <style>
    @page {
      margin: 15mm;
      size: A4 portrait;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      line-height: 1.5;
      font-size: 13px;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
    }
    .header-table {
      width: 100%;
      margin-bottom: 24px;
      border-collapse: collapse;
    }
    .bill-to-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .items-table th {
      background: #0f172a;
      color: #ffffff;
      padding: 10px 8px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .summary-table {
      width: 320px;
      margin-left: auto;
      border-collapse: collapse;
    }
    .summary-table td {
      padding: 6px 8px;
      font-size: 13px;
    }
    .footer-box {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #64748b;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Top Action Bar for browser view -->
    <div class="no-print" style="display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 16px;">
      <button onclick="window.print()" style="background: #0f172a; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px;">
        Print / Save PDF
      </button>
    </div>

    <!-- Header -->
    <table class="header-table">
      <tr>
        <td style="vertical-align: top; width: 60%;">
          ${data.companyLogo ? `<img src="${data.companyLogo}" alt="Logo" style="max-height: 48px; max-width: 180px; object-fit: contain; margin-bottom: 8px;" /><br/>` : ''}
          <div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
            ${escapeHtml(data.companyName)}
          </div>
          <div style="color: #475569; font-size: 12px; margin-top: 4px; line-height: 1.4;">
            ${data.companyAddress ? `${escapeHtml(data.companyAddress)}<br/>` : ''}
            ${[data.companyCity, data.companyState, data.companyPostalCode].filter(Boolean).map(escapeHtml).join(', ')}${data.companyCountry ? `, ${escapeHtml(data.companyCountry)}` : ''}
          </div>
          ${data.companyGstin ? `<div style="color: #64748b; font-size: 11px; margin-top: 4px;"><strong>GSTIN:</strong> ${escapeHtml(data.companyGstin)}</div>` : ''}
          ${data.companyPan ? `<div style="color: #64748b; font-size: 11px;"><strong>PAN:</strong> ${escapeHtml(data.companyPan)}</div>` : ''}
        </td>
        <td style="vertical-align: top; text-align: right; width: 40%;">
          <div style="font-size: 26px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -0.03em;">
            TAX INVOICE
          </div>
          <div style="display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; background-color: ${statusBgColor}; color: ${statusBadgeColor}; margin-top: 4px; text-transform: uppercase;">
            ${escapeHtml(data.status.replace(/_/g, ' '))}
          </div>
          <div style="margin-top: 12px; font-size: 12px; line-height: 1.6;">
            <div><span style="color: #64748b;">Invoice #:</span> <strong>${escapeHtml(data.invoiceNumber)}</strong></div>
            <div><span style="color: #64748b;">Invoice Date:</span> ${invDateStr}</div>
            <div><span style="color: #64748b;">Due Date:</span> ${dueDateStr}</div>
            ${data.paymentTerms ? `<div><span style="color: #64748b;">Terms:</span> ${escapeHtml(data.paymentTerms)}</div>` : ''}
          </div>
        </td>
      </tr>
    </table>

    <!-- Bill To Details -->
    <div class="bill-to-box">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 6px;">
        Billed To
      </div>
      <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
        <div>
          <div style="font-size: 15px; font-weight: 700; color: #0f172a;">
            ${escapeHtml(data.customerCompany || data.customerName || 'Valued Customer')}
          </div>
          ${data.customerName && data.customerCompany ? `<div style="color: #475569; font-size: 12px;">Attn: ${escapeHtml(data.customerName)}</div>` : ''}
          <div style="color: #475569; font-size: 12px; margin-top: 2px;">
            ${data.customerAddress ? `${escapeHtml(data.customerAddress)}<br/>` : ''}
            ${[data.customerCity, data.customerState, data.customerPostalCode].filter(Boolean).map(escapeHtml).join(', ')}
          </div>
        </div>
        <div style="text-align: right; font-size: 12px; color: #475569;">
          ${data.customerEmail ? `<div>${escapeHtml(data.customerEmail)}</div>` : ''}
          ${data.customerPhone ? `<div>${escapeHtml(data.customerPhone)}</div>` : ''}
          ${data.customerGstin ? `<div style="margin-top: 4px;"><strong>Customer GSTIN:</strong> ${escapeHtml(data.customerGstin)}</div>` : ''}
          ${data.customerPan ? `<div><strong>PAN:</strong> ${escapeHtml(data.customerPan)}</div>` : ''}
        </div>
      </div>
    </div>

    <!-- Line Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 40px; text-align: center; border-top-left-radius: 6px;">#</th>
          <th style="text-align: left;">Item & Description</th>
          <th style="width: 80px; text-align: center;">Qty</th>
          <th style="width: 100px; text-align: right;">Rate</th>
          <th style="width: 60px; text-align: right;">Tax</th>
          <th style="width: 110px; text-align: right; border-top-right-radius: 6px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <!-- Bottom Section: Bank / UPI on Left, Financial Summary on Right -->
    <div style="display: flex; justify-content: space-between; gap: 24px; align-items: flex-start;">
      <!-- Payment info -->
      <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 6px;">
          Bank & Payment Details
        </div>
        <div style="font-size: 12px; color: #334155; line-height: 1.6;">
          ${data.bankName ? `<div><strong>Bank:</strong> ${escapeHtml(data.bankName)}</div>` : ''}
          ${data.accountHolderName ? `<div><strong>A/C Name:</strong> ${escapeHtml(data.accountHolderName)}</div>` : ''}
          ${data.accountNumber ? `<div><strong>A/C No:</strong> ${escapeHtml(data.accountNumber)}</div>` : ''}
          ${data.ifscCode ? `<div><strong>IFSC Code:</strong> ${escapeHtml(data.ifscCode)}</div>` : ''}
          ${data.upiId ? `<div style="margin-top: 4px; color: #4f46e5; font-weight: 600;"><strong>UPI ID:</strong> ${escapeHtml(data.upiId)}</div>` : ''}
        </div>
      </div>

      <!-- Financial Totals -->
      <table class="summary-table">
        <tr>
          <td style="color: #64748b;">Subtotal:</td>
          <td style="text-align: right; font-weight: 600; color: #0f172a;">${formatCurrency(toNumber(data.subtotal), curr)}</td>
        </tr>
        ${
          data.discountAmount > 0
            ? `<tr>
                <td style="color: #059669;">Discount:</td>
                <td style="text-align: right; color: #059669; font-weight: 600;">-${formatCurrency(toNumber(data.discountAmount), curr)}</td>
              </tr>`
            : ''
        }
        <tr>
          <td style="color: #64748b;">Taxable Amount:</td>
          <td style="text-align: right; font-weight: 600; color: #0f172a;">${formatCurrency(toNumber(data.taxableAmount), curr)}</td>
        </tr>
        ${
          data.cgstAmount > 0
            ? `<tr>
                <td style="color: #64748b;">CGST:</td>
                <td style="text-align: right; color: #334155;">${formatCurrency(toNumber(data.cgstAmount), curr)}</td>
              </tr>`
            : ''
        }
        ${
          data.sgstAmount > 0
            ? `<tr>
                <td style="color: #64748b;">SGST:</td>
                <td style="text-align: right; color: #334155;">${formatCurrency(toNumber(data.sgstAmount), curr)}</td>
              </tr>`
            : ''
        }
        ${
          data.igstAmount > 0
            ? `<tr>
                <td style="color: #64748b;">IGST:</td>
                <td style="text-align: right; color: #334155;">${formatCurrency(toNumber(data.igstAmount), curr)}</td>
              </tr>`
            : ''
        }
        ${
          data.roundOff !== 0
            ? `<tr>
                <td style="color: #64748b;">Round Off:</td>
                <td style="text-align: right; color: #64748b;">${data.roundOff > 0 ? '+' : ''}${formatCurrency(toNumber(data.roundOff), curr)}</td>
              </tr>`
            : ''
        }
        <tr style="border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a;">
          <td style="font-size: 15px; font-weight: 800; color: #0f172a; padding: 10px 8px;">Total Amount:</td>
          <td style="font-size: 16px; font-weight: 800; color: #0f172a; text-align: right; padding: 10px 8px;">${formatCurrency(toNumber(data.totalAmount), curr)}</td>
        </tr>
        ${
          data.paidAmount > 0
            ? `<tr>
                <td style="color: #059669; font-weight: 600; padding-top: 8px;">Amount Paid:</td>
                <td style="text-align: right; color: #059669; font-weight: 700; padding-top: 8px;">${formatCurrency(toNumber(data.paidAmount), curr)}</td>
              </tr>
              <tr>
                <td style="color: #dc2626; font-weight: 700;">Balance Due:</td>
                <td style="text-align: right; color: #dc2626; font-weight: 800; font-size: 14px;">${formatCurrency(toNumber(data.balanceAmount), curr)}</td>
              </tr>`
            : ''
        }
      </table>
    </div>

    <!-- Notes & Terms -->
    ${
      data.notes || data.termsAndConditions
        ? `<div style="margin-top: 28px; padding: 14px; background: #fafafa; border: 1px solid #e2e8f0; border-radius: 8px;">
            ${data.notes ? `<div style="margin-bottom: 8px;"><strong style="font-size: 11px; text-transform: uppercase; color: #64748b;">Notes:</strong><div style="font-size: 12px; color: #334155; margin-top: 2px;">${escapeHtml(data.notes)}</div></div>` : ''}
            ${data.termsAndConditions ? `<div><strong style="font-size: 11px; text-transform: uppercase; color: #64748b;">Terms & Conditions:</strong><div style="font-size: 12px; color: #64748b; margin-top: 2px; line-height: 1.4;">${escapeHtml(data.termsAndConditions)}</div></div>` : ''}
          </div>`
        : ''
    }

    <!-- Footer -->
    <div class="footer-box" style="text-align: center;">
      <p style="margin: 0;">This is a computer-generated invoice and requires no physical signature.</p>
      <p style="margin: 4px 0 0 0; color: #94a3b8;">${escapeHtml(data.companyName)} • GST Compliant Invoicing</p>
    </div>
  </div>
</body>
</html>`;
  }
}

function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
