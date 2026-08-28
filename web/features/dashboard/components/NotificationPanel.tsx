"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, Bell, Trash2, ArrowRight, Sparkles, ShieldAlert } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { formatDistanceToNow, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from "@/shared/hooks/use-dashboard";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Skeleton } from "@/shared/ui/skeleton";
import { EmptyState } from "@/shared/components/EmptyState";

type Notification = {
  id: string;
  title: string;
  description: string;
  time: string | Date;
  read: boolean;
  type: string;
};

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
      if (isNaN(dateObj.getTime())) {
        return time;
      }
    } else {
      return "Recently";
    }

    if (isNaN(dateObj.getTime())) {
      return "Recently";
    }

    return formatDistanceToNow(dateObj, { addSuffix: true }).replace(/^about\s+/, '');
  } catch {
    return typeof time === "string" ? time : "Recently";
  }
}

export default function NotificationPanel() {
  const router = useRouter();
  const { data, isLoading: loading } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const rawNotifications = useMemo(() => {
    if (!data?.notifications) return [];
    return data.notifications;
  }, [data]);

  const notifications = useMemo(() => {
    if (filter === "unread") {
      return rawNotifications.filter((n) => !n.read);
    }
    return rawNotifications;
  }, [rawNotifications, filter]);

  const unreadCount = rawNotifications.filter((n) => !n.read).length;

  const markAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (unreadCount === 0) return;
    markAllReadMutation.mutate();
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markReadMutation.mutate(notification.id);
    }
    setIsOpen(false);

    const type = notification.type?.toLowerCase() || "";
    if (type.includes("lead")) {
      router.push("/leads");
    } else if (type.includes("deal")) {
      router.push("/deals");
    } else if (type.includes("task")) {
      router.push("/tasks");
    } else if (type.includes("invoice") || type.includes("quote")) {
      router.push("/invoices");
    } else if (type.includes("meeting") || type.includes("calendar")) {
      router.push("/calendar");
    } else if (type.includes("security")) {
      router.push("/settings?section=security-privacy");
    } else if (type.includes("ai")) {
      router.push("/ai-insights");
    } else {
      router.push("/notifications");
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteMutation.mutate(id);
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
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button 
          className="relative flex items-center justify-center w-9 h-9 hover:bg-sidebar-accent/60 rounded-lg transition-all duration-200 text-sidebar-foreground/70 hover:text-sidebar-foreground group outline-none cursor-pointer"
          aria-label="Notifications"
        >
          <AppIcon 
            name="notifications" 
            size={17} 
            className="transition-transform duration-300 group-hover:rotate-[14deg] group-hover:scale-110" 
          />
          {unreadCount > 0 && (
            <span className="top-1.5 right-1.5 absolute flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/60 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive border border-background"></span>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-84 sm:w-[400px] rounded-xl p-0 shadow-elevated border-border bg-popover/98 backdrop-blur-xl overflow-hidden" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/50 bg-muted/40">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm tracking-tight text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-primary/15 text-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                {unreadCount} New
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={markAllAsRead}
              disabled={markAllReadMutation.isPending || unreadCount === 0}
              className="text-[10px] font-black text-muted-foreground hover:text-primary uppercase tracking-widest transition-colors flex items-center gap-1 disabled:opacity-40 cursor-pointer"
            >
              <Check className="w-3 h-3" />
              Mark all read
            </button>
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1 px-4 py-1.5 border-b border-border/30 bg-muted/20">
          <button
            onClick={() => setFilter("all")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
              filter === "all" ? "bg-background text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({rawNotifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
              filter === "unread" ? "bg-background text-primary shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
        
        {/* Notification Items List */}
        <div className="max-h-[380px] overflow-y-auto custom-scrollbar divide-y divide-border/20">
          {loading ? (
            <div className="p-4 space-y-3.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 items-center">
                  <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 6 }}
                    className={`group relative flex items-start gap-3.5 p-3.5 hover:bg-muted/50 transition-colors cursor-pointer ${
                      !notification.read ? "bg-primary/[0.03]" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {!notification.read && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-primary rounded-r-full shadow-[0_0_8px_var(--primary)]" />
                    )}
                    <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs border border-border/50 ${!notification.read ? 'bg-background' : 'bg-muted/70'}`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className={`text-xs sm:text-sm tracking-tight truncate ${!notification.read ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>
                          {notification.title}
                        </p>
                        <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap flex items-center gap-1 shrink-0 ml-2">
                          <Clock className="w-2.5 h-2.5 text-muted-foreground/60" />
                          {safeFormatDistanceToNow(notification.time)}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-muted-foreground leading-relaxed line-clamp-2">
                        {notification.description}
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleDelete(e, notification.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0 self-center cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))
              ) : (
                <EmptyState 
                  icon={Bell}
                  title="All caught up!"
                  description="You don't have any notifications right now."
                  size="sm"
                  className="py-8 border-none bg-transparent shadow-none"
                />
              )}
            </AnimatePresence>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-2.5 border-t border-border/50 bg-muted/30 flex items-center justify-between gap-2">
          <button 
            onClick={() => {
              setIsOpen(false);
              router.push("/settings?section=notifications");
            }}
            className="text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider px-2 py-1.5 transition-colors cursor-pointer"
          >
            Settings
          </button>

          <button 
            onClick={() => {
              setIsOpen(false);
              router.push("/notifications");
            }}
            className="flex-1 py-1.5 px-3 rounded-lg border border-border bg-background hover:bg-muted text-[10px] font-black uppercase tracking-[0.15em] transition-all shadow-xs text-center flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>View All Notifications</span>
            <ArrowRight className="w-3 h-3 text-primary" />
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
