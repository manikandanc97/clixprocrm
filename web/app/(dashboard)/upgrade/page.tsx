"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  Sparkles,
  CreditCard,
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Shield,
  Zap,
  HardDrive,
  Bot,
  Target,
  Lock,
  RefreshCw,
  PhoneCall,
  Plus,
  Minus,
  Crown,
  HelpCircle,
  Receipt,
  FileText,
  Download,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
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
import { Textarea } from "@/shared/ui/textarea";
import {
  CANONICAL_PLANS,
  formatPlanDisplayPrice,
  normalizePlanId,
  PlanDefinition,
} from "@/shared/lib/plans/plan-definitions";
import { useSubscription } from "@/shared/hooks/use-subscription";
import { useAuth } from "@/features/auth/components/auth-provider";
import { PlanBadge } from "@/shared/components/PlanBadge";
import { toast } from "sonner";
import { CRMPageContainer, CRMPageHeader } from "@/shared/components/crm";
import { motion, AnimatePresence } from "framer-motion";

import { loadRazorpayCheckoutScript } from "@/shared/lib/billing/razorpay-loader";

function UpgradePageSkeleton() {
  return (
    <CRMPageContainer>
      <div className="flex flex-col gap-6 w-full pb-10">
        <CRMPageHeader
          title="Upgrade & Plans"
          subtitle="Transparent, seat-based pricing that scales with your business. Choose the right capabilities for your sales & operations."
          icon={Sparkles}
        >
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-card border border-border/80 shadow-xs">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Active Plan:
            </span>
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-28 rounded-md" />
            <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1 border-l border-border/60 pl-2">
              <Users className="w-3 h-3 text-muted-foreground shrink-0" />
              <Skeleton className="h-3.5 w-10 rounded-md" />
            </span>
          </div>
        </CRMPageHeader>

        {/* Monthly / Annual Segmented Toggle Placeholder */}
        <div className="flex flex-col items-center justify-center space-y-2 py-2">
          <div className="inline-flex items-center bg-muted/70 p-1 rounded-2xl border border-border/80 shadow-xs">
            <div className="px-5 py-2 rounded-xl text-xs font-bold bg-card text-foreground shadow-xs border border-border/80">
              Monthly Billing
            </div>
            <div className="px-5 py-2 rounded-xl text-xs font-bold text-muted-foreground flex items-center gap-2">
              <span>Annual Billing</span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                Save ~17% (2 Months Free)
              </span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Switch anytime. All plans include instant activation and prorated adjustments.
          </p>
        </div>

        {/* PRICING CARDS GRID SKELETON */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch w-full pt-2 max-w-7xl mx-auto">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex flex-col justify-between rounded-2xl p-6 sm:p-7 bg-card border border-border/80 shadow-xs relative ${
                i === 2 ? "border-emerald-500/40 shadow-emerald-500/5 ring-1 ring-emerald-500/20" : ""
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-5 w-24 rounded-md" />
                      <Skeleton className="h-3 w-36 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>

                <Skeleton className="h-4 w-full mb-1.5 mt-2 rounded-md" />
                <Skeleton className="h-4 w-3/4 mb-4 rounded-md" />

                <div className="py-3.5 border-y border-border/60 bg-muted/30 -mx-5 sm:-mx-6 px-5 sm:px-6 space-y-2">
                  <div className="flex items-baseline gap-2">
                    <Skeleton className="h-8 w-24 rounded-md" />
                    <Skeleton className="h-4 w-16 rounded-md" />
                  </div>
                  <Skeleton className="h-3 w-28 rounded-md" />
                </div>

                <div className="grid grid-cols-2 gap-1.5 my-3.5">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-7 w-full rounded-lg" />
                  ))}
                </div>

                <div className="space-y-2.5 pt-3">
                  <Skeleton className="h-3 w-32 mb-2 rounded-md" />
                  {[1, 2, 3, 4, 5].map((k) => (
                    <div key={k} className="flex items-center gap-2">
                      <Skeleton className="h-3.5 w-3.5 rounded-full shrink-0" />
                      <Skeleton className="h-3 w-4/5 rounded-md" />
                    </div>
                  ))}
                </div>
              </div>

              <Skeleton className="h-11 w-full rounded-xl mt-6" />
            </div>
          ))}
        </div>
      </div>
    </CRMPageContainer>
  );
}

