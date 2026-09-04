import type { StatusVariant } from "@/shared/components/StatusBadge";

/**
 * Canonical quotation-status → StatusBadge variant mapping.
 * Single source of truth used by both QuotationsDataTable and QuotationPreview.
 */
export const QUOTATION_STATUS_VARIANT = {
  ACCEPTED: "emerald",
  SENT:     "blue",
  DRAFT:    "slate",
  REJECTED: "rose",
  EXPIRED:  "amber",
} as const satisfies Record<string, StatusVariant>;

/**
 * Returns the canonical StatusBadge variant for a given quotation status string.
 * Falls back to "neutral" for any unknown value.
 */
export function getQuotationStatusVariant(
  status: string | undefined
): StatusVariant {
  return (
    QUOTATION_STATUS_VARIANT[status as keyof typeof QUOTATION_STATUS_VARIANT] ??
    "neutral"
  );
}
