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
  CheckCircle2,
} from "lucide-react";
import { CRMCard } from "@/shared/components/crm";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import { toast } from "sonner";

interface NotificationConfig {
  emailAlerts: boolean;
  inAppAlerts: boolean;
  leadAssignment: boolean;
  dealUpdates: boolean;
  taskReminders: boolean;
  aiBriefing: boolean;
  weeklyDigest: boolean;
  soundEnabled: boolean;
  securityAlerts: boolean;
}

const STORAGE_KEY = "clixpro_notification_prefs";

const DEFAULT_PREFS: NotificationConfig = {
  emailAlerts: true,
  inAppAlerts: true,
  leadAssignment: true,
  dealUpdates: true,
  taskReminders: true,
  aiBriefing: true,
  weeklyDigest: true,
  soundEnabled: false,
  securityAlerts: true,
};

export default function NotificationsSettings() {
  const [prefs, setPrefs] = useState<NotificationConfig>(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPrefs(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleToggle = (key: keyof NotificationConfig) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveAll = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    toast.success("Notification preferences saved");
  };

  return (
    <div className="space-y-6">
      {/* Delivery Channels */}
      <CRMCard>
        <div className="flex items-center justify-between pb-4 border-b border-border/50">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Delivery Channels
            </h3>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Select how you prefer to receive notifications and alerts across devices.
            </p>
          </div>
          {saved && (
            <span className="text-xs text-primary font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>

        <div className="divide-y divide-border/40">
          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Receive critical alerts and activity summaries in your inbox.</p>
              </div>
            </div>
            <Switch
              checked={prefs.emailAlerts}
              onCheckedChange={() => handleToggle("emailAlerts")}
            />
          </div>

          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">In-App Banner Alerts</p>
                <p className="text-xs text-muted-foreground">Show real-time toast and notification drawer updates while working.</p>
              </div>
            </div>
            <Switch
              checked={prefs.inAppAlerts}
              onCheckedChange={() => handleToggle("inAppAlerts")}
            />
          </div>

          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Notification Sound Chime</p>
                <p className="text-xs text-muted-foreground">Play an audible sound when new leads or messages arrive.</p>
              </div>
            </div>
            <Switch
              checked={prefs.soundEnabled}
              onCheckedChange={() => handleToggle("soundEnabled")}
            />
          </div>
        </div>
      </CRMCard>

      {/* Activity & Workflow Triggers */}
      <CRMCard>
        <div className="pb-4 border-b border-border/50">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Activity & Event Alerts
          </h3>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            Fine-tune which events trigger immediate notifications.
          </p>
        </div>

        <div className="divide-y divide-border/40">
          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Lead Assignments</p>
                <p className="text-xs text-muted-foreground">Alert immediately when a new lead is assigned to you.</p>
              </div>
            </div>
            <Switch
              checked={prefs.leadAssignment}
              onCheckedChange={() => handleToggle("leadAssignment")}
            />
          </div>

          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                <Handshake className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Deal Stage Movements</p>
                <p className="text-xs text-muted-foreground">Notify when monitored deals change stage or are marked Won/Lost.</p>
              </div>
            </div>
            <Switch
              checked={prefs.dealUpdates}
              onCheckedChange={() => handleToggle("dealUpdates")}
            />
          </div>

          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Task Reminders & Overdue Alerts</p>
                <p className="text-xs text-muted-foreground">Reminders 15 minutes before tasks and overdue notifications.</p>
              </div>
            </div>
            <Switch
              checked={prefs.taskReminders}
              onCheckedChange={() => handleToggle("taskReminders")}
            />
          </div>

          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">AI Daily Briefing & Insights</p>
                <p className="text-xs text-muted-foreground">Receive daily AI summaries of top priorities and actionable deals.</p>
              </div>
            </div>
            <Switch
              checked={prefs.aiBriefing}
              onCheckedChange={() => handleToggle("aiBriefing")}
            />
          </div>

          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Security & Login Alerts</p>
                <p className="text-xs text-muted-foreground">Instant notifications for new logins, password changes, and MFA events.</p>
              </div>
            </div>
            <Switch
              checked={prefs.securityAlerts}
              onCheckedChange={() => handleToggle("securityAlerts")}
            />
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-border/50 flex justify-end">
          <Button onClick={handleSaveAll} className="gap-2 text-xs font-semibold">
            <Save className="w-3.5 h-3.5" /> Save Preferences
          </Button>
        </div>
      </CRMCard>
    </div>
  );
}
