"use client";

import React from "react";
import { Building2, Trash2, Plus } from "lucide-react";
import { SettingsSection } from "@/shared/components/crm/ContextualSettingsComponents";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";

interface CompanyAccountTypesSectionProps {
  accountTypes: string[];
  newAccountType: string;
  setNewAccountType: (val: string) => void;
  onAddAccountType: (e: React.FormEvent) => void;
  onRemoveAccountType: (type: string) => void;
}

export function CompanyAccountTypesSection({
  accountTypes,
  newAccountType,
  setNewAccountType,
  onAddAccountType,
  onRemoveAccountType,
}: CompanyAccountTypesSectionProps) {
  return (
    <div className="space-y-5">
      <SettingsSection
        title="Account Types & Business Roles"
        description="Categorize companies by commercial relationship and partnership type."
        icon={Building2}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {accountTypes.map((type) => (
              <div
                key={type}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-card hover:bg-muted/20 transition-colors"
              >
                <span className="text-xs font-semibold text-foreground truncate">
                  {type}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => onRemoveAccountType(type)}
                  disabled={accountTypes.length <= 1}
                  aria-label={`Delete account type ${type}`}
                  className="w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <form onSubmit={onAddAccountType} className="mt-4 flex items-center gap-2 pt-2 border-t border-border/40">
            <Input
              placeholder="New account type (e.g., Affiliate, Sub-Contractor)..."
              value={newAccountType}
              onChange={(e) => setNewAccountType(e.target.value)}
              className="text-xs h-9 flex-1"
            />
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              className="text-xs font-semibold h-9 shrink-0 gap-1"
              disabled={!newAccountType.trim()}
            >
              <Plus className="w-3.5 h-3.5" /> Add Account Type
            </Button>
          </form>
        </div>
      </SettingsSection>
    </div>
  );
}
