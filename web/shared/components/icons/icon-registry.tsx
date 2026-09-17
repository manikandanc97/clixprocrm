"use client";

import React from "react";
import {
  LayoutDashboard,
  Users,
  User,
  UserCog,
  UserCheck,
  UserPlus,
  CalendarDays,
  CheckCheck,
  Check,
  CircleCheck,
  FileText,
  Receipt,
  Sparkles,
  ChartColumn,
  Settings,
  Headset,
  ShieldCheck,
  CreditCard,
  Ticket,
  Layers,
  Activity,
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
  Globe,
  Lock,
  Key,
  Folder,
  File,
  Tag,
  Bookmark,
  Star,
  Info,
  Clock,
  TriangleAlert,
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
  Building2,
  Handshake,
  BriefcaseBusiness,
  Palette,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

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
  icon?: LucideIcon | React.ComponentType<{ className?: string; size?: number; [key: string]: unknown }>;
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

const ICON_MAP: Record<IconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  contacts: Users,
  leads: Users,
  user: User,
  userPlus: UserPlus,
  platformUsers: UserCog,
  companies: Building2,
  building: Building2,
  organizations: Building2,
  deals: Handshake,
  tasks: CheckCheck,
  calendar: CalendarDays,
  attendance: CalendarDays,
  quotations: FileText,
  invoices: Receipt,
  billing: Receipt,
  ai: Sparkles,
  reports: ChartColumn,
  analytics: ChartColumn,
  performance: ChartColumn,
  teamPerformance: BriefcaseBusiness,
  employees: UserCheck,
  roles: ShieldCheck,
  roleManagement: ShieldCheck,
  security: ShieldCheck,
  settings: Settings,
  support: Headset,
  help: Headset,
  supportTickets: Ticket,
  modules: Layers,
  telemetry: Activity,
  auditLogs: FileClock,
  sessions: Laptop,
  plans: CreditCard,
  packages: CreditCard,
  notifications: Bell,
  mail: Mail,
  logout: LogOut,
  arrowLeftRight: ArrowLeftRight,
  type: Type,
  palette: Palette,
  search: Search,
  filter: Filter,
  sliders: SlidersHorizontal,
  plus: Plus,
  add: Plus,
  trash: Trash2,
  delete: Trash2,
  refresh: RefreshCw,
  sync: RefreshCw,
  download: Download,
  export: Download,
  upload: Upload,
  import: Upload,
  arrowRight: ArrowRight,
  arrowUpRight: ArrowUpRight,
  next: ArrowRight,
  arrowLeft: ArrowLeft,
  back: ArrowLeft,
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronsLeft: ChevronsLeft,
  chevronsRight: ChevronsRight,
  edit: Pencil,
  pencil: Pencil,
  copy: Copy,
  send: Send,
  eye: Eye,
  view: Eye,
  eyeOff: EyeOff,
  check: Check,
  circleCheck: CircleCheck,
  save: Check,
  externalLink: ExternalLink,
  phone: Phone,
  globe: Globe,
  lock: Lock,
  key: Key,
  folder: Folder,
  file: File,
  tag: Tag,
  bookmark: Bookmark,
  star: Star,
  info: Info,
  alert: TriangleAlert,
  close: X,
  menu: Menu,
  message: MessageCircle,
  messageSquare: MessageSquare,
  clock: Clock,
  paperclip: Paperclip,
  video: Video,
  image: Image,
  play: Play,
  default: Layers,
};

export function resolveIconName(
  name?: string,
  href?: string,
  IconComponent?: unknown
): IconName {
  const comp = (typeof IconComponent === "object" || typeof IconComponent === "function")
    ? (IconComponent as { displayName?: string; name?: string; render?: { displayName?: string; name?: string } } | null)
    : null;
  const iconDisp = (
    comp?.displayName ||
    comp?.name ||
    comp?.render?.displayName ||
    comp?.render?.name ||
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
  if (iconDisp.includes("globe") || iconDisp.includes("website") || iconDisp.includes("domain")) return "globe";
  if (iconDisp.includes("messagesquare") || text.includes("thread") || text.includes("conversation") || text.includes("reply") || text.includes("replies")) return "messageSquare";
  if (iconDisp.includes("message") || text.includes("chat") || text.includes("comment")) return "message";
  if (iconDisp.includes("clock") || text.includes("time") || text.includes("sla") || text.includes("hour")) return "clock";
  if (iconDisp.includes("paperclip") || text.includes("attachment")) return "paperclip";
  if (iconDisp.includes("circlecheck") || text.includes("checkcircle") || text.includes("staff")) return "circleCheck";
  if (iconDisp.includes("video") || text.includes("film")) return "video";
  if (iconDisp.includes("image") || text.includes("photo") || text.includes("picture") || text.includes("screenshot")) return "image";
  if (iconDisp.includes("play")) return "play";
  if (iconDisp.includes("close") || text.includes("cancel") || text.includes("dismiss")) return "close";
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

/**
 * Clean, static Icon Component powered by Lucide.
 * Completely static rendering with zero animations and zero runtime overhead.
 */
export function AppIcon({
  name,
  href,
  icon: FallbackIcon,
  size = 18,
  className = "",
  onClick,
}: AppIconProps) {
  const iconName = resolveIconName(name, href, FallbackIcon);
  const IconComp = (FallbackIcon as LucideIcon) || ICON_MAP[iconName] || Layers;

  return (
    <span
      data-animate-icon="true"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center justify-center select-none",
        onClick ? "cursor-pointer pointer-events-auto" : "pointer-events-none"
      )}
    >
      <IconComp size={size} className={cn("shrink-0 select-none", className)} />
    </span>
  );
}
