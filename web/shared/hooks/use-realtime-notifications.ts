"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/components/auth-provider";
import { playEnterpriseNotificationChime, sendBrowserDesktopNotification } from "@/shared/lib/notifications/sound-chime";
import { toast } from "sonner";

/**
 * Hook providing instant, zero-polling Supabase Realtime subscriptions
 * for user notifications, activity alerts, and badge updates.
 */
export function useRealtimeNotifications() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    const supabase = createClient();
    const channelName = `notifications-${user.id}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Notification",
          filter: `userId=eq.${user.id}`,
        },
        (payload) => {
          // Immediately invalidate notification queries for fresh data
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({ queryKey: ["dashboardData"] });

          if (payload.eventType === "INSERT" && payload.new) {
            const newNotif = payload.new as {
              id?: string;
              title?: string;
              message?: string;
              type?: string;
            };

            // 1. Play subtle audio chime
            try {
              playEnterpriseNotificationChime(0.25);
            } catch {
              // Audio context may be restricted by browser policy before first interaction
            }

            // 2. Dispatch desktop notification if granted
            if (newNotif.title) {
              sendBrowserDesktopNotification(
                newNotif.title,
                newNotif.message || "You have a new update in ClixProCRM",
                "/dashboard"
              );
            }

            // 3. Display reactive in-app toast notification
            toast.info(newNotif.title || "New Notification", {
              description: newNotif.message,
              duration: 4500,
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Channel connected
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isAuthenticated, user?.id, queryClient]);
}
