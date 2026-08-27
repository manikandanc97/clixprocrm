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
} from "lucide-react";
import { CRMCard } from "@/shared/components/crm";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import { AppIcon } from "@/shared/components/icons/icon-registry";
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
    <div className="space-y-3.5">
      {/* Delivery Channels */}
      <CRMCard className="p-3.5 sm:p-4.5">
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <AppIcon name="notifications" icon={Bell} size={15} className="text-primary" />
              Delivery Channels
            </h3>
            <p className="text-[11.5px] text-muted-foreground font-medium mt-0.5">
              Select how you prefer to receive notifications and alerts across devices.
            </p>
          </div>
          {saved && (
            <span className="text-[11px] text-primary font-semibold flex items-center gap-1">
              <AppIcon name="check" icon={Check} size={13} /> Saved
            </span>
          )}
        </div>

        <div className="divide-y divide-border/30">
          <div className="py-2.5 flex items-center justify-between group">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <AppIcon name="mail" icon={Mail} size={14} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-foreground">Email Notifications</p>
                <p className="text-[11px] text-muted-foreground">Receive critical alerts and activity summaries in your inbox.</p>
              </div>
            </div>
            <Switch
              checked={prefs.emailAlerts}
              onCheckedChange={() => handleToggle("emailAlerts")}
            />
          </div>

          <div className="py-2.5 flex items-center justify-between group">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <AppIcon icon={Smartphone} size={14} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-foreground">In-App Banner Alerts</p>
                <p className="text-[11px] text-muted-foreground">Show real-time toast and notification drawer updates while working.</p>
              </div>
            </div>
            <Switch
              checked={prefs.inAppAlerts}
              onCheckedChange={() => handleToggle("inAppAlerts")}
            />
          </div>

          <div className="py-2.5 flex items-center justify-between group">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <AppIcon icon={Volume2} size={14} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-foreground">Notification Sound Chime</p>
                <p className="text-[11px] text-muted-foreground">Play an audible sound when new leads or messages arrive.</p>
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
      <CRMCard className="p-3.5 sm:p-4.5">
        <div className="pb-3 border-b border-border/50">
          <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
            <AppIcon name="ai" icon={Sparkles} size={15} className="text-primary" />
            Activity & Event Alerts
          </h3>
          <p className="text-[11.5px] text-muted-foreground font-medium mt-0.5">
            Fine-tune which events trigger immediate notifications.
          </p>
        </div>

        <div className="divide-y divide-border/30">
          <div className="py-2.5 flex items-center justify-between group">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                <AppIcon name="contacts" icon={Users} size={14} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-foreground">Lead Assignments</p>
                <p className="text-[11px] text-muted-foreground">Alert immediately when a new lead is assigned to you.</p>
              </div>
            </div>
            <Switch
              checked={prefs.leadAssignment}
              onCheckedChange={() => handleToggle("leadAssignment")}
            />
          </div>

          <div className="py-2.5 flex items-center justify-between group">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                <AppIcon name="deals" icon={Handshake} size={14} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-foreground">Deal Stage Movements</p>
                <p className="text-[11px] text-muted-foreground">Notify when monitored deals change stage or are marked Won/Lost.</p>
              </div>
            </div>
            <Switch
              checked={prefs.dealUpdates}
              onCheckedChange={() => handleToggle("dealUpdates")}
            />
          </div>

          <div className="py-2.5 flex items-center justify-between group">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                <AppIcon name="tasks" icon={CheckSquare} size={14} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-foreground">Task Reminders & Overdue Alerts</p>
                <p className="text-[11px] text-muted-foreground">Reminders 15 minutes before tasks and overdue notifications.</p>
              </div>
            </div>
            <Switch
              checked={prefs.taskReminders}
              onCheckedChange={() => handleToggle("taskReminders")}
            />
          </div>

          <div className="py-2.5 flex items-center justify-between group">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                <AppIcon name="ai" icon={Sparkles} size={14} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-foreground">AI Daily Briefing & Insights</p>
                <p className="text-[11px] text-muted-foreground">Receive daily AI summaries of top priorities and actionable deals.</p>
              </div>
            </div>
            <Switch
              checked={prefs.aiBriefing}
              onCheckedChange={() => handleToggle("aiBriefing")}
            />
          </div>

          <div className="py-2.5 flex items-center justify-between group">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                <AppIcon name="security" icon={ShieldAlert} size={14} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-foreground">Security & Login Alerts</p>
                <p className="text-[11px] text-muted-foreground">Instant notifications for new logins, password changes, and MFA events.</p>
              </div>
            </div>
            <Switch
              checked={prefs.securityAlerts}
              onCheckedChange={() => handleToggle("securityAlerts")}
            />
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-border/50 flex justify-end">
          <Button onClick={handleSaveAll} className="group h-8 px-3.5 text-xs font-semibold gap-1.5 shadow-xs">
            <AppIcon name="save" icon={Save} size={13} /> Save Preferences
          </Button>
        </div>
      </CRMCard>
    </div>
  );
}
