import React from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Handshake,
  CheckSquare,
  CalendarDays,
  FileText,
  BarChart3,
  UserSquare2,
  ShieldCheck,
  Settings,
  Ticket,
  BriefcaseBusiness,
  LifeBuoy,
  Layers,
  Box,
  Folder,
  Sliders,
  Bell,
  Mail,
  Phone,
  MessageSquare,
  Globe,
  Database,
  Cpu,
  Zap,
  Tag,
  CreditCard,
  Receipt,
  ShoppingCart,
  Workflow,
  Sparkles,
  Bot,
  Search,
  Key,
  Lock,
  Compass,
  FileSpreadsheet,
  PieChart,
  LineChart,
  ListTodo,
  Kanban,
  FileBox,
  FolderKanban,
  Contact,
  type LucideIcon,
} from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";

export const ICON_REGISTRY: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Building2,
  Handshake,
  CheckSquare,
  CalendarDays,
  FileText,
  BarChart3,
  UserSquare2,
  ShieldCheck,
  Settings,
  Ticket,
  BriefcaseBusiness,
  LifeBuoy,
  Layers,
  Box,
  Folder,
  Sliders,
  Bell,
  Mail,
  Phone,
  MessageSquare,
  Globe,
  Database,
  Cpu,
  Zap,
  Tag,
  CreditCard,
  Receipt,
  ShoppingCart,
  Workflow,
  Sparkles,
  Bot,
  Search,
  Key,
  Lock,
  Compass,
  FileSpreadsheet,
  PieChart,
  LineChart,
  ListTodo,
  Kanban,
  FileBox,
  FolderKanban,
  Contact,
};

export const AVAILABLE_ICON_NAMES = Object.keys(ICON_REGISTRY);

export function getDynamicIcon(iconName?: string | null): LucideIcon {
  if (!iconName) return Layers;
  
  // Exact match
  if (ICON_REGISTRY[iconName]) {
    return ICON_REGISTRY[iconName];
  }

  // Case-insensitive match
  const lower = iconName.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const [key, comp] of Object.entries(ICON_REGISTRY)) {
    if (key.toLowerCase().replace(/[^a-z0-9]/g, "") === lower) {
      return comp;
    }
  }

  return Layers;
}

export function DynamicIcon({
  name,
  className,
  size = 18,
}: {
  name?: string | null;
  className?: string;
  size?: number;
}) {
  const IconComponent = getDynamicIcon(name);
  return <AppIcon icon={IconComponent} name={name || undefined} size={size} className={className} />;
}
