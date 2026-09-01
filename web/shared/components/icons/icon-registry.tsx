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
  ArrowUpRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
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
  Clock,
  ClockAlert,
  TriangleAlert,
  HandCoins,
  DollarSign,
  BadgeDollarSign,
  Store,
  House,
  Boxes,
  MessageCircle,
  MessageSquare,
  Paperclip,
  Play,
  Video,
  Image,
  X,
  Menu,
  LogOut,
  ArrowLeftRight,
  Type,
  Laptop,
} from "@animateicons/react/lucide";
import { Building2, Handshake, BriefcaseBusiness, Palette, type LucideIcon } from "lucide-react";

export type IconName =
  | "dashboard"
  | "contacts"
  | "leads"
  | "user"
  | "userPlus"
  | "platformUsers"
  | "companies"
  | "building"
  | "organizations"
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
  | "sessions"
  | "plans"
  | "packages"
  | "notifications"
  | "mail"
  | "logout"
  | "arrowLeftRight"
  | "type"
  | "palette"
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
  | "arrowUpRight"
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
  | "circleCheck"
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
  | "messageSquare"
  | "clock"
  | "paperclip"
  | "video"
  | "image"
  | "play"
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
  animateOnMount?: boolean;
  standalone?: boolean;
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
  sessions: "sessions",
  devices: "sessions",
  laptop: "sessions",
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
  arrowupright: "arrowUpRight",
  viewreports: "arrowUpRight",
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
  cancel: "close",
  dismiss: "close",
  menu: "menu",
  message: "message",
  messagesquare: "messageSquare",
  clock: "clock",
  time: "clock",
  sla: "clock",
  paperclip: "paperclip",
  attachment: "paperclip",
  attachments: "paperclip",
  circlecheck: "circleCheck",
  checkcircle: "circleCheck",
  checkcircle2: "circleCheck",
  video: "video",
  image: "image",
  photo: "image",
  play: "play",
  shieldcheck: "security",
  shield: "security",
  logout: "logout",
  signout: "logout",
  arrowleftright: "arrowLeftRight",
  switch: "arrowLeftRight",
  swap: "arrowLeftRight",
  type: "type",
  typography: "type",
  font: "type",
  fonts: "type",
  palette: "palette",
  accent: "palette",
  accentcolor: "palette",
  color: "palette",
  theme: "palette",
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
  if (iconDisp.includes("logout") || iconDisp.includes("signout")) return "logout";
  if (iconDisp.includes("arrowleftright") || iconDisp.includes("switch") || iconDisp.includes("arrowrightleft")) return "arrowLeftRight";
  if (iconDisp.includes("palette") || iconDisp.includes("paint") || iconDisp.includes("theme")) return "palette";
  if (iconDisp.includes("type") || iconDisp.includes("font")) return "type";
  if (iconDisp.includes("trash")) return "trash";
  if (iconDisp.includes("pencil") || iconDisp.includes("edit") || iconDisp.includes("squarepen")) return "edit";
  if (iconDisp.includes("userplus")) return "userPlus";
  if (iconDisp.includes("usercog") || iconDisp.includes("usersround")) return "platformUsers";
  if (iconDisp.includes("usercheck") || iconDisp.includes("usersquare")) return "employees";
  if (iconDisp.includes("users") || iconDisp.includes("contact")) return "contacts";
  if (iconDisp.includes("user")) return "user";
  if (iconDisp.includes("activity")) return "telemetry";
  if (iconDisp.includes("laptop") || iconDisp.includes("monitor") || iconDisp.includes("device")) return "sessions";
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
  if (iconDisp.includes("circlecheck") || iconDisp.includes("checkcircle")) return "circleCheck";
  if (iconDisp.includes("check")) return "check";
  if (iconDisp.includes("externallink") || iconDisp.includes("link")) return "externalLink";
  if (iconDisp.includes("clock") || iconDisp.includes("timer")) return "clock";
  if (iconDisp.includes("paperclip") || iconDisp.includes("attachment")) return "paperclip";
  if (iconDisp.includes("messagesquare")) return "messageSquare";
  if (iconDisp.includes("video") || iconDisp.includes("film")) return "video";
  if (iconDisp.includes("image") || iconDisp.includes("photo")) return "image";
  if (iconDisp.includes("play")) return "play";
  if (iconDisp.includes("calendar")) return "calendar";
  if (iconDisp.includes("file") || iconDisp.includes("filetext")) return "quotations";
  if (iconDisp.includes("building") || iconDisp.includes("company")) return "companies";
  if (iconDisp.includes("handshake") || iconDisp.includes("deal")) return "deals";
  if (iconDisp.includes("chevronright") || iconDisp.includes("chevronsright")) return "chevronRight";
  if (iconDisp.includes("chevronleft") || iconDisp.includes("chevronsleft")) return "chevronLeft";
  if (iconDisp.includes("chevrondown")) return "chevronDown";
  if (iconDisp.includes("chevronup")) return "chevronUp";
  if (iconDisp.includes("arrowupright")) return "arrowUpRight";
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

  // Sessions & Devices
  if (text.includes("session") || text.includes("device") || text.includes("laptop") || lastPathPart === "sessions") return "sessions";

  // Audit Logs & Activity History
  if (text.includes("audit") || text.includes("audit log") || text.includes("activity log") || text.includes("auditlog") || text.includes("scroll") || text.includes("history") || lastPathPart === "audit-logs" || lastPathPart === "audit-log") return "auditLogs";

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

  if (text.includes("logout") || text.includes("sign out") || text.includes("signout") || text.includes("log out")) return "logout";
  if (text.includes("switch") || text.includes("swap") || text.includes("arrowleftright") || text.includes("tenant crm")) return "arrowLeftRight";
  if (text.includes("palette") || text.includes("accent") || text.includes("color theme")) return "palette";
  if (text.includes("typography") || text.includes("font") || text.includes("typeface")) return "type";
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
  if (text.includes("messagesquare") || text.includes("thread") || text.includes("conversation") || text.includes("reply") || text.includes("replies")) return "messageSquare";
  if (text.includes("message") || text.includes("chat") || text.includes("comment")) return "message";
  if (text.includes("clock") || text.includes("time") || text.includes("sla") || text.includes("hour")) return "clock";
  if (text.includes("paperclip") || text.includes("attachment")) return "paperclip";
  if (text.includes("circlecheck") || text.includes("checkcircle") || text.includes("staff")) return "circleCheck";
  if (text.includes("video") || text.includes("film")) return "video";
  if (text.includes("image") || text.includes("photo") || text.includes("picture") || text.includes("screenshot")) return "image";
  if (text.includes("play")) return "play";
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
 * Primary Centralized Animated Icon Component powered by @animateicons/react and Framer Motion.
 * Strictly animates ONCE per hover/interaction (no continuous loops).
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
  animateOnMount = false,
  standalone = false,
  triggerAnimation,
  duration = 0.55,
  onClick,
}: AppIconProps) {
  const iconName = resolveIconName(name, href, FallbackIcon);
  const iconRef = useRef<AnimateIconHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isFormFieldRef = useRef(false);
  const hasAnimatedForCurrentHoverRef = useRef(false);

  const stopCurrentAnimation = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    iconRef.current?.stopAnimation?.();
    setIsAnimating(false);
  }, []);

  const playOneShotAnimation = useCallback(() => {
    if (reducedMotion) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    iconRef.current?.startAnimation?.();
    setIsAnimating(true);

    // Auto-reset back to rest state cleanly after one complete cycle
    timerRef.current = setTimeout(() => {
      iconRef.current?.stopAnimation?.();
      setIsAnimating(false);
      timerRef.current = null;
    }, Math.max(500, Math.round(duration * 1000)));
  }, [duration, reducedMotion]);

  // Handle explicit triggerAnimation key changes (e.g. click trigger)
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

  // Animate on mount if requested (e.g. when opening a popup/modal)
  useEffect(() => {
    if (animateOnMount) {
      const mountTimer = setTimeout(() => {
        playOneShotAnimation();
      }, 150);
      return () => clearTimeout(mountTimer);
    }
  }, [animateOnMount, playOneShotAnimation]);

  // Handle prop-driven hover state cleanly: strictly ONCE per hover cycle
  useEffect(() => {
    if (disableHover || isFormFieldRef.current) return;

    if (isHovered) {
      if (!hasAnimatedForCurrentHoverRef.current) {
        hasAnimatedForCurrentHoverRef.current = true;
        playOneShotAnimation();
      }
    } else {
      hasAnimatedForCurrentHoverRef.current = false;
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

  // Listen for parent interactive element hover / click / focus or form field input
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // 1. Direct interactive control (button, link, menu item, tab, etc.)
    const directButton = el.closest(
      'button, a, [role="button"], [role="tab"], [data-slot="tabs-trigger"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [data-slot="button"], [data-slot="dropdown-menu-item"], [data-slot="dropdown-menu-sub-trigger"]'
    );
    // 2. Explicit custom animate target (e.g. card with data-animate-target="true")
    const localTarget = el.closest('[data-animate-target="true"]');

    // Determine the controlling interactive parent:
    // - If standalone: only bind to localTarget if specified, otherwise direct icon hover (CASE 3)
    // - Direct button/link ALWAYS takes priority so icons inside buttons only react to their own button!
    // - If not inside a button, bind to localTarget card if present
    const parentInteractive = standalone
      ? localTarget
      : (directButton || localTarget);

    const handleCustomTrigger = () => {
      if (!hasAnimatedForCurrentHoverRef.current) {
        hasAnimatedForCurrentHoverRef.current = true;
        playOneShotAnimation();
      }
    };
    const handleCustomStop = () => {
      hasAnimatedForCurrentHoverRef.current = false;
      stopCurrentAnimation();
    };

    el.addEventListener("trigger-icon-animation", handleCustomTrigger);
    el.addEventListener("stop-icon-animation", handleCustomStop);

    // CASE 1: Icon is inside a button / link / interactive element.
    // It must strictly respond ONLY to hover, focus, or clicks on that button itself.
    if (parentInteractive) {
      isFormFieldRef.current = false;

      const onEnter = () => {
        if (!disableHover) {
          if (!hasAnimatedForCurrentHoverRef.current) {
            hasAnimatedForCurrentHoverRef.current = true;
            playOneShotAnimation();
          }
        }
      };

      const onLeave = () => {
        if (!disableHover) {
          hasAnimatedForCurrentHoverRef.current = false;
          stopCurrentAnimation();
        }
      };

      const onFocusOrClick = () => {
        playOneShotAnimation();
      };

      if (!disableHover) {
        parentInteractive.addEventListener("mouseenter", onEnter);
        parentInteractive.addEventListener("mouseleave", onLeave);
      }
      parentInteractive.addEventListener("focusin", onFocusOrClick);
      parentInteractive.addEventListener("focusout", onLeave);
      parentInteractive.addEventListener("click", onFocusOrClick);

      return () => {
        if (!disableHover) {
          parentInteractive.removeEventListener("mouseenter", onEnter);
          parentInteractive.removeEventListener("mouseleave", onLeave);
        }
        parentInteractive.removeEventListener("focusin", onFocusOrClick);
        parentInteractive.removeEventListener("focusout", onLeave);
        parentInteractive.removeEventListener("click", onFocusOrClick);
        el.removeEventListener("trigger-icon-animation", handleCustomTrigger);
        el.removeEventListener("stop-icon-animation", handleCustomStop);
      };
    }

    // CASE 2: Icon is an adornment for an input field (NOT inside a button).
    // Find the immediate sibling or enclosing control wrapper with an input/textarea/select.
    const findAssociatedInput = (): HTMLElement | null => {
      if (standalone) return null;

      // 1. Direct relative wrapper for this input
      const relativeParent = el.closest('.relative, [data-slot="control"], .form-control');
      if (relativeParent) {
        const input = relativeParent.querySelector<HTMLElement>(
          'input:not([type="hidden"]):not([type="file"]), textarea, select, [role="combobox"], [role="textbox"]'
        );
        if (input) return input;
      }

      // 2. Direct parent if it contains an input
      if (el.parentElement) {
        const input = el.parentElement.querySelector<HTMLElement>(
          'input:not([type="hidden"]):not([type="file"]), textarea, select, [role="combobox"], [role="textbox"]'
        );
        if (input) return input;
      }

      // 3. Enclosing group / form item
      const groupParent = el.closest('.group, [data-slot="form-item"], .space-y-1\\.5, .space-y-2');
      if (groupParent) {
        const input = groupParent.querySelector<HTMLElement>(
          'input:not([type="hidden"]):not([type="file"]), textarea, select, [role="combobox"], [role="textbox"], [data-slot="select-trigger"]'
        );
        if (input) return input;
      }

      return null;
    };

    const targetInput = findAssociatedInput();
    const isField = Boolean(targetInput);
    isFormFieldRef.current = isField;

    if (targetInput) {
      const handleFieldFocusOrClick = () => {
        playOneShotAnimation();
      };

      targetInput.addEventListener("focus", handleFieldFocusOrClick);
      targetInput.addEventListener("click", handleFieldFocusOrClick);
      targetInput.addEventListener("pointerdown", handleFieldFocusOrClick);

      // Clicking directly on the icon inside the field focuses the input & animates
      const handleIconClick = () => {
        targetInput.focus();
        playOneShotAnimation();
      };
      el.addEventListener("click", handleIconClick);

      return () => {
        targetInput.removeEventListener("focus", handleFieldFocusOrClick);
        targetInput.removeEventListener("click", handleFieldFocusOrClick);
        targetInput.removeEventListener("pointerdown", handleFieldFocusOrClick);
        el.removeEventListener("click", handleIconClick);
        el.removeEventListener("trigger-icon-animation", handleCustomTrigger);
        el.removeEventListener("stop-icon-animation", handleCustomStop);
      };
    }

    // CASE 3: Standalone icon or icon inside non-interactive badge/text.
    // Hovering the icon directly triggers the animation.
    const onDirectEnter = () => {
      if (!disableHover) {
        if (!hasAnimatedForCurrentHoverRef.current) {
          hasAnimatedForCurrentHoverRef.current = true;
          playOneShotAnimation();
        }
      }
    };

    const onDirectLeave = () => {
      if (!disableHover) {
        hasAnimatedForCurrentHoverRef.current = false;
        stopCurrentAnimation();
      }
    };

    if (!disableHover) {
      el.addEventListener("mouseenter", onDirectEnter);
      el.addEventListener("mouseleave", onDirectLeave);
    }

    return () => {
      if (!disableHover) {
        el.removeEventListener("mouseenter", onDirectEnter);
        el.removeEventListener("mouseleave", onDirectLeave);
      }
      el.removeEventListener("trigger-icon-animation", handleCustomTrigger);
      el.removeEventListener("stop-icon-animation", handleCustomStop);
    };
  }, [playOneShotAnimation, stopCurrentAnimation, disableHover]);

  const props = {
    ref: iconRef,
    size,
    duration,
    isAnimated: false,
    className: `shrink-0 select-none ${className}`,
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
      case "circleCheck":
        return <CircleCheck {...props} />;
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
      case "messageSquare":
        return <MessageSquare {...props} />;
      case "clock":
        return <Clock {...props} />;
      case "paperclip":
        return <Paperclip {...props} />;
      case "video":
        return <Video {...props} />;
      case "image":
        return <Image {...props} />;
      case "logout":
        return <LogOut {...props} />;
      case "arrowLeftRight":
        return <ArrowLeftRight {...props} />;
      case "type":
        return <Type {...props} />;
      case "play":
        return <Play {...props} />;

      // Animated Lucide Icons with smooth micro-interaction
      case "chevronRight":
        return (
          <motion.div
            animate={
              !reducedMotion && isAnimating
                ? { x: [0, 3, 0] }
                : { x: 0 }
            }
            transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
            className="shrink-0 select-none flex items-center justify-center pointer-events-none"
          >
            <ChevronRight size={size} className={className} />
          </motion.div>
        );

      case "chevronLeft":
        return (
          <motion.div
            animate={
              !reducedMotion && isAnimating
                ? { x: [0, -3, 0] }
                : { x: 0 }
            }
            transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
            className="shrink-0 select-none flex items-center justify-center pointer-events-none"
          >
            <ChevronLeft size={size} className={className} />
          </motion.div>
        );

      case "chevronsRight":
        return (
          <motion.div
            animate={
              !reducedMotion && isAnimating
                ? { x: [0, 4, 0], scale: [1, 1.08, 1] }
                : { x: 0, scale: 1 }
            }
            transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
            className="shrink-0 select-none flex items-center justify-center pointer-events-none"
          >
            <ChevronsRight size={size} className={className} />
          </motion.div>
        );

      case "chevronsLeft":
        return (
          <motion.div
            animate={
              !reducedMotion && isAnimating
                ? { x: [0, -4, 0], scale: [1, 1.08, 1] }
                : { x: 0, scale: 1 }
            }
            transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
            className="shrink-0 select-none flex items-center justify-center pointer-events-none"
          >
            <ChevronsLeft size={size} className={className} />
          </motion.div>
        );

      case "arrowUpRight":
        return (
          <motion.div
            animate={
              !reducedMotion && isAnimating
                ? { x: [0, 2, 0], y: [0, -2, 0], scale: [1, 1.15, 1] }
                : { x: 0, y: 0, scale: 1 }
            }
            transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
            className="shrink-0 select-none flex items-center justify-center pointer-events-none"
          >
            <ArrowUpRight size={size} className={className} />
          </motion.div>
        );

      case "filter":
        return (
          <motion.div
            animate={
              !reducedMotion && isAnimating
                ? { rotate: [0, -12, 12, -4, 0], scale: [1, 1.1, 0.95, 1] }
                : { rotate: 0, scale: 1 }
            }
            transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
            className="shrink-0 select-none flex items-center justify-center pointer-events-none"
          >
            {FallbackIcon === Filter ? (
              <Filter size={size} className={className} />
            ) : (
              <SlidersHorizontal size={size} className={className} />
            )}
          </motion.div>
        );

      case "companies":
      case "building":
      case "organizations":
        return (
          <motion.div
            animate={
              !reducedMotion && isAnimating
                ? { scale: [1, 1.18, 0.95, 1], y: [0, -3, 0], rotate: [0, -6, 5, 0] }
                : { scale: 1, y: 0, rotate: 0 }
            }
            style={{ transformOrigin: "bottom center" }}
            transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
            className="shrink-0 select-none flex items-center justify-center pointer-events-none"
          >
            <Building2 size={size} className={className} />
          </motion.div>
        );

      case "deals":
        return (
          <motion.div
            animate={
              !reducedMotion && isAnimating
                ? { rotate: [0, -6, 4, -1, 0], scale: [1, 1.05, 0.98, 1] }
                : { rotate: 0, scale: 1 }
            }
            style={{ transformOrigin: "center center" }}
            transition={{ duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
            className="shrink-0 select-none flex items-center justify-center pointer-events-none"
          >
            <Handshake size={size} className={className} />
          </motion.div>
        );

      case "teamPerformance":
        return (
          <motion.div
            animate={
              !reducedMotion && isAnimating
                ? { y: [0, -2, 0.4, 0], scale: [1, 1.04, 0.98, 1] }
                : { y: 0, scale: 1 }
            }
            transition={{ duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
            className="shrink-0 select-none flex items-center justify-center pointer-events-none"
          >
            <BriefcaseBusiness size={size} className={className} />
          </motion.div>
        );

      case "palette":
        return (
          <motion.div
            animate={
              !reducedMotion && isAnimating
                ? { rotate: [0, -18, 16, -6, 0], scale: [1, 1.15, 0.95, 1] }
                : { rotate: 0, scale: 1 }
            }
            style={{ transformOrigin: "center center" }}
            transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
            className="shrink-0 select-none flex items-center justify-center pointer-events-none"
          >
            <Palette size={size} className={className} />
          </motion.div>
        );

      case "sessions":
        return (
          <motion.div
            animate={
              !reducedMotion && isAnimating
                ? { scale: [1, 1.1, 0.96, 1], y: [0, -1.5, 0] }
                : { scale: 1, y: 0 }
            }
            transition={{ duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
            className="shrink-0 select-none flex items-center justify-center pointer-events-none"
          >
            <Laptop size={size} className={className} />
          </motion.div>
        );

      default:
        if (FallbackIcon) {
          return (
            <motion.div
              animate={
                !reducedMotion && isAnimating
                  ? { scale: [1, 1.14, 0.96, 1], rotate: [0, -4, 4, 0], y: [0, -1, 0] }
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
    <span
      ref={containerRef}
      data-animate-icon="true"
      onClick={onClick}
      className="inline-flex shrink-0 items-center justify-center select-none pointer-events-auto"
    >
      <span className="inline-flex shrink-0 items-center justify-center pointer-events-none">
        {renderIcon()}
      </span>
    </span>
  );
}
