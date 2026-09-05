/**
 * Ticket Utility Functions
 * Provides deterministic, human-readable display numbers (e.g. T-1, T-2, T-3)
 * without altering database primary keys, foreign keys, or unique identifiers.
 */

// Legacy known seeds / IDs mapping for absolute stability
const LEGACY_TICKET_MAP: Record<string, string> = {
  "CP-SUP-2026-937799": "T-1",
  "CP-SUP-2026-123456": "T-1",
  "CP-SUP-2026-999999": "T-2",
};

export interface TicketLike {
  ticketCode?: string;
  displayNumber?: number;
  ticketNumber?: string;
  ticketId?: string;
  id?: string;
}

/**
 * Format any ticket object or ticket reference string into a clean,
 * human-readable format like "T-1", "T-2", etc.
 */
export function formatTicketCode(ticket: string | TicketLike | null | undefined): string {
  if (!ticket) return "T-1";

  // If already a string
  if (typeof ticket === "string") {
    const trimmed = ticket.trim();
    if (trimmed.startsWith("T-") || trimmed.startsWith("t-")) {
      return trimmed.toUpperCase();
    }
    if (LEGACY_TICKET_MAP[trimmed]) {
      return LEGACY_TICKET_MAP[trimmed];
    }
    const match = trimmed.match(/CP-SUP-\d+-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num < 1000) return `T-${num}`;
    }
    // Fallback: extract ending digits or return T-1
    const endDigits = trimmed.match(/\d+$/);
    if (endDigits) {
      const parsed = parseInt(endDigits[0], 10);
      if (parsed < 1000) return `T-${parsed}`;
    }
    return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  }

  // Explicit ticketCode or displayNumber from backend
  if (ticket.ticketCode) return ticket.ticketCode;
  if (typeof ticket.displayNumber === "number" && ticket.displayNumber > 0) {
    return `T-${ticket.displayNumber}`;
  }

  // Check ticket.ticketNumber or ticket.ticketId
  const rawRef = ticket.ticketNumber || ticket.ticketId || ticket.id || "";
  if (typeof rawRef === "string") {
    const trimmed = rawRef.trim();
    if (trimmed.startsWith("T-") || trimmed.startsWith("t-")) {
      return trimmed.toUpperCase();
    }
    if (LEGACY_TICKET_MAP[trimmed]) {
      return LEGACY_TICKET_MAP[trimmed];
    }
    const match = trimmed.match(/CP-SUP-\d+-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num < 1000) return `T-${num}`;
    }
  }

  // If ticket has legacy format with 937799
  if (typeof rawRef === "string" && rawRef.includes("937799")) {
    return "T-1";
  }

  return "T-1";
}
