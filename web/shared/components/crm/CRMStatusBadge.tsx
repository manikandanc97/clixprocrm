"use client";

import React from "react";
import { StatusBadge, StatusVariant } from "@/shared/components/StatusBadge";

type CRMStatusTone = "success" | "warning" | "danger" | "info" | "neutral" | "primary";

const toneToVariant: Record<CRMStatusTone, StatusVariant> = {
  success: "success",
  warning: "warning",
  danger: "danger",
  info: "info",
  neutral: "neutral",
  primary: "primary",
};

interface CRMStatusBadgeProps {
  children: React.ReactNode;
  tone?: CRMStatusTone;
  className?: string;
  showDot?: boolean;
  pulse?: boolean;
}

export const CRMStatusBadge = ({
  children,
  tone = "neutral",
  className,
  showDot = false,
  pulse = false,
}: CRMStatusBadgeProps) => {
  const statusText = typeof children === "string" ? children : String(children ?? "");
  return (
    <StatusBadge
      status={statusText}
      variant={toneToVariant[tone] || "neutral"}
      className={className}
      showDot={showDot}
      pulse={pulse}
    />
  );
};