function filterPureFeatures(features: string[]): string[] {
  if (!Array.isArray(features)) return [];
  return features.filter((feat) => {
    if (!feat || typeof feat !== "string") return false;
    const f = feat.trim();
    if (/^\s*(up to \d+|\d+[\d,]*|unlimited)\s*(team members|users|members|seats)/i.test(f)) return false;
    if (/\b\d+[\d,]*\s*contacts\b/i.test(f) && /\b\d+[\d,]*\s*leads\b/i.test(f)) return false;
    if (/^\s*(unlimited\s*)?(contacts|leads)\s*(&|and)?\s*(contacts|leads)?/i.test(f) && /\b(contacts|leads)\b/i.test(f)) return false;
    if (/^\s*\d+[\d,]*\s*GB\s*(cloud\s*)?storage/i.test(f)) return false;
    return true;
  });
}

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
    calculateQuote,
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

  const rawDisplayPlans = availablePlans && availablePlans.length > 0 ? availablePlans : (isLoading ? [] : Object.values(CANONICAL_PLANS));
  const displayPlans = useMemo(() => {
    return [...rawDisplayPlans]
      .filter((p) => p.isActive !== false)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [rawDisplayPlans]);

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

  const handleOpenUpgradeModal = (planItem: PlanDefinition) => {
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
  };

  // Pre-select plan if passed in query param
  useEffect(() => {
    if (highlightParam && displayPlans.length > 0) {
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
      const { order, quote: serverQuote } = await createCheckoutOrder({
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

      const options: any = {
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
        handler: async (response: any) => {
          try {
            toast.loading("Verifying payment with gateway...", { id: "payment-verify" });
            await verifyPayment({
              orderId: response.razorpay_order_id || order.orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              planId: targetPlan.id,
              billingCycle,
              seats,
            });
            toast.dismiss("payment-verify");
            setUpgradeSuccess(true);
          } catch (vErr: any) {
            toast.dismiss("payment-verify");
            const msg = vErr?.response?.data?.message || "Payment verification failed. Your plan has not changed.";
            console.error("[Checkout] Payment verification error:", msg);
            toast.error(msg);
          } finally {
            setIsProcessingCheckout(false);
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);

      rzp.on("payment.failed", (failResponse: any) => {
        setIsProcessingCheckout(false);
        const reason = failResponse?.error?.description || "Payment failed. Your subscription plan remains unchanged.";
        console.warn("[Checkout] Payment failed on gateway:", reason);
        toast.error(reason);
      });

      rzp.open();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to process payment checkout.";
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

  // Helper for tier aesthetics matching Orbit Design System
  const getTierTheme = (planId: string, isPopular: boolean) => {
    const p = planId.toLowerCase();
    if (p.includes("free") || p.includes("sandbox")) {
      return {
        icon: Shield,
        iconWrap: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
        badge: "FREE",
        gradientBg: "from-blue-500/[0.02] to-transparent",
        watermark: Shield,
        tagline: "For individuals & early evaluation",
      };
    }
    if (isPopular || p.includes("growth") || p.includes("starter")) {
      return {
        icon: Sparkles,
        iconWrap: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
        badge: "GROWTH",
        gradientBg: "from-emerald-500/[0.06] via-emerald-500/[0.01] to-transparent",
        watermark: Sparkles,
        tagline: "Best for scaling SMBs & active teams",
      };
    }
    if (p.includes("business") || p.includes("pro")) {
      return {
        icon: Zap,
        iconWrap: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30",
        badge: "BUSINESS",
        gradientBg: "from-indigo-500/[0.03] to-transparent",
        watermark: Zap,
        tagline: "Complete CRM governance & API control",
      };
    }
    return {
      icon: Crown,
      iconWrap: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
      badge: "ENTERPRISE",
      gradientBg: "from-amber-500/[0.03] to-transparent",
      watermark: Crown,
      tagline: "Custom scale, SLA & dedicated architects",
    };
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
      <div className="flex flex-col gap-6 w-full pb-10">
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
            <PlanBadge plan={currentPlan.id} size="xs" />
            <span className="text-xs font-bold text-foreground">
              {currentPlan.name} Plan ({currentPlan.price}
              {currentPlan.pricingMode === "FIXED" && currentPlan.priceNum > 0
                ? `/${currentPlan.billingInterval}`
                : ""}
              )
            </span>
            <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1 border-l border-border/60 pl-2">
              <Users className="w-3 h-3 text-primary shrink-0" />
              {currentActiveUsers} seat{currentActiveUsers > 1 ? "s" : ""}
            </span>
          </div>
        </CRMPageHeader>

        {/* Monthly / Annual Segmented Toggle */}
        <div className="flex flex-col items-center justify-center space-y-2 py-2">
          <div className="inline-flex items-center bg-muted/70 p-1 rounded-2xl border border-border/80 shadow-xs">
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
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 animate-pulse">
                Save ~17% (2 Months Free)
              </span>
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Switch anytime. All plans include instant activation and prorated adjustments.
          </p>
        </div>

        {/* PRICING CARDS GRID */}
        <div className={`grid ${gridLayoutClass} gap-6 items-stretch w-full pt-2`}>
          {displayPlans.map((planItem) => {
            const isCurrent = planItem.id === activePlanId;
            const isPopular = planItem.id === popularPlanId;
            const pricingInfo = formatPlanDisplayPrice(planItem, billingCycle);
            const tierTheme = getTierTheme(planItem.id, isPopular);
            const TierIcon = tierTheme.icon;
            const WatermarkIcon = tierTheme.watermark;

            const isUpgrade = planItem.displayOrder > currentPlan.displayOrder;
            const isDowngrade = planItem.displayOrder < currentPlan.displayOrder;

            return (
              <div
                key={planItem.id}
                className={`group flex flex-col justify-between rounded-2xl p-6 sm:p-7 transition-all duration-200 relative ${
                  isPopular
                    ? "bg-gradient-to-b from-emerald-500/[0.06] via-card to-card border-2 border-emerald-500/70 dark:border-emerald-500/80 ring-2 ring-emerald-500/15 shadow-lg shadow-emerald-500/10 hover:border-emerald-500 hover:shadow-xl"
                    : "bg-gradient-to-b from-card via-card to-card border border-border/80 hover:border-border hover:shadow-md shadow-xs"
                }`}
              >
                {/* Decorative background watermark contained cleanly in pseudo wrapper */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden">
                  <div className="absolute -bottom-6 -right-6 w-32 h-32 opacity-[0.03] dark:opacity-[0.05] select-none flex items-center justify-center">
                    <WatermarkIcon className="w-full h-full text-foreground" strokeWidth={1} />
                  </div>
                </div>

                {/* Single Unique Most Popular Floating Badge (not clipped) */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                    <span className="px-4 py-1 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white text-[10px] font-black tracking-wider uppercase shadow-md shadow-emerald-600/30 flex items-center gap-1.5 border border-emerald-400/30">
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div>
                  {/* Card Header: 3D Layered Icon + Title & Badge */}
                  <div className={`flex items-start justify-between gap-3 mb-3 ${isPopular ? "pt-2" : ""}`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${tierTheme.iconWrap}`}>
                        <TierIcon className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h3 className="font-black text-foreground text-base sm:text-lg tracking-tight leading-tight">
                          {planItem.name}
                        </h3>
                        <p className="text-[11px] text-muted-foreground leading-tight">
                          {tierTheme.tagline}
                        </p>
                      </div>
                    </div>
                    <PlanBadge plan={planItem.id} size="xs" showIcon={false} />
                  </div>

                  {/* Target Audience Description */}
                  <p className="text-xs text-muted-foreground min-h-[36px] leading-relaxed mb-4">
                    {planItem.target || planItem.description}
                  </p>

                  {/* Price Section */}
                  <div className="py-3.5 border-y border-border/60 bg-muted/30 -mx-5 sm:-mx-6 px-5 sm:px-6">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-foreground tracking-tight">
                        {pricingInfo.priceText}
                      </span>
                      {planItem.pricingMode === "FIXED" && planItem.priceNum > 0 && (
                        <span className="text-xs font-semibold text-muted-foreground">
                          /user/month
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground block mt-0.5 font-medium">
                      {pricingInfo.periodText}
                    </span>
                    {billingCycle === "annual" && pricingInfo.savingsText && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-1">
                        {pricingInfo.savingsText}
                      </span>
                    )}
                  </div>

                  {/* Key Capacity Chips */}
                  <div className="grid grid-cols-2 gap-1.5 my-3.5">
                    <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-muted/50 border border-border/50 text-[10.5px] font-medium text-foreground">
                      <Users className="w-3 h-3 text-primary shrink-0" />
                      <span className="truncate">
                        {planItem.limits.maxUsers === -1 ? "Unlimited" : `${planItem.limits.maxUsers}`} Seats
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-muted/50 border border-border/50 text-[10.5px] font-medium text-foreground">
                      <Target className="w-3 h-3 text-primary shrink-0" />
                      <span className="truncate">
                        {planItem.limits.maxContacts === -1
                          ? "Unlimited"
                          : `${planItem.limits.maxContacts.toLocaleString()}`}{" "}
                        Contacts
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-muted/50 border border-border/50 text-[10.5px] font-medium text-foreground">
                      <Zap className="w-3 h-3 text-primary shrink-0" />
                      <span className="truncate">
                        {planItem.limits.maxAutomations === -1
                          ? "Unlimited"
                          : `${planItem.limits.maxAutomations}`}{" "}
                        Automations
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-muted/50 border border-border/50 text-[10.5px] font-medium text-foreground">
                      <HardDrive className="w-3 h-3 text-primary shrink-0" />
                      <span className="truncate">
                        {planItem.limits.storageGb || 1} GB Storage
                      </span>
                    </div>
                  </div>

                  {/* Key Features Entitlements List */}
                  <div className="space-y-2 my-4">
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                      Key Capabilities Included:
                    </p>
                    <ul className="space-y-2 text-xs text-foreground/90">
                      {(filterPureFeatures(planItem.featureDescriptions || planItem.features || [])).map((desc, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <div
                            className={`h-4 w-4 rounded-full mt-0.5 shrink-0 flex items-center justify-center ${
                              isPopular
                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                : "bg-primary/15 text-primary"
                            }`}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span className="leading-snug text-xs font-medium text-foreground/90">
                            {desc}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="pt-4 border-t border-border/60">
                  {isCurrent ? (
                    <Button
                      disabled
                      variant="outline"
                      className="w-full text-xs font-bold bg-muted/70 text-muted-foreground border-border cursor-default h-10 rounded-xl gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Current Plan
                    </Button>
                  ) : planItem.pricingMode === "CUSTOM" ? (
                    <Button
                      onClick={() => setEnterpriseModalOpen(true)}
                      variant="outline"
                      className="w-full text-xs font-bold border-border hover:bg-muted h-10 rounded-xl gap-1.5 cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-muted-foreground" />
                      Contact Sales
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleOpenUpgradeModal(planItem)}
                      className={`w-full text-xs font-extrabold shadow-xs h-10 rounded-xl gap-1.5 transition-all cursor-pointer ${
                        isPopular
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20"
                          : isUpgrade
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-muted hover:bg-muted/80 text-foreground border border-border"
                      }`}
                    >
                      <span>
                        {isUpgrade
                          ? `Upgrade to ${planItem.name}`
                          : isDowngrade
                          ? `Switch to ${planItem.name}`
                          : `Choose ${planItem.name}`}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* BILLING & PAYMENT HISTORY ACCORDION TABLE */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs w-full mt-2">
          <div
            className="flex items-center justify-between cursor-pointer select-none"
            onClick={() => setShowBillingHistory(!showBillingHistory)}
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                <Receipt className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground tracking-tight">
                  Billing &amp; Payment History
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  View past invoices, payment receipts, active plan charges, and billing statements.
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground rounded-lg cursor-pointer">
              <span>{showBillingHistory ? "Hide History" : "View History"}</span>
              {showBillingHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          <AnimatePresence>
            {showBillingHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 border-t border-border/60 pt-4 overflow-hidden"
              >
                {isLoadingInvoices ? (
                  <div className="space-y-2 py-3">
                    <div className="h-10 bg-muted/50 rounded-xl animate-pulse" />
                    <div className="h-10 bg-muted/50 rounded-xl animate-pulse" />
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-border/80 rounded-xl space-y-2 bg-muted/20">
                    <FileText className="w-8 h-8 text-muted-foreground mx-auto opacity-40" />
                    <p className="text-xs font-bold text-foreground">
                      No past billing records found
                    </p>
                    <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                      Invoices and payment receipts will appear here automatically after your first subscription payment.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                      <thead>
                        <tr className="border-b border-border/80 bg-muted/40">
                          <th className="p-3.5 font-bold text-foreground rounded-tl-xl">Date</th>
                          <th className="p-3.5 font-bold text-foreground">Invoice #</th>
                          <th className="p-3.5 font-bold text-foreground">Plan / Description</th>
                          <th className="p-3.5 font-bold text-foreground">Seats</th>
                          <th className="p-3.5 font-bold text-foreground">Amount</th>
                          <th className="p-3.5 font-bold text-foreground">Status</th>
                          <th className="p-3.5 font-bold text-foreground text-right rounded-tr-xl">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                            <td className="p-3.5 font-medium text-foreground">{inv.date}</td>
                            <td className="p-3.5 font-mono text-[11px] text-muted-foreground">{inv.invoiceNumber}</td>
                            <td className="p-3.5 text-foreground font-semibold">{inv.description}</td>
                            <td className="p-3.5 text-foreground">{inv.seats} seats</td>
                            <td className="p-3.5 font-bold text-foreground">
                              ₹{inv.amount.toLocaleString("en-IN")}
                            </td>
                            <td className="p-3.5">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                {inv.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toast.info(`Invoice ${inv.invoiceNumber} is being downloaded.`)}
                                className="h-7 text-xs font-semibold gap-1 text-primary hover:text-primary cursor-pointer"
                              >
                                <Download className="w-3 h-3" />
                                <span>Download</span>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* FULL CAPABILITY & FEATURE COMPARISON TABLE */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs w-full mt-2">
          <div
            className="flex items-center justify-between cursor-pointer select-none"
            onClick={() => setShowComparison(!showComparison)}
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground tracking-tight">
                  Full Plan Capability &amp; Feature Comparison Matrix
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Compare in-depth limits across CRM capacities, automation workflows, RBAC roles, security, and storage.
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground rounded-lg">
              <span>{showComparison ? "Hide Matrix" : "View Matrix"}</span>
              {showComparison ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          <AnimatePresence>
            {showComparison && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 overflow-x-auto border-t border-border/60 pt-4"
              >
                <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="p-3.5 font-bold text-foreground rounded-tl-xl">Feature Category</th>
                      {displayPlans.map((p, idx) => {
                        const isLast = idx === displayPlans.length - 1;
                        const isPop = p.id === popularPlanId;
                        const priceInfo = formatPlanDisplayPrice(p, billingCycle);
                        return (
                          <th
                            key={p.id}
                            className={`p-3.5 font-bold text-center ${
                              isPop
                                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border-x border-emerald-500/20"
                                : "text-foreground"
                            } ${isLast ? "rounded-tr-xl" : ""}`}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span>{p.name}</span>
                              <span className="text-[11px] font-normal opacity-80">({priceInfo.priceText})</span>
                              {isPop && <span>⭐</span>}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {(subscription?.comparisonMatrix && subscription.comparisonMatrix.length > 0
                      ? subscription.comparisonMatrix
                      : []
                    ).map((category) => (
                      <React.Fragment key={category.category}>
                        <tr className="bg-muted/70">
                          <td
                            colSpan={displayPlans.length + 1}
                            className="py-2.5 px-3.5 font-extrabold text-[11px] text-foreground uppercase tracking-wider"
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
                            {displayPlans.map((p) => {
                              const isPop = p.id === popularPlanId;
                              const cellValue = feature.values?.[p.id] ?? feature[p.id] ?? (p.features?.some((f) => f.toLowerCase().includes(feature.name.toLowerCase())) ?? false);
                              return (
                                <td
                                  key={p.id}
                                  className={`p-3.5 text-center ${
                                    isPop
                                      ? "bg-emerald-500/5 font-semibold text-emerald-700 dark:text-emerald-300 border-x border-emerald-500/20"
                                      : ""
                                  }`}
                                >
                                  {renderMatrixCell(cellValue)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* TRUST & FAQ BADGES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          <div className="p-4 rounded-xl border border-border/80 bg-card shadow-xs flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Instant Activation</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Upgrades and additional seats take effect immediately without system downtime.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/80 bg-card shadow-xs flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Enterprise Security</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                256-bit SSL encrypted transactions with bank-grade payment processing.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/80 bg-card shadow-xs flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Prorated Seat Billing</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Add or remove team members at any point during your billing period seamlessly.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/80 bg-card shadow-xs flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Cancel Anytime</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                No locked-in lock-in contracts. Switch between monthly or annual tiers easily.
              </p>
            </div>
          </div>
        </div>

        {/* SEAT-BASED PURCHASE / UPGRADE FLOW MODAL */}
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
                    onClick={() => {
                      setUpgradeModalOpen(false);
                      router.push("/dashboard");
                    }}
                    className="bg-primary text-primary-foreground text-xs font-bold px-8 shadow-xs rounded-xl cursor-pointer"
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
          <DialogContent className="sm:max-w-lg rounded-2xl">
            <form onSubmit={handleEnterpriseInquirySubmit} className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base sm:text-lg font-bold">
                      Contact Enterprise Sales
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Custom seat allocations, SAML 2.0 SSO, compliance vaults, and dedicated solution architects.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-3.5 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Estimated Team Size</Label>
                  <select
                    value={inquiryData.teamSize}
                    onChange={(e) => setInquiryData({ ...inquiryData, teamSize: e.target.value })}
                    className="w-full h-9 rounded-xl border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="25-50">25 - 50 team members</option>
                    <option value="50-150">50 - 150 team members</option>
                    <option value="150-500">150 - 500 team members</option>
                    <option value="500+">500+ team members (Large Enterprise)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Phone / WhatsApp Number</Label>
                  <Input
                    placeholder="+91 98765 43210"
                    value={inquiryData.phone}
                    onChange={(e) => setInquiryData({ ...inquiryData, phone: e.target.value })}
                    className="text-xs h-9 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Custom Security / Organization Needs</Label>
                  <Textarea
                    placeholder="Tell us about your organization requirements, custom integrations, compliance retention, or setup timeline..."
                    value={inquiryData.message}
                    onChange={(e) => setInquiryData({ ...inquiryData, message: e.target.value })}
                    className="text-xs min-h-[80px] rounded-xl"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEnterpriseModalOpen(false)}
                  className="text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingInquiry}
                  className="bg-primary text-primary-foreground text-xs font-bold gap-1.5 rounded-xl cursor-pointer"
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
        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
      </div>
    ) : (
      <span className="text-muted-foreground/40 font-bold">—</span>
    );
  }
  return <span className="font-semibold text-foreground">{val}</span>;
}
