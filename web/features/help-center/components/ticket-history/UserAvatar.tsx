"use client";

import React from "react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { cn } from "@/shared/lib/utils";
import { getInitials } from "./ticket-history.types";

export function UserAvatar({
  name,
  isStaff = false,
  size = "md",
  className = "",
}: {
  name?: string;
  isStaff?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = getInitials(name);
  const sizeClasses = {
    xs: "w-5 h-5 text-[9px]",
    sm: "w-7 h-7 text-[11px]",
    md: "w-8 h-8 text-xs",
    lg: "w-10 h-10 text-sm",
  }[size];

  if (isStaff) {
    return (
      <div
        className={cn(
          sizeClasses,
          "rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/25 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center ring-1 ring-blue-500/30 shadow-xs shrink-0 select-none",
          className
        )}
        title={name ? `${name} (Support Staff)` : "Support Staff"}
      >
        <AppIcon
          name="security"
          size={size === "xs" ? 11 : size === "sm" ? 13 : 15}
          className="text-blue-600 dark:text-blue-400"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        sizeClasses,
        "rounded-full bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center ring-1 ring-emerald-500/30 shadow-xs shrink-0 select-none",
        className
      )}
      title={name || "User"}
    >
      {initials}
    </div>
  );
}
