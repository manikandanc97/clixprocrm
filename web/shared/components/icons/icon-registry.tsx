"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  UserCog,
  UserCheck,
  UserPlus,
  CalendarDays,
  CheckCheck,
  Check,
  FileText,
  Receipt,
  Sparkles,
  ChartColumn,
  Settings,
  Headset,
  ShieldCheck,
  CreditCard,
  Package,
  Ticket,
  Layers,
  Activity,
  History,
  FileClock,
  Bell,
  Mail,
  Search,
  Filter,
  SlidersHorizontal,
  Plus,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Pencil,
  Copy,
  Send,
  Eye,
  EyeOff,
  ExternalLink,
} from "@animateicons/react/lucide";
import { Building2, Handshake, BriefcaseBusiness, type LucideIcon } from "lucide-react";

export type IconName =
  | "dashboard"
  | "contacts"
  | "leads"
  | "userPlus"
  | "platformUsers"
  | "companies"
  | "deals"
  | "tasks"
  | "calendar"
  | "attendance"
  | "quotations"
  | "invoices"
  | "billing"
  | "ai"
  | "reports"
  | "analytics"
  | "performance"
  | "teamPerformance"
  | "employees"
  | "roles"
  | "roleManagement"
  | "security"
  | "settings"
  | "support"
  | "help"
  | "supportTickets"
  | "modules"
  | "telemetry"
  | "auditLogs"
  | "plans"
  | "packages"
  | "notifications"
  | "mail"
  | "search"
  | "filter"
  | "sliders"
  | "plus"
  | "add"
  | "trash"
  | "delete"
  | "refresh"
  | "sync"
  | "download"
  | "export"
  | "upload"
  | "import"
  | "arrowRight"
  | "next"
  | "arrowLeft"
  | "back"
  | "chevronRight"
  | "chevronLeft"
  | "edit"
  | "pencil"
  | "copy"
  | "send"
  | "eye"
  | "view"
  | "eyeOff"
  | "check"
  | "save"
  | "externalLink"
  | "default";

export interface AppIconProps {
  name?: string;
  href?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string; size?: number }>;
  size?: number;
  className?: string;
  active?: boolean;
  isHovered?: boolean;
  triggerAnimation?: number | string;
  duration?: number;
  onClick?: (e: React.MouseEvent) => void;
}

