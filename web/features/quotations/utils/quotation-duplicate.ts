import type { QuotationType } from "@/shared/types/quotation";

export interface QuotationDuplicatePayload {
  client: string;
  leadId: string;
  amount: string;
  status: "DRAFT";
  validTill: string | undefined;
  items: NonNullable<QuotationType["items"]>;
  notes: string;
  discount: number;
  tax: number;
}

/**
 * Pure canonical payload builder for quotation duplication/cloning.
 * Returns ONLY fields accepted by quotation creation and normalizes values:
 * - Always forces status to "DRAFT"
 * - Normalizes amount to string
 * - Formats validTill as ISO string if present
 * - Explicitly excludes internal/database/UI fields (id, quoteId, timestamps, tenantId, etc.)
 */
export function buildQuotationDuplicatePayload(
  quotation: QuotationType
): QuotationDuplicatePayload {
  return {
    client: quotation.client,
    leadId: quotation.leadId || "",
    amount: String(quotation.amountValue ?? 0),
    status: "DRAFT",
    validTill: quotation.validTillValue
      ? new Date(quotation.validTillValue).toISOString()
      : undefined,
    items: quotation.items || [],
    notes: quotation.notes || "",
    discount: quotation.discount || 0,
    tax: quotation.tax || 0,
  };
}
