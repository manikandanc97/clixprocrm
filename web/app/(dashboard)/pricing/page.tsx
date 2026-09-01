"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  Sparkles,
  ShieldCheck,
  Building2,
  Zap,
  Box,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Shield,
  CreditCard,
  Layers,
  ArrowLeft,
  Users,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import { Label } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import {
  CANONICAL_PLANS,
  COMPARISON_MATRIX,
  formatPlanDisplayPrice,
  getPlanDefinition,
  normalizePlanId,
  PlanDefinition,
} from "@/shared/lib/plans/plan-definitions";
import { useSubscription, SubscriptionQuote } from "@/shared/hooks/use-subscription";
import { PlanBadge } from "@/shared/components/PlanBadge";
import { CRMPageContainer, CRMPageHeader } from "@/shared/components/crm";
import { useAuth } from "@/features/auth/components/auth-provider";
import { toast } from "sonner";

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightParam = searchParams.get("plan");

  const { user } = useAuth();
  const {
    subscription,
    plan: currentPlan,
    usage,
    availablePlans,
    calculateQuote,
    changePlan,
    isChangingPlan,
    contactSales,
    isSubmittingInquiry,
    canManageBilling,
  } = useSubscription();

  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [showComparison, setShowComparison] = useState(true);

  // Upgrade Modal State
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [targetPlan, setTargetPlan] = useState<PlanDefinition | null>(null);
  const [seats, setSeats] = useState<number>(1);
  const [quote, setQuote] = useState<SubscriptionQuote | null>(null);
  const [isCalculatingQuote, setIsCalculatingQuote] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  // Enterprise Contact Sales Modal
  const [enterpriseModalOpen, setEnterpriseModalOpen] = useState(false);
  const [inquiryData, setInquiryData] = useState({
    teamSize: "25-50",
    phone: "",
    message: "",
  });

  const activePlanId = normalizePlanId(subscription?.planId || "free");
  const currentActiveUsers = usage?.users?.current ?? 1;

  const rawDisplayPlans = availablePlans && availablePlans.length > 0 ? availablePlans : Object.values(CANONICAL_PLANS);
  const displayPlans = rawDisplayPlans
    .filter((p) => ["free", "growth", "business"].includes(normalizePlanId(p.id)))
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  // Pre-select plan if passed in query param
  useEffect(() => {
    if (highlightParam) {
      const match = displayPlans.find((p) => p.id.toLowerCase() === highlightParam.toLowerCase());
      if (match && match.id !== activePlanId) {
        if (match.pricingMode === "CUSTOM") {
          setEnterpriseModalOpen(true);
        } else {
          handleOpenUpgradeModal(match);
        }
      }
    }
  }, [highlightParam, activePlanId, displayPlans]);

  const handleOpenUpgradeModal = async (planItem: PlanDefinition) => {
    if (!canManageBilling) {
      toast.error("Only workspace administrators can manage subscription plans.");
      return;
    }

    setTargetPlan(planItem);
    const initialSeats = Math.max(currentActiveUsers, 1);
    setSeats(initialSeats);
    setUpgradeSuccess(false);
    setUpgradeModalOpen(true);
    await fetchQuote(planItem.id, initialSeats, billingCycle);
  };

  const fetchQuote = async (
    pId: string,
    seatCount: number,
    cycle: "monthly" | "annual"
  ) => {
    setIsCalculatingQuote(true);
    try {
      const q = await calculateQuote({
        planId: pId,
        seats: seatCount,
        billingCycle: cycle,
      });
      setQuote(q);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to calculate subscription quote.";
      toast.error(msg);
    } finally {
      setIsCalculatingQuote(false);
    }
  };

  const handleSeatChange = (newSeats: number) => {
    const minSeats = Math.max(currentActiveUsers, 1);
    const validated = Math.max(newSeats, minSeats);
    setSeats(validated);
    if (targetPlan) {
      fetchQuote(targetPlan.id, validated, billingCycle);
    }
  };

  const handleCycleChangeInModal = (newCycle: "monthly" | "annual") => {
    setBillingCycle(newCycle);
    if (targetPlan) {
      fetchQuote(targetPlan.id, seats, newCycle);
    }
  };

  const handleExecuteUpgrade = async () => {
    if (!targetPlan) return;
    try {
      await changePlan({
        planId: targetPlan.id,
        billingCycle,
        seats,
      });
      setUpgradeSuccess(true);
    } catch {
      // Toast handled in mutation
    }
  };

  const handleEnterpriseInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await contactSales(inquiryData);
      setEnterpriseModalOpen(false);
      setInquiryData({ teamSize: "25-50", phone: "", message: "" });
    } catch {
      // Handled in mutation
    }
  };

  return (
    <CRMPageContainer>
      <div className="space-y-10 max-w-6xl mx-auto pb-3.5">
        {/* Top Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="space-y-1">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Workspace</span>
            </button>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
              ClixProCRM Pricing & Plans
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Transparent, seat-based pricing that scales with your business. Choose the right capabilities for your sales & customer operations.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/settings?section=subscription")}
              className="text-xs font-semibold gap-1.5 border-border"
            >
              <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Subscription & Billing</span>
            </Button>
          </div>
        </div>

        {/* Current Workspace Plan Banner */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Your Current Plan
                </span>
                <PlanBadge plan={currentPlan.id} size="xs" />
              </div>
              <p className="text-sm font-bold text-foreground mt-0.5">
                {currentPlan.name} Plan ({currentPlan.price}
                {currentPlan.pricingMode === "FIXED" && currentPlan.priceNum > 0
                  ? `/${currentPlan.billingInterval}`
                  : ""}
                )
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-xs font-medium text-muted-foreground">
              {usage?.users?.current ?? 1} active user seat(s)
            </span>
          </div>
        </div>

        {/* Monthly / Annual Segmented Toggle */}
        <div className="flex flex-col items-center justify-center space-y-3 pt-2">
          <div className="inline-flex items-center bg-muted/60 p-1.5 rounded-2xl border border-border/70 shadow-xs">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                billingCycle === "monthly"
                  ? "bg-card text-foreground shadow-xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                billingCycle === "annual"
                  ? "bg-card text-foreground shadow-xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Save ~17%
              </span>
            </button>
          </div>
        </div>

        {/* 3 DYNAMIC PRICING CARDS IN BALANCED GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch max-w-5xl mx-auto">
          {displayPlans.map((planItem) => {
            const isCurrent = planItem.id === activePlanId;
            const isGrowth = planItem.recommended || planItem.id === "growth";
            const pricingInfo = formatPlanDisplayPrice(planItem, billingCycle);

            const isUpgrade = planItem.displayOrder > currentPlan.displayOrder;
            const isDowngrade = planItem.displayOrder < currentPlan.displayOrder;

            return (
              <div
                key={planItem.id}
                className={`flex flex-col justify-between rounded-2xl p-6 transition-all relative ${
                  isGrowth
                    ? "bg-card border-2 border-primary ring-4 ring-primary/10 shadow-lg md:-translate-y-1 z-10"
                    : "bg-card border border-border/80 hover:border-border shadow-xs"
                }`}
              >
                {/* Popular Badge */}
                {isGrowth && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Most Popular</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-extrabold text-foreground text-lg">
                      {planItem.name}
                    </h3>
                    <PlanBadge plan={planItem.id} size="xs" showIcon={false} />
                  </div>

                  <p className="text-xs text-muted-foreground min-h-[32px] leading-relaxed">
                    {planItem.target || planItem.description}
                  </p>

                  {/* Price Section */}
                  <div className="my-5 pt-3.5 border-t border-border/60">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-foreground tracking-tight">
                        {pricingInfo.priceText}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground block mt-0.5">
                      {pricingInfo.periodText}
                    </span>
                    {billingCycle === "annual" && pricingInfo.savingsText && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
                        {pricingInfo.savingsText}
                      </span>
                    )}
                  </div>

                  {/* Key Features List */}
                  <ul className="space-y-3 my-5 text-xs text-foreground/90">
                    {planItem.featureDescriptions.map((desc, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <div
                          className={`p-0.5 rounded-full mt-0.5 shrink-0 ${
                            isGrowth
                              ? "bg-primary/20 text-primary"
                              : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <span className="leading-snug text-xs">{desc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Primary CTA */}
                <div className="pt-4 border-t border-border/60">
                  {isCurrent ? (
                    <Button
                      disabled
                      variant="outline"
                      className="w-full text-xs font-bold bg-muted/60 text-muted-foreground border-border cursor-default h-10"
                    >
                      Current Plan
                    </Button>
                  ) : planItem.pricingMode === "CUSTOM" ? (
                    <Button
                      onClick={() => setEnterpriseModalOpen(true)}
                      variant="outline"
                      className="w-full text-xs font-bold border-border hover:bg-muted h-10"
                    >
                      Contact Sales
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleOpenUpgradeModal(planItem)}
                      className={`w-full text-xs font-bold shadow-xs h-10 ${
                        isGrowth
                          ? "bg-primary text-primary-foreground hover:brightness-110"
                          : isUpgrade
                          ? "bg-primary/90 text-primary-foreground hover:bg-primary"
                          : "bg-muted hover:bg-muted/80 text-foreground border border-border"
                      }`}
                    >
                      {isUpgrade
                        ? `Upgrade to ${planItem.name}`
                        : isDowngrade
                        ? `Downgrade to ${planItem.name}`
                        : `Choose ${planItem.name}`}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 3-TIER DETAILED COMPARISON TABLE */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs mt-14 max-w-5xl mx-auto">
          <div
            className="flex items-center justify-between cursor-pointer select-none"
            onClick={() => setShowComparison(!showComparison)}
          >
            <div>
              <h3 className="text-xl font-bold text-foreground tracking-tight">
                Full Plan Capability & Feature Matrix
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Explore in-depth specifications across CRM, automations, security, integrations, and SLAs.
              </p>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
              <span>{showComparison ? "Collapse Table" : "Expand Table"}</span>
              {showComparison ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          {showComparison && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40">
                    <th className="p-3.5 font-bold text-foreground w-[37%]">Feature Category</th>
                    <th className="p-3.5 font-bold text-foreground text-center w-[21%]">Free</th>
                    <th className="p-3.5 font-bold text-primary text-center bg-primary/5 w-[21%]">
                      Growth (₹499) ⭐
                    </th>
                    <th className="p-3.5 font-bold text-foreground text-center w-[21%]">Business (₹999)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {COMPARISON_MATRIX.map((category) => (
                    <React.Fragment key={category.category}>
                      <tr className="bg-muted/60">
                        <td
                          colSpan={4}
                          className="py-2.5 px-3.5 font-bold text-xs text-foreground uppercase tracking-wider"
                        >
                          {category.category}
                        </td>
                      </tr>
                      {category.features.map((feature) => (
                        <tr key={feature.key} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3.5">
                            <div className="font-semibold text-foreground">{feature.name}</div>
                            <div className="text-[11px] text-muted-foreground">{feature.description}</div>
                          </td>
                          <td className="p-3.5 text-center">{renderMatrixCell(feature.free)}</td>
                          <td className="p-3.5 text-center bg-primary/5 font-semibold text-primary">
                            {renderMatrixCell(feature.growth)}
                          </td>
                          <td className="p-3.5 text-center">{renderMatrixCell(feature.business)}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SEAT-BASED PURCHASE / UPGRADE FLOW MODAL */}
        <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
          <DialogContent className="sm:max-w-lg">
            {!upgradeSuccess ? (
              <div className="space-y-5">
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-bold">
                        {quote?.isUpgrade ? "Upgrade to" : "Switch to"} {targetPlan?.name}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground">
                        Configure seats and billing cycle for your workspace.
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                {/* Seats Configuration */}
                <div className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <Label className="font-bold flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        Number of User Seats
                      </Label>
                      <span className="text-muted-foreground">
                        Min. {Math.max(currentActiveUsers, 1)} seats (active team)
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={Math.max(currentActiveUsers, 1)}
                        max={targetPlan?.limits.maxUsers === -1 ? 500 : targetPlan?.limits.maxUsers || 100}
                        value={seats}
                        onChange={(e) => handleSeatChange(parseInt(e.target.value) || Math.max(currentActiveUsers, 1))}
                        className="h-10 text-sm font-bold w-32"
                      />
                      <span className="text-xs text-muted-foreground">
                        seats × {targetPlan?.price}/user/month
                      </span>
                    </div>
                  </div>

                  {/* Billing Cycle Toggle in Modal */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Billing Interval</Label>
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
                        <div className="font-bold">Monthly</div>
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
                          <span>Annual</span>
                          <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold">
                            Save ~17%
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">Billed yearly</div>
                      </button>
                    </div>
                  </div>

                  {/* Authoritative Server Quote Calculation Breakdown */}
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-2 text-xs">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Billing Summary
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {targetPlan?.name} ({seats} seats × ₹{quote?.unitPricePerMonth || targetPlan?.priceNum}/mo)
                      </span>
                      <span className="font-semibold text-foreground">
                        ₹{(quote?.unitPricePerMonth || 0) * seats * (billingCycle === "annual" ? 12 : 1)}
                      </span>
                    </div>

                    {billingCycle === "annual" && (quote?.annualDiscountAmount || 0) > 0 && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                        <span>Annual Savings (~17%)</span>
                        <span>-₹{quote?.annualDiscountAmount?.toLocaleString("en-IN")}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal ({quote?.intervalDescription})</span>
                      <span className="font-semibold text-foreground">
                        ₹{quote?.subtotal?.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {(quote?.taxAmount || 0) > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Estimated Tax (GST 18%)</span>
                        <span>₹{quote?.taxAmount?.toLocaleString("en-IN")}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-border/60 flex justify-between items-baseline font-bold text-sm">
                      <span className="text-foreground">Total Recurring Amount:</span>
                      <span className="text-primary text-base font-black">
                        ₹{quote?.totalAmount?.toLocaleString("en-IN")}
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          /{billingCycle === "annual" ? "yr" : "mo"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUpgradeModalOpen(false)}
                    className="text-xs"
                  >
                    Back
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleExecuteUpgrade}
                    disabled={isChangingPlan || isCalculatingQuote}
                    className="bg-primary text-primary-foreground text-xs font-bold gap-1.5 shadow-xs"
                  >
                    {isChangingPlan ? "Activating..." : "Continue & Activate Plan"}
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              /* PREMIUM SUCCESS STATE */
              <div className="py-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-extrabold text-foreground">
                    You&apos;re now on {targetPlan?.name}!
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Your workspace subscription has been upgraded successfully. New limits and unlocked features are immediately active.
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
                    <span className="text-muted-foreground">Billing:</span>
                    <span className="font-bold text-foreground capitalize">{billingCycle}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() => {
                      setUpgradeModalOpen(false);
                      router.push("/dashboard");
                    }}
                    className="bg-primary text-primary-foreground text-xs font-bold px-8 shadow-xs"
                  >
                    Go to CRM Dashboard
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ENTERPRISE CONTACT SALES MODAL */}
        <Dialog open={enterpriseModalOpen} onOpenChange={setEnterpriseModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <form onSubmit={handleEnterpriseInquirySubmit} className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold">
                      Contact Enterprise Sales
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Custom seat capacity, SAML 2.0 SSO, compliance vaults, and dedicated solution architects.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Estimated Team Size</Label>
                  <select
                    value={inquiryData.teamSize}
                    onChange={(e) => setInquiryData({ ...inquiryData, teamSize: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="25-50">25 - 50 team members</option>
                    <option value="50-150">50 - 150 team members</option>
                    <option value="150-500">150 - 500 team members</option>
                    <option value="500+">500+ team members (Large Enterprise)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Phone Number</Label>
                  <Input
                    placeholder="+91 98765 43210"
                    value={inquiryData.phone}
                    onChange={(e) => setInquiryData({ ...inquiryData, phone: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Custom Security / Architecture Needs</Label>
                  <Textarea
                    placeholder="Tell us about your organization requirements, custom integrations, compliance retention, or setup timeline..."
                    value={inquiryData.message}
                    onChange={(e) => setInquiryData({ ...inquiryData, message: e.target.value })}
                    className="text-xs min-h-[80px]"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEnterpriseModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingInquiry}
                  className="bg-primary text-primary-foreground text-xs font-semibold gap-1.5"
                >
                  {isSubmittingInquiry ? "Submitting..." : "Submit Inquiry"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </CRMPageContainer>
  );
}

function renderMatrixCell(val: string | boolean) {
  if (typeof val === "boolean") {
    return val ? (
      <div className="inline-flex p-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        <Check className="w-3.5 h-3.5" />
      </div>
    ) : (
      <span className="text-muted-foreground/40 font-bold">—</span>
    );
  }
  return <span className="font-medium text-foreground">{val}</span>;
}
