"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  Clock,
  Percent,
  Layers,
  Save,
  CheckCircle2,
  Sliders,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { CRMCard } from "@/shared/components/crm";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { toast } from "sonner";

export default function SalesPreferencesSettings() {
  const [dealRotDays, setDealRotDays] = useState("14");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [autoAssignLeads, setAutoAssignLeads] = useState(true);
  const [requireQuotationApproval, setRequireQuotationApproval] = useState(true);
  const [discountThreshold, setDiscountThreshold] = useState("15");
  const [weightedForecast, setWeightedForecast] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    toast.success("Sales preferences updated successfully");
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <CRMCard>
        <div className="flex items-center justify-between pb-4 border-b border-border/50">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Sales & Pipeline Parameters
            </h3>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Configure deal aging rules, forecasting weighting, and sales velocity metrics.
            </p>
          </div>
          {saved && (
            <span className="text-xs text-primary font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>

        <div className="space-y-5 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                Deal Rot Alert Threshold (Days)
              </Label>
              <Input
                type="number"
                min="1"
                max="90"
                value={dealRotDays}
                onChange={(e) => setDealRotDays(e.target.value)}
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Highlight deals that have remained in the same stage without activity for longer than this period.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-muted-foreground" />
                Quotation Max Discount Threshold (%)
              </Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={discountThreshold}
                onChange={(e) => setDiscountThreshold(e.target.value)}
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Discounts above this threshold require manager approval before quotation dispatch.
              </p>
            </div>
          </div>

          <div className="divide-y divide-border/40 pt-2">
            <div className="py-3.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Weighted Revenue Forecasting</p>
                <p className="text-xs text-muted-foreground">
                  Multiply deal amounts by stage win probability percentages in reports and pipeline metrics.
                </p>
              </div>
              <Switch checked={weightedForecast} onCheckedChange={setWeightedForecast} />
            </div>

            <div className="py-3.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Round-Robin Lead Assignment</p>
                <p className="text-xs text-muted-foreground">
                  Automatically distribute newly captured website and marketing leads evenly across active sales reps.
                </p>
              </div>
              <Switch checked={autoAssignLeads} onCheckedChange={setAutoAssignLeads} />
            </div>

            <div className="py-3.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Strict Quotation Approvals</p>
                <p className="text-xs text-muted-foreground">
                  Require manager review before generating formal client PDF quotation downloads.
                </p>
              </div>
              <Switch checked={requireQuotationApproval} onCheckedChange={setRequireQuotationApproval} />
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-border/50 flex justify-end">
          <Button onClick={handleSave} className="gap-2 text-xs font-semibold">
            <Save className="w-3.5 h-3.5" /> Save Sales Preferences
          </Button>
        </div>
      </CRMCard>
    </div>
  );
}
