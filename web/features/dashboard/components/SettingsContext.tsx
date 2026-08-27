"use client";

import React, { createContext, useContext, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useCRMStore } from "@/shared/store/useCRMStore";
import { generateBrandPalette } from "@/shared/lib/utils/color-utils";

export type AccentColor = string;
export type FontFamily = string;

type SettingsContextType = {
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
  dashboardScope: "tenant" | "super-admin" | "auth";
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function ensureGoogleFontLoaded(fontName: string) {
  if (typeof window === "undefined" || !fontName) return fontName;

  const knownMap: Record<string, string> = {
    inter: "Inter",
    roboto: "Roboto",
    poppins: "Poppins",
    jakarta: "Plus Jakarta Sans",
    outfit: "Outfit",
    space: "Space Grotesk",
    lora: "Lora",
    fira: "Fira Code",
    geist: "Geist",
    sans: "Inter",
  };

  const displayName = knownMap[fontName.toLowerCase()] || fontName;
  const fontSlug = displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const elementId = `google-font-css-${fontSlug}`;

  if (!document.getElementById(elementId)) {
    const link = document.createElement("link");
    link.id = elementId;
    link.rel = "stylesheet";
    const formattedQuery = encodeURIComponent(displayName).replace(/%20/g, "+");
    link.href = `https://fonts.googleapis.com/css2?family=${formattedQuery}:wght@300;400;500;600;700;800&display=swap`;
    document.head.appendChild(link);
  }

  return displayName;
}

export interface AccentPreset {
  label: string;
  value: AccentColor;
  color: string;
  hex: string;
}

export interface GoogleFontOption {
  name: string;
  category: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { label: "Emerald", value: "emerald", color: "bg-emerald-500", hex: "#10b981" },
  { label: "Blue", value: "blue", color: "bg-blue-500", hex: "#3b82f6" },
  { label: "Indigo", value: "indigo", color: "bg-indigo-500", hex: "#6366f1" },
  { label: "Violet", value: "violet", color: "bg-violet-500", hex: "#8b5cf6" },
  { label: "Purple", value: "purple", color: "bg-purple-500", hex: "#a855f7" },
  { label: "Red", value: "red", color: "bg-red-500", hex: "#ef4444" },
  { label: "Teal", value: "teal", color: "bg-teal-500", hex: "#14b8a6" },
  { label: "Cyan", value: "cyan", color: "bg-cyan-500", hex: "#06b6d4" },
  { label: "Amber", value: "amber", color: "bg-amber-500", hex: "#f59e0b" },
  { label: "Rose", value: "rose", color: "bg-rose-500", hex: "#f43f5e" },
];

export const ALL_GOOGLE_FONTS: GoogleFontOption[] = [
  // Popular Sans-Serif & UI
  { name: "Inter", category: "Sans-Serif" },
  { name: "Roboto", category: "Sans-Serif" },
  { name: "Poppins", category: "Sans-Serif" },
  { name: "Open Sans", category: "Sans-Serif" },
  { name: "Montserrat", category: "Sans-Serif" },
  { name: "Lato", category: "Sans-Serif" },
  { name: "Nunito", category: "Sans-Serif" },
  { name: "Raleway", category: "Sans-Serif" },
  { name: "Plus Jakarta Sans", category: "SaaS UI" },
  { name: "Outfit", category: "Geometric" },
  { name: "DM Sans", category: "Clean" },
  { name: "Rubik", category: "Rounded" },
  { name: "Ubuntu", category: "Modern" },
  { name: "Work Sans", category: "Grotesque" },
  { name: "Quicksand", category: "Soft" },
  { name: "Barlow", category: "Grotesk" },
  { name: "Fira Sans", category: "Tech" },
  { name: "Kanit", category: "Modern" },
  { name: "Manrope", category: "SaaS" },
  { name: "Urbanist", category: "Geometric" },
  { name: "Geist", category: "Developer" },

  // Display & Futuristic
  { name: "Space Grotesk", category: "Display" },
  { name: "Oswald", category: "Condensed" },
  { name: "Syne", category: "Experimental" },
  { name: "Bebas Neue", category: "Display" },
  { name: "Anton", category: "Impact" },
  { name: "Righteous", category: "Futuristic" },
  { name: "Lexend", category: "Readable" },

  // Serif & Luxury
  { name: "Playfair Display", category: "Luxury Serif" },
  { name: "Lora", category: "Serif" },
  { name: "Merriweather", category: "Editorial" },
  { name: "Cinzel", category: "Classic Serif" },
  { name: "Cormorant Garamond", category: "Elegant Serif" },
  { name: "Bitter", category: "Slab Serif" },

  // Handwriting & Creative
  { name: "Dancing Script", category: "Cursive" },
  { name: "Caveat", category: "Handwriting" },
  { name: "Pacifico", category: "Fun" },
  { name: "Shadows Into Light", category: "Handwriting" },
  { name: "Great Vibes", category: "Script" },
  { name: "Permanent Marker", category: "Marker" },

  // Monospace & Tech
  { name: "Fira Code", category: "Monospace" },
  { name: "JetBrains Mono", category: "Monospace" },
  { name: "Inconsolata", category: "Monospace" },
  { name: "Roboto Mono", category: "Monospace" },
  { name: "Space Mono", category: "Monospace" },
  { name: "Source Code Pro", category: "Monospace" },
];

export function isFontSelected(currentFont: string, itemFontName: string): boolean {
  const currentLower = (currentFont || "").toLowerCase().trim();
  const itemLower = itemFontName.toLowerCase().trim();
  if (currentLower === itemLower) return true;
  if (currentLower === "sans" && itemLower === "inter") return true;
  if (currentLower === "jakarta" && itemLower === "plus jakarta sans") return true;
  if (currentLower === "space" && itemLower === "space grotesk") return true;
  if (currentLower === "fira" && itemLower === "fira code") return true;
  return false;
}

const PRESET_ACCENTS: Record<string, { primary: string; accent: string }> = {
  emerald: { primary: "#10b981", accent: "rgba(16, 185, 129, 0.12)" },
  blue: { primary: "#3b82f6", accent: "rgba(59, 130, 246, 0.12)" },
  indigo: { primary: "#6366f1", accent: "rgba(99, 102, 241, 0.12)" },
  violet: { primary: "#8b5cf6", accent: "rgba(139, 92, 246, 0.12)" },
  purple: { primary: "#a855f7", accent: "rgba(168, 85, 247, 0.12)" },
  red: { primary: "#ef4444", accent: "rgba(239, 68, 68, 0.12)" },
  teal: { primary: "#14b8a6", accent: "rgba(20, 184, 166, 0.12)" },
  cyan: { primary: "#06b6d4", accent: "rgba(6, 182, 212, 0.12)" },
  amber: { primary: "#f59e0b", accent: "rgba(245, 158, 11, 0.12)" },
  rose: { primary: "#f43f5e", accent: "rgba(244, 63, 94, 0.12)" },
  slate: { primary: "#475569", accent: "rgba(71, 85, 105, 0.12)" },
};

const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/onboarding",
];

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { 
    accentColor: tenantAccentColor, 
    setAccentColor: setTenantAccentColor, 
    superAdminAccentColor,
    setSuperAdminAccentColor,
    fontFamily: tenantFontFamily, 
    setFontFamily: setTenantFontFamily,
    superAdminFontFamily,
    setSuperAdminFontFamily,
  } = useCRMStore();
  const pathname = usePathname();

  const isAuthPage = pathname
    ? AUTH_ROUTES.some((route) => pathname.startsWith(route))
    : false;

  const isSuperAdminPath = pathname ? pathname.startsWith("/super-admin") : false;

  // Determine active accent and font based on dashboard scope
  const activeAccent = isAuthPage
    ? "emerald"
    : isSuperAdminPath
    ? (superAdminAccentColor || "emerald")
    : (tenantAccentColor || "emerald");

  const activeFont = isAuthPage
    ? "sans"
    : isSuperAdminPath
    ? (superAdminFontFamily || "sans")
    : (tenantFontFamily || "sans");

  const dashboardScope: "tenant" | "super-admin" | "auth" = isSuperAdminPath
    ? "super-admin"
    : isAuthPage
    ? "auth"
    : "tenant";

  // Update body classes and data attributes
  useEffect(() => {
    const root = document.documentElement;
    
    // Auth pages (login, register, forgot-password, etc.) always use the default ClixPro emerald theme.
    // Custom account/admin colors only reflect across the dashboard and internal screens.
    let activeHex = "#10b981";

    if (isAuthPage) {
      activeHex = "#10b981";
      root.setAttribute("data-accent", "emerald");
    } else if (activeAccent && activeAccent.startsWith("#")) {
      activeHex = activeAccent;
      root.setAttribute("data-accent", "custom");
    } else if (PRESET_ACCENTS[activeAccent]) {
      activeHex = PRESET_ACCENTS[activeAccent].primary;
      root.setAttribute("data-accent", activeAccent);
    } else {
      root.setAttribute("data-accent", "emerald");
    }

    const palette = generateBrandPalette(activeHex);

    root.style.setProperty("--primary", palette.primary);
    root.style.setProperty("--primary-hover", palette.primaryHover);
    root.style.setProperty("--primary-active", palette.primaryActive);
    root.style.setProperty("--primary-light", palette.primaryLight);
    root.style.setProperty("--sidebar-primary", palette.primary);
    root.style.setProperty("--ring", palette.ring);
    root.style.setProperty("--accent", palette.accentBg);
    root.style.setProperty("--color-primary", palette.primary);
    root.style.setProperty("--color-accent", palette.accentBg);
    
    // Handle font family & Google Fonts dynamic loading
    const targetFont = activeFont || "inter";
    const loadedDisplayName = ensureGoogleFontLoaded(targetFont);
    
    const slug = targetFont.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    root.setAttribute("data-font", slug);

    if (loadedDisplayName) {
      const fontFamilyStyle = `'${loadedDisplayName}', system-ui, -apple-system, sans-serif`;
      root.style.setProperty("--font-sans", fontFamilyStyle);
      root.style.setProperty("--font-display", fontFamilyStyle);
      document.body.style.fontFamily = fontFamilyStyle;
    }
  }, [activeAccent, activeFont, isAuthPage, isSuperAdminPath]);

  const handleSetAccentColor = (color: AccentColor) => {
    if (isSuperAdminPath) {
      setSuperAdminAccentColor(color);
    } else {
      setTenantAccentColor(color);
    }
  };

  const handleSetFontFamily = (font: FontFamily) => {
    if (isSuperAdminPath) {
      setSuperAdminFontFamily(font);
    } else {
      setTenantFontFamily(font);
    }
  };

  return (
    <SettingsContext.Provider value={{ 
      accentColor: activeAccent as AccentColor, 
      setAccentColor: handleSetAccentColor, 
      fontFamily: activeFont as FontFamily, 
      setFontFamily: handleSetFontFamily,
      dashboardScope,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}














