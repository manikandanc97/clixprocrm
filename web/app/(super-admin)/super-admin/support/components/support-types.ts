export const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  OPEN: {
    label: "Open",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    dotClass: "bg-blue-500",
  },
  IN_PROGRESS: {
    label: "In Progress",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    dotClass: "bg-amber-500",
  },
  WAITING_FOR_USER: {
    label: "Waiting for User",
    badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    dotClass: "bg-purple-500",
  },
  RESOLVED: {
    label: "Resolved",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dotClass: "bg-emerald-500",
  },
  CLOSED: {
    label: "Closed",
    badgeClass: "bg-muted text-muted-foreground border-border",
    dotClass: "bg-muted-foreground",
  },
};

export const PRIORITY_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  LOW: {
    label: "Low",
    badgeClass: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  },
  MEDIUM: {
    label: "Medium",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  HIGH: {
    label: "High",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  CRITICAL: {
    label: "Critical",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
};

export type SupportSortKey =
  | "ticketNumber"
  | "subject"
  | "createdBy"
  | "priority"
  | "status"
  | "assignedTo"
  | "createdAt";

export interface SupportSortConfig {
  key: SupportSortKey;
  direction: "asc" | "desc";
}
