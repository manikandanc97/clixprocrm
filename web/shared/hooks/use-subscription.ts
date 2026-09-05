"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import api from "@/shared/lib/api/client";
import {
  CANONICAL_PLANS,
  getPlanDefinition,
  hasPlanFeature,
  normalizePlanId,
  MatrixCategory,
  PlanDefinition,
  PlanLimits,
} from "@/shared/lib/plans/plan-definitions";
import { CRM_ROLES, normalizeRole } from "@/shared/lib/auth/rbac";
import { useAuth } from "@/features/auth/components/auth-provider";
import { toast } from "sonner";

export interface WorkspaceUsageStats {
  users: { current: number; limit: number; remaining: number; percentage: number; isLimitReached: boolean };
  contacts: { current: number; limit: number; remaining: number; percentage: number; isLimitReached: boolean };
  leads: { current: number; limit: number; remaining: number; percentage: number; isLimitReached: boolean };
  tasks?: { current: number; limit: number; remaining: number; percentage: number; isLimitReached: boolean };
  pipelines?: { current: number; limit: number; remaining: number; percentage: number; isLimitReached: boolean };
  customFields?: { current: number; limit: number; remaining: number; percentage: number; isLimitReached: boolean };
  deals?: { current: number; limit: number; remaining: number; percentage: number; isLimitReached: boolean };
  automations?: { current: number; limit: number; remaining: number; percentage: number; isLimitReached: boolean };
  storageGb?: { current: number; limit: number; remaining: number; percentage: number; isLimitReached: boolean };
  apiRequests?: { current: number; limit: number; remaining: number; percentage: number; isLimitReached: boolean };
}

export interface WorkspaceSubscriptionResponse {
  tenantId: string;
  tenantName: string;
  planId: string;
  planName: string;
  status: string;
  billingCycle: "monthly" | "annual";
  trialStart?: string | null;
  trialEnd?: string | null;
  trialDaysRemaining?: number | null;
  currentPeriodEnd?: string | null;
  currency: string;
  seats: number;
  activeUsers: number;
  monthlyPricePerUser: number;
  annualPricePerUser: number;
  totalRecurringAmount: number;
  plan: PlanDefinition;
  usage: WorkspaceUsageStats;
  entitledFeatures: string[];
  availablePlans: PlanDefinition[];
  comparisonMatrix?: MatrixCategory[];
}

export interface SubscriptionQuote {
  planId: string;
  planName: string;
  seats: number;
  billingCycle: "monthly" | "annual";
  currency: string;
  unitPricePerMonth: number;
  subtotal: number;
  annualDiscountPercentage: number;
  annualDiscountAmount: number;
  taxRatePercentage: number;
  taxAmount: number;
  totalAmount: number;
  recurringAmount: number;
  intervalDescription: string;
  isUpgrade: boolean;
  isDowngrade: boolean;
  effectiveImmediately: boolean;
}

export interface BillingInvoiceItem {
  id: string;
  invoiceNumber: string;
  date: string;
  description: string;
  planName: string;
  seats: number;
  amount: number;
  currency: string;
  status: "PAID" | "PENDING" | "FAILED" | "REFUNDED";
  downloadUrl?: string | null;
}

