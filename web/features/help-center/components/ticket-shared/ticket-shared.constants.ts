export const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  OPEN: {
    label: "Open",
    badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
    dotClass: "bg-blue-500",
  },
  IN_PROGRESS: {
    label: "In Progress",
    badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    dotClass: "bg-amber-500",
  },
  WAITING_FOR_USER: {
    label: "Waiting for User",
    badgeClass: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
    dotClass: "bg-purple-500",
  },
  RESOLVED: {
    label: "Resolved",
    badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
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
    badgeClass: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400",
  },
  MEDIUM: {
    label: "Medium",
    badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  },
  HIGH: {
    label: "High",
    badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  },
  CRITICAL: {
    label: "Critical",
    badgeClass: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
  },
};

export const CATEGORY_OPTIONS = [
  "Bug Report",
  "Feature Request",
  "Billing Issue",
  "Account Access",
  "Integration",
  "General Inquiry",
];

export const isImageFile = (filename: string, contentType?: string) => {
  if (contentType?.startsWith("image/")) return true;
  const ext = filename.toLowerCase().split(".").pop() || "";
  return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "avif"].includes(ext);
};

export const isVideoFile = (filename: string, contentType?: string) => {
  if (contentType?.startsWith("video/")) return true;
  const ext = filename.toLowerCase().split(".").pop() || "";
  return ["mp4", "webm", "mov", "avi", "mkv", "m4v"].includes(ext);
};
