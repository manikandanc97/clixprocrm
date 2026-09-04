"use client";

import React, { useState } from "react";
import {
  Laptop,
  Smartphone,
  Tablet,
  Globe,
  Monitor,
  LogOut,
  Loader2,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CRMCard } from "@/shared/components/crm";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import {
  fetchUserSessions,
  revokeUserSession,
  revokeAllOtherSessions,
  UserSessionDto,
} from "@/shared/lib/api/sessions.api";
import { toast } from "sonner";

export default function SessionsSettings() {
  const queryClient = useQueryClient();
  const [showRevokeAllModal, setShowRevokeAllModal] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    isError: sessionsError,
    refetch: refetchSessions,
  } = useQuery({
    queryKey: ["user-sessions"],
    queryFn: fetchUserSessions,
    staleTime: 30_000,
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => revokeUserSession(sessionId),
    onMutate: (id) => setRevokingSessionId(id),
    onSuccess: () => {
      toast.success("Session revoked successfully");
      void queryClient.invalidateQueries({ queryKey: ["user-sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["security-activity"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to revoke session");
    },
    onSettled: () => setRevokingSessionId(null),
  });

  const revokeAllMutation = useMutation({
    mutationFn: revokeAllOtherSessions,
    onSuccess: () => {
      toast.success("All other sessions signed out");
      setShowRevokeAllModal(false);
      void queryClient.invalidateQueries({ queryKey: ["user-sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["security-activity"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to sign out sessions");
    },
  });

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType?.toLowerCase()) {
      case "desktop":
        return <Laptop className="w-4 h-4" />;
      case "mobile":
        return <Smartphone className="w-4 h-4" />;
      case "tablet":
        return <Tablet className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const formatSessionTime = (isoString?: string) => {
    if (!isoString) return "Recently";
    try {
      const d = new Date(isoString);
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="min-h-full flex-1 flex flex-col">
      <CRMCard className="min-h-full flex-1 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">Active Login Sessions</h3>
                {sessionsData?.activeCount !== undefined && (
                  <Badge variant="outline" className="text-[10px] font-bold text-primary bg-primary/10 border-primary/20">
                    {sessionsData.activeCount} Active
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Manage all devices and browser sessions currently logged into your account.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sessionsData?.sessions && sessionsData.sessions.filter((s) => !s.isCurrent && !s.isRevoked).length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRevokeAllModal(true)}
                className="text-xs font-semibold gap-1.5 h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out Others
              </Button>
            )}
          </div>
        </div>

        {sessionsLoading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 flex-1">
                  <Skeleton className="w-9 h-9 rounded-lg shrink-0 mt-0.5" />
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-44" />
                      {i === 0 && <Skeleton className="h-4.5 w-20 rounded-full" />}
                    </div>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end shrink-0">
                  <Skeleton className="h-7 w-20 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : sessionsError ? (
          <div className="p-4 mt-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs font-medium">
            Failed to load active sessions. Please refresh the page.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {sessionsData?.sessions && sessionsData.sessions.length > 0 ? (
              sessionsData.sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    session.isCurrent
                      ? "border-primary/40 bg-primary/[0.03]"
                      : session.isRevoked
                      ? "border-border/30 bg-muted/20 opacity-60"
                      : "border-border/60 bg-muted/20 hover:border-border"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        session.isCurrent
                          ? "bg-primary/10 text-primary"
                          : session.isRevoked
                          ? "bg-muted text-muted-foreground"
                          : "bg-background border border-border/60 text-foreground"
                      }`}
                    >
                      {getDeviceIcon(session.deviceType)}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">
                          {session.browser || "Web Browser"} on {session.operatingSystem || "Device"}
                        </span>
                        {session.isCurrent && (
                          <Badge variant="success" className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2">
                            This Device
                          </Badge>
                        )}
                        {session.isRevoked && (
                          <Badge variant="neutral" className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2">
                            Revoked
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground font-medium">
                        {session.ipAddress && <span>IP: {session.ipAddress}</span>}
                        <span>•</span>
                        <span>{session.isCurrent ? "Active now" : `Last active: ${formatSessionTime(session.lastActiveAt)}`}</span>
                        <span>•</span>
                        <span>Signed in: {new Date(session.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {!session.isCurrent && !session.isRevoked && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeMutation.mutate(session.id)}
                      disabled={revokingSessionId === session.id}
                      className="text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-3 shrink-0"
                    >
                      {revokingSessionId === session.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      ) : (
                        <LogOut className="w-3.5 h-3.5 mr-1" />
                      )}
                      Revoke
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground font-medium border border-dashed rounded-xl">
                No active session records found.
              </div>
            )}
          </div>
        )}
      </CRMCard>

      {/* Revoke All Other Sessions Confirmation Dialog */}
      <Dialog open={showRevokeAllModal} onOpenChange={setShowRevokeAllModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
              <LogOut className="w-4 h-4" />
              Sign Out All Other Sessions
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              This action will revoke all active sessions on other browsers and mobile devices. You will remain signed in on this current browser.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowRevokeAllModal(false)}
              disabled={revokeAllMutation.isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => revokeAllMutation.mutate()}
              disabled={revokeAllMutation.isPending}
              className="text-xs font-semibold gap-1.5"
            >
              {revokeAllMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogOut className="w-3.5 h-3.5" />
              )}
              Sign Out Other Devices
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
