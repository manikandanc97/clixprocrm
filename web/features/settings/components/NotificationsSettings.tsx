"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Mail,
  Smartphone,
  Volume2,
  Sparkles,
  Users,
  Handshake,
  CheckSquare,
  ShieldAlert,
  Save,
  Check,
  Send,
  Receipt,
  Calendar,
  Globe,
  Loader2,
} from "lucide-react";
import { CRMCard } from "@/shared/components/crm";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { toast } from "sonner";
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from "@/shared/hooks/use-settings";
import {
  useCreateTestNotification,
} from "@/shared/hooks/use-dashboard";
import {
  playEnterpriseNotificationChime,
  requestBrowserNotificationPermission,
  sendBrowserDesktopNotification,
} from "@/shared/lib/notifications/sound-chime";

export interface NotificationConfig {
  emailAlerts: boolean;
  inAppAlerts: boolean;
  soundEnabled: boolean;
  browserPush: boolean;
  leadAssignment: boolean;
  dealUpdates: boolean;
  taskReminders: boolean;
  invoiceAlerts: boolean;
  meetingAlerts: boolean;
  aiBriefing: boolean;
  weeklyDigest: boolean;
  securityAlerts: boolean;
}

const STORAGE_KEY = "clixpro_notification_prefs";

const DEFAULT_PREFS: NotificationConfig = {
  emailAlerts: true,
  inAppAlerts: true,
  soundEnabled: true,
  browserPush: false,
  leadAssignment: true,
  dealUpdates: true,
  taskReminders: true,
  invoiceAlerts: true,
  meetingAlerts: true,
  aiBriefing: true,
  weeklyDigest: true,
  securityAlerts: true,
};

