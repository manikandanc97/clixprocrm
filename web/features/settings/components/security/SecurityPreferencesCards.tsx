"use client";

import React from "react";
import { BellRing, FileDown, Loader2, Download } from "lucide-react";
import { CRMCard } from "@/shared/components/crm";
import { Switch } from "@/shared/ui/switch";
import { Button } from "@/shared/ui/button";

interface SecurityPreferencesCardsProps {
  securityAlertsEnabled: boolean;
  onToggleSecurityAlerts: (enabled: boolean) => void;
  isNotifLoading: boolean;
  isNotifPending: boolean;
  isExporting: boolean;
  handleExportData: () => Promise<void>;
}

export function SecurityPreferencesCards({
  securityAlertsEnabled,
  onToggleSecurityAlerts,
  isNotifLoading,
  isNotifPending,
  isExporting,
  handleExportData,
}: SecurityPreferencesCardsProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Security Notifications Card */}
      <CRMCard>
        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold tracking-tight text-foreground">Security Notifications</h4>
              <p className="text-[11px] text-muted-foreground font-medium">Automated login and verification alerts</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-muted/30 rounded-xl border border-border/50 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h5 className="text-xs font-bold text-foreground">Security &amp; Login Alerts</h5>
            <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
              Receive instant email and in-app alerts for unrecognized device logins, password modifications, and MFA state changes.
            </p>
          </div>
          <Switch
            checked={securityAlertsEnabled}
            onCheckedChange={onToggleSecurityAlerts}
            disabled={isNotifLoading || isNotifPending}
          />
        </div>
      </CRMCard>

      {/* Privacy & Data Card */}
      <CRMCard>
        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FileDown className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold tracking-tight text-foreground">Privacy &amp; Personal Data</h4>
              <p className="text-[11px] text-muted-foreground font-medium">Data portability and GDPR / DPDP records</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-muted/30 rounded-xl border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h5 className="text-xs font-bold text-foreground">Export Personal Account Data</h5>
            <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
              Download a machine-readable JSON archive of your personal profile, activity history, and security metadata.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            disabled={isExporting}
            className="font-bold text-xs gap-1.5 h-8.5 shrink-0"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {isExporting ? "Exporting..." : "Export My Data"}
          </Button>
        </div>
      </CRMCard>
    </div>
  );
}
