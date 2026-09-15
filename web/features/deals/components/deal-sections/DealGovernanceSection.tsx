"use client";

import React from "react";
import {
  SettingsSection,
  SettingsRow,
  SettingsToggleRow,
} from "@/shared/components/crm/ContextualSettingsComponents";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import {
  ShieldAlert,
  Percent,
  DollarSign,
  Lock,
  UserCheck,
  Sparkles,
  Clock,
} from "lucide-react";

export interface DealGovernanceSectionProps {
  currency: string;
  requireQuotationApproval: boolean;
  setRequireQuotationApproval: (v: boolean) => void;
  discountThreshold: string;
  setDiscountThreshold: (v: string) => void;
  requireDealValueApproval: boolean;
  setRequireDealValueApproval: (v: boolean) => void;
  dealValueThreshold: string;
  setDealValueThreshold: (v: string) => void;
  lockClosedDeals: boolean;
  setLockClosedDeals: (v: boolean) => void;
  allowReopenClosed: boolean;
  setAllowReopenClosed: (v: boolean) => void;
  autoAssignDeals: boolean;
  setAutoAssignDeals: (v: boolean) => void;
  enableStagnantReassignment: boolean;
  setEnableStagnantReassignment: (v: boolean) => void;
  reassignOnStuckDays: string;
  setReassignOnStuckDays: (v: string) => void;
  triggerAutoSave: () => void;
}

export function DealGovernanceSection({
  currency,
  requireQuotationApproval,
  setRequireQuotationApproval,
  discountThreshold,
  setDiscountThreshold,
  requireDealValueApproval,
  setRequireDealValueApproval,
  dealValueThreshold,
  setDealValueThreshold,
  lockClosedDeals,
  setLockClosedDeals,
  allowReopenClosed,
  setAllowReopenClosed,
  autoAssignDeals,
  setAutoAssignDeals,
  enableStagnantReassignment,
  setEnableStagnantReassignment,
  reassignOnStuckDays,
  setReassignOnStuckDays,
  triggerAutoSave,
}: DealGovernanceSectionProps) {
  return (
    <div className="space-y-5">
      <SettingsSection
        title="Deal Governance & Approval Controls"
        description="Protect deal data integrity, quotation discounting limits, and managerial approval workflows."
        icon={ShieldAlert}
      >
        <div className="divide-y divide-border/40">
          <SettingsToggleRow
            label="Strict Quotation Approvals"
            description="Require sales manager approval before sales reps can issue or send formal client PDF quotations."
            checked={requireQuotationApproval}
            onCheckedChange={(c) => { setRequireQuotationApproval(c); triggerAutoSave(); }}
          />

          <SettingsRow label="Quotation Max Discount Ceiling" description="Quotation discounts exceeding this percentage mandate managerial approval before quotation generation." icon={Percent}>
            <div className="flex items-center gap-1.5">
              <Input type="number" min="0" max="100" value={discountThreshold} onChange={(e) => { setDiscountThreshold(e.target.value); triggerAutoSave(); }} className="w-20 h-8 text-xs text-center font-semibold" />
              <span className="text-muted-foreground text-xs font-semibold">%</span>
            </div>
          </SettingsRow>

          <SettingsRow label="High-Value Deal Approval Threshold" description="Require sales director authorization for deals exceeding this contract value threshold." icon={DollarSign}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Input
                  type="number" min="0" step="10000"
                  disabled={!requireDealValueApproval}
                  value={dealValueThreshold}
                  onChange={(e) => { setDealValueThreshold(e.target.value); triggerAutoSave(); }}
                  className="w-28 h-8 text-xs text-center font-semibold disabled:opacity-50"
                />
                <span className="text-muted-foreground text-xs font-medium">{currency}</span>
              </div>
              <Switch
                checked={requireDealValueApproval}
                onCheckedChange={(c) => { setRequireDealValueApproval(c); triggerAutoSave(); }}
                className="data-[state=checked]:bg-emerald-600 cursor-pointer"
              />
            </div>
          </SettingsRow>

          <SettingsToggleRow
            label="Lock Closed Deals"
            description="Prevent editing of deal value, products, and parameters once marked as Closed Won or Closed Lost."
            icon={Lock}
            checked={lockClosedDeals}
            onCheckedChange={(c) => { setLockClosedDeals(c); triggerAutoSave(); }}
          />

          <SettingsToggleRow
            label="Allow Authorized Reopening of Closed Deals"
            description="Permit workspace administrators and sales managers to reopen closed deals with audit logging."
            icon={UserCheck}
            checked={allowReopenClosed}
            onCheckedChange={(c) => { setAllowReopenClosed(c); triggerAutoSave(); }}
          />

          <SettingsToggleRow
            label="Auto-Assign Deal Owner on Conversion"
            description="Automatically assign the lead owner or creator as the primary deal executive upon lead conversion."
            icon={Sparkles}
            checked={autoAssignDeals}
            onCheckedChange={(c) => { setAutoAssignDeals(c); triggerAutoSave(); }}
          />

          <SettingsRow label="Auto-Reassign Stagnant Deals" description="Automatically reassign deals with no stage movement or logged touchpoints after this duration." icon={Clock}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Input
                  type="number" min="1" max="180"
                  disabled={!enableStagnantReassignment}
                  value={reassignOnStuckDays}
                  onChange={(e) => { setReassignOnStuckDays(e.target.value); triggerAutoSave(); }}
                  className="w-18 h-8 text-xs text-center disabled:opacity-50"
                />
                <span className="text-muted-foreground text-xs font-medium">days</span>
              </div>
              <Switch
                checked={enableStagnantReassignment}
                onCheckedChange={(c) => { setEnableStagnantReassignment(c); triggerAutoSave(); }}
                className="data-[state=checked]:bg-emerald-600 cursor-pointer"
              />
            </div>
          </SettingsRow>
        </div>
      </SettingsSection>
    </div>
  );
}
