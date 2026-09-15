"use client";

import React from "react";
import { Lock } from "lucide-react";

interface AdminPermissionBannerProps {
  isAdmin: boolean;
}

export function AdminPermissionBanner({ isAdmin }: AdminPermissionBannerProps) {
  if (isAdmin) return null;
  return (
    <div className="mb-4 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs">
      <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
      <div>
        <span className="font-semibold">Workspace Administrator Restricted:</span> Settings are currently in read-only mode. Workspace Admin privileges are required to modify task governance rules.
      </div>
    </div>
  );
}