export function useSubscription() {
  const queryClient = useQueryClient();
  const { isAuthenticated, user, access } = useAuth();
  const [upgradeModalState, setUpgradeModalState] = useState<{
    isOpen: boolean;
    featureName?: string;
    targetPlan?: string;
  }>({
    isOpen: false,
  });

  const roleKey = normalizeRole(user?.role || access?.roleName);
  const isSuperAdmin =
    roleKey === CRM_ROLES.SUPER_ADMIN ||
    user?.role === "SUPER_ADMIN" ||
    (user as any)?.isSuperAdmin === true;
  const userRole = (user?.role || access?.roleName || "").toUpperCase();
  // Billing management requires ADMIN or organization owner
  const canManageBilling =
    isSuperAdmin ||
    roleKey === CRM_ROLES.ADMIN ||
    userRole === "ADMIN" ||
    userRole === "ORG_ADMIN" ||
    userRole === "OWNER" ||
    (user as any)?.isOrgOwner === true ||
    (user as any)?.isOrgAdmin === true;

  const query = useQuery<WorkspaceSubscriptionResponse>({
    queryKey: ["workspace", "subscription"],
    queryFn: async () => {
      const res = await api.get("/crm/subscription");
      return res.data?.data;
    },
    enabled: !!isAuthenticated && !isSuperAdmin,
    staleTime: 30 * 1000,
  });

  const invoicesQuery = useQuery<BillingInvoiceItem[]>({
    queryKey: ["workspace", "subscription", "invoices"],
    queryFn: async () => {
      const res = await api.get("/crm/subscription/invoices");
      return res.data?.data || [];
    },
    enabled: !!isAuthenticated && !isSuperAdmin && canManageBilling,
    staleTime: 60 * 1000,
  });

  const activePlanId = normalizePlanId(query.data?.planId || "free");
  const currentPlan = query.data?.plan || getPlanDefinition(activePlanId);
  const entitledFeatures = query.data?.entitledFeatures;
  const usage = query.data?.usage;

  const hasFeature = useCallback(
    (featureKey: string): boolean => {
      if (isSuperAdmin) return true;
      if (entitledFeatures) {
        return entitledFeatures.includes(featureKey);
      }
      return hasPlanFeature(activePlanId, featureKey);
    },
    [isSuperAdmin, entitledFeatures, activePlanId]
  );

  const canAccess = hasFeature;

  const getPlanLimit = useCallback(
    (limitKey: keyof PlanLimits): number => {
      if (isSuperAdmin) return -1;
      return currentPlan.limits?.[limitKey] ?? -1;
    },
    [isSuperAdmin, currentPlan]
  );

  const canUseLimit = useCallback(
    (limitKey: keyof PlanLimits): boolean => {
      if (isSuperAdmin) return true;
      const val = currentPlan.limits?.[limitKey];
      if (val === -1) return true;
      const usageKey = limitKey === "maxUsers"
        ? "users"
        : limitKey === "maxContacts"
        ? "contacts"
        : limitKey === "maxLeads"
        ? "leads"
        : limitKey === "maxDeals"
        ? "deals"
        : limitKey === "maxAutomations"
        ? "automations"
        : null;

      if (usageKey && usage?.[usageKey]) {
        return !usage[usageKey].isLimitReached;
      }
      return true;
    },
    [isSuperAdmin, currentPlan, usage]
  );

  const isLimitReached = useCallback(
    (limitKey: keyof PlanLimits): boolean => {
      return !canUseLimit(limitKey);
    },
    [canUseLimit]
  );

  const calculateQuote = useCallback(
    async (params: {
      planId: string;
      seats?: number;
      billingCycle?: "monthly" | "annual";
    }): Promise<SubscriptionQuote> => {
      const res = await api.post("/crm/subscription/quote", params);
      return res.data?.data;
    },
    []
  );

  const createCheckoutOrder = useCallback(
    async (params: {
      planId: string;
      seats?: number;
      billingCycle?: "monthly" | "annual";
    }): Promise<{ quote: SubscriptionQuote; order: any }> => {
      const res = await api.post("/crm/subscription/create-checkout-order", params);
      return res.data?.data;
    },
    []
  );

  const verifyPaymentMutation = useMutation({
    mutationFn: async (payload: {
      orderId: string;
      paymentId: string;
      signature: string;
      planId: string;
      billingCycle?: "monthly" | "annual";
      seats?: number;
    }) => {
      const res = await api.post("/crm/subscription/verify-payment", payload);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", "subscription"] });
      queryClient.invalidateQueries({ queryKey: ["workspace", "subscription", "invoices"] });
      toast.success("Payment verified and plan activated successfully!");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to verify payment.";
      toast.error(msg);
    },
  });

  const switchCycleMutation = useMutation({
    mutationFn: async (billingCycle: "monthly" | "annual") => {
      const res = await api.post("/crm/subscription/switch-cycle", { billingCycle });
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", "subscription"] });
      toast.success("Billing cycle updated.");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to switch billing cycle.";
      toast.error(msg);
    },
  });

  const changePlanMutation = useMutation({
    mutationFn: async ({
      planId,
      billingCycle = "monthly",
      seats,
    }: {
      planId: string;
      billingCycle?: "monthly" | "annual";
      seats?: number;
    }) => {
      const res = await api.post("/crm/subscription/change-plan", {
        planId,
        billingCycle,
        seats,
      });
      return res.data?.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["workspace", "subscription"], data);
      queryClient.invalidateQueries({ queryKey: ["workspace"] });
      toast.success(`Plan updated to ${data.planName} successfully!`);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to update subscription.";
      toast.error(msg);
    },
  });

  const contactSalesMutation = useMutation({
    mutationFn: async (details: { message?: string; teamSize?: string; phone?: string }) => {
      const res = await api.post("/crm/subscription/contact-sales", details);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Thank you! Our enterprise sales team will contact you shortly.");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to submit inquiry.";
      toast.error(msg);
    },
  });

  const openUpgradeModal = useCallback((featureName?: string, targetPlan?: string) => {
    setUpgradeModalState({
      isOpen: true,
      featureName,
      targetPlan,
    });
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setUpgradeModalState({ isOpen: false });
  }, []);

  return {
    ...query,
    subscription: query.data,
    plan: currentPlan,
    activePlanId,
    usage: query.data?.usage,
    availablePlans: query.data?.availablePlans || (query.isLoading ? [] : Object.values(CANONICAL_PLANS)),
    comparisonMatrix: query.data?.comparisonMatrix || [],
    invoices: invoicesQuery.data || [],
    isLoadingInvoices: invoicesQuery.isLoading,
    canManageBilling,
    hasFeature,
    canAccess,
    getPlanLimit,
    canUseLimit,
    isLimitReached,
    calculateQuote,
    createCheckoutOrder,
    verifyPayment: verifyPaymentMutation.mutateAsync,
    isVerifyingPayment: verifyPaymentMutation.isPending,
    switchCycle: switchCycleMutation.mutateAsync,
    isSwitchingCycle: switchCycleMutation.isPending,
    changePlan: changePlanMutation.mutateAsync,
    isChangingPlan: changePlanMutation.isPending,
    contactSales: contactSalesMutation.mutateAsync,
    isSubmittingInquiry: contactSalesMutation.isPending,
    upgradeModalState,
    openUpgradeModal,
    closeUpgradeModal,
  };
}


