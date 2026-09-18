"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Users,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  CANONICAL_PLANS,
  normalizePlanId,
  PlanDefinition,
} from "@/shared/lib/plans/plan-definitions";
import { useSubscription } from "@/shared/hooks/use-subscription";
import { useAuth } from "@/features/auth/components/auth-provider";
import { PlanBadge } from "@/shared/components/PlanBadge";
import { toast } from "sonner";
import { CRMPageContainer, CRMPageHeader } from "@/shared/components/crm";

import { loadRazorpayCheckoutScript } from "@/shared/lib/billing/razorpay-loader";
import {
  RazorpayPaymentResponse,
  RazorpayPaymentFailedResponse,
  RazorpayCheckoutOptions,
  UpgradePageSkeleton,
} from "./components/upgrade-types";
import { UpgradePricingCards } from "./components/UpgradePricingCards";
import { BillingHistorySection } from "./components/BillingHistorySection";
import { FeatureComparisonTable } from "./components/FeatureComparisonTable";
import { TrustFaqSection } from "./components/TrustFaqSection";
import { UpgradePurchaseModal } from "./components/UpgradePurchaseModal";
import { EnterpriseContactModal } from "./components/EnterpriseContactModal";

export default function UpgradePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightParam = searchParams.get("plan");
  const { user } = useAuth();

  const {
    subscription,
    plan: currentPlan,
    usage,
    availablePlans,
    invoices,
    isLoadingInvoices,
    canManageBilling,
    createCheckoutOrder,
    verifyPayment,
    isVerifyingPayment,
    changePlan,
    isChangingPlan,
    contactSales,
    isSubmittingInquiry,
    isLoading,
    isError,
    refetch,
  } = useSubscription();

  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [showComparison, setShowComparison] = useState(false);
  const [showBillingHistory, setShowBillingHistory] = useState(false);

  // Seat-Based Upgrade Modal State
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [targetPlan, setTargetPlan] = useState<PlanDefinition | null>(null);
  const [seats, setSeats] = useState<number>(1);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // Preload Razorpay Checkout Script on component mount for instant checkout launch
  useEffect(() => {
    loadRazorpayCheckoutScript();
  }, []);

  // Enterprise Contact Sales Modal
  const [enterpriseModalOpen, setEnterpriseModalOpen] = useState(false);
  const [inquiryData, setInquiryData] = useState({
    teamSize: "25-50",
    phone: "",
    message: "",
  });

  const activePlanId = normalizePlanId(subscription?.planId || "free");
  const currentActiveUsers = usage?.users?.current ?? 1;

  const displayPlans = useMemo(() => {
    const rawDisplayPlans = availablePlans && availablePlans.length > 0 ? availablePlans : (isLoading ? [] : Object.values(CANONICAL_PLANS));
    return [...rawDisplayPlans]
      .filter((p) => p.isActive !== false)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [availablePlans, isLoading]);

  // Compute live quote instantly (0ms latency, perfectly responsive stepper and toggles)
  const currentQuote = useMemo(() => {
    if (!targetPlan) return null;
    const unitPrice = targetPlan.priceNum || 0;
    const isAnnual = billingCycle === "annual";
    const annualPrice = targetPlan.annualPriceNum || Math.round(unitPrice * 10 / 12);
    const subtotal = isAnnual ? annualPrice * 12 * seats : unitPrice * seats;
    const fullMonthlyEquivalent = unitPrice * 12 * seats;
    const annualDiscount = isAnnual ? Math.max(0, fullMonthlyEquivalent - subtotal) : 0;
    const taxAmount = Math.round((subtotal * 18) / 100);
    const totalAmount = subtotal + taxAmount;

    return {
      unitPricePerMonth: unitPrice,
      subtotal,
      annualDiscountAmount: annualDiscount,
      taxAmount,
      totalAmount,
      intervalDescription: isAnnual ? "billed annually" : "billed monthly",
    };
  }, [targetPlan, billingCycle, seats]);

  // Identify exactly one recommended / most popular plan (prefer growth or first explicitly highlighted)
  const popularPlanId = useMemo(() => {
    const explicit = displayPlans.find((p) => p.recommended || p.badge === "MOST POPULAR");
    if (explicit && explicit.id !== "free") return explicit.id;
    const growth = displayPlans.find((p) => p.id === "growth" || p.id.toLowerCase().includes("growth"));
    if (growth) return growth.id;
    return displayPlans.length > 1 ? displayPlans[1].id : null;
  }, [displayPlans]);

  const handleOpenUpgradeModal = useCallback((planItem: PlanDefinition) => {
    if (!canManageBilling) {
      toast.error("Only workspace administrators can manage subscription plans.");
      return;
    }

    setTargetPlan(planItem);
    const initialSeats = Math.max(currentActiveUsers, 1);
    setSeats(initialSeats);
    setUpgradeSuccess(false);
    setUpgradeModalOpen(true);
    loadRazorpayCheckoutScript();
  }, [canManageBilling, currentActiveUsers]);

  // Pre-select plan if passed in query param
  const highlightHandledRef = useRef(false);
  useEffect(() => {
    if (highlightParam && displayPlans.length > 0 && !highlightHandledRef.current) {
      const match = displayPlans.find((p) => p.id.toLowerCase() === highlightParam.toLowerCase());
      if (match && match.id !== activePlanId) {
        highlightHandledRef.current = true;
        setTimeout(() => {
          if (match.pricingMode === "CUSTOM") {
            setEnterpriseModalOpen(true);
          } else {
            handleOpenUpgradeModal(match);
          }
        }, 0);
      }
    }
  }, [highlightParam, activePlanId, displayPlans, handleOpenUpgradeModal]);

  const handleSeatChange = (newSeats: number) => {
    const minSeats = Math.max(currentActiveUsers, 1);
    const validated = Math.max(newSeats, minSeats);
    setSeats(validated);
  };

  const handleCycleChangeInModal = (newCycle: "monthly" | "annual") => {
    setBillingCycle(newCycle);
  };

  const handleExecuteUpgrade = async () => {
    if (!targetPlan) return;
    setIsProcessingCheckout(true);

    try {
      // 1. If downgrading to free tier
      if (targetPlan.id === "free") {
        await changePlan({
          planId: targetPlan.id,
          billingCycle,
          seats,
        });
        setUpgradeSuccess(true);
        return;
      }

      // 2. Load official Razorpay Checkout SDK
      const isLoaded = await loadRazorpayCheckoutScript();
      if (!isLoaded) {
        console.error("[Checkout] Failed to load Razorpay Checkout SDK.");
        toast.error("Could not load Razorpay payment gateway. Please check your network connection and try again.");
        setIsProcessingCheckout(false);
        return;
      }

      // 3. Create server-side checkout order with canonical price
      const { order } = await createCheckoutOrder({
        planId: targetPlan.id,
        seats,
        billingCycle,
      });

      if (!order || !order.orderId || !order.keyId) {
        console.error("[Checkout] Invalid order response from API:", order);
        toast.error("Failed to initialize payment gateway order. Please try again.");
        setIsProcessingCheckout(false);
        return;
      }

      // 4. Open Razorpay Checkout modal with authenticated user's credentials
      const prefName = user?.name || user?.displayName || order?.customer?.name || subscription?.tenantName || "Customer";
      const prefEmail = user?.email || order?.customer?.email || "";
      const prefContact = user?.phone || order?.customer?.contact || "";

      const options: RazorpayCheckoutOptions = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "ClixProCRM",
        description: `${targetPlan.name} Plan Subscription (${seats} seats, ${billingCycle})`,
        order_id: order.orderId,
        prefill: {
          name: prefName,
          email: prefEmail,
          contact: prefContact || undefined,
        },
        notes: {
          tenantId: subscription?.tenantId,
          planId: targetPlan.id,
          seats: String(seats),
          billingCycle,
        },
        theme: { color: "#32bd87" },
        modal: {
          ondismiss: () => {
            setIsProcessingCheckout(false);
            toast.info("Payment was cancelled. Your subscription plan remains unchanged.");
          },
        },
        handler: async (response: RazorpayPaymentResponse) => {
          try {
            toast.loading("Verifying payment with gateway...", { id: "payment-verify" });
            await verifyPayment({
              orderId: response.razorpay_order_id || order.orderId || "",
              paymentId: response.razorpay_payment_id || "",
              signature: response.razorpay_signature || "",
              planId: targetPlan.id,
              billingCycle,
              seats,
            });
            toast.dismiss("payment-verify");
            setUpgradeSuccess(true);
          } catch (vErr: unknown) {
            toast.dismiss("payment-verify");
            const errObj = vErr as { response?: { data?: { message?: string } } } | undefined;
            const msg = errObj?.response?.data?.message || "Payment verification failed. Your plan has not changed.";
            console.error("[Checkout] Payment verification error:", msg);
            toast.error(msg);
          } finally {
            setIsProcessingCheckout(false);
          }
        },
      };

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout script failed to initialize.");
      }
      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (failResponse: unknown) => {
        setIsProcessingCheckout(false);
        const errObj = failResponse as RazorpayPaymentFailedResponse | undefined;
        const reason = errObj?.error?.description || "Payment failed. Your subscription plan remains unchanged.";
        console.warn("[Checkout] Payment failed on gateway:", reason);
        toast.error(reason);
      });

      rzp.open();
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string } | undefined;
      const msg = errObj?.response?.data?.message || errObj?.message || "Failed to process payment checkout.";
      console.error("[Checkout] Exception during checkout initiation:", msg);
      toast.error(msg);
      setIsProcessingCheckout(false);
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

  // Compute responsive grid layout based on number of active plans
  const gridLayoutClass = useMemo(() => {
    const count = displayPlans.length;
    if (count === 1) return "grid-cols-1 max-w-md mx-auto";
    if (count === 2) return "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto";
    if (count === 3) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto";
    return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  }, [displayPlans.length]);

  if (isLoading) {
    return <UpgradePageSkeleton />;
  }

  if (isError && !subscription) {
    return (
      <CRMPageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 max-w-lg mx-auto">
          <div className="p-4 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 shadow-xs">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">
            Unable to Load Plans & Subscription
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            There was an error retrieving the subscription plans for your workspace. Please check your connection and try again.
          </p>
          <Button size="sm" onClick={() => refetch()} className="gap-2 text-xs font-semibold">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </Button>
        </div>
      </CRMPageContainer>
    );
  }

  return (
    <CRMPageContainer>
      {/* Standard CRM Page Header with compact right-side Active Plan status */}
      <CRMPageHeader
        title="Upgrade & Plans"
        subtitle="Transparent, seat-based pricing that scales with your business. Choose the right capabilities for your sales & operations."
        icon={Sparkles}
      >
          {/* Compact Current Plan Status Pill */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-card border border-border/80 shadow-xs">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Active Plan:
            </span>
            <PlanBadge plan={activePlanId} size="xs" />
            <span className="text-xs font-bold text-foreground">
              {currentPlan?.name || "Free Tier"}
            </span>
            <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1 border-l border-border/60 pl-2">
              <Users className="w-3 h-3 text-muted-foreground shrink-0" />
              <span>{currentActiveUsers} active</span>
            </span>
          </div>
        </CRMPageHeader>

        {/* Monthly / Annual Segmented Toggle */}
        <div className="flex flex-col items-center justify-center space-y-2 py-2">
          <div className="inline-flex items-center bg-muted/70 p-1 rounded-2xl border border-border/80 shadow-xs">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer ${
                billingCycle === "monthly"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-5 py-2 text-xs font-bold rounded-xl transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                billingCycle === "annual"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold">
                Save ~17%
              </span>
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Switch anytime. All plans include instant activation and prorated adjustments.
          </p>
        </div>

        {/* PRICING CARDS GRID */}
        <UpgradePricingCards
          displayPlans={displayPlans}
          activePlanId={activePlanId}
          popularPlanId={popularPlanId}
          currentPlan={currentPlan}
          billingCycle={billingCycle}
          handleOpenUpgradeModal={handleOpenUpgradeModal}
          setEnterpriseModalOpen={setEnterpriseModalOpen}
          gridLayoutClass={gridLayoutClass}
        />

        {/* BILLING & PAYMENT HISTORY ACCORDION TABLE */}
        <BillingHistorySection
          invoices={invoices}
          isLoadingInvoices={isLoadingInvoices}
          showBillingHistory={showBillingHistory}
          setShowBillingHistory={setShowBillingHistory}
        />

        {/* FULL CAPABILITY & FEATURE COMPARISON TABLE */}
        <FeatureComparisonTable
          showComparison={showComparison}
          setShowComparison={setShowComparison}
          displayPlans={displayPlans}
          popularPlanId={popularPlanId}
          billingCycle={billingCycle}
          subscription={subscription}
        />

        {/* TRUST & FAQ BADGES */}
        <TrustFaqSection />

        {/* SEAT-BASED PURCHASE / UPGRADE FLOW MODAL */}
        <UpgradePurchaseModal
          upgradeModalOpen={upgradeModalOpen}
          setUpgradeModalOpen={setUpgradeModalOpen}
          targetPlan={targetPlan}
          seats={seats}
          handleSeatChange={handleSeatChange}
          billingCycle={billingCycle}
          handleCycleChangeInModal={handleCycleChangeInModal}
          currentQuote={currentQuote}
          currentActiveUsers={currentActiveUsers}
          isProcessingCheckout={isProcessingCheckout}
          isVerifyingPayment={isVerifyingPayment}
          isChangingPlan={isChangingPlan}
          upgradeSuccess={upgradeSuccess}
          handleExecuteUpgrade={handleExecuteUpgrade}
          onNavigateToDashboard={() => {
            setUpgradeModalOpen(false);
            router.push("/dashboard");
          }}
        />

        {/* ENTERPRISE CONTACT SALES MODAL */}
        <EnterpriseContactModal
          enterpriseModalOpen={enterpriseModalOpen}
          setEnterpriseModalOpen={setEnterpriseModalOpen}
          inquiryData={inquiryData}
          setInquiryData={setInquiryData}
          isSubmittingInquiry={isSubmittingInquiry}
          handleEnterpriseInquirySubmit={handleEnterpriseInquirySubmit}
        />
    </CRMPageContainer>
  );
}