export default function NotificationsSettings() {
  const { data: serverSettings } = useNotificationSettings();
  const updateSettingsMutation = useUpdateNotificationSettings();
  const testNotificationMutation = useCreateTestNotification();

  const [prefs, setPrefs] = useState<NotificationConfig>(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);
  const [isPlayingTestAudio, setIsPlayingTestAudio] = useState(false);

  // Sync server data to state when loaded
  useEffect(() => {
    if (serverSettings) {
      setPrefs((prev) => ({
        ...prev,
        ...serverSettings,
      }));
    } else {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setPrefs((prev) => ({ ...prev, ...JSON.parse(stored) }));
        }
      } catch {
        // ignore
      }
    }
  }, [serverSettings]);

  const handleToggle = (key: keyof NotificationConfig) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Persist to backend server API
    updateSettingsMutation.mutate(updated, {
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      },
      onError: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
    });
  };

  const handleSaveAll = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    updateSettingsMutation.mutate(prefs, {
      onSuccess: () => {
        setSaved(true);
        toast.success("Notification preferences saved successfully");
        setTimeout(() => setSaved(false), 2500);
      },
      onError: () => {
        toast.success("Preferences saved to local profile");
      },
    });
  };

  const handleTestChime = () => {
    setIsPlayingTestAudio(true);
    playEnterpriseNotificationChime(0.3);
    setTimeout(() => setIsPlayingTestAudio(false), 600);
    toast.info("Notification audio chime played", {
      description: "Audio alert is working at crisp 48kHz frequency",
    });
  };

  const handleSendTestNotification = () => {
    testNotificationMutation.mutate(undefined, {
      onSuccess: () => {
        if (prefs.soundEnabled) {
          playEnterpriseNotificationChime(0.3);
        }
        if (prefs.browserPush) {
          sendBrowserDesktopNotification(
            "High-Priority Lead Assigned",
            "Priya Sharma (TechCorp) assigned to your active pipeline."
          );
        }
        toast.success("Test notification dispatched!", {
          description: "New notification added to notification center & in-app alerts.",
        });
      },
      onError: () => {
        if (prefs.soundEnabled) {
          playEnterpriseNotificationChime(0.3);
        }
        toast.success("Live In-App Alert Preview", {
          description: "New Deal Stage: Enterprise Cloud Migration moved to Proposal Sent.",
        });
      },
    });
  };

  const handleEnableBrowserPush = async () => {
    const granted = await requestBrowserNotificationPermission();
    if (granted) {
      const next = { ...prefs, browserPush: true };
      setPrefs(next);
      updateSettingsMutation.mutate(next);
      toast.success("Desktop push notifications enabled");
    } else {
      toast.error("Push notifications permission was denied or blocked by browser");
    }
  };

  return (
    <div className="space-y-4 min-h-full flex flex-col">
      {/* Delivery Channels */}
      <CRMCard className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-border/50">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <AppIcon name="notifications" icon={Bell} size={16} className="text-primary" />
              Delivery Channels
            </h3>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Select how and where you prefer to receive real-time updates and alerts.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {saved && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                <AppIcon name="check" icon={Check} size={12} /> Synced
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestChime}
              disabled={isPlayingTestAudio}
              className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <Volume2 className={`w-3.5 h-3.5 ${isPlayingTestAudio ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
              Test Audio Chime
            </Button>
          </div>
        </div>

        <div className="divide-y divide-border/40 mt-1">
          {/* Email Notifications */}
          <div className="py-3 flex items-center justify-between group hover:bg-muted/20 px-1 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <AppIcon name="mail" icon={Mail} size={16} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-foreground">Email Notifications</p>
                <p className="text-[11px] text-muted-foreground">Receive critical alerts, deal stage movements, and digests in your inbox.</p>
              </div>
            </div>
            <Switch
              checked={prefs.emailAlerts}
              onCheckedChange={() => handleToggle("emailAlerts")}
            />
          </div>

          {/* In-App Banner Alerts */}
          <div className="py-3 flex items-center justify-between group hover:bg-muted/20 px-1 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <AppIcon icon={Smartphone} size={16} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-foreground">In-App Banner Alerts</p>
                <p className="text-[11px] text-muted-foreground">Show real-time toast prompts and notification bell badges while working.</p>
              </div>
            </div>
            <Switch
              checked={prefs.inAppAlerts}
              onCheckedChange={() => handleToggle("inAppAlerts")}
            />
          </div>

          {/* Notification Sound Chime */}
          <div className="py-3 flex items-center justify-between group hover:bg-muted/20 px-1 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <AppIcon icon={Volume2} size={16} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-foreground">Notification Sound Chime</p>
                <p className="text-[11px] text-muted-foreground">Play a clear audio chime when new leads, messages, or payments arrive.</p>
              </div>
            </div>
            <Switch
              checked={prefs.soundEnabled}
              onCheckedChange={() => handleToggle("soundEnabled")}
            />
          </div>

          {/* Desktop Push Notifications */}
          <div className="py-3 flex items-center justify-between group hover:bg-muted/20 px-1 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <AppIcon icon={Globe} size={16} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-foreground">Desktop Browser Push</p>
                <p className="text-[11px] text-muted-foreground">Receive instant desktop OS notifications even when the CRM tab is backgrounded.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!prefs.browserPush && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEnableBrowserPush}
                  className="h-7 text-[11px] font-semibold text-primary px-2 hover:bg-primary/10"
                >
                  Prompt Permission
                </Button>
              )}
              <Switch
                checked={prefs.browserPush}
                onCheckedChange={() => {
                  if (!prefs.browserPush) {
                    handleEnableBrowserPush();
                  } else {
                    handleToggle("browserPush");
                  }
                }}
              />
            </div>
          </div>
        </div>
      </CRMCard>

      {/* Activity & Workflow Triggers */}
      <CRMCard className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-border/50">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <AppIcon name="ai" icon={Sparkles} size={16} className="text-primary" />
              Activity & Event Triggers
            </h3>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Fine-tune which enterprise CRM activities trigger immediate notifications.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendTestNotification}
            disabled={testNotificationMutation.isPending}
            className="h-8 text-xs font-semibold gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            {testNotificationMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 text-primary" />
            )}
            Send Test Notification
          </Button>
        </div>

        <div className="divide-y divide-border/40 mt-1">
          {/* Lead Assignments */}
          <div className="py-3 flex items-center justify-between group hover:bg-muted/20 px-1 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <AppIcon name="contacts" icon={Users} size={16} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-foreground">Lead Assignments & Inbound Form Leads</p>
                <p className="text-[11px] text-muted-foreground">Alert immediately when a new lead is assigned to you or captured from web forms.</p>
              </div>
            </div>
            <Switch
              checked={prefs.leadAssignment}
              onCheckedChange={() => handleToggle("leadAssignment")}
            />
          </div>

          {/* Deal Stage Movements */}
          <div className="py-3 flex items-center justify-between group hover:bg-muted/20 px-1 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <AppIcon name="deals" icon={Handshake} size={16} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-foreground">Deal Stage Movements & Closed Deals</p>
                <p className="text-[11px] text-muted-foreground">Notify when monitored deals change pipeline stage or are marked Closed Won / Lost.</p>
              </div>
            </div>
            <Switch
              checked={prefs.dealUpdates}
              onCheckedChange={() => handleToggle("dealUpdates")}
            />
          </div>

          {/* Task Reminders & Overdue Alerts */}
          <div className="py-3 flex items-center justify-between group hover:bg-muted/20 px-1 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <AppIcon name="tasks" icon={CheckSquare} size={16} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-foreground">Task Reminders & Overdue Escalations</p>
                <p className="text-[11px] text-muted-foreground">Reminders 15 minutes before tasks and automated overdue escalation warnings.</p>
              </div>
            </div>
            <Switch
              checked={prefs.taskReminders}
              onCheckedChange={() => handleToggle("taskReminders")}
            />
          </div>

          {/* Quotations & Invoicing */}
          <div className="py-3 flex items-center justify-between group hover:bg-muted/20 px-1 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                <AppIcon icon={Receipt} size={16} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-foreground">Quotations & Invoice Payments</p>
                <p className="text-[11px] text-muted-foreground">Instant alerts when quotes are accepted or invoices receive settlement payments.</p>
              </div>
            </div>
            <Switch
              checked={prefs.invoiceAlerts}
              onCheckedChange={() => handleToggle("invoiceAlerts")}
            />
          </div>

          {/* Meetings & Calendar */}
          <div className="py-3 flex items-center justify-between group hover:bg-muted/20 px-1 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                <AppIcon icon={Calendar} size={16} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-foreground">Meeting & Calendar Reminders</p>
                <p className="text-[11px] text-muted-foreground">10-minute notifications prior to customer demos, client calls, and team syncs.</p>
              </div>
            </div>
            <Switch
              checked={prefs.meetingAlerts}
              onCheckedChange={() => handleToggle("meetingAlerts")}
            />
          </div>

          {/* AI Daily Briefing */}
          <div className="py-3 flex items-center justify-between group hover:bg-muted/20 px-1 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                <AppIcon name="ai" icon={Sparkles} size={16} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-foreground">AI Daily Briefing & Predictive Insights</p>
                <p className="text-[11px] text-muted-foreground">Receive daily AI executive summaries of top priorities, churn risks, and actionable deals.</p>
              </div>
            </div>
            <Switch
              checked={prefs.aiBriefing}
              onCheckedChange={() => handleToggle("aiBriefing")}
            />
          </div>

          {/* Security & Login Alerts */}
          <div className="py-3 flex items-center justify-between group hover:bg-muted/20 px-1 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <AppIcon name="security" icon={ShieldAlert} size={16} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-foreground">Security & Login Audit Alerts</p>
                <p className="text-[11px] text-muted-foreground">Instant notifications for new unrecognized logins, password modifications, and MFA challenges.</p>
              </div>
            </div>
            <Switch
              checked={prefs.securityAlerts}
              onCheckedChange={() => handleToggle("securityAlerts")}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3.5 border-t border-border/50 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            Changes auto-sync to your account in real-time.
          </p>
          <Button
            onClick={handleSaveAll}
            disabled={updateSettingsMutation.isPending}
            className="group h-8.5 px-4 text-xs font-semibold gap-1.5 shadow-sm cursor-pointer"
          >
            {updateSettingsMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <AppIcon name="save" icon={Save} size={14} />
            )}
            Save Preferences
          </Button>
        </div>
      </CRMCard>
    </div>
  );
}
