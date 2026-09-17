"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Receipt,
  TrendingUp,
  CreditCard,
  IndianRupee,
  Clock,
  Settings,
  Plus,
  Layers,
  Users,
  Download,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  fetchPlatformBillingOverview,
  fetchPlatformSubscriptions,
  fetchPlatformInvoices,
  createOrUpdatePlatformSubscription,
  processPlatformRefund,
  fetchPlatformBillingSettings,
  updatePlatformBillingSettings,
  fetchPlatformOrganizations,
  PlatformBillingOverviewData,
  PlatformSubscriptionItem,
  PlatformInvoiceItemData,
  PlatformOrganization,
  PlatformBillingSettingsData,
} from "@/shared/lib/api/super-admin.api";
import { useCurrency } from "@/shared/hooks/use-currency";
import { toast } from "sonner";
import {
  CRMPageContainer,
  CRMPageHeader,
  CRMMetricsGrid,
  CRMMetricCard,
} from "@/shared/components/crm";
import { useIsClient } from "@/shared/hooks/use-is-client";

import {
  exportInvoicesToCSV,
  exportSubscriptionsToCSV,
} from "./utils/billing-formatters.util";
import { BillingOverviewTab } from "./components/BillingOverviewTab";
import { BillingSubscriptionsTab } from "./components/BillingSubscriptionsTab";
import { BillingInvoicesTab } from "./components/BillingInvoicesTab";
import { BillingSettingsTab } from "./components/BillingSettingsTab";
import { BillingSubscriptionModal } from "./components/BillingSubscriptionModal";
import { BillingRefundModal } from "./components/BillingRefundModal";
import { BillingInvoiceViewModal } from "./components/BillingInvoiceViewModal";

