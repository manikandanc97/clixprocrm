"use client";

import React from "react";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { PlatformPlanItem } from "@/shared/lib/api/super-admin.api";

interface PlanPricingTabProps {
  editingPlan: PlatformPlanItem;
  onPlanChange: (updated: PlatformPlanItem) => void;
}

export function PlanPricingTab({
  editingPlan,
  onPlanChange,
}: PlanPricingTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-100">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Currency</Label>
          <Select 
            value={editingPlan.currency} 
            onValueChange={(val) => 
              onPlanChange({
                ...editingPlan,
                currency: val,
              })
            }
          >
            <SelectTrigger className="w-full h-10 px-3 border-input bg-background text-xs font-semibold">
              <SelectValue placeholder="Select Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INR">INR (₹) - Indian Rupee</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Pricing Mode</Label>
          <Select 
            value={editingPlan.pricingMode} 
            onValueChange={(val) => 
              onPlanChange({
                ...editingPlan,
                pricingMode: val as "FIXED" | "CUSTOM",
              })
            }
          >
            <SelectTrigger className="w-full h-10 px-3 border-input bg-background text-xs font-semibold">
              <SelectValue placeholder="Select Pricing Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FIXED">Fixed Subscription Price</SelectItem>
              <SelectItem value="CUSTOM">Custom Enterprise (Contact Sales)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {editingPlan.pricingMode === "FIXED" ? (
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Monthly Price ({editingPlan.currency})
            </Label>
            <Input
              type="number"
              min="0"
              value={editingPlan.priceNum}
              onChange={(e) =>
                onPlanChange({
                  ...editingPlan,
                  priceNum: Number(e.target.value),
                })
              }
              className="rounded-xl h-10 font-bold"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Annual Price ({editingPlan.currency}/year)
            </Label>
            <Input
              type="number"
              min="0"
              value={editingPlan.annualPriceNum}
              onChange={(e) =>
                onPlanChange({
                  ...editingPlan,
                  annualPriceNum: Number(e.target.value),
                })
              }
              className="rounded-xl h-10 font-bold"
            />
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
          Enterprise custom pricing will display as <strong>&quot;Contact Sales&quot;</strong> on customer pricing pages. Subscriptions will be provisioned manually or via sales contracts.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Free Trial Period (Days)</Label>
          <Input
            type="number"
            min="0"
            value={editingPlan.trialDays}
            onChange={(e) =>
              onPlanChange({
                ...editingPlan,
                trialDays: Number(e.target.value),
              })
            }
            className="rounded-xl h-10"
            placeholder="Enter trial duration in days"
          />
        </div>

        <div className="space-y-2 pt-1">
          <Label className="text-xs font-semibold">Supported Billing Cycles</Label>
          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={editingPlan.billingCycleMonthly}
                onChange={(e) =>
                  onPlanChange({
                    ...editingPlan,
                    billingCycleMonthly: e.target.checked,
                  })
                }
                className="rounded border-input text-emerald-600 focus:ring-emerald-500"
              />
              Monthly
            </label>
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={editingPlan.billingCycleAnnual}
                onChange={(e) =>
                  onPlanChange({
                    ...editingPlan,
                    billingCycleAnnual: e.target.checked,
                  })
                }
                className="rounded border-input text-emerald-600 focus:ring-emerald-500"
              />
              Annual
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
