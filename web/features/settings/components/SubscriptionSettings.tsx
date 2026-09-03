"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  Building2,
  Users,
  HardDrive,
  Target,
  ArrowRight,
  HelpCircle,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  AlertCircle,
  RefreshCw,
  Lock,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  CANONICAL_PLANS,
  formatPlanDisplayPrice,
  getPlanDefinition,
  normalizePlanId,
  PlanDefinition,
} from "@/shared/lib/plans/plan-definitions";
import { useSubscription } from "@/shared/hooks/use-subscription";
import { PlanBadge } from "@/shared/components/PlanBadge";
import { useAuth } from "@/features/auth/components/auth-provider";
import { SubscriptionSettingsSkeleton } from "./SettingsSkeletons";
import { toast } from "sonner";

export default function SubscriptionSettings() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    subscription,
    plan: currentPlan,
    usage,
    invoices,
    isLoadingInvoices,
    canManageBilling,
    isLoading,
    isError,
    refetch,
  } = useSubscription();

  const [showComparison, setShowComparison] = useState(false);

  const activePlanId = normalizePlanId(subscription?.planId || "free");
  const isEnterprise = activePlanId === "enterprise";
  const isFree = activePlanId === "free";
  const pricing = formatPlanDisplayPrice(currentPlan, subscription?.billingCycle || "monthly");

  const renewalDateFormatted = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Active (Perpetual)";

  if (isLoading) {
    return <SubscriptionSettingsSkeleton />;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card p-8 text-center space-y-4 max-w-2xl mx-auto">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
        <h3 className="text-base font-bold text-foreground">
          Unable to load subscription details
        </h3>
        <p className="text-xs text-muted-foreground">
          There was an error connecting to the subscription management engine. Please try again.
        </p>
        <Button size="sm" onClick={() => refetch()} className="gap-1.5 text-xs font-semibold">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl min-h-full flex flex-col">
      {/* 1. CURRENT PLAN HERO SUMMARY CARD */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                CURRENT PLAN
              </span>
              <PlanBadge plan={currentPlan.id} size="md" />
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  subscription?.status === "ACTIVE"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : subscription?.status === "PAST_DUE"
                    ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {subscription?.status || "Active"}
              </span>
            </div>

            <div className="flex items-baseline gap-2 flex-wrap">
              <h2 className="text-3xl font-black text-foreground tracking-tight">
                {currentPlan.name} Plan
              </h2>
              <span className="text-muted-foreground text-sm font-semibold">
                ({pricing.priceText}
                {currentPlan.pricingMode === "FIXED" && currentPlan.priceNum > 0
                  ? `/${currentPlan.billingInterval}`
                  : ""}
                )
              </span>
            </div>

            <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
              {currentPlan.description}
            </p>

            {/* Billing Meta Tags */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 flex-wrap">
              <div>
                <span className="font-semibold text-foreground">Billing Interval:</span>{" "}
                <span className="capitalize">{subscription?.billingCycle || "Monthly"}</span>
              </div>
              <div>
                <span className="font-semibold text-foreground">Next Renewal:</span>{" "}
                <span>{renewalDateFormatted}</span>
              </div>
              <div>
                <span className="font-semibold text-foreground">Included Seats:</span>{" "}
                <span>
                  {subscription?.seats ?? usage?.users?.current ?? 1} allocated (
                  {currentPlan.limits.maxUsers === -1 ? "Unlimited" : `${currentPlan.limits.maxUsers} max`}
                  )
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {canManageBilling ? (
              <>
                <Button
                  onClick={() => router.push("/upgrade")}
                  className="bg-primary text-primary-foreground hover:brightness-110 shadow-xs gap-1.5 text-xs font-bold"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Change Plan</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/upgrade")}
                  className="text-xs font-bold border-border gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Manage Billing</span>
                </Button>
              </>
            ) : (
              <div className="p-3 rounded-xl bg-muted/50 border border-border/80 text-xs text-muted-foreground flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Contact your organization admin to change plans.</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. LIVE USAGE OVERVIEW */}
        <div className="mt-8 pt-6 border-t border-border/60">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Live Workspace Resource Usage
            </h4>
            <span className="text-[11px] text-muted-foreground">
              Based on active workspace records
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Users */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  Active Users
                </span>
                <span className="font-bold text-foreground">
                  {usage?.users?.current ?? 1} /{" "}
                  {currentPlan.limits.maxUsers === -1 ? "Unlimited" : currentPlan.limits.maxUsers}
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-1.5 overflow-hidden border border-border/40">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, usage?.users?.percentage ?? 0)}%` }}
                />
              </div>
            </div>

            {/* Contacts */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-muted-foreground" />
                  Contacts
                </span>
                <span className="font-bold text-foreground">
                  {(usage?.contacts?.current ?? 0).toLocaleString()} /{" "}
                  {currentPlan.limits.maxContacts === -1
                    ? "Unlimited"
                    : currentPlan.limits.maxContacts.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-1.5 overflow-hidden border border-border/40">
                <div
                  className="bg-sky-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, usage?.contacts?.percentage ?? 0)}%` }}
                />
              </div>
            </div>

            {/* Leads */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                  Leads
                </span>
                <span className="font-bold text-foreground">
                  {(usage?.leads?.current ?? 0).toLocaleString()} /{" "}
                  {currentPlan.limits.maxLeads === -1
                    ? "Unlimited"
                    : currentPlan.limits.maxLeads.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-1.5 overflow-hidden border border-border/40">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, usage?.leads?.percentage ?? 0)}%` }}
                />
              </div>
            </div>

            {/* Tasks / Storage */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-muted-foreground" />
                  Tasks
                </span>
                <span className="font-bold text-foreground">
                  {(usage?.tasks?.current ?? 0).toLocaleString()} /{" "}
                  {currentPlan.limits.maxTasks === -1
                    ? "Unlimited"
                    : currentPlan.limits.maxTasks.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-1.5 overflow-hidden border border-border/40">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, usage?.tasks?.percentage ?? 0)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. QUICK UPGRADE PROMPT (IF ON FREE) */}
      {isFree && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-bold text-foreground">
                Unlock Advanced Workflows & Higher Limits
              </h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Upgrade your workspace to access custom fields, sales pipelines, email tracking, team permissions, and expanded contact limits.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => router.push("/upgrade")}
            className="bg-primary text-primary-foreground text-xs font-bold shrink-0 shadow-xs"
          >
            Explore Plans ⭐
          </Button>
        </div>
      )}

      {/* 4. BILLING HISTORY / INVOICES TABLE */}
      {canManageBilling && (
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Billing History & Invoices</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                View previous subscription receipts and download tax invoices for your records.
              </p>
            </div>
          </div>

          {isLoadingInvoices ? (
            <div className="space-y-2 py-3">
              <div className="h-10 bg-muted/50 rounded-lg animate-pulse" />
              <div className="h-10 bg-muted/50 rounded-lg animate-pulse" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-border/80 rounded-xl space-y-2">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
              <p className="text-xs font-semibold text-muted-foreground">
                No past billing records found.
              </p>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                Invoices and payment receipts will appear here after your first paid billing cycle.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/30">
                    <th className="p-3 font-semibold text-muted-foreground">Date</th>
                    <th className="p-3 font-semibold text-muted-foreground">Invoice #</th>
                    <th className="p-3 font-semibold text-muted-foreground">Description</th>
                    <th className="p-3 font-semibold text-muted-foreground">Seats</th>
                    <th className="p-3 font-semibold text-muted-foreground">Amount</th>
                    <th className="p-3 font-semibold text-muted-foreground">Status</th>
                    <th className="p-3 font-semibold text-muted-foreground text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-medium text-foreground">{inv.date}</td>
                      <td className="p-3 font-mono text-[11px] text-muted-foreground">{inv.invoiceNumber}</td>
                      <td className="p-3 text-foreground">{inv.description}</td>
                      <td className="p-3 text-foreground">{inv.seats} seats</td>
                      <td className="p-3 font-bold text-foreground">
                        ₹{inv.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toast.info(`Invoice ${inv.invoiceNumber} is being prepared for download.`)}
                          className="h-7 text-xs font-semibold gap-1 text-primary hover:text-primary"
                        >
                          <Download className="w-3 h-3" />
                          <span>View Invoice</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. QUICK LINK TO FULL PRICING MATRIX */}
      <div className="p-4 rounded-xl border border-border/80 bg-muted/20 flex items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-foreground">
            Looking for full feature comparisons across all plans?
          </h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Compare plans, limits, and capabilities side-by-side.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/upgrade")}
          className="text-xs font-bold gap-1 shrink-0 border-border"
        >
          <span>View Plans & Upgrade</span>
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
