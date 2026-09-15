"use client";

import React from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { motion } from "framer-motion";
import { PlatformOrganization } from "@/shared/lib/api/super-admin.api";

interface BillingSubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  selectedTenantId: string;
  setSelectedTenantId: (id: string) => void;
  selectedPlanId: string;
  setSelectedPlanId: (plan: string) => void;
  selectedBillingCycle: "monthly" | "annual";
  setSelectedBillingCycle: (cycle: "monthly" | "annual") => void;
  selectedSeats: number;
  setSelectedSeats: (seats: number) => void;
  organizations: PlatformOrganization[];
  isSubmitting: boolean;
}

export function BillingSubscriptionModal({
  open,
  onClose,
  onSubmit,
  selectedTenantId,
  setSelectedTenantId,
  selectedPlanId,
  setSelectedPlanId,
  selectedBillingCycle,
  setSelectedBillingCycle,
  selectedSeats,
  setSelectedSeats,
  organizations,
  isSubmitting,
}: BillingSubscriptionModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-card border border-border/80 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" /> Configure Subscription
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label className="text-xs font-semibold text-foreground mb-1">Organization (Workspace) *</Label>
            <select
              required
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-card border border-border text-xs font-semibold text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select an organization...</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.plan?.toUpperCase()} - {org.slug})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-foreground mb-1">Plan Tier</Label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-card border border-border text-xs font-semibold text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="free">Free Tier</option>
                <option value="growth">Growth ⭐ (₹499/mo)</option>
                <option value="business">Business (₹999/mo)</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-foreground mb-1">Billing Cycle</Label>
              <select
                value={selectedBillingCycle}
                onChange={(e) => setSelectedBillingCycle(e.target.value as "monthly" | "annual")}
                className="w-full h-9 px-3 rounded-xl bg-card border border-border text-xs font-semibold text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="monthly">Monthly</option>
                <option value="annual">Annual (Discounted)</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-foreground mb-1">Licensed Seats</Label>
            <Input
              type="number"
              min="1"
              max="1000"
              required
              value={selectedSeats}
              onChange={(e) => setSelectedSeats(Number(e.target.value))}
              className="h-9 text-xs font-mono font-bold"
            />
          </div>

          <div className="p-3 rounded-xl bg-muted/20 border border-border/60 text-xs text-muted-foreground">
            <p>
              Setting this will immediately update the organization&apos;s active quota, access tier, and generate a platform invoice.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/80">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs font-semibold"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Save Subscription
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
