"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  Clock,
  Trash2,
  Filter,
  Search,
  CheckCheck,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Settings,
  Volume2,
  RefreshCw,
} from "lucide-react";
import { CRMPageContainer, CRMCard } from "@/shared/components/crm";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useClearAllReadNotifications,
} from "@/shared/hooks/use-dashboard";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Skeleton } from "@/shared/ui/skeleton";
import { EmptyState } from "@/shared/components/EmptyState";
import { formatDistanceToNow, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { playEnterpriseNotificationChime } from "@/shared/lib/notifications/sound-chime";
import { toast } from "sonner";

type FilterTab = "all" | "unread" | "lead" | "deal" | "task" | "invoice" | "ai" | "security";

function safeFormatDistanceToNow(time: string | Date | number | null | undefined): string {
  if (!time) return "Recently";
  try {
    let dateObj: Date;
    if (time instanceof Date) {
      dateObj = time;
    } else if (typeof time === "number") {
      dateObj = new Date(time);
    } else if (typeof time === "string") {
      dateObj = parseISO(time);
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date(time);
      }
      if (isNaN(dateObj.getTime())) return time;
    } else {
      return "Recently";
    }
    if (isNaN(dateObj.getTime())) return "Recently";
    return formatDistanceToNow(dateObj, { addSuffix: true }).replace(/^about\s+/, "");
  } catch {
    return typeof time === "string" ? time : "Recently";
  }
}

import { useAuth } from "@/features/auth/components/auth-provider";

