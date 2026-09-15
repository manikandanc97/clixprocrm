"use client";

import React from "react";
import {
  Sparkles,
  Minus,
  Plus,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PlanDefinition } from "@/shared/lib/plans/plan-definitions";
import { QuoteDetails } from "./upgrade-types";

interface UpgradePurchaseModalProps {
  upgradeModalOpen: boolean;
  setUpgradeModalOpen: (open: boolean) => void;
  targetPlan: PlanDefinition | null;
  seats: number;
  handleSeatChange: (newSeats: number) => void;
  billingCycle: "monthly" | "annual";
  handleCycleChangeInModal: (newCycle: "monthly" | "annual") => void;
  currentQuote: QuoteDetails | null;
  currentActiveUsers: number;
  isProcessingCheckout: boolean;
  isVerifyingPayment: boolean;
  isChangingPlan: boolean;
  upgradeSuccess: boolean;
  handleExecuteUpgrade: () => Promise<void>;
  onNavigateToDashboard: () => void;
}

export function UpgradePurchaseModal({
  upgradeModalOpen,
  setUpgradeModalOpen,
  targetPlan,
  seats,
  handleSeatChange,
  billingCycle,
  handleCycleChangeInModal,
  currentQuote,
  currentActiveUsers,
  isProcessingCheckout,
  isVerifyingPayment,
  isChangingPlan,
  upgradeSuccess,
  handleExecuteUpgrade,
  onNavigateToDashboard,
}: UpgradePurchaseModalProps) {
  return (
    <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        {!upgradeSuccess ? (
          <div className="space-y-5">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-bold">
                    Upgrade to {targetPlan?.name} Plan
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Configure team member seat count and review live quote breakdown.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-1">
              {/* Seat Selection Stepper */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold">Team Member Seats</Label>
                  <span className="text-[11px] text-muted-foreground">
                    Minimum: {Math.max(currentActiveUsers, 1)} seats (current active users)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-border rounded-xl bg-card p-1 shadow-xs">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={seats <= Math.max(currentActiveUsers, 1)}
                      onClick={() => handleSeatChange(seats - 1)}
                      aria-label="Decrease seat count"
                      className="h-8 w-8 rounded-lg cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </Button>
                    <Input
                      type="number"
                      min={Math.max(currentActiveUsers, 1)}
                      max={targetPlan?.limits.maxUsers === -1 ? 500 : targetPlan?.limits.maxUsers || 100}
                      value={seats}
                      onChange={(e) => handleSeatChange(parseInt(e.target.value) || Math.max(currentActiveUsers, 1))}
                      aria-label="Number of seats"
                      className="h-8 text-center text-sm font-bold w-16 border-0 focus-visible:ring-0"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSeatChange(seats + 1)}
                      aria-label="Increase seat count"
                      className="h-8 w-8 rounded-lg cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    seats × {targetPlan?.price}/user/month
                  </span>
                </div>
              </div>

              {/* Billing Cycle Toggle in Modal */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Billing Cycle</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCycleChangeInModal("monthly")}
                    className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      billingCycle === "monthly"
                        ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                        : "border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <div className="font-bold">Monthly Billing</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Billed every month</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCycleChangeInModal("annual")}
                    className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      billingCycle === "annual"
                        ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                        : "border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>Annual Billing</span>
                      <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold">
                        Save ~17%
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Billed yearly</div>
                  </button>
                </div>
              </div>

              {/* Live Quote Breakdown */}
              {currentQuote && (
                <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-2 text-xs">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1">
                    Billing Calculation Summary
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {targetPlan?.name} ({seats} seats × ₹{currentQuote.unitPricePerMonth}/mo)
                    </span>
                    <span className="font-semibold text-foreground">
                      ₹{currentQuote.unitPricePerMonth * seats * (billingCycle === "annual" ? 12 : 1)}
                    </span>
                  </div>

                  {billingCycle === "annual" && currentQuote.annualDiscountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                      <span>Annual Savings (~17% discount)</span>
                      <span>-₹{currentQuote.annualDiscountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({currentQuote.intervalDescription})</span>
                    <span className="font-semibold text-foreground">
                      ₹{currentQuote.subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {currentQuote.taxAmount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Estimated GST (18%)</span>
                      <span>₹{currentQuote.taxAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  <div className="pt-2.5 border-t border-border/60 flex justify-between items-baseline font-bold text-sm">
                    <span className="text-foreground">Total Recurring Amount:</span>
                    <span className="text-primary text-base font-black">
                      ₹{currentQuote.totalAmount.toLocaleString("en-IN")}
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        /{billingCycle === "annual" ? "yr" : "mo"}
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUpgradeModalOpen(false)}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleExecuteUpgrade}
                disabled={isProcessingCheckout || isVerifyingPayment || isChangingPlan}
                className="bg-primary text-primary-foreground text-xs font-bold gap-1.5 shadow-xs rounded-xl cursor-pointer"
              >
                {isProcessingCheckout || isVerifyingPayment || isChangingPlan
                  ? "Processing Checkout..."
                  : "Proceed to Checkout"}
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* SUCCESS STATE */
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-extrabold text-foreground">
                You&apos;re now on {targetPlan?.name}!
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Your workspace subscription has been upgraded successfully. New limits and features are active immediately.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 max-w-xs mx-auto text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Plan:</span>
                <span className="font-bold text-foreground">{targetPlan?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Allocated Seats:</span>
                <span className="font-bold text-foreground">{seats} users</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Billing Interval:</span>
                <span className="font-bold text-foreground capitalize">{billingCycle}</span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={onNavigateToDashboard}
                className="bg-primary text-primary-foreground text-xs font-bold px-8 shadow-xs rounded-xl cursor-pointer"
              >
                Go to CRM Dashboard
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