export default function PlatformBillingAdminPage() {
  const router = useRouter();
  const { formatCurrency } = useCurrency();

  const [activeTab, setActiveTab] = useState<"overview" | "subscriptions" | "invoices" | "settings">("overview");
  const [loading, setLoading] = useState(true);
  const isClient = useIsClient();

  // Data States
  const [overview, setOverview] = useState<PlatformBillingOverviewData | null>(null);
  const [subscriptions, setSubscriptions] = useState<PlatformSubscriptionItem[]>([]);
  const [invoices, setInvoices] = useState<PlatformInvoiceItemData[]>([]);
  const [organizations, setOrganizations] = useState<PlatformOrganization[]>([]);
  const [configForm, setConfigForm] = useState<Partial<PlatformBillingSettingsData>>({});
  const [savingConfig, setSavingConfig] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  // Subscriptions Table Filter & Sort
  const [subSearch, setSubSearch] = useState("");
  const [subStatusFilter, setSubStatusFilter] = useState("all");
  const [subPlanFilter, setSubPlanFilter] = useState("all");
  const [subPage, setSubPage] = useState(1);
  const [subRowsPerPage, setSubRowsPerPage] = useState(10);
  const [subSortConfig, setSubSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  // Invoices Table Filter & Sort
  const [invSearch, setInvSearch] = useState("");
  const [invStatusFilter, setInvStatusFilter] = useState("all");
  const [invPage, setInvPage] = useState(1);
  const [invRowsPerPage, setInvRowsPerPage] = useState(10);
  const [invSortConfig, setInvSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  // Modals
  const [isCreateSubModalOpen, setIsCreateSubModalOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("growth");
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [selectedSeats, setSelectedSeats] = useState<number>(5);
  const [isSubmittingSub, setIsSubmittingSub] = useState(false);

  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundTargetInvoice, setRefundTargetInvoice] = useState<PlatformInvoiceItemData | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState("");
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  const [viewInvoiceModalOpen, setViewInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PlatformInvoiceItemData | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ovData, subData, invData, cfgData, orgsData] = await Promise.all([
        fetchPlatformBillingOverview().catch(() => null),
        fetchPlatformSubscriptions({ limit: 1000 }).catch(() => ({ subscriptions: [], pagination: { total: 0 } })),
        fetchPlatformInvoices({ limit: 1000 }).catch(() => ({ invoices: [], pagination: { total: 0 } })),
        fetchPlatformBillingSettings().catch(() => ({})),
        fetchPlatformOrganizations({ limit: 1000 }).catch(() => ({ organizations: [] })),
      ]);

      if (ovData) setOverview(ovData);
      setSubscriptions(subData?.subscriptions || []);
      setInvoices(invData?.invoices || []);
      setConfigForm(cfgData || {});
      setOrganizations(orgsData?.organizations || []);
    } catch (err: unknown) {
      const errorMsg = (err as { message?: string })?.message || "Failed to load platform billing data";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    const run = async () => {
      try {
        await loadData();
      } catch {
        // Handled inside loadData
      }
    };
    run();

    const handleAal2Verified = () => {
      if (isCancelled) return;
      loadData();
    };
    window.addEventListener("clixpro:aal2-verified", handleAal2Verified);
    return () => {
      isCancelled = true;
      window.removeEventListener("clixpro:aal2-verified", handleAal2Verified);
    };
  }, []);

  // Handle Subscription Create / Update Submit
  const handleCreateSubscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId) {
      toast.error("Please select a workspace / organization.");
      return;
    }

    try {
      setIsSubmittingSub(true);
      await createOrUpdatePlatformSubscription({
        tenantId: selectedTenantId,
        planId: selectedPlanId,
        billingCycle: selectedBillingCycle,
        seats: Number(selectedSeats) || 1,
        status: "ACTIVE",
      });
      toast.success("Subscription configured successfully!");
      setIsCreateSubModalOpen(false);
      setSelectedTenantId("");
      loadData();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Failed to configure subscription";
      toast.error(errorMsg);
    } finally {
      setIsSubmittingSub(false);
    }
  };

  // Handle Refund Submit
  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTargetInvoice) return;

    if (refundAmount <= 0) {
      toast.error("Refund amount must be greater than 0.");
      return;
    }
    if (refundAmount > refundTargetInvoice.paidAmount) {
      toast.error("Refund cannot exceed paid amount.");
      return;
    }

    try {
      setIsProcessingRefund(true);
      await processPlatformRefund(refundTargetInvoice.id, {
        amount: Number(refundAmount),
        reason: refundReason.trim() || "Customer requested refund",
      });
      toast.success("Refund processed successfully!");
      setIsRefundModalOpen(false);
      setRefundTargetInvoice(null);
      setRefundReason("");
      loadData();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Failed to process refund";
      toast.error(errorMsg);
    } finally {
      setIsProcessingRefund(false);
    }
  };

  // Handle Save Billing Settings
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingConfig(true);
      await updatePlatformBillingSettings(configForm);
      toast.success("Platform billing configuration updated successfully!");
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Failed to update configuration";
      toast.error(errorMsg);
    } finally {
      setSavingConfig(false);
    }
  };

  // Export CSV Handler
  const exportCSV = () => {
    if (activeTab === "invoices") {
      exportInvoicesToCSV(invoices);
    } else {
      exportSubscriptionsToCSV(subscriptions);
    }
  };

  // Filtered & Sorted Subscriptions
  const filteredSubscriptions = useMemo(() => {
    let list = [...subscriptions];
    if (subSearch.trim()) {
      const q = subSearch.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.tenantName?.toLowerCase().includes(q) ||
          s.planName?.toLowerCase().includes(q) ||
          s.planId?.toLowerCase().includes(q)
      );
    }
    if (subStatusFilter !== "all") {
      list = list.filter((s) => s.status?.toLowerCase() === subStatusFilter.toLowerCase());
    }
    if (subPlanFilter !== "all") {
      list = list.filter((s) => s.planId?.toLowerCase() === subPlanFilter.toLowerCase());
    }

    if (subSortConfig) {
      const key = subSortConfig.key as keyof PlatformSubscriptionItem;
      list.sort((a, b) => {
        let valA: unknown = a[key];
        let valB: unknown = b[key];
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();
        if (String(valA ?? "") < String(valB ?? "")) return subSortConfig.direction === "asc" ? -1 : 1;
        if (String(valA ?? "") > String(valB ?? "")) return subSortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [subscriptions, subSearch, subStatusFilter, subPlanFilter, subSortConfig]);

  const totalSubPages = Math.max(1, Math.ceil(filteredSubscriptions.length / subRowsPerPage));
  const paginatedSubscriptions = useMemo(() => {
    return filteredSubscriptions.slice((subPage - 1) * subRowsPerPage, subPage * subRowsPerPage);
  }, [filteredSubscriptions, subPage, subRowsPerPage]);

  // Filtered & Sorted Invoices
  const filteredInvoices = useMemo(() => {
    let list = [...invoices];
    if (invSearch.trim()) {
      const q = invSearch.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.invoiceNumber?.toLowerCase().includes(q) ||
          i.tenantName?.toLowerCase().includes(q) ||
          i.planName?.toLowerCase().includes(q)
      );
    }
    if (invStatusFilter !== "all") {
      if (invStatusFilter === "refunded") {
        list = list.filter((i) => i.status === "REFUNDED" || i.paymentStatus === "REFUNDED");
      } else if (invStatusFilter === "paid") {
        list = list.filter((i) => i.paymentStatus === "PAID" && i.status !== "REFUNDED");
      } else if (invStatusFilter === "pending") {
        list = list.filter((i) => i.paymentStatus === "PENDING" || i.status === "PENDING");
      }
    }

    if (invSortConfig) {
      const key = invSortConfig.key as keyof PlatformInvoiceItemData;
      list.sort((a, b) => {
        let valA: unknown = a[key];
        let valB: unknown = b[key];
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();
        if (String(valA ?? "") < String(valB ?? "")) return invSortConfig.direction === "asc" ? -1 : 1;
        if (String(valA ?? "") > String(valB ?? "")) return invSortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [invoices, invSearch, invStatusFilter, invSortConfig]);

  const totalInvPages = Math.max(1, Math.ceil(filteredInvoices.length / invRowsPerPage));
  const paginatedInvoices = useMemo(() => {
    return filteredInvoices.slice((invPage - 1) * invRowsPerPage, invPage * invRowsPerPage);
  }, [filteredInvoices, invPage, invRowsPerPage]);

  const totalWorkspacesCount = organizations.length || overview?.kpis?.totalOrganizations || 0;
  const paidSubsCount = overview?.kpis?.paidSubscriptions ?? (overview?.kpis?.activeSubscriptions && overview.planDistribution?.some(p => p.name.toLowerCase() !== 'free' && p.count > 0) ? overview.kpis.activeSubscriptions : 0);

  const kpis = {
    mrr: overview?.kpis?.mrr || 0,
    arr: overview?.kpis?.arr || 0,
    totalRevenue: overview?.kpis?.totalRevenue || 0,
    paidRevenue: overview?.kpis?.paidRevenue || 0,
    pendingRevenue: overview?.kpis?.pendingRevenue || 0,
    pendingInvoicesCount: overview?.kpis?.pendingInvoicesCount || invoices.filter((i) => i.paymentStatus === "PENDING" || i.status === "PENDING").length,
    overdueRevenue: overview?.kpis?.overdueRevenue || 0,
    totalRefunds: overview?.kpis?.totalRefunds || 0,
    paidSubscriptions: paidSubsCount,
    totalSubscriptions: subscriptions.length || totalWorkspacesCount,
    totalOrganizations: totalWorkspacesCount,
  };

  // Canonical plans array for distribution
  const planDistribution = useMemo(() => {
    if (overview?.planDistribution && overview.planDistribution.length > 0) {
      return overview.planDistribution;
    }
    return [
      { name: "Free", count: totalWorkspacesCount || 0, revenue: 0, percentage: 100 },
      { name: "Starter", count: 0, revenue: 0, percentage: 0 },
      { name: "Growth", count: 0, revenue: 0, percentage: 0 },
    ];
  }, [overview, totalWorkspacesCount]);

  // Safe trend series for Recharts
  const trendData = useMemo(() => {
    if (overview?.monthlyTrend && overview.monthlyTrend.length > 0) {
      return overview.monthlyTrend.map((m) => ({
        month: m.month,
        revenue: m.revenue,
        projected: m.revenue > 0 ? m.revenue : (kpis.mrr || 0),
        invoices: m.invoicesCount,
      }));
    }
    const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];
    return months.map((m) => ({
      month: m,
      revenue: 0,
      projected: 0,
      invoices: 0,
    }));
  }, [overview, kpis.mrr]);

  const handleOpenCreateSub = () => {
    setSelectedTenantId("");
    setSelectedPlanId("growth");
    setSelectedBillingCycle("monthly");
    setSelectedSeats(5);
    setIsCreateSubModalOpen(true);
  };

  const handleEditSubscription = (sub: PlatformSubscriptionItem) => {
    setSelectedTenantId(sub.tenantId);
    setSelectedPlanId(sub.planId || "growth");
    setSelectedBillingCycle((sub.billingCycle as "monthly" | "annual") || "monthly");
    setSelectedSeats(sub.seats || 5);
    setIsCreateSubModalOpen(true);
  };

  const handleRefundInvoice = (inv: PlatformInvoiceItemData) => {
    setRefundTargetInvoice(inv);
    setRefundAmount(inv.paidAmount);
    setIsRefundModalOpen(true);
  };

  const handleViewInvoice = (inv: PlatformInvoiceItemData) => {
    setSelectedInvoice(inv);
    setViewInvoiceModalOpen(true);
  };

  return (
    <CRMPageContainer>
      {/* 1. Standard CRM Page Header */}
      <CRMPageHeader
        title="Billing & Revenue"
        subtitle="Manage recurring subscriptions, platform SaaS invoices, gateway payouts, and legal configuration."
        icon={CreditCard}
        badge="Platform SaaS Billing"
        actions={[
          {
            label: "Export CSV",
            icon: Download,
            onClick: exportCSV,
            variant: "outline",
          },
          {
            label: "Configure Plans",
            icon: Layers,
            onClick: () => router.push("/super-admin/plans"),
            variant: "outline",
          },
          {
            label: "New Subscription",
            icon: Plus,
            onClick: handleOpenCreateSub,
            variant: "default",
          },
        ]}
      />

      {/* 2. Global Metric Cards */}
      <div className="shrink-0">
        <CRMMetricsGrid cols={4}>
          <CRMMetricCard
            title="Monthly Recurring Revenue (MRR)"
            value={formatCurrency(kpis.mrr)}
            comparisonText="Predictable recurring run-rate"
            trend={kpis.mrr > 0 ? "up" : "neutral"}
            icon={IndianRupee}
            color="emerald"
            loading={loading}
          />
          <CRMMetricCard
            title="Annualized Run Rate (ARR)"
            value={formatCurrency(kpis.arr)}
            comparisonText={`Across ${totalWorkspacesCount} total workspaces`}
            trend={kpis.arr > 0 ? "up" : "neutral"}
            icon={TrendingUp}
            color="indigo"
            loading={loading}
          />
          <CRMMetricCard
            title="Paid Subscriptions"
            value={`${kpis.paidSubscriptions} / ${totalWorkspacesCount}`}
            comparisonText={totalWorkspacesCount > 0 ? `${Math.round((kpis.paidSubscriptions / totalWorkspacesCount) * 100)}% paid penetration` : "0% paid"}
            trend={kpis.paidSubscriptions > 0 ? "up" : "neutral"}
            icon={Users}
            color="blue"
            loading={loading}
          />
          <CRMMetricCard
            title="Outstanding Invoices"
            value={formatCurrency(kpis.pendingRevenue)}
            comparisonText={`${kpis.pendingInvoicesCount} invoices pending payment`}
            trend={kpis.pendingRevenue > 0 ? "down" : "neutral"}
            icon={Clock}
            color="orange"
            loading={loading}
          />
        </CRMMetricsGrid>
      </div>

      {/* 3. Global Navigation Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap border-b border-border/70 pb-3">
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/80 text-xs font-semibold">
          {[
            { id: "overview", label: "Revenue Overview", icon: TrendingUp },
            { id: "subscriptions", label: "Subscriptions", icon: CreditCard, count: subscriptions.length || totalWorkspacesCount },
            { id: "invoices", label: "Platform Invoices", icon: Receipt, count: invoices.length },
            { id: "settings", label: "Billing Config", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "overview" | "subscriptions" | "invoices" | "settings")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-card text-foreground shadow-xs font-bold border border-border/50"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isCurrent
                        ? "bg-primary/10 text-primary font-bold"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "subscriptions" && (
            <Button
              size="sm"
              variant="default"
              onClick={handleOpenCreateSub}
              className="h-8 px-3 text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> New Subscription
            </Button>
          )}
        </div>
      </div>

      {/* TAB 1: REVENUE OVERVIEW */}
      {activeTab === "overview" && (
        <BillingOverviewTab
          kpis={kpis}
          totalWorkspacesCount={totalWorkspacesCount}
          invoicesCount={invoices.length}
          configForm={configForm}
          planDistribution={planDistribution}
          trendData={trendData}
          isClient={isClient}
          formatCurrency={formatCurrency}
          onNavigatePlans={() => router.push("/super-admin/plans")}
          onNewSubscription={handleOpenCreateSub}
        />
      )}

      {/* TAB 2: SUBSCRIPTIONS TABLE */}
      {activeTab === "subscriptions" && (
        <BillingSubscriptionsTab
          loading={loading}
          subSearch={subSearch}
          setSubSearch={setSubSearch}
          subStatusFilter={subStatusFilter}
          setSubStatusFilter={setSubStatusFilter}
          subPlanFilter={subPlanFilter}
          setSubPlanFilter={setSubPlanFilter}
          subPage={subPage}
          setSubPage={setSubPage}
          subRowsPerPage={subRowsPerPage}
          setSubRowsPerPage={setSubRowsPerPage}
          subSortConfig={subSortConfig}
          setSubSortConfig={setSubSortConfig}
          filteredSubscriptions={filteredSubscriptions}
          paginatedSubscriptions={paginatedSubscriptions}
          totalSubPages={totalSubPages}
          formatCurrency={formatCurrency}
          onEditSubscription={handleEditSubscription}
          onCreateSubscription={handleOpenCreateSub}
        />
      )}

      {/* TAB 3: PLATFORM INVOICES TABLE */}
      {activeTab === "invoices" && (
        <BillingInvoicesTab
          loading={loading}
          invSearch={invSearch}
          setInvSearch={setInvSearch}
          invStatusFilter={invStatusFilter}
          setInvStatusFilter={setInvStatusFilter}
          invPage={invPage}
          setInvPage={setInvPage}
          invRowsPerPage={invRowsPerPage}
          setInvRowsPerPage={setInvRowsPerPage}
          invSortConfig={invSortConfig}
          setInvSortConfig={setInvSortConfig}
          filteredInvoices={filteredInvoices}
          paginatedInvoices={paginatedInvoices}
          totalInvPages={totalInvPages}
          formatCurrency={formatCurrency}
          onViewInvoice={handleViewInvoice}
          onRefundInvoice={handleRefundInvoice}
        />
      )}

      {/* TAB 4: BILLING CONFIGURATION */}
      {activeTab === "settings" && (
        <BillingSettingsTab
          configForm={configForm}
          setConfigForm={setConfigForm}
          savingConfig={savingConfig}
          showAccountNumber={showAccountNumber}
          setShowAccountNumber={setShowAccountNumber}
          onSaveConfig={handleSaveConfig}
        />
      )}

      {/* CREATE / CONFIGURE SUBSCRIPTION MODAL */}
      <BillingSubscriptionModal
        open={isCreateSubModalOpen}
        onClose={() => setIsCreateSubModalOpen(false)}
        onSubmit={handleCreateSubscriptionSubmit}
        selectedTenantId={selectedTenantId}
        setSelectedTenantId={setSelectedTenantId}
        selectedPlanId={selectedPlanId}
        setSelectedPlanId={setSelectedPlanId}
        selectedBillingCycle={selectedBillingCycle}
        setSelectedBillingCycle={setSelectedBillingCycle}
        selectedSeats={selectedSeats}
        setSelectedSeats={setSelectedSeats}
        organizations={organizations}
        isSubmitting={isSubmittingSub}
      />

      {/* PLATFORM REFUND MODAL */}
      <BillingRefundModal
        open={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        onSubmit={handleRefundSubmit}
        refundTargetInvoice={refundTargetInvoice}
        refundAmount={refundAmount}
        setRefundAmount={setRefundAmount}
        refundReason={refundReason}
        setRefundReason={setRefundReason}
        isProcessing={isProcessingRefund}
        formatCurrency={formatCurrency}
      />

      {/* VIEW INVOICE PREVIEW MODAL */}
      <BillingInvoiceViewModal
        open={viewInvoiceModalOpen}
        onClose={() => setViewInvoiceModalOpen(false)}
        selectedInvoice={selectedInvoice}
        formatCurrency={formatCurrency}
      />
    </CRMPageContainer>
  );
}
