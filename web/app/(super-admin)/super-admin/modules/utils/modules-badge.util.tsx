import React from "react";
import { Lock, Users, Shield, ShieldAlert } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { PlatformModule } from "@/shared/lib/api/super-admin.api";

export function renderAccessBadge(mod: PlatformModule, activeScope: "tenant" | "platform") {
  if (activeScope === "platform") {
    return (
      <Badge
        variant="secondary"
        className="bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 font-semibold text-[10px] gap-1 mx-auto"
      >
        <Lock className="w-3 h-3" />
        Super Admin
      </Badge>
    );
  }

  if (!mod.permission || mod.permission === "Dashboard" || mod.permission === "Help Center") {
    return (
      <Badge
        variant="outline"
        className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40 font-semibold text-[10px] gap-1 mx-auto"
      >
        <Users className="w-3 h-3" />
        All CRM Users
      </Badge>
    );
  }

  if (mod.permission === "Settings" || mod.permission === "Role Management" || mod.permission === "Employees") {
    return (
      <Badge
        variant="secondary"
        className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-semibold text-[10px] gap-1 mx-auto"
      >
        <Shield className="w-3 h-3 text-slate-500" />
        Admin Only
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="bg-muted text-foreground border-border/70 font-mono text-[10px] gap-1 max-w-[140px] truncate mx-auto"
    >
      <ShieldAlert className="w-3 h-3 text-amber-500 shrink-0" />
      <span className="truncate">{mod.permission}</span>
    </Badge>
  );
}
