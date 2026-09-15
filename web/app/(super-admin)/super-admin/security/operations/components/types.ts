import {
  Activity,
  Database,
  Key,
  Users,
  HardDrive,
  Cpu,
  FileCheck2,
} from "lucide-react";
import { PlatformHealthRow } from "@/shared/lib/api/super-admin.api";

export type SecOpsTab = "health" | "alerts" | "incidents" | "emergency";

export interface EmergencyModalState {
  action: "LOCK_USER" | "UNLOCK_USER" | "REVOKE_SESSIONS" | "FORCE_RESET" | "LOCK_TENANT" | null;
  targetId: string;
  reason: string;
  confirmText: string;
}

export const DEFAULT_HEALTH_ROWS: PlatformHealthRow[] = [
  {
    service: "Database",
    status: "Healthy",
    lastChecked: new Date().toISOString(),
    detail: "PostgreSQL connection responsive (2ms latency)",
  },
  {
    service: "Authentication",
    status: "Healthy",
    lastChecked: new Date().toISOString(),
    detail: "Supabase JWT & cryptographic token verification active",
  },
  {
    service: "Session Management",
    status: "Healthy",
    lastChecked: new Date().toISOString(),
    detail: "Active session registry verified with idle timeouts",
  },
  {
    service: "Storage",
    status: "Healthy",
    lastChecked: new Date().toISOString(),
    detail: "Cloud object storage & local persistence operational",
  },
  {
    service: "Background Jobs",
    status: "Healthy",
    lastChecked: new Date().toISOString(),
    detail: "Task scheduler runner & outbox queue operational",
  },
  {
    service: "Audit Logging",
    status: "Healthy",
    lastChecked: new Date().toISOString(),
    detail: "Immutable audit chain indexed & verified",
  },
];

export const getServiceIcon = (service: string) => {
  switch (service) {
    case "Database":
      return Database;
    case "Authentication":
      return Key;
    case "Session Management":
      return Users;
    case "Storage":
      return HardDrive;
    case "Background Jobs":
      return Cpu;
    case "Audit Logging":
      return FileCheck2;
    default:
      return Activity;
  }
};

export const getStatusBadge = (status: string) => {
  switch (status) {
    case "Healthy":
    case "HEALTHY":
    case "RESOLVED":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    case "Warning":
    case "DEGRADED":
    case "ACKNOWLEDGED":
    case "INVESTIGATING":
    case "CONTAINED":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    case "Unavailable":
    case "CRITICAL":
    case "OPEN":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    case "HIGH":
      return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
    case "MEDIUM":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    case "LOW":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};