export default function NotificationsPage() {
  const router = useRouter();
  const { isHydrated, isAuthenticated, isInitializing } = useAuth();
  const { data, isLoading, isPending, refetch, isRefetching } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();
  const clearReadMutation = useClearAllReadNotifications();

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const rawNotifications = useMemo(() => {
    if (!data?.notifications) return [];
    return data.notifications;
  }, [data]);

  const filteredNotifications = useMemo(() => {
    return rawNotifications.filter((n) => {
      // Tab filter
      if (activeTab === "unread" && n.read) return false;
      if (activeTab === "lead" && !n.type.includes("lead")) return false;
      if (activeTab === "deal" && !n.type.includes("deal")) return false;
      if (activeTab === "task" && !n.type.includes("task")) return false;
      if (activeTab === "invoice" && !n.type.includes("invoice") && !n.type.includes("quote")) return false;
      if (activeTab === "ai" && !n.type.includes("ai")) return false;
      if (activeTab === "security" && !n.type.includes("security")) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = n.title?.toLowerCase().includes(q);
        const matchDesc = n.description?.toLowerCase().includes(q);
        return matchTitle || matchDesc;
      }

      return true;
    });
  }, [rawNotifications, activeTab, searchQuery]);

  const unreadCount = rawNotifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate(undefined, {
      onSuccess: () => toast.success("All notifications marked as read"),
    });
  };

  const handleClearRead = () => {
    clearReadMutation.mutate(undefined, {
      onSuccess: () => toast.success("Cleared all read notifications"),
    });
  };

  const handleItemClick = (notification: any) => {
    if (!notification.read) {
      markReadMutation.mutate(notification.id);
    }

    const type = notification.type?.toLowerCase() || "";
    if (type.includes("lead")) router.push("/leads");
    else if (type.includes("deal")) router.push("/deals");
    else if (type.includes("task")) router.push("/tasks");
    else if (type.includes("invoice") || type.includes("quote")) router.push("/invoices");
    else if (type.includes("meeting") || type.includes("calendar")) router.push("/calendar");
    else if (type.includes("security")) router.push("/settings?section=security-privacy");
    else if (type.includes("ai")) router.push("/ai-insights");
  };

  const handleDeleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Notification removed"),
    });
  };

  const getIcon = (type: string) => {
    const t = type?.toLowerCase() || "";
    if (t.includes("lead")) return <AppIcon name="userPlus" size={16} className="text-emerald-500" />;
    if (t.includes("deal")) return <AppIcon name="deals" size={16} className="text-blue-500" />;
    if (t.includes("task")) return <AppIcon name="tasks" size={16} className="text-amber-500" />;
    if (t.includes("invoice") || t.includes("quote")) return <AppIcon name="invoices" size={16} className="text-violet-500" />;
    if (t.includes("ai")) return <AppIcon name="ai" icon={Sparkles} size={16} className="text-purple-500" />;
    if (t.includes("security")) return <AppIcon name="security" icon={ShieldAlert} size={16} className="text-rose-500" />;
    if (t.includes("meeting") || t.includes("calendar")) return <AppIcon name="calendar" size={16} className="text-teal-500" />;
    return <AppIcon name="notifications" icon={Bell} size={16} className="text-primary" />;
  };

  return (
    <CRMPageContainer className="flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Notification Center
            </h1>
            {unreadCount > 0 && (
              <Badge variant="default" className="bg-primary text-primary-foreground font-black text-xs px-2.5 py-0.5 rounded-full">
                {unreadCount} Unread
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time feed of leads, deals, automated tasks, invoices, and system security alerts.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-8.5 text-xs font-semibold gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin text-primary" : "text-muted-foreground"}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              playEnterpriseNotificationChime(0.3);
              toast.info("Audio chime test executed");
            }}
            className="h-8.5 text-xs font-semibold gap-1.5 cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5 text-primary" />
            Chime Test
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/settings?section=notifications")}
            className="h-8.5 text-xs font-semibold gap-1.5 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-muted-foreground" />
            Preferences
          </Button>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <CRMCard className="p-3 sm:p-4 shrink-0 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications by keywords..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Bulk actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || markAllReadMutation.isPending}
              className="h-8 text-xs font-medium gap-1.5 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
              Mark All Read
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearRead}
              disabled={clearReadMutation.isPending}
              className="h-8 text-xs font-medium gap-1.5 text-muted-foreground hover:text-destructive cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Read
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {[
            { id: "all", label: "All", count: rawNotifications.length },
            { id: "unread", label: "Unread", count: unreadCount },
            { id: "lead", label: "Leads", count: rawNotifications.filter((n) => n.type.includes("lead")).length },
            { id: "deal", label: "Deals", count: rawNotifications.filter((n) => n.type.includes("deal")).length },
            { id: "task", label: "Tasks", count: rawNotifications.filter((n) => n.type.includes("task")).length },
            { id: "invoice", label: "Invoices & Billing", count: rawNotifications.filter((n) => n.type.includes("invoice") || n.type.includes("quote")).length },
            { id: "ai", label: "AI Insights", count: rawNotifications.filter((n) => n.type.includes("ai")).length },
            { id: "security", label: "Security", count: rawNotifications.filter((n) => n.type.includes("security")).length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as FilterTab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-background text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </CRMCard>

      {/* Notifications List */}
      <CRMCard className="flex-1 min-h-0 overflow-hidden flex flex-col p-0">
        <div className="flex-1 overflow-y-auto divide-y divide-border/40 custom-scrollbar">
          {(!data && (isLoading || isPending || !isHydrated || !isAuthenticated || isInitializing)) ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4 items-center">
                  <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length > 0 ? (
            <AnimatePresence initial={false}>
              {filteredNotifications.map((n) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  onClick={() => handleItemClick(n)}
                  className={`group relative flex items-start gap-4 p-4 sm:px-5 hover:bg-muted/40 transition-colors cursor-pointer ${
                    !n.read ? "bg-primary/[0.02] dark:bg-primary/[0.04]" : ""
                  }`}
                >
                  {!n.read && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-primary rounded-r-full shadow-[0_0_8px_var(--primary)]" />
                  )}

                  <div
                    className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      !n.read
                        ? "bg-background border-primary/30 shadow-xs"
                        : "bg-muted/60 border-border/50"
                    }`}
                  >
                    {getIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm tracking-tight truncate ${
                            !n.read ? "font-bold text-foreground" : "font-semibold text-muted-foreground"
                          }`}
                        >
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground/70" />
                        {safeFormatDistanceToNow(n.time)}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {n.description}
                    </p>
                  </div>

                  {/* Actions on hover */}
                  <div className="flex items-center gap-1 self-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    {!n.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          markReadMutation.mutate(n.id);
                        }}
                        aria-label="Mark notification as read"
                        className="w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary cursor-pointer"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteItem(e, n.id)}
                      aria-label="Delete notification"
                      className="w-8 h-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
                      title="Remove notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <ArrowRight className="w-4 h-4 text-muted-foreground ml-1" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <EmptyState
              icon={Bell}
              title="No notifications found"
              description={
                searchQuery
                  ? "No matching alerts match your search query."
                  : "You are all caught up! No notifications in this category."
              }
              size="default"
              className="py-16 border-none bg-transparent shadow-none"
            />
          )}
        </div>
      </CRMCard>
    </CRMPageContainer>
  );
}
