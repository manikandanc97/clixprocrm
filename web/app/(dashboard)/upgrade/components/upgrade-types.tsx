"use client";

import React from "react";
import {
  Sparkles,
  Users,
  Shield,
  Zap,
  Crown,
  Check,
} from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { CRMPageContainer, CRMPageHeader } from "@/shared/components/crm";

export interface RazorpayPaymentResponse {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

export interface RazorpayPaymentFailedResponse {
  error?: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  };
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes: Record<string, string | undefined>;
  theme: { color: string };
  modal: {
    ondismiss: () => void;
  };
  handler: (response: RazorpayPaymentResponse) => Promise<void> | void;
  [key: string]: unknown;
}

export interface QuoteDetails {
  unitPricePerMonth: number;
  subtotal: number;
  annualDiscountAmount: number;
  taxAmount: number;
  totalAmount: number;
  intervalDescription: string;
}

export function filterPureFeatures(features: string[]): string[] {
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

export function getTierTheme(planId: string, isPopular: boolean) {
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
}

export function renderMatrixCell(val: unknown) {
  if (typeof val === "boolean") {
    return val ? (
      <div className="inline-flex p-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
      </div>
    ) : (
      <span className="text-muted-foreground/40 font-bold">—</span>
    );
  }
  if (typeof val === "string") {
    return <span className="font-semibold text-foreground">{val}</span>;
  }
  if (val && typeof val === "object") {
    return <span className="font-semibold text-foreground">{JSON.stringify(val)}</span>;
  }
  return <span className="text-muted-foreground/40 font-bold">—</span>;
}

export function UpgradePageSkeleton() {
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
            <Skeleton className="h-9 w-32 rounded-xl" />
            <Skeleton className="h-9 w-40 rounded-xl" />
          </div>
          <Skeleton className="h-3 w-72 rounded-md" />
        </div>

        {/* PRICING CARDS GRID SKELETON */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch w-full pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-xs relative"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="h-9 w-9 rounded-xl" />
                    <div>
                      <Skeleton className="h-4 w-24 rounded-md mb-1" />
                      <Skeleton className="h-3 w-32 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>

                <Skeleton className="h-8 w-full rounded-md mb-4" />

                <div className="py-3.5 border-y border-border/60 -mx-6 px-6 mb-4">
                  <Skeleton className="h-8 w-28 rounded-md mb-1" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                </div>

                <div className="grid grid-cols-2 gap-1.5 mb-4">
                  <Skeleton className="h-7 rounded-lg" />
                  <Skeleton className="h-7 rounded-lg" />
                  <Skeleton className="h-7 rounded-lg" />
                  <Skeleton className="h-7 rounded-lg" />
                </div>

                <div className="space-y-2 mb-4">
                  <Skeleton className="h-3 w-28 rounded-md mb-2" />
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="flex items-center gap-2">
                      <Skeleton className="h-3.5 w-3.5 rounded-full" />
                      <Skeleton className="h-3.5 w-full rounded-md" />
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
