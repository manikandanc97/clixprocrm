export interface TicketItem {
  id: string;
  ticketId: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  category: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "OPEN" | "IN_PROGRESS" | "WAITING_FOR_USER" | "RESOLVED" | "CLOSED";
  description: string;
  diagnostics?: Record<string, unknown> | null;
  attachments?: {
    id?: string;
    filename: string;
    size: number;
    url?: string;
    contentType?: string;
  }[];
  estimatedResponseTime?: string;
  createdAt: string;
  updatedAt: string;
  replies?: Array<{
    id: string;
    author: string;
    authorRole: string;
    message: string;
    createdAt: string;
    isStaff: boolean;
  }>;
}

export const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  OPEN: {
    label: "Open",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  WAITING_FOR_USER: {
    label: "Waiting for Reply",
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
    dot: "bg-purple-500",
  },
  RESOLVED: {
    label: "Resolved",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  CLOSED: {
    label: "Closed",
    color: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
};

export const PRIORITY_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  Critical: {
    label: "Critical",
    color: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
  },
  High: {
    label: "High",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  },
  Medium: {
    label: "Medium",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  },
  Low: {
    label: "Low",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  },
};

export const CATEGORIES = [
  "Bug Report",
  "Feature Request",
  "Billing & Subscription",
  "Technical Issue",
  "Account / Access",
  "General Inquiry",
];

export const isImageFile = (filename: string, contentType?: string) => {
  if (contentType?.startsWith("image/")) return true;
  const ext = filename.toLowerCase().split(".").pop() || "";
  return ["png", "jpg", "jpeg", "webp", "gif", "svg", "bmp"].includes(ext);
};

export const isVideoFile = (filename: string, contentType?: string) => {
  if (contentType?.startsWith("video/")) return true;
  const ext = filename.toLowerCase().split(".").pop() || "";
  return ["mp4", "webm", "mov", "avi", "mkv", "m4v"].includes(ext);
};

export {
  getInitials,
  formatRelativeTime,
} from "@/shared/utils/formatters";

