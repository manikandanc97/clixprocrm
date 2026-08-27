"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  User,
  UserCog,
  UserCheck,
  UserPlus,
  CalendarDays,
  Calendar,
  CheckCheck,
  Check,
  CircleCheck,
  CirclePlus,
  FileText,
  Receipt,
  Sparkles,
  ChartColumn,
  ChartBar,
  ChartLine,
  ChartPie,
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
  BellDot,
  Mail,
  Search,
  Filter,
  SlidersHorizontal,
  Plus,
  Trash2,
  Trash,
  RefreshCw,
  Download,
  Upload,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Pencil,
  Copy,
  Send,
  Eye,
  EyeOff,
  ExternalLink,
  Phone,
  PhoneCall,
  Globe,
  Lock,
  Key,
  Folder,
  FolderOpen,
  File,
  FilePlus,
  Tag,
  Bookmark,
  Heart,
  Star,
  Pin,
  Info,
  ClockAlert,
  TriangleAlert,
  HandCoins,
  DollarSign,
  BadgeDollarSign,
  Store,
  House,
  Boxes,
  MessageCircle,
  X,
  Menu,
} from "@animateicons/react/lucide";
import { Building2, Handshake, BriefcaseBusiness, type LucideIcon } from "lucide-react";

export type IconName =
  | "dashboard"
  | "contacts"
  | "leads"
  | "user"
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
  | "chevronDown"
  | "chevronUp"
  | "chevronsLeft"
  | "chevronsRight"
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
  | "phone"
  | "globe"
  | "lock"
  | "key"
  | "folder"
  | "file"
  | "tag"
  | "bookmark"
  | "star"
  | "info"
  | "alert"
  | "close"
  | "menu"
  | "message"
  | "default";

export interface AppIconProps {
  name?: string;
  href?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string; size?: number; [key: string]: any }>;
  size?: number;
  className?: string;
  active?: boolean;
  isHovered?: boolean;
  disableHover?: boolean;
  triggerAnimation?: number | string;
  duration?: number;
  onClick?: (e: React.MouseEvent) => void;
}

const CANONICAL_ICONS: Record<string, IconName> = {
  dashboard: "dashboard",
  contacts: "contacts",
  leads: "leads",
  user: "user",
  userplus: "userPlus",
  platformusers: "platformUsers",
  companies: "companies",
  deals: "deals",
  tasks: "tasks",
  calendar: "calendar",
  attendance: "attendance",
  quotations: "quotations",
  invoices: "invoices",
  billing: "billing",
  ai: "ai",
  reports: "reports",
  analytics: "analytics",
  performance: "performance",
  teamperformance: "teamPerformance",
  employees: "employees",
  roles: "roles",
  rolemanagement: "roleManagement",
  security: "security",
  settings: "settings",
  support: "support",
  help: "help",
  supporttickets: "supportTickets",
  modules: "modules",
  telemetry: "telemetry",
  auditlogs: "auditLogs",
  plans: "plans",
  packages: "packages",
  notifications: "notifications",
  mail: "mail",
  search: "search",
  filter: "filter",
  sliders: "sliders",
  plus: "plus",
  add: "add",
  trash: "trash",
  delete: "delete",
  refresh: "refresh",
  sync: "sync",
  download: "download",
  export: "export",
  upload: "upload",
  import: "import",
  arrowright: "arrowRight",
  next: "next",
  arrowleft: "arrowLeft",
  back: "back",
  chevronright: "chevronRight",
  chevronleft: "chevronLeft",
  chevrondown: "chevronDown",
  chevronup: "chevronUp",
  chevronsleft: "chevronsLeft",
  chevronsright: "chevronsRight",
  edit: "edit",
  pencil: "pencil",
  copy: "copy",
  send: "send",
  eye: "eye",
  view: "view",
  eyeoff: "eyeOff",
  check: "check",
  save: "save",
  externallink: "externalLink",
  phone: "phone",
  globe: "globe",
  lock: "lock",
  key: "key",
  folder: "folder",
  file: "file",
  tag: "tag",
  bookmark: "bookmark",
  star: "star",
  info: "info",
  alert: "alert",
  close: "close",
  menu: "menu",
  message: "message",
};