export function resolveIconName(name?: string, href?: string, IconComponent?: any): IconName {
  const iconDisp = (IconComponent?.displayName || IconComponent?.name || "").toLowerCase();
  const nameText = (name || "").toLowerCase();
  const hrefText = (href || "").toLowerCase();
  const pathParts = hrefText.split(/[\/?#]/).filter(Boolean);
  const lastPathPart = pathParts[pathParts.length - 1] || "";
  const text = `${nameText} ${hrefText}`.trim();

  // 1. Match specific IconComponent name first if available
  if (iconDisp.includes("userplus")) return "userPlus";
  if (iconDisp.includes("usercog") || iconDisp.includes("usersround")) return "platformUsers";
  if (iconDisp.includes("usercheck") || iconDisp.includes("usersquare")) return "employees";
  if (iconDisp.includes("activity")) return "telemetry";
  if (iconDisp.includes("scroll") || iconDisp.includes("fileclock") || iconDisp.includes("history")) return "auditLogs";
  if (iconDisp.includes("layers") || iconDisp.includes("boxes")) return "modules";
  if (iconDisp.includes("creditcard") || iconDisp.includes("package")) return "plans";
  if (iconDisp.includes("receipt") || iconDisp.includes("banknote")) return "invoices";
  if (iconDisp.includes("sparkle") || iconDisp.includes("bot")) return "ai";
  if (iconDisp.includes("chart") || iconDisp.includes("barchart")) return "reports";
  if (iconDisp.includes("shieldalert") || iconDisp.includes("shieldcheck") || iconDisp.includes("shield")) return "security";
  if (iconDisp.includes("setting") || iconDisp.includes("sliders")) return "settings";

  // 2. High-specificity route, action, and keyword resolution
  if (text.includes("bulk upload") || text.includes("import") || text.includes("upload")) return "upload";
  if (text.includes("add lead") || text.includes("create lead") || text.includes("add customer") || text.includes("userplus") || text.includes("new user")) return "userPlus";

  // Modules & Navigation
  if (text.includes("module") || text.includes("layer") || lastPathPart === "modules") return "modules";

  // Telemetry & Operations
  if (text.includes("telemetry") || text.includes("operation") || text.includes("secops") || lastPathPart === "operations") return "telemetry";

  // Audit Logs & Activity History
  if (text.includes("audit") || text.includes("log") || text.includes("scroll") || text.includes("history") || lastPathPart === "audit-logs") return "auditLogs";

  // Settings
  if (text.includes("setting") || lastPathPart === "settings") return "settings";

  // Platform Users & Employee Roles
  if (text.includes("platform user") || (text.includes("user") && !text.includes("contact") && !text.includes("lead") && lastPathPart === "users")) return "platformUsers";
  if (text.includes("employee") || text.includes("staff") || text.includes("member") || lastPathPart === "employees") return "employees";

  // Security & Permissions (strictly match security/permission contexts, not global super-admin paths)
  if (text.includes("security") || text.includes("role") || text.includes("permission") || lastPathPart === "security" || lastPathPart === "role-management") return "security";

  // Billing, Invoicing & Plans
  if (text.includes("payment") || text.includes("plan") || text.includes("package") || lastPathPart === "plans") return "plans";
  if (text.includes("invoice") || text.includes("receipt") || text.includes("billing") || text.includes("revenue") || lastPathPart === "billing" || lastPathPart === "invoices") return "invoices";

  // AI
  if (text.includes("ai") || text.includes("sparkle") || text.includes("clixpro ai") || text.includes("model") || text.includes("tier") || lastPathPart === "ai") return "ai";

  // Reporting & Analytics
  if (text.includes("team-performance") || text.includes("team performance") || lastPathPart === "team-performance") return "teamPerformance";
  if (text.includes("report") || text.includes("analytics") || text.includes("performance") || lastPathPart === "reports" || lastPathPart === "analytics" || lastPathPart === "performance") return "reports";

  // Support & Help
  if (text.includes("ticket") || lastPathPart === "support-tickets") return "supportTickets";
  if (text.includes("help") || text.includes("support") || text.includes("buoy") || lastPathPart === "help") return "support";

  // Tasks & Calendars
  if (text.includes("attendance") || lastPathPart === "attendance") return "attendance";
  if (text.includes("calendar") || lastPathPart === "calendar") return "calendar";
  if (text.includes("quotation") || text.includes("proposal") || text.includes("quote") || lastPathPart === "quotations") return "quotations";
  if (text.includes("task") || text.includes("todo") || lastPathPart === "tasks") return "tasks";

  // CRM Entities
  if (text.includes("compan") || text.includes("organization") || lastPathPart === "companies" || lastPathPart === "organizations") return "companies";
  if (text.includes("deal") || text.includes("pipeline") || text.includes("handshake") || lastPathPart === "deals") return "deals";
  if (text.includes("contact") || text.includes("lead") || lastPathPart === "contacts" || lastPathPart === "leads") return "contacts";

  // Navigation Utilities
  if (text.includes("notification") || text.includes("bell")) return "notifications";
  if (text.includes("mail") || text.includes("email")) return "mail";
  if (text.includes("search")) return "search";
  if (text.includes("filter")) return "filter";
  if (text.includes("slider")) return "sliders";
  if (text.includes("plus") || text.includes("add") || text.includes("create") || text.includes("new")) return "plus";
  if (text.includes("trash") || text.includes("delete") || text.includes("remove")) return "trash";
  if (text.includes("refresh") || text.includes("sync") || text.includes("reload")) return "refresh";
  if (text.includes("download") || text.includes("export")) return "download";
  if (text.includes("arrowright") || text.includes("next")) return "arrowRight";
  if (text.includes("arrowleft") || text.includes("back") || text.includes("prev")) return "arrowLeft";
  if (text.includes("chevronright")) return "chevronRight";
  if (text.includes("chevronleft")) return "chevronLeft";
  if (text.includes("edit") || text.includes("pencil") || text.includes("update")) return "edit";
  if (text.includes("copy") || text.includes("duplicate")) return "copy";
  if (text.includes("send")) return "send";
  if (text.includes("eyeoff") || text.includes("hide")) return "eyeOff";
  if (text.includes("eye") || text.includes("view") || text.includes("show")) return "eye";
  if (text.includes("check") || text.includes("save") || text.includes("done")) return "check";
  if (text.includes("externallink") || text.includes("link")) return "externalLink";

  // Dashboard / Overview
  if (text.includes("dashboard") || text.includes("overview") || hrefText === "/dashboard" || hrefText === "/super-admin") return "dashboard";

  return "default";
}

interface AnimateIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

/**
 * Primary Centralized Animated Icon Component powered by genuine @animateicons/react
 * with native animated SVG path motion on hover, button hover, click, and activation.
 */
export function AppIcon({
  name,
  href,
  icon: FallbackIcon,
  size = 18,
  className = "",
  active = false,
  isHovered = false,
  triggerAnimation,
  duration = 0.65,
  onClick,
}: AppIconProps) {
  const iconName = resolveIconName(name, href, FallbackIcon);
  const iconRef = useRef<AnimateIconHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [isFallbackAnimating, setIsFallbackAnimating] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stopCurrentAnimation = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    iconRef.current?.stopAnimation();
    setIsFallbackAnimating(false);
  }, []);

  const playOneShotAnimation = useCallback(() => {
    if (reducedMotion) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    iconRef.current?.startAnimation();
    setIsFallbackAnimating(true);

    // Auto-reset back to rest state cleanly after one cycle
    timerRef.current = setTimeout(() => {
      iconRef.current?.stopAnimation();
      setIsFallbackAnimating(false);
      timerRef.current = null;
    }, Math.max(550, Math.round(duration * 1000)));
  }, [duration, reducedMotion]);

  // Handle explicit triggerAnimation key changes
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (triggerAnimation !== undefined && triggerAnimation !== 0) {
      playOneShotAnimation();
    }
  }, [triggerAnimation, playOneShotAnimation]);

  // Handle hover state cleanly
  useEffect(() => {
    if (isHovered) {
      playOneShotAnimation();
    } else {
      stopCurrentAnimation();
    }
  }, [isHovered, playOneShotAnimation, stopCurrentAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Listen for parent button hover & custom trigger/stop events
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleCustomTrigger = () => {
      playOneShotAnimation();
    };

    const handleCustomStop = () => {
      stopCurrentAnimation();
    };

    el.addEventListener("trigger-icon-animation", handleCustomTrigger);
    el.addEventListener("stop-icon-animation", handleCustomStop);
    return () => {
      el.removeEventListener("trigger-icon-animation", handleCustomTrigger);
      el.removeEventListener("stop-icon-animation", handleCustomStop);
    };
  }, [playOneShotAnimation, stopCurrentAnimation]);

  const props = {
    ref: iconRef,
    size,
    duration,
    className: `shrink-0 select-none ${className}`,
  };

  const renderIcon = () => {
    switch (iconName) {
      case "dashboard":
        return <LayoutDashboard {...props} />;
      case "contacts":
      case "leads":
        return <Users {...props} />;
      case "platformUsers":
        return <UserCog {...props} />;
      case "userPlus":
        return <UserPlus {...props} />;
      case "tasks":
        return <CheckCheck {...props} />;
      case "calendar":
      case "attendance":
        return <CalendarDays {...props} />;
      case "quotations":
        return <FileText {...props} />;
      case "invoices":
      case "billing":
        return <Receipt {...props} />;
      case "ai":
        return <Sparkles {...props} />;
      case "reports":
      case "analytics":
      case "performance":
        return <ChartColumn {...props} />;
      case "settings":
        return <Settings {...props} />;
      case "support":
      case "help":
        return <Headset {...props} />;
      case "security":
      case "roleManagement":
      case "roles":
        return <ShieldCheck {...props} />;
      case "employees":
        return <UserCheck {...props} />;
      case "plans":
      case "packages":
        return <CreditCard {...props} />;
      case "supportTickets":
        return <Ticket {...props} />;
      case "modules":
        return <Layers {...props} />;
      case "telemetry":
        return <Activity {...props} />;
      case "auditLogs":
        return <FileClock {...props} />;
      case "notifications":
        return <Bell {...props} />;
      case "mail":
        return <Mail {...props} />;
      case "search":
        return <Search {...props} />;
      case "filter":
        return <Filter {...props} />;
      case "sliders":
        return <SlidersHorizontal {...props} />;
      case "plus":
      case "add":
        return <Plus {...props} />;
      case "trash":
      case "delete":
        return <Trash2 {...props} />;
      case "refresh":
      case "sync":
        return <RefreshCw {...props} />;
      case "download":
      case "export":
        return <Download {...props} />;
      case "upload":
      case "import":
        return <Upload {...props} />;
      case "arrowRight":
      case "next":
        return <ArrowRight {...props} />;
      case "arrowLeft":
      case "back":
        return <ArrowLeft {...props} />;
      case "chevronRight":
        return <ChevronRight {...props} />;
      case "chevronLeft":
        return <ChevronLeft {...props} />;
      case "edit":
      case "pencil":
        return <Pencil {...props} />;
      case "copy":
        return <Copy {...props} />;
      case "send":
        return <Send {...props} />;
      case "eye":
      case "view":
        return <Eye {...props} />;
      case "eyeOff":
        return <EyeOff {...props} />;
      case "check":
      case "save":
        return <Check {...props} />;
      case "externalLink":
        return <ExternalLink {...props} />;

      // Animated Lucide Icons with smooth micro-interaction
      case "companies":
        return (
          <motion.div
            animate={
              !reducedMotion && (isFallbackAnimating || isHovered)
                ? { scaleY: [1, 1.1, 0.96, 1], y: [0, -1, 0] }
                : { scaleY: 1, y: 0 }
            }
            style={{ transformOrigin: "bottom center" }}
            transition={{ duration: 0.65, ease: [0.25, 1, 0.5, 1] }}
            className="shrink-0 select-none flex items-center justify-center pointer-events-none"
          >
            <Building2 size={size} className={className} />
          </motion.div>
        );

      case "deals":
        return (
          <motion.div
            animate={
              !reducedMotion && (isFallbackAnimating || isHovered)
                ? { rotate: [0, -6, 4, -1, 0], scale: [1, 1.05, 0.98, 1] }
                : { rotate: 0, scale: 1 }
            }
            style={{ transformOrigin: "center center" }}
            transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
            className="shrink-0 select-none flex items-center justify-center pointer-events-none"
          >
            <Handshake size={size} className={className} />
          </motion.div>
        );

      case "teamPerformance":
        return (
          <motion.div
            animate={
              !reducedMotion && (isFallbackAnimating || isHovered)
                ? { y: [0, -2, 0.4, 0], scale: [1, 1.04, 0.98, 1] }
                : { y: 0, scale: 1 }
            }
            transition={{ duration: 0.65, ease: [0.25, 1, 0.5, 1] }}
            className="shrink-0 select-none flex items-center justify-center pointer-events-none"
          >
            <BriefcaseBusiness size={size} className={className} />
          </motion.div>
        );

      default:
        if (FallbackIcon) {
          return <FallbackIcon size={size} className={`shrink-0 select-none ${className}`} />;
        }
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      data-animate-icon="true"
      onClick={onClick}
      className="inline-flex shrink-0 items-center justify-center"
    >
      {renderIcon()}
    </div>
  );
}
