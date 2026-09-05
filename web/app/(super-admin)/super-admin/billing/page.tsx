"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Receipt,
  TrendingUp,
  CreditCard,
  Building2,
  IndianRupee,
  CheckCircle2,
  Clock,
  RotateCcw,
  Settings,
  Plus,
  Shield,
  Layers,
  Sparkles,
  Users,
  Download,
  Save,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Briefcase,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

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
} from "@/shared/lib/api/super-admin.api";
import { useCurrency } from "@/shared/hooks/use-currency";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  CRMPageContainer,
  CRMPageHeader,
  CRMMetricsGrid,
  CRMMetricCard,
  CRMToolbar,
  CRMPagination,
  TruncatedText,
  EmptyState,
} from "@/shared/components/crm";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { PlanBadge } from "@/shared/components/PlanBadge";
import { DataTableColumnHeader } from "@/shared/components/DataTableColumnHeader";
import { getOrgAvatarColor } from "@/shared/utils/avatar-colors";
import { cn } from "@/shared/lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";

export default function SuperAdminBillingPage() {
  const router = useRouter();
  const { formatCurrency } = useCurrency();

  const [activeTab, setActiveTab] = useState<"overview" | "subscriptions" | "invoices" | "settings">("overview");
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Data States
  const [overview, setOverview] = useState<PlatformBillingOverviewData | null>(null);
  const [subscriptions, setSubscriptions] = useState<PlatformSubscriptionItem[]>([]);
  const [invoices, setInvoices] = useState<PlatformInvoiceItemData[]>([]);
  const [organizations, setOrganizations] = useState<PlatformOrganization[]>([]);
  const [configForm, setConfigForm] = useState<any>({});
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

  useEffect(() => {
    setIsClient(true);
  }, []);

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
    } catch (err: any) {
      toast.error(err.message || "Failed to load platform billing data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleAal2Verified = () => {
      loadData();
    };
    window.addEventListener("clixpro:aal2-verified", handleAal2Verified);
    return () => {
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
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to configure subscription");
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
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to process refund");
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
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update configuration");
    } finally {
      setSavingConfig(false);
    }
  };

  // Export CSV Helper
  const exportCSV = () => {
    try {
      if (activeTab === "invoices") {
        const rows = [
          ["Invoice Number", "Organization", "Plan", "Seats", "Date", "Subtotal", "Tax", "Total Amount", "Paid Amount", "Status"],
          ...invoices.map((i) => [
            i.invoiceNumber,
            i.tenantName,
            i.planName,
            i.seats,
            new Date(i.invoiceDate).toLocaleDateString(),
            i.subtotal,
            i.taxAmount,
            i.totalAmount,
            i.paidAmount,
            i.status,
          ]),
        ];
        const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `platform_invoices_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Platform invoices exported to CSV.");
      } else {
        const rows = [
          ["Organization", "Plan", "Billing Cycle", "Seats", "Recurring Amount", "Next Renewal", "Status"],
          ...subscriptions.map((s) => [
            s.tenantName,
            s.planName || s.planId,
            s.billingCycle,
            s.seats,
            s.recurringAmount,
            new Date(s.currentPeriodEnd).toLocaleDateString(),
            s.status,
          ]),
        ];
        const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `platform_subscriptions_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Platform subscriptions exported to CSV.");
      }
    } catch {
      toast.error("Failed to export CSV.");
    }
  };

  // Helper Badge for Subscriptions
  const getSubStatusBadge = (st: string) => {
    switch (st?.toUpperCase()) {
      case "ACTIVE":
        return <StatusBadge status="ACTIVE" variant="emerald" />;
      case "TRIALING":
        return <StatusBadge status="TRIALING" variant="blue" />;
      case "PAST_DUE":
        return <StatusBadge status="PAST DUE" variant="rose" />;
      case "CANCELED":
      case "CANCELLED":
        return <StatusBadge status="CANCELED" variant="neutral" />;
      default:
        return <StatusBadge status={st || "UNKNOWN"} variant="neutral" />;
    }
  };

  // Helper Badge for Invoices
  const getInvStatusBadge = (st: string, paySt: string) => {
    if (st === "REFUNDED" || paySt === "REFUNDED") {
      return <StatusBadge status="REFUNDED" variant="purple" />;
    }
    switch (paySt?.toUpperCase()) {
      case "PAID":
        return <StatusBadge status="PAID" variant="emerald" />;
      case "PARTIALLY_REFUNDED":
        return <StatusBadge status="PARTIAL REFUND" variant="amber" />;
      case "PENDING":
        return <StatusBadge status="PENDING" variant="amber" />;
      case "FAILED":
      case "OVERDUE":
        return <StatusBadge status={paySt || "OVERDUE"} variant="rose" />;
      default:
        return <StatusBadge status={paySt || st || "UNPAID"} variant="neutral" />;
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
      list.sort((a, b) => {
        let valA = (a as any)[subSortConfig.key];
        let valB = (b as any)[subSortConfig.key];
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();
        if (valA < valB) return subSortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return subSortConfig.direction === "asc" ? 1 : -1;
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
      list.sort((a, b) => {
        let valA = (a as any)[invSortConfig.key];
        let valB = (b as any)[invSortConfig.key];
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();
        if (valA < valB) return invSortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return invSortConfig.direction === "asc" ? 1 : -1;
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

  return (
    <CRMPageContainer twoStageScroll>
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
            onClick: () => {
              setSelectedTenantId("");
              setSelectedPlanId("growth");
              setSelectedBillingCycle("monthly");
              setSelectedSeats(5);
              setIsCreateSubModalOpen(true);
            },
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
            change={kpis.mrr > 0 ? "Active recurring run-rate" : "No active recurring revenue"}
            trend={kpis.mrr > 0 ? "up" : "neutral"}
            icon={TrendingUp}
            color="indigo"
            loading={loading}
          />
          <CRMMetricCard
            title="Collected Revenue"
            value={formatCurrency(kpis.paidRevenue)}
            change="Settled billing data"
            trend={kpis.paidRevenue > 0 ? "up" : "neutral"}
            icon={IndianRupee}
            color="emerald"
            loading={loading}
          />
          <CRMMetricCard
            title="Paid Subscriptions"
            value={kpis.paidSubscriptions}
            change={`${kpis.paidSubscriptions} of ${totalWorkspacesCount} workspaces`}
            trend={kpis.paidSubscriptions > 0 ? "up" : "neutral"}
            icon={Users}
            color="blue"
            loading={loading}
          />
          <CRMMetricCard
            title="Outstanding Revenue"
            value={formatCurrency(kpis.pendingRevenue)}
            change={`${kpis.pendingInvoicesCount} pending ${kpis.pendingInvoicesCount === 1 ? "invoice" : "invoices"}`}
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
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
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
              onClick={() => setIsCreateSubModalOpen(true)}
              className="h-8 px-3 text-xs font-semibold gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> New Subscription
            </Button>
          )}
        </div>
      </div>

      {/* TAB 1: REVENUE OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Zero Data Onboarding Banner if total revenue is 0 */}
          {kpis.totalRevenue === 0 && (
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-4.5 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground">
                    Ready to scale platform billing across {totalWorkspacesCount} workspaces
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Currently all registered organizations are on the Free starter tier. Configure paid packages in Plans or assign workspaces to Growth or Business tiers to generate recurring revenue.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push("/super-admin/plans")}
                  className="h-8 px-3 text-xs font-semibold gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" /> Configure Plans
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedTenantId("");
                    setSelectedPlanId("growth");
                    setSelectedBillingCycle("monthly");
                    setSelectedSeats(5);
                    setIsCreateSubModalOpen(true);
                  }}
                  className="h-8 px-3 text-xs font-semibold gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> New Subscription
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Trend Visualizer */}
            <div className="lg:col-span-2 bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-foreground">
                      Monthly Platform Revenue Trend
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Historical SaaS recurring revenue and run-rate trajectory (6 Months)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                    MRR Trajectory
                  </span>
                </div>
              </div>

              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="rounded-xl bg-muted/40 border border-border/40 p-2.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">Current MRR</span>
                  <p className="text-sm sm:text-base font-bold font-mono text-foreground mt-0.5">
                    {formatCurrency(kpis.mrr)}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/40 border border-border/40 p-2.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">Projected ARR</span>
                  <p className="text-sm sm:text-base font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {formatCurrency(kpis.arr)}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/40 border border-border/40 p-2.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">Invoices Issued</span>
                  <p className="text-sm sm:text-base font-bold font-mono text-foreground mt-0.5">
                    {invoices.length}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/40 border border-border/40 p-2.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">Settlement Rate</span>
                  <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    100%
                  </p>
                </div>
              </div>

              {/* Chart Component / Empty State */}
              <div className="h-56 w-full pt-2">
                {isClient ? (
                  kpis.totalRevenue === 0 && kpis.mrr === 0 && !trendData.some((d) => d.revenue > 0) ? (
                    <div className="h-full w-full flex flex-col items-center justify-center rounded-xl bg-muted/10 border border-dashed border-border/60 p-6 text-center">
                      <div className="w-10 h-10 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-center text-muted-foreground/70 mb-2">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-foreground">No revenue recorded yet</h4>
                      <p className="text-xs text-muted-foreground max-w-sm mt-1">
                        Revenue trends will appear here once paid subscriptions begin.
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="billingRevGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                        <XAxis
                          dataKey="month"
                          stroke="var(--muted-foreground)"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="var(--muted-foreground)"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => `₹${val}`}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "var(--card)",
                            borderColor: "var(--border)",
                            borderRadius: "12px",
                            fontSize: "11px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          }}
                          formatter={(val: any) => [formatCurrency(Number(val)), "Revenue"]}
                          labelStyle={{ fontWeight: "bold", color: "var(--foreground)" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#6366f1"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#billingRevGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    Loading trend analytics...
                  </div>
                )}
              </div>
            </div>

            {/* Subscriptions by Plan */}
            <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-center border-b border-border/40 pb-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" /> Subscriptions by Plan
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tenant distribution across subscription tiers
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {totalWorkspacesCount} Workspaces
                  </span>
                </div>

                <div className="space-y-3.5 pt-4">
                  {planDistribution.map((p) => {
                    const pct = p.percentage || 0;
                    return (
                      <div
                        key={p.name}
                        className="p-3 rounded-xl bg-muted/20 border border-border/60 hover:bg-muted/30 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <PlanBadge plan={p.name} size="sm" />
                            <span className="text-xs font-bold text-foreground capitalize">{p.name} Tier</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-foreground">
                            {p.count} {p.count === 1 ? "org" : "orgs"}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden">
                          <div
                            style={{ width: `${Math.max(p.count > 0 ? 4 : 0, pct)}%` }}
                            className={`h-full rounded-full transition-all ${
                              p.name.toLowerCase() === "free"
                                ? "bg-slate-400 dark:bg-slate-600"
                                : p.name.toLowerCase() === "starter"
                                ? "bg-blue-500"
                                : p.name.toLowerCase() === "growth" || p.name.toLowerCase() === "pro"
                                ? "bg-emerald-500"
                                : p.name.toLowerCase() === "business"
                                ? "bg-indigo-500"
                                : "bg-amber-500"
                            }`}
                          />
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                          <span>{pct}% of total workspaces</span>
                          <span className="font-mono font-semibold text-foreground">
                            {formatCurrency(p.revenue)}/mo
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Paid Subscriptions</span>
                <span className="font-mono font-bold text-foreground">
                  {kpis.paidSubscriptions} of {totalWorkspacesCount} orgs
                </span>
              </div>
            </div>
          </div>

          {/* SaaS Health & Cash Flow Breakdown (3 Non-Duplicative Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-semibold">Collected Revenue</span>
                <div className="text-lg font-black text-foreground font-mono mt-0.5">
                  {formatCurrency(kpis.paidRevenue)}
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Settled successfully</span>
              </div>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 border border-amber-500/20">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-semibold">Outstanding Revenue</span>
                <div className="text-lg font-black text-foreground font-mono mt-0.5">
                  {formatCurrency(kpis.pendingRevenue)}
                </div>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                  {kpis.pendingInvoicesCount} {kpis.pendingInvoicesCount === 1 ? "invoice" : "invoices"} awaiting payment
                </span>
              </div>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 border border-purple-500/20">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-semibold">Payment Gateway</span>
                <div className="text-lg font-black text-foreground uppercase mt-0.5">
                  {configForm.paymentGateway || "RAZORPAY"}
                </div>
                <span className="text-[11px] text-muted-foreground">GSTIN: {configForm.gstin || "29AAAAA0000A1Z5"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUBSCRIPTIONS TABLE */}
      {activeTab === "subscriptions" && (
        <div className="crm-table-workspace-sticky">
          <CRMToolbar
            searchQuery={subSearch}
            setSearchQuery={setSubSearch}
            placeholder="Search by organization or plan..."
            sticky={false}
          >
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border">
                {["all", "active", "trialing", "past_due", "canceled"].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setSubStatusFilter(st);
                      setSubPage(1);
                    }}
                    className={`h-7 px-2.5 rounded-md text-xs font-semibold capitalize transition-all ${
                      subStatusFilter === st
                        ? "bg-card text-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {st.replace(/_/g, " ")}
                  </button>
                ))}
              </div>

              {/* Plan Filter */}
              <select
                value={subPlanFilter}
                onChange={(e) => {
                  setSubPlanFilter(e.target.value);
                  setSubPage(1);
                }}
                className="h-8 px-2.5 rounded-lg bg-card border border-border text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Plans</option>
                <option value="free">Free</option>
                <option value="growth">Growth / Pro</option>
                <option value="business">Business / Enterprise</option>
              </select>
            </div>
          </CRMToolbar>

          <div className={cn("crm-table-wrap", (loading || filteredSubscriptions.length <= subRowsPerPage) && "crm-table-no-pagination")}>
            <div className="overflow-auto flex-1 min-h-0">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="sticky top-0 z-20 bg-card border-b border-border/60">
                  <tr className="text-[12px] font-semibold uppercase tracking-[0.05em] leading-tight text-muted-foreground">
                    <th className="group h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left bg-card whitespace-nowrap cursor-pointer select-none">
                      <DataTableColumnHeader
                        title="Organization"
                        sortable
                        sortDirection={subSortConfig?.key === "tenantName" ? subSortConfig.direction : null}
                        onSort={(d) => setSubSortConfig(d ? { key: "tenantName", direction: d } : null)}
                      />
                    </th>
                    <th className="group h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left bg-card whitespace-nowrap">
                      <DataTableColumnHeader title="Plan Tier" />
                    </th>
                    <th className="group h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-center bg-card whitespace-nowrap">
                      <DataTableColumnHeader title="Billing Cycle" align="center" />
                    </th>
                    <th className="group h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-right bg-card whitespace-nowrap">
                      <DataTableColumnHeader title="Seats" align="right" />
                    </th>
                    <th className="group h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-right bg-card whitespace-nowrap cursor-pointer select-none">
                      <DataTableColumnHeader
                        title="Recurring Amount"
                        align="right"
                        sortable
                        sortDirection={subSortConfig?.key === "recurringAmount" ? subSortConfig.direction : null}
                        onSort={(d) => setSubSortConfig(d ? { key: "recurringAmount", direction: d } : null)}
                      />
                    </th>
                    <th className="group h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left bg-card whitespace-nowrap">
                      <DataTableColumnHeader title="Next Renewal" />
                    </th>
                    <th className="group h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-center bg-card whitespace-nowrap">
                      <DataTableColumnHeader title="Status" align="center" />
                    </th>
                    <th className="group h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-right bg-card whitespace-nowrap">
                      <DataTableColumnHeader title="Actions" align="right" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse h-14">
                        <td className="px-6 py-3"><div className="h-4 w-36 bg-muted rounded" /></td>
                        <td className="px-6 py-3"><div className="h-5 w-20 bg-muted rounded-full" /></td>
                        <td className="px-6 py-3 text-center"><div className="h-4 w-16 bg-muted rounded mx-auto" /></td>
                        <td className="px-6 py-3 text-right"><div className="h-4 w-8 bg-muted rounded ml-auto" /></td>
                        <td className="px-6 py-3 text-right"><div className="h-4 w-20 bg-muted rounded ml-auto" /></td>
                        <td className="px-6 py-3"><div className="h-4 w-24 bg-muted rounded" /></td>
                        <td className="px-6 py-3 text-center"><div className="h-5 w-16 bg-muted rounded-full mx-auto" /></td>
                        <td className="px-6 py-3 text-right"><div className="h-7 w-14 bg-muted rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : paginatedSubscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 border-0">
                        <EmptyState
                          title="No platform subscriptions found"
                          description="No tenant organizations match your search or filter criteria."
                          icon={CreditCard}
                          className="border-none bg-transparent shadow-none p-0 min-h-0"
                          action={{
                            label: "Create Subscription",
                            onClick: () => setIsCreateSubModalOpen(true),
                          }}
                        />
                      </td>
                    </tr>
                  ) : (
                    paginatedSubscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-3.5 font-bold text-foreground">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {(() => {
                              const orgColor = getOrgAvatarColor(sub.tenantName);
                              return (
                                <div
                                  className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs border shadow-xs",
                                    orgColor.bg,
                                    orgColor.text,
                                    orgColor.border
                                  )}
                                >
                                  {sub.tenantName?.charAt(0)?.toUpperCase() || "O"}
                                </div>
                              );
                            })()}
                            <div className="min-w-0">
                              <TruncatedText text={sub.tenantName} lines={1} className="font-bold text-foreground text-xs" />
                              <span className="text-[10px] text-muted-foreground font-mono block">
                                ID: {sub.tenantId?.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <PlanBadge plan={sub.planName || sub.planId} size="sm" />
                        </td>
                        <td className="px-6 py-3.5 text-center capitalize text-xs text-muted-foreground font-medium">
                          <span className="px-2 py-0.5 rounded-md bg-muted/40 border border-border/60">
                            {sub.billingCycle}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono font-medium text-xs">
                          {sub.seats}
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono font-bold text-foreground text-xs">
                          {formatCurrency(sub.recurringAmount, sub.currency)}
                        </td>
                        <td className="px-6 py-3.5 text-xs text-muted-foreground">
                          {new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          {getSubStatusBadge(sub.status)}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTenantId(sub.tenantId);
                              setSelectedPlanId(sub.planId || "growth");
                              setSelectedBillingCycle((sub.billingCycle as any) || "monthly");
                              setSelectedSeats(sub.seats || 5);
                              setIsCreateSubModalOpen(true);
                            }}
                            className="h-7 px-2.5 text-[11px] font-semibold"
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredSubscriptions.length > subRowsPerPage && (
              <CRMPagination
                currentPage={subPage}
                totalPages={totalSubPages}
                totalItems={filteredSubscriptions.length}
                rowsPerPage={subRowsPerPage}
                onPageChange={setSubPage}
                onRowsPerPageChange={(rows: number) => {
                  setSubRowsPerPage(rows);
                  setSubPage(1);
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PLATFORM INVOICES TABLE */}
      {activeTab === "invoices" && (
        <div className="crm-table-workspace-sticky">
          <CRMToolbar
            searchQuery={invSearch}
            setSearchQuery={setInvSearch}
            placeholder="Search by invoice # or organization..."
            sticky={false}
          >
            <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border">
              {["all", "paid", "pending", "refunded"].map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setInvStatusFilter(st);
                    setInvPage(1);
                  }}
                  className={`h-7 px-2.5 rounded-md text-xs font-semibold capitalize transition-all ${
                    invStatusFilter === st
                      ? "bg-card text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </CRMToolbar>

          <div className={cn("crm-table-wrap", (loading || filteredInvoices.length <= invRowsPerPage) && "crm-table-no-pagination")}>
            <div className="overflow-auto flex-1 min-h-0">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="sticky top-0 z-20 bg-card border-b border-border/60">
                  <tr className="text-[12px] font-semibold uppercase tracking-[0.05em] leading-tight text-muted-foreground">
                    <th className="group h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left bg-card whitespace-nowrap cursor-pointer select-none">
                      <DataTableColumnHeader
                        title="Platform Invoice #"
                        sortable
                        sortDirection={invSortConfig?.key === "invoiceNumber" ? invSortConfig.direction : null}
                        onSort={(d) => setInvSortConfig(d ? { key: "invoiceNumber", direction: d } : null)}
                      />
                    </th>
                    <th className="group h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left bg-card whitespace-nowrap">
                      <DataTableColumnHeader title="Organization (Tenant)" />
                    </th>
                    <th className="group h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left bg-card whitespace-nowrap">
                      <DataTableColumnHeader title="Plan & Seats" />
                    </th>
                    <th className="group h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left bg-card whitespace-nowrap cursor-pointer select-none">
                      <DataTableColumnHeader
                        title="Date"
                        sortable
                        sortDirection={invSortConfig?.key === "invoiceDate" ? invSortConfig.direction : null}
                        onSort={(d) => setInvSortConfig(d ? { key: "invoiceDate", direction: d } : null)}
                      />
                    </th>
                    <th className="group h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-right bg-card whitespace-nowrap">
                      <DataTableColumnHeader title="Tax (GST)" align="right" />
                    </th>
                    <th className="group h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-right bg-card whitespace-nowrap cursor-pointer select-none">
                      <DataTableColumnHeader
                        title="Total Amount"
                        align="right"
                        sortable
                        sortDirection={invSortConfig?.key === "totalAmount" ? invSortConfig.direction : null}
                        onSort={(d) => setInvSortConfig(d ? { key: "totalAmount", direction: d } : null)}
                      />
                    </th>
                    <th className="group h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-center bg-card whitespace-nowrap">
                      <DataTableColumnHeader title="Status" align="center" />
                    </th>
                    <th className="group h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-right bg-card whitespace-nowrap">
                      <DataTableColumnHeader title="Actions" align="right" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse h-14">
                        <td className="px-6 py-3"><div className="h-4 w-28 bg-muted rounded font-mono" /></td>
                        <td className="px-6 py-3"><div className="h-4 w-36 bg-muted rounded" /></td>
                        <td className="px-6 py-3"><div className="h-4 w-24 bg-muted rounded" /></td>
                        <td className="px-6 py-3"><div className="h-4 w-20 bg-muted rounded" /></td>
                        <td className="px-6 py-3 text-right"><div className="h-4 w-16 bg-muted rounded ml-auto" /></td>
                        <td className="px-6 py-3 text-right"><div className="h-4 w-20 bg-muted rounded ml-auto" /></td>
                        <td className="px-6 py-3 text-center"><div className="h-5 w-16 bg-muted rounded-full mx-auto" /></td>
                        <td className="px-6 py-3 text-right"><div className="h-7 w-20 bg-muted rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : paginatedInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 border-0">
                        <EmptyState
                          title="No platform invoices yet"
                          description="Invoices will appear here when paid subscriptions generate billing."
                          icon={Receipt}
                          className="border-none bg-transparent shadow-none p-0 min-h-0"
                        />
                      </td>
                    </tr>
                  ) : (
                    paginatedInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-3.5 font-mono font-bold text-foreground text-xs">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-foreground text-xs max-w-[200px]">
                          <div className="flex items-center gap-2 min-w-0">
                            <Building2 className="w-4 h-4 text-primary shrink-0" />
                            <TruncatedText text={inv.tenantName} lines={1} className="font-semibold text-foreground" />
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-muted-foreground capitalize text-xs max-w-[160px]">
                          <TruncatedText text={`${inv.planName} (${inv.seats} seats)`} lines={1} />
                        </td>
                        <td className="px-6 py-3.5 text-xs text-muted-foreground">
                          {new Date(inv.invoiceDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono text-muted-foreground text-xs">
                          {formatCurrency(inv.taxAmount, inv.currency)}
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono font-bold text-foreground text-xs">
                          {formatCurrency(inv.totalAmount, inv.currency)}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          {getInvStatusBadge(inv.status, inv.paymentStatus)}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setViewInvoiceModalOpen(true);
                              }}
                              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                              title="View Invoice"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            {inv.paymentStatus === "PAID" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setRefundTargetInvoice(inv);
                                  setRefundAmount(inv.paidAmount);
                                  setIsRefundModalOpen(true);
                                }}
                                className="h-7 px-2.5 text-[11px] text-purple-600 hover:text-purple-700 hover:bg-purple-500/10 font-semibold gap-1"
                              >
                                <RotateCcw className="w-3 h-3" /> Refund
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredInvoices.length > invRowsPerPage && (
              <CRMPagination
                currentPage={invPage}
                totalPages={totalInvPages}
                totalItems={filteredInvoices.length}
                rowsPerPage={invRowsPerPage}
                onPageChange={setInvPage}
                onRowsPerPageChange={(rows: number) => {
                  setInvRowsPerPage(rows);
                  setInvPage(1);
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* TAB 4: BILLING CONFIGURATION */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveConfig} className="space-y-6">
          <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-border/80 flex-wrap gap-4">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" /> ClixPro Platform Legal & Invoicing Configuration
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Platform legal and banking details printed on invoices generated when customer organizations subscribe.
                </p>
              </div>
              <Button type="submit" size="sm" disabled={savingConfig} className="gap-1.5 text-xs font-semibold">
                {savingConfig ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Configuration
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Section 1: Legal & Tax */}
              <div className="bg-muted/15 border border-border/60 rounded-xl p-4.5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 pb-2 border-b border-border/40">
                  <Briefcase className="w-3.5 h-3.5 text-primary" /> Legal & Tax
                </h4>

                <div>
                  <Label className="text-xs font-semibold text-foreground mb-1">Company Legal Entity Name</Label>
                  <Input
                    value={configForm.companyLegalName || ""}
                    onChange={(e) => setConfigForm({ ...configForm, companyLegalName: e.target.value })}
                    placeholder="ClixPro Technologies Pvt. Ltd."
                    className="h-8 text-xs font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1">Platform GSTIN</Label>
                    <Input
                      value={configForm.gstin || ""}
                      onChange={(e) => setConfigForm({ ...configForm, gstin: e.target.value.toUpperCase() })}
                      placeholder="29AAAAA0000A1Z5"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1">Platform PAN</Label>
                    <Input
                      value={configForm.pan || ""}
                      onChange={(e) => setConfigForm({ ...configForm, pan: e.target.value.toUpperCase() })}
                      placeholder="AAAAA0000A"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Registered Address */}
              <div className="bg-muted/15 border border-border/60 rounded-xl p-4.5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 pb-2 border-b border-border/40">
                  <Building2 className="w-3.5 h-3.5 text-primary" /> Registered Address
                </h4>

                <div>
                  <Label className="text-xs font-semibold text-foreground mb-1">Registered Address</Label>
                  <Input
                    value={configForm.billingAddress || ""}
                    onChange={(e) => setConfigForm({ ...configForm, billingAddress: e.target.value })}
                    placeholder="Level 4, Cyber City, Phase II"
                    className="h-8 text-xs"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1">City</Label>
                    <Input
                      value={configForm.city || ""}
                      onChange={(e) => setConfigForm({ ...configForm, city: e.target.value })}
                      placeholder="Bengaluru"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1">State</Label>
                    <Input
                      value={configForm.state || ""}
                      onChange={(e) => setConfigForm({ ...configForm, state: e.target.value })}
                      placeholder="Karnataka"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1">Postal Code</Label>
                    <Input
                      value={configForm.postalCode || ""}
                      onChange={(e) => setConfigForm({ ...configForm, postalCode: e.target.value })}
                      placeholder="560100"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Invoice Settings */}
              <div className="bg-muted/15 border border-border/60 rounded-xl p-4.5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 pb-2 border-b border-border/40">
                  <FileText className="w-3.5 h-3.5 text-primary" /> Invoice Settings
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1">Invoice Prefix</Label>
                    <Input
                      value={configForm.invoicePrefix || ""}
                      onChange={(e) => setConfigForm({ ...configForm, invoicePrefix: e.target.value.toUpperCase() })}
                      placeholder="CP-INV"
                      className="h-8 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1">GST Rate (%)</Label>
                    <Input
                      type="number"
                      value={configForm.taxRate || 18}
                      onChange={(e) => setConfigForm({ ...configForm, taxRate: Number(e.target.value) })}
                      placeholder="18"
                      className="h-8 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1">Due Terms (Days)</Label>
                    <Input
                      type="number"
                      value={configForm.paymentTermsDays || 15}
                      onChange={(e) => setConfigForm({ ...configForm, paymentTermsDays: Number(e.target.value) })}
                      placeholder="15"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Bank & Settlement */}
              <div className="bg-muted/15 border border-border/60 rounded-xl p-4.5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 pb-2 border-b border-border/40">
                  <CreditCard className="w-3.5 h-3.5 text-primary" /> Bank & Settlement
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1">Bank Name</Label>
                    <Input
                      value={configForm.bankName || ""}
                      onChange={(e) => setConfigForm({ ...configForm, bankName: e.target.value })}
                      placeholder="HDFC Bank"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs font-semibold text-foreground">Account Number</Label>
                      <button
                        type="button"
                        onClick={() => setShowAccountNumber(!showAccountNumber)}
                        className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {showAccountNumber ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showAccountNumber ? "Mask" : "Reveal"}</span>
                      </button>
                    </div>
                    <Input
                      type={showAccountNumber ? "text" : "password"}
                      value={configForm.accountNumber || ""}
                      onChange={(e) => setConfigForm({ ...configForm, accountNumber: e.target.value })}
                      placeholder="50200012345678"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1">IFSC Code</Label>
                    <Input
                      value={configForm.ifscCode || ""}
                      onChange={(e) => setConfigForm({ ...configForm, ifscCode: e.target.value.toUpperCase() })}
                      placeholder="HDFC0001234"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1">UPI ID</Label>
                    <Input
                      value={configForm.upiId || ""}
                      onChange={(e) => setConfigForm({ ...configForm, upiId: e.target.value })}
                      placeholder="clixpro@hdfcbank"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* CREATE / CONFIGURE SUBSCRIPTION MODAL */}
      {isCreateSubModalOpen && (
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
                onClick={() => setIsCreateSubModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubscriptionSubmit} className="space-y-4">
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
                    onChange={(e) => setSelectedBillingCycle(e.target.value as any)}
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
                  onClick={() => setIsCreateSubModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingSub}
                  className="text-xs font-semibold"
                >
                  {isSubmittingSub ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  Save Subscription
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* PLATFORM REFUND MODAL */}
      {isRefundModalOpen && refundTargetInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="bg-card border border-border/80 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-purple-600" /> Process Platform Refund
              </h3>
              <button
                onClick={() => setIsRefundModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRefundSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-muted/20 border border-border/60 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice #:</span>
                  <span className="font-mono font-bold text-foreground">{refundTargetInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Organization:</span>
                  <span className="font-semibold text-foreground">{refundTargetInvoice.tenantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid Amount:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(refundTargetInvoice.paidAmount, refundTargetInvoice.currency)}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-foreground mb-1">Refund Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={refundTargetInvoice.paidAmount}
                  required
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="h-9 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-foreground mb-1">Refund Reason *</Label>
                <Textarea
                  rows={2}
                  required
                  placeholder="Enter reason for refund..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/80">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRefundModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isProcessingRefund}
                  className="text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isProcessingRefund ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  Confirm Refund
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* VIEW INVOICE PREVIEW MODAL */}
      {viewInvoiceModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="bg-card border border-border/80 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="text-base font-bold text-foreground font-mono">
                    {selectedInvoice.invoiceNumber}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Platform SaaS Tax Invoice</p>
                </div>
              </div>
              <button
                onClick={() => setViewInvoiceModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/20 border border-border/60">
                <div>
                  <span className="text-[11px] text-muted-foreground uppercase font-bold block">Billed To</span>
                  <span className="font-bold text-foreground block text-sm mt-0.5">{selectedInvoice.tenantName}</span>
                  <span className="text-muted-foreground block text-[11px]">Tenant ID: {selectedInvoice.tenantId}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-muted-foreground uppercase font-bold block">Status</span>
                  <div className="mt-1">{getInvStatusBadge(selectedInvoice.status, selectedInvoice.paymentStatus)}</div>
                  <span className="text-[11px] text-muted-foreground block mt-1">
                    Date: {new Date(selectedInvoice.invoiceDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="border border-border/60 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 border-b border-border/60 text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-2 px-3 text-left">Description</th>
                      <th className="py-2 px-3 text-center">Seats</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    <tr>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-foreground block capitalize">{selectedInvoice.planName} Plan</span>
                        <span className="text-[10px] text-muted-foreground capitalize">{selectedInvoice.billingCycle} billing</span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono">{selectedInvoice.seats}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-foreground">
                        {formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border/60">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST ({selectedInvoice.taxRate || 18}%)</span>
                  <span className="font-mono">{formatCurrency(selectedInvoice.taxAmount, selectedInvoice.currency)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-border/60">
                  <span>Total Amount</span>
                  <span className="font-mono text-primary">
                    {formatCurrency(selectedInvoice.totalAmount, selectedInvoice.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <span>Amount Paid</span>
                  <span className="font-mono">
                    {formatCurrency(selectedInvoice.paidAmount, selectedInvoice.currency)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewInvoiceModalOpen(false)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </CRMPageContainer>
  );
}
