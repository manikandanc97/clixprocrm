"use client";

import React from "react";
import {
  SettingsSection,
  SettingsField,
  SettingsToggleRow,
} from "@/shared/components/crm/ContextualSettingsComponents";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { CreditCard, ChevronDown, ChevronUp } from "lucide-react";

export interface InvoicePaymentSectionProps {
  defaultPaymentTerms: string;
  setDefaultPaymentTerms: (v: string) => void;
  allowPartialPayments: boolean;
  setAllowPartialPayments: (v: boolean) => void;
  autoMarkOverdue: boolean;
  setAutoMarkOverdue: (v: boolean) => void;
  enableReminders: boolean;
  setEnableReminders: (v: boolean) => void;
  reminderDaysBefore: string;
  setReminderDaysBefore: (v: string) => void;
  reminderDaysAfter: string;
  setReminderDaysAfter: (v: string) => void;
  showAdvancedSettlement: boolean;
  setShowAdvancedSettlement: (v: boolean) => void;
  gracePeriodDays: string;
  setGracePeriodDays: (v: string) => void;
  onChangeNotify: () => void;
}

export function InvoicePaymentSection({
  defaultPaymentTerms,
  setDefaultPaymentTerms,
  allowPartialPayments,
  setAllowPartialPayments,
  autoMarkOverdue,
  setAutoMarkOverdue,
  enableReminders,
  setEnableReminders,
  reminderDaysBefore,
  setReminderDaysBefore,
  reminderDaysAfter,
  setReminderDaysAfter,
  showAdvancedSettlement,
  setShowAdvancedSettlement,
  gracePeriodDays,
  setGracePeriodDays,
  onChangeNotify,
}: InvoicePaymentSectionProps) {
  return (
    <div className="space-y-5">
      <SettingsSection
        title="Invoice Due Dates & Settlement Terms"
        description="Manage default payment periods, partial split receipts, and automated payment reminders."
        icon={CreditCard}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SettingsField label="Default Settlement Period" required>
            <Select
              value={defaultPaymentTerms}
              onValueChange={(val) => { setDefaultPaymentTerms(val); onChangeNotify(); }}
            >
              <SelectTrigger className="h-9 text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DUE_ON_RECEIPT">Due on Receipt (Immediate)</SelectItem>
                <SelectItem value="NET7">Net 7 Days</SelectItem>
                <SelectItem value="NET15">Net 15 Days</SelectItem>
                <SelectItem value="NET30">Net 30 Days (Standard)</SelectItem>
                <SelectItem value="NET45">Net 45 Days</SelectItem>
                <SelectItem value="NET60">Net 60 Days</SelectItem>
                <SelectItem value="NET90">Net 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </SettingsField>

          <SettingsField label="Automated Overdue Flagging">
            <div className="pt-2">
              <SettingsToggleRow
                label="Auto-Mark Overdue"
                description="Flags invoice status as OVERDUE immediately when unpaid past due date."
                checked={autoMarkOverdue}
                onCheckedChange={(c) => { setAutoMarkOverdue(c); onChangeNotify(); }}
              />
            </div>
          </SettingsField>
        </div>

        <div className="divide-y divide-border/40 pt-2">
          <SettingsToggleRow
            label="Allow Partial / Installment Payments"
            description="Enables split payment logging against single invoices while automatically maintaining outstanding balance."
            checked={allowPartialPayments}
            onCheckedChange={(c) => { setAllowPartialPayments(c); onChangeNotify(); }}
          />
          <SettingsToggleRow
            label="Enable Automated Payment Reminders"
            description="Sends scheduled automated email notices to customers regarding pending invoices."
            checked={enableReminders}
            onCheckedChange={(c) => { setEnableReminders(c); onChangeNotify(); }}
          />
        </div>

        {enableReminders && (
          <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-3">
            <p className="text-xs font-bold text-foreground">Automated Reminder Schedule</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block">Ahead of Due Date</span>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={reminderDaysBefore}
                    onChange={(e) => { setReminderDaysBefore(e.target.value); onChangeNotify(); }}
                    className="h-8 text-xs font-mono w-16 text-center"
                  />
                  <span className="text-muted-foreground text-[11px]">days before</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block">On Due Date</span>
                <div className="pt-1">
                  <span className="text-xs font-semibold text-primary border border-primary/30 rounded px-2 py-0.5">
                    Exact Due Date
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block">Overdue Follow-up</span>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={reminderDaysAfter}
                    onChange={(e) => { setReminderDaysAfter(e.target.value); onChangeNotify(); }}
                    className="h-8 text-xs font-mono w-16 text-center"
                  />
                  <span className="text-muted-foreground text-[11px]">days overdue</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Settlement Policy */}
        <div className="border border-border/70 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvancedSettlement(!showAdvancedSettlement)}
            aria-expanded={showAdvancedSettlement}
            className="w-full px-4 py-2.5 bg-muted/20 hover:bg-muted/40 flex items-center justify-between text-xs font-semibold text-foreground transition-colors cursor-pointer"
          >
            <span>Advanced Settlement & Grace Period Rules</span>
            {showAdvancedSettlement ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          {showAdvancedSettlement && (
            <div className="p-4 bg-card space-y-3 border-t border-border/70 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SettingsField
                  label="Grace Period (Days)"
                  description="Extra days allowed after due date before applying late notices."
                >
                  <Input
                    type="number"
                    min="0"
                    max="30"
                    value={gracePeriodDays}
                    onChange={(e) => { setGracePeriodDays(e.target.value); onChangeNotify(); }}
                    className="h-8 text-xs font-mono w-24 text-center"
                  />
                </SettingsField>
              </div>
            </div>
          )}
        </div>
      </SettingsSection>
    </div>
  );
}
