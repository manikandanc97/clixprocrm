"use client";

import React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import { useCRMStore } from "@/shared/store/useCRMStore";

export type LogoSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "full" | "icon" | "badge";
  size?: LogoSize;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
  animated?: boolean;
}

const sizeConfig: Record<LogoSize, { px: number; width: string; text: string; gap: string }> = {
  xs: { px: 20, width: "w-5 h-5", text: "text-sm font-bold", gap: "gap-1.5" },
  sm: { px: 24, width: "w-6 h-6", text: "text-base font-bold", gap: "gap-1.5" },
  md: { px: 30, width: "w-[30px] h-[30px]", text: "text-lg font-bold", gap: "gap-2" },
  lg: { px: 36, width: "w-9 h-9", text: "text-xl font-extrabold", gap: "gap-2" },
  xl: { px: 44, width: "w-11 h-11", text: "text-2xl font-extrabold", gap: "gap-2.5" },
  "2xl": { px: 52, width: "w-[52px] h-[52px]", text: "text-3xl font-extrabold", gap: "gap-3" },
};

const THEME_LOGO_MAP: Record<string, string> = {
  emerald: "/brand/clixpro-logo-emerald.png",
  blue: "/brand/clixpro-logo-blue.png",
  violet: "/brand/clixpro-logo-violet.png",
  amber: "/brand/clixpro-logo-amber.png",
  rose: "/brand/clixpro-logo-rose.png",
};

const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/onboarding",
];

/**
 * Exact ClixPro Emblem image that dynamically switches its color scheme
 * based on the active CRM Theme (Emerald, Blue, Violet, Amber, Rose).
 */
export function ClixProIcon({
  size = "md",
  className,
  pixelSize,
}: {
  size?: LogoSize;
  className?: string;
  pixelSize?: number;
}) {
  const storeAccent = useCRMStore((state) => state.accentColor);
  const superAdminAccent = useCRMStore((state) => state.superAdminAccentColor);
  const pathname = usePathname();
  const isAuthPage = pathname
    ? AUTH_ROUTES.some((route) => pathname.startsWith(route))
    : false;
  const isSuperAdmin = pathname ? pathname.startsWith("/super-admin") : false;

  const activeAccent = isAuthPage 
    ? "emerald" 
    : isSuperAdmin 
    ? (superAdminAccent || "emerald") 
    : (storeAccent || "emerald");

  const targetSize = pixelSize || sizeConfig[size]?.px || 30;
  const logoSrc = THEME_LOGO_MAP[activeAccent] || "/brand/clixpro-logo.png";

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center shrink-0 transition-transform duration-200 select-none",
        sizeConfig[size]?.width,
        className
      )}
      style={{
        width: pixelSize ? `${pixelSize}px` : undefined,
        height: pixelSize ? `${pixelSize}px` : undefined,
      }}
    >
      <Image
        key={activeAccent}
        src={logoSrc}
        alt="ClixPro Emblem"
        width={targetSize}
        height={targetSize}
        unoptimized
        priority
        className="w-full h-full object-contain drop-shadow-sm transition-all duration-300"
      />
    </div>
  );
}

/**
 * Main ClixPro Brand Logo Component.
 * - Exact original CP monogram logo asset with zero distortion
 * - Theme-reactive color switching for all 5 accent palettes
 * - Crisp text typography matching "Clix" (foreground) and "Pro" (primary)
 */
export function ClixProLogo({
  variant = "full",
  size = "md",
  className,
  iconClassName,
  textClassName,
  showText = true,
  animated: _animated = false,
  ...props
}: LogoProps) {
  const currentSize = sizeConfig[size] || sizeConfig.md;

  if (variant === "icon" || !showText) {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center",
          className
        )}
        {...props}
      >
        <ClixProIcon size={size} className={iconClassName} />
      </div>
    );
  }

  if (variant === "badge") {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center p-1.5 rounded-xl bg-primary/10 border border-primary/20 shadow-sm transition-colors duration-200 hover:bg-primary/15",
          className
        )}
        {...props}
      >
        <ClixProIcon size={size} className={iconClassName} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center select-none tracking-tight font-display",
        currentSize.gap,
        className
      )}
      {...props}
    >
      <ClixProIcon size={size} className={iconClassName} />
      <div
        className={cn(
          "leading-none flex items-center tracking-tight transition-colors duration-300 font-display select-none",
          currentSize.text
        )}
      >
        {/* textClassName applied directly on "Clix" span for color overrides to work */}
        <span className={cn("text-foreground font-bold tracking-tight transition-colors duration-300", textClassName)}>
          Clix
        </span>
        <span className="text-primary font-extrabold tracking-tight transition-colors duration-300">
          Pro
        </span>
      </div>
    </div>
  );
}

export default ClixProLogo;