export function resolveIconName(name?: string, href?: string, IconComponent?: any): IconName {
  const iconDisp = (
    IconComponent?.displayName ||
    IconComponent?.name ||
    IconComponent?.render?.displayName ||
    IconComponent?.render?.name ||
    ""
  ).toLowerCase();
  const nameText = (name || "").toLowerCase();
  const hrefText = (href || "").toLowerCase();
  const pathParts = hrefText.split(/[\/?#]/).filter(Boolean);
  const lastPathPart = pathParts[pathParts.length - 1] || "";
  const text = `${nameText} ${hrefText}`.trim();

  // 1. Direct canonical name lookup
  const cleanName = nameText.replace(/[-_\s]/g, "");
  if (cleanName && CANONICAL_ICONS[cleanName]) {
    return CANONICAL_ICONS[cleanName];
  }

  // 2. Direct IconComponent name matches
  if (iconDisp.includes("trash")) return "trash";
  if (iconDisp.includes("pencil") || iconDisp.includes("edit") || iconDisp.includes("squarepen")) return "edit";
  if (iconDisp.includes("userplus")) return "userPlus";
  if (iconDisp.includes("usercog") || iconDisp.includes("usersround")) return "platformUsers";
  if (iconDisp.includes("usercheck") || iconDisp.includes("usersquare")) return "employees";
  if (iconDisp.includes("users") || iconDisp.includes("contact")) return "contacts";
  if (iconDisp.includes("user")) return "user";
  if (iconDisp.includes("activity")) return "telemetry";
  if (iconDisp.includes("scroll") || iconDisp.includes("fileclock") || iconDisp.includes("history")) return "auditLogs";
  if (iconDisp.includes("layers") || iconDisp.includes("boxes")) return "modules";
  if (iconDisp.includes("creditcard") || iconDisp.includes("package")) return "plans";
  if (iconDisp.includes("receipt") || iconDisp.includes("banknote")) return "invoices";
  if (iconDisp.includes("sparkle") || iconDisp.includes("bot") || iconDisp.includes("brain")) return "ai";
  if (iconDisp.includes("chart") || iconDisp.includes("barchart") || iconDisp.includes("trending")) return "reports";
  if (iconDisp.includes("shieldalert") || iconDisp.includes("shieldcheck") || iconDisp.includes("shield")) return "security";
  if (iconDisp.includes("setting") || iconDisp.includes("cog")) return "settings";
  if (iconDisp.includes("download") || iconDisp.includes("arrowdowntoline")) return "download";
  if (iconDisp.includes("upload") || iconDisp.includes("uploadcloud")) return "upload";
  if (iconDisp.includes("refresh") || iconDisp.includes("rotate") || iconDisp.includes("sync")) return "refresh";
  if (iconDisp.includes("search")) return "search";
  if (iconDisp.includes("filter") || iconDisp.includes("slider") || iconDisp.includes("arrowupdown")) return "filter";
  if (iconDisp.includes("plus") || iconDisp.includes("circleplus")) return "plus";
  if (iconDisp.includes("copy") || iconDisp.includes("clipboard")) return "copy";
  if (iconDisp.includes("mail") || iconDisp.includes("envelope") || iconDisp.includes("inbox")) return "mail";
  if (iconDisp.includes("phone")) return "phone";
  if (iconDisp.includes("bell")) return "notifications";
  if (iconDisp.includes("eyeoff")) return "eyeOff";
  if (iconDisp.includes("eye")) return "eye";
  if (iconDisp.includes("check")) return "check";
  if (iconDisp.includes("externallink") || iconDisp.includes("link")) return "externalLink";
  if (iconDisp.includes("calendar")) return "calendar";
  if (iconDisp.includes("file") || iconDisp.includes("filetext")) return "quotations";
  if (iconDisp.includes("building") || iconDisp.includes("company")) return "companies";
  if (iconDisp.includes("handshake") || iconDisp.includes("deal")) return "deals";
  if (iconDisp.includes("chevronright") || iconDisp.includes("chevronsright")) return "chevronRight";
  if (iconDisp.includes("chevronleft") || iconDisp.includes("chevronsleft")) return "chevronLeft";
  if (iconDisp.includes("chevrondown")) return "chevronDown";
  if (iconDisp.includes("chevronup")) return "chevronUp";
  if (iconDisp.includes("arrowright")) return "arrowRight";
  if (iconDisp.includes("arrowleft")) return "arrowLeft";
  if (iconDisp.includes("lock")) return "lock";
  if (iconDisp.includes("key")) return "key";
  if (iconDisp.includes("folder")) return "folder";
  if (iconDisp.includes("tag")) return "tag";
  if (iconDisp.includes("bookmark")) return "bookmark";
  if (iconDisp.includes("star")) return "star";
  if (iconDisp.includes("info")) return "info";
  if (iconDisp.includes("alert") || iconDisp.includes("trianglealert")) return "alert";
  if (iconDisp.includes("close") || iconDisp.includes("x")) return "close";
  if (iconDisp.includes("menu")) return "menu";

  // 3. High-specificity route, action, and keyword resolution
  if (text.includes("trash") || text.includes("delete") || text.includes("remove") || text.includes("destroy")) return "trash";
  if (text.includes("edit") || text.includes("pencil") || text.includes("modify") || text.includes("rename")) return "edit";
  if (text.includes("bulk upload") || text.includes("import") || text.includes("upload") || text.includes("import data") || text.includes("import leads") || text.includes("csv")) return "upload";
  if (text.includes("download") || text.includes("export") || text.includes("export data") || text.includes("save report")) return "download";
  if (text.includes("refresh") || text.includes("sync") || text.includes("reload") || text.includes("re-fetch")) return "refresh";
  if (text.includes("tag") || text.includes("status") || text.includes("stage")) return "tag";
  if (text.includes("lead") || text.includes("add lead") || text.includes("create lead") || text.includes("create first lead") || text.includes("new lead") || text.includes("userplus") || text.includes("new user") || text.includes("invite")) return "userPlus";
  if (text.includes("deal") || text.includes("pipeline") || text.includes("handshake") || lastPathPart === "deals") return "deals";
  if (text.includes("task") || text.includes("todo") || text.includes("checklist") || lastPathPart === "tasks") return "tasks";
  if (text.includes("quotation") || text.includes("proposal") || text.includes("quote") || lastPathPart === "quotations") return "quotations";
  if (text.includes("invoice") || text.includes("receipt") || text.includes("billing") || text.includes("revenue") || lastPathPart === "billing" || lastPathPart === "invoices") return "invoices";
  if (text.includes("compan") || text.includes("organization") || lastPathPart === "companies" || lastPathPart === "organizations") return "companies";
  if (text.includes("contact") || text.includes("customer") || lastPathPart === "contacts" || lastPathPart === "customers") return "contacts";
  if (text.includes("plus") || text.includes("add") || text.includes("create") || text.includes("new")) return "plus";

  // Modules & Navigation
  if (text.includes("module") || text.includes("layer") || lastPathPart === "modules") return "modules";

  // Telemetry & Operations
  if (text.includes("telemetry") || text.includes("operation") || text.includes("secops") || lastPathPart === "operations") return "telemetry";

  // Audit Logs & Activity History
  if (text.includes("audit") || text.includes("log") || text.includes("scroll") || text.includes("history") || lastPathPart === "audit-logs") return "auditLogs";

  // Settings
  if (text.includes("setting") || lastPathPart === "settings" || text.includes("preference") || text.includes("config")) return "settings";

  // Platform Users & Employee Roles
  if (text.includes("platform user") || (text.includes("user") && !text.includes("contact") && !text.includes("lead") && lastPathPart === "users")) return "platformUsers";
  if (text.includes("employee") || text.includes("staff") || text.includes("member") || lastPathPart === "employees") return "employees";
  if (text.includes("user") || text.includes("fullname") || text.includes("full name")) return "user";

  // Security & Permissions
  if (text.includes("security") || text.includes("role") || text.includes("permission") || lastPathPart === "security" || lastPathPart === "role-management") return "security";

  // Billing, Invoicing & Plans
  if (text.includes("payment") || text.includes("plan") || text.includes("package") || lastPathPart === "plans") return "plans";

  // AI
  if (text.includes("ai") || text.includes("sparkle") || text.includes("clixpro ai") || text.includes("neural") || text.includes("intelligence") || text.includes("model") || text.includes("tier") || lastPathPart === "ai") return "ai";

  // Reporting & Analytics
  if (text.includes("team-performance") || text.includes("team performance") || lastPathPart === "team-performance") return "teamPerformance";
  if (text.includes("report") || text.includes("analytics") || text.includes("performance") || text.includes("stats") || text.includes("metric") || lastPathPart === "reports" || lastPathPart === "analytics" || lastPathPart === "performance") return "reports";

  // Support & Help
  if (text.includes("ticket") || lastPathPart === "support-tickets") return "supportTickets";
  if (text.includes("help") || text.includes("support") || text.includes("buoy") || text.includes("faq") || lastPathPart === "help") return "support";

  // Tasks & Calendars
  if (text.includes("attendance") || lastPathPart === "attendance") return "attendance";
  if (text.includes("calendar") || text.includes("meeting") || text.includes("schedule") || text.includes("event") || lastPathPart === "calendar") return "calendar";

  // Navigation Utilities
  if (text.includes("notification") || text.includes("bell")) return "notifications";
  if (text.includes("alert") || text.includes("warning") || text.includes("priority")) return "alert";
  if (text.includes("mail") || text.includes("email") || text.includes("inbox")) return "mail";
  if (text.includes("phone") || text.includes("call")) return "phone";
  if (text.includes("search") || text.includes("find") || text.includes("lookup")) return "search";
  if (text.includes("filter") || text.includes("sort") || text.includes("slider")) return "filter";
  if (text.includes("arrowright") || text.includes("next") || text.includes("forward")) return "arrowRight";
  if (text.includes("arrowleft") || text.includes("back") || text.includes("prev") || text.includes("previous")) return "arrowLeft";
  if (text.includes("chevronright")) return "chevronRight";
  if (text.includes("chevronleft")) return "chevronLeft";
  if (text.includes("chevrondown")) return "chevronDown";
  if (text.includes("chevronup")) return "chevronUp";
  if (text.includes("copy") || text.includes("duplicate") || text.includes("clone")) return "copy";
  if (text.includes("send") || text.includes("share")) return "send";
  if (text.includes("eyeoff") || text.includes("hide")) return "eyeOff";
  if (text.includes("eye") || text.includes("view") || text.includes("show") || text.includes("preview")) return "eye";
  if (text.includes("check") || text.includes("save") || text.includes("done") || text.includes("confirm") || text.includes("submit") || text.includes("apply")) return "check";
  if (text.includes("externallink") || text.includes("link")) return "externalLink";
  if (text.includes("lock") || text.includes("password")) return "lock";
  if (text.includes("key") || text.includes("secret") || text.includes("token")) return "key";
  if (text.includes("folder")) return "folder";
  if (text.includes("file") || text.includes("document")) return "file";
  if (text.includes("bookmark")) return "bookmark";
  if (text.includes("star") || text.includes("rating")) return "star";
  if (text.includes("info")) return "info";
  if (text.includes("globe") || text.includes("website") || text.includes("domain")) return "globe";
  if (text.includes("message") || text.includes("chat") || text.includes("comment")) return "message";
  if (text.includes("close") || text.includes("cancel") || text.includes("dismiss")) return "close";
  if (text.includes("menu")) return "menu";

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
  disableHover = false,
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
    iconRef.current?.stopAnimation?.();
    setIsFallbackAnimating(false);
  }, []);

  const playOneShotAnimation = useCallback(() => {
    if (reducedMotion) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    iconRef.current?.startAnimation?.();
    setIsFallbackAnimating(true);

    // Auto-reset back to rest state cleanly after one complete cycle
    timerRef.current = setTimeout(() => {
      iconRef.current?.stopAnimation?.();
      setIsFallbackAnimating(false);
      timerRef.current = null;
    }, Math.max(600, Math.round(duration * 1000)));
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

  // Handle prop-driven hover state cleanly
  useEffect(() => {
    if (!disableHover && isHovered) {
      playOneShotAnimation();
    } else {
      stopCurrentAnimation();
    }
  }, [isHovered, disableHover, playOneShotAnimation, stopCurrentAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Listen for parent interactive element hover / click / focus
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const parentInteractive = el.closest(
      'button, a, [role="button"], [role="menuitem"], [data-slot="button"], tr, .group, [data-interactive], .relative, [data-slot="form-item"], .form-item, label'
    );

    const onEnter = () => {
      if (!disableHover) {
        playOneShotAnimation();
      }
    };
    const onLeave = () => {
      if (!disableHover) {
        stopCurrentAnimation();
      }
    };
    const onFocusOrClick = () => playOneShotAnimation();

    if (parentInteractive) {
      if (!disableHover) {
        parentInteractive.addEventListener("mouseenter", onEnter);
        parentInteractive.addEventListener("mouseleave", onLeave);
      }
      parentInteractive.addEventListener("focusin", onFocusOrClick);
      parentInteractive.addEventListener("focusout", onLeave);
      parentInteractive.addEventListener("click", onFocusOrClick);
    }

    const handleCustomTrigger = () => playOneShotAnimation();
    const handleCustomStop = () => stopCurrentAnimation();

    el.addEventListener("trigger-icon-animation", handleCustomTrigger);
    el.addEventListener("stop-icon-animation", handleCustomStop);

    return () => {
      if (parentInteractive) {
        if (!disableHover) {
          parentInteractive.removeEventListener("mouseenter", onEnter);
          parentInteractive.removeEventListener("mouseleave", onLeave);
        }
        parentInteractive.removeEventListener("focusin", onFocusOrClick);
        parentInteractive.removeEventListener("focusout", onLeave);
        parentInteractive.removeEventListener("click", onFocusOrClick);
      }
      el.removeEventListener("trigger-icon-animation", handleCustomTrigger);
      el.removeEventListener("stop-icon-animation", handleCustomStop);
    };
  }, [playOneShotAnimation, stopCurrentAnimation, disableHover]);

  const props = {
    ref: iconRef,
    size,
    duration,
    className: `shrink-0 select-none ${className}`,
    onMouseEnter: () => {
      if (!disableHover) playOneShotAnimation();
    },
    onMouseLeave: () => {
      if (!disableHover) stopCurrentAnimation();
    },
  };

  const renderIcon = () => {
    switch (iconName) {
      case "dashboard":
        return <LayoutDashboard {...props} />;
      case "contacts":
      case "leads":
        return <Users {...props} />;
      case "user":
        return <User {...props} />;
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
      case "phone":
        return <Phone {...props} />;
      case "search":
        return <Search {...props} />;
      case "filter":
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
      case "chevronDown":
        return <ChevronDown {...props} />;
      case "chevronUp":
        return <ChevronUp {...props} />;
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
      case "lock":
        return <Lock {...props} />;
      case "key":
        return <Key {...props} />;
      case "folder":
        return <Folder {...props} />;
      case "file":
        return <File {...props} />;
      case "tag":
        return <Tag {...props} />;
      case "bookmark":
        return <Bookmark {...props} />;
      case "star":
        return <Star {...props} />;
      case "info":
        return <Info {...props} />;
      case "alert":
        return <TriangleAlert {...props} />;
      case "close":
        return <X {...props} />;
      case "menu":
        return <Menu {...props} />;
      case "message":
        return <MessageCircle {...props} />;

      // Animated Lucide Icons with smooth micro-interaction
      case "companies":
        return (
          <motion.div
            animate={
              !reducedMotion && (isFallbackAnimating || isHovered)
                ? { scaleY: [1, 1.08, 0.96, 1], y: [0, -1.5, 0] }
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
          return (
            <motion.div
              animate={
                !reducedMotion && (isFallbackAnimating || isHovered)
                  ? { scale: [1, 1.14, 0.96, 1], rotate: [0, -5, 5, 0], y: [0, -1, 0] }
                  : { scale: 1, rotate: 0, y: 0 }
              }
              transition={{ duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
              className="shrink-0 select-none flex items-center justify-center pointer-events-none"
            >
              <FallbackIcon size={size} className={className} />
            </motion.div>
          );
        }
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      data-animate-icon="true"
      onClick={onClick}
      onMouseEnter={() => {
        if (!disableHover) playOneShotAnimation();
      }}
      onMouseLeave={() => {
        if (!disableHover) stopCurrentAnimation();
      }}
      className="inline-flex shrink-0 items-center justify-center"
    >
      {renderIcon()}
    </div>
  );
}
