"use client";

import React, { useState, useEffect } from "react";
import {
  Receipt,
  TrendingUp,
  CreditCard,
  Building2,
  Calendar,
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  Settings,
  Search,
  Plus,
  ArrowUpRight,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
  Users,
  Download,
  Save,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  fetchPlatformBillingOverview,
  fetchPlatformSubscriptions,
  fetchPlatformInvoices,
  createOrUpdatePlatformSubscription,
  processPlatformRefund,
  fetchPlatformBillingSettings,
  updatePlatformBillingSettings,
  PlatformBillingOverviewData,
  PlatformSubscriptionItem,
  PlatformInvoiceItemData,
} from "@/shared/lib/api/super-admin.api";
import { useCurrency } from "@/shared/hooks/use-currency";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function SuperAdminBillingPage() {
  const { formatCurrency } = useCurrency();

  const [activeTab, setActiveTab] = useState<"overview" | "subscriptions" | "invoices" | "settings">("overview");
  const [loading, setLoading] = useState(true);

  // Data States
  const [overview, setOverview] = useState<PlatformBillingOverviewData | null>(null);
  const [subscriptions, setSubscriptions] = useState<PlatformSubscriptionItem[]>([]);
  const [invoices, setInvoices] = useState<PlatformInvoiceItemData[]>([]);
  const [configForm, setConfigForm] = useState<any>({});

  // Filters & Search
  const [subSearch, setSubSearch] = useState("");
  const [subStatusFilter, setSubStatusFilter] = useState("all");
  const [invSearch, setInvSearch] = useState("");
  const [invStatusFilter, setInvStatusFilter] = useState("all");

  // Modals
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundTargetInvoice, setRefundTargetInvoice] = useState<PlatformInvoiceItemData | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState("");
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ovData, subData, invData, cfgData] = await Promise.all([
        fetchPlatformBillingOverview(),
        fetchPlatformSubscriptions({ search: subSearch || undefined, status: subStatusFilter !== "all" ? subStatusFilter : undefined }),
        fetchPlatformInvoices({ search: invSearch || undefined, status: invStatusFilter !== "all" ? invStatusFilter : undefined }),
        fetchPlatformBillingSettings(),
      ]);
      setOverview(ovData);
      setSubscriptions(subData.subscriptions || []);
      setInvoices(invData.invoices || []);
      setConfigForm(cfgData || {});
    } catch (err: any) {
      toast.error(err.message || "Failed to load platform billing data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [subSearch, subStatusFilter, invSearch, invStatusFilter]);

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
      toast.success("Refund processed successfully");
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

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePlatformBillingSettings(configForm);
      toast.success("Platform billing configuration updated");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update configuration");
    }
  };

  const getSubStatusBadge = (st: string) => {
    switch (st?.toUpperCase()) {
      case "ACTIVE":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="w-3 h-3" /> ACTIVE</span>;
      case "TRIALING":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20"><Clock className="w-3 h-3" /> TRIALING</span>;
      case "PAST_DUE":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"><AlertCircle className="w-3 h-3" /> PAST DUE</span>;
      case "CANCELED":
      case "CANCELLED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/15 text-slate-500 border border-slate-500/20">CANCELED</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-muted text-muted-foreground">{st}</span>;
    }
  };

  const getInvStatusBadge = (st: string, paySt: string) => {
    if (st === "REFUNDED" || paySt === "REFUNDED") {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20"><RotateCcw className="w-3 h-3" /> REFUNDED</span>;
    }
    switch (paySt?.toUpperCase()) {
      case "PAID":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="w-3 h-3" /> PAID</span>;
      case "PARTIALLY_REFUNDED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">PARTIAL REFUND</span>;
      case "PENDING":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"><Clock className="w-3 h-3" /> PENDING</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/15 text-slate-500 border border-slate-500/20">{paySt || st}</span>;
    }
  };

  const kpis = overview?.kpis || {
    mrr: 0,
    arr: 0,
    totalRevenue: 0,
    paidRevenue: 0,
    pendingRevenue: 0,
    overdueRevenue: 0,
    totalRefunds: 0,
    activeSubscriptions: 0,
    totalSubscriptions: 0,
    totalOrganizations: 0,
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 mb-2">
            <Shield className="w-3.5 h-3.5" /> ClixPro Platform Revenue & SaaS Billing
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            Platform Billing Control Center
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time SaaS recurring revenue metrics, organization subscriptions, platform invoices, and gateway payouts.
          </p>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/80 text-xs font-semibold">
          {[
            { id: "overview", label: "Revenue Overview", icon: TrendingUp },
            { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
            { id: "invoices", label: "Platform Invoices", icon: Receipt },
            { id: "settings", label: "Billing Config", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Monthly Recurring Revenue (MRR)
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-foreground font-mono">
              {formatCurrency(kpis.mrr)}
            </span>
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">ARR: {formatCurrency(kpis.arr)}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total SaaS Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-foreground font-mono">
              {formatCurrency(kpis.totalRevenue)}
            </span>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">
              Collected: {formatCurrency(kpis.paidRevenue)}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Active SaaS Subscriptions
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-foreground font-mono">
              {kpis.activeSubscriptions}
            </span>
            <div className="text-[11px] text-muted-foreground mt-1">
              across {kpis.totalOrganizations} tenant organizations
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Refunds & Disputes
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-foreground font-mono">
              {formatCurrency(kpis.totalRefunds)}
            </span>
            <div className="text-[11px] text-muted-foreground mt-1">
              Refund rate: &lt; 0.5%
            </div>
          </div>
        </div>
      </div>

      {/* TAB CONTENT */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Trend */}
          <div className="lg:col-span-2 bg-card border border-border/80 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Monthly Platform Revenue Trend (Last 6 Months)
            </h3>

            <div className="grid grid-cols-6 gap-3 pt-4 items-end h-44">
              {overview?.monthlyTrend?.map((mt) => {
                const maxRev = Math.max(...(overview?.monthlyTrend?.map((m) => m.revenue) || [1]), 1000);
                const heightPercent = Math.max(12, Math.round((mt.revenue / maxRev) * 100));
                return (
                  <div key={mt.month} className="flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[10px] font-mono text-muted-foreground font-bold">
                      {formatCurrency(mt.revenue)}
                    </span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-primary/20 hover:bg-primary/40 rounded-xl transition-all relative group border border-primary/30"
                    />
                    <span className="text-xs font-bold text-foreground">{mt.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Plan Distribution */}
          <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Subscriptions by Plan
            </h3>

            <div className="space-y-3 pt-2">
              {overview?.planDistribution?.length === 0 ? (
                <p className="text-xs text-muted-foreground">No active subscription breakdown available.</p>
              ) : (
                overview?.planDistribution?.map((p) => (
                  <div
                    key={p.name}
                    className="p-3 rounded-xl bg-muted/20 border border-border/60 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-foreground capitalize block">{p.name}</span>
                      <span className="text-[11px] text-muted-foreground">{p.count} active subscribers</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-foreground">
                      {formatCurrency(p.revenue)}/mo
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Subscriptions Table */}
      {activeTab === "subscriptions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={subSearch}
                onChange={(e) => setSubSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              {["all", "active", "trialing", "past_due", "canceled"].map((st) => (
                <Button
                  key={st}
                  variant={subStatusFilter === st ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSubStatusFilter(st)}
                  className="h-8 px-3 text-xs font-semibold capitalize"
                >
                  {st.replace(/_/g, " ")}
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-20 bg-muted/10 border-b border-border/60 text-[12px] font-semibold uppercase tracking-[0.05em] leading-tight text-muted-foreground">
                <tr>
                  <th className="h-10 sm:h-11 py-2.5 px-4 text-left bg-card whitespace-nowrap">Organization</th>
                  <th className="h-10 sm:h-11 py-2.5 px-3 sm:px-4 text-left bg-card whitespace-nowrap">Plan</th>
                  <th className="h-10 sm:h-11 py-2.5 px-3 sm:px-4 text-center bg-card whitespace-nowrap">Billing Cycle</th>
                  <th className="h-10 sm:h-11 py-2.5 px-3 sm:px-4 text-right bg-card whitespace-nowrap">Seats</th>
                  <th className="h-10 sm:h-11 py-2.5 px-3 sm:px-4 text-right bg-card whitespace-nowrap">Recurring Amount</th>
                  <th className="h-10 sm:h-11 py-2.5 px-3 sm:px-4 text-left bg-card whitespace-nowrap">Next Renewal</th>
                  <th className="h-10 sm:h-11 py-2.5 px-3 sm:px-4 text-center bg-card whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No platform subscriptions found.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-bold text-foreground flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        {sub.tenantName}
                      </td>
                      <td className="py-3 px-3 capitalize font-semibold text-foreground">
                        {sub.planName || sub.planId}
                      </td>
                      <td className="py-3 px-3 text-center capitalize text-muted-foreground">
                        {sub.billingCycle}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-medium">
                        {sub.seats}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-foreground">
                        {formatCurrency(sub.recurringAmount, sub.currency)}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">
                        {new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {getSubStatusBadge(sub.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Platform Invoices Table */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search by invoice # or tenant..."
                value={invSearch}
                onChange={(e) => setInvSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              {["all", "paid", "refunded"].map((st) => (
                <Button
                  key={st}
                  variant={invStatusFilter === st ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setInvStatusFilter(st)}
                  className="h-8 px-3 text-xs font-semibold capitalize"
                >
                  {st}
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-20 bg-muted/10 border-b border-border/60 text-[12px] font-semibold uppercase tracking-[0.05em] leading-tight text-muted-foreground">
                <tr>
                  <th className="h-10 sm:h-11 py-2.5 px-4 text-left bg-card whitespace-nowrap">Platform Invoice #</th>
                  <th className="h-10 sm:h-11 py-2.5 px-3 sm:px-4 text-left bg-card whitespace-nowrap">Organization (Tenant)</th>
                  <th className="h-10 sm:h-11 py-2.5 px-3 sm:px-4 text-left bg-card whitespace-nowrap">Plan &amp; Seats</th>
                  <th className="h-10 sm:h-11 py-2.5 px-3 sm:px-4 text-left bg-card whitespace-nowrap">Date</th>
                  <th className="h-10 sm:h-11 py-2.5 px-3 sm:px-4 text-right bg-card whitespace-nowrap">Tax (GST)</th>
                  <th className="h-10 sm:h-11 py-2.5 px-3 sm:px-4 text-right bg-card whitespace-nowrap">Total Amount</th>
                  <th className="h-10 sm:h-11 py-2.5 px-3 sm:px-4 text-center bg-card whitespace-nowrap">Status</th>
                  <th className="h-10 sm:h-11 py-2.5 px-3 sm:px-4 text-center bg-card whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      No platform SaaS invoices found.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-3 font-semibold text-foreground">
                        {inv.tenantName}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground capitalize">
                        {inv.planName} ({inv.seats} seats)
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">
                        {new Date(inv.invoiceDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-muted-foreground">
                        {formatCurrency(inv.taxAmount, inv.currency)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-foreground">
                        {formatCurrency(inv.totalAmount, inv.currency)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {getInvStatusBadge(inv.status, inv.paymentStatus)}
                      </td>
                      <td className="py-3 px-3 text-center">
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Billing Configuration */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveConfig} className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-border/80">
            <div>
              <h3 className="text-base font-bold text-foreground">
                ClixPro Platform SaaS Legal & Invoicing Configuration
              </h3>
              <p className="text-xs text-muted-foreground">
                Company legal details used when generating SaaS invoices for organizations purchasing ClixPro plans.
              </p>
            </div>
            <Button type="submit" size="sm" className="gap-1.5 text-xs font-semibold">
              <Save className="w-3.5 h-3.5" /> Save Configuration
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-foreground mb-1">Company Legal Entity</Label>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-foreground mb-1">Platform Invoice Prefix</Label>
                  <Input
                    value={configForm.invoicePrefix || ""}
                    onChange={(e) => setConfigForm({ ...configForm, invoicePrefix: e.target.value.toUpperCase() })}
                    placeholder="CP-INV"
                    className="h-8 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-foreground mb-1">Platform GST Rate (%)</Label>
                  <Input
                    type="number"
                    value={configForm.taxRate || 18}
                    onChange={(e) => setConfigForm({ ...configForm, taxRate: Number(e.target.value) })}
                    placeholder="18"
                    className="h-8 text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-foreground mb-1">Billing Street Address</Label>
                <Input
                  value={configForm.billingAddress || ""}
                  onChange={(e) => setConfigForm({ ...configForm, billingAddress: e.target.value })}
                  placeholder="Level 4, Cyber City"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-foreground mb-1">Bank Name</Label>
                  <Input
                    value={configForm.bankName || ""}
                    onChange={(e) => setConfigForm({ ...configForm, bankName: e.target.value })}
                    placeholder="ICICI Bank"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-foreground mb-1">Account Number</Label>
                  <Input
                    value={configForm.accountNumber || ""}
                    onChange={(e) => setConfigForm({ ...configForm, accountNumber: e.target.value })}
                    placeholder="000105001234"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Platform Refund Modal */}
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
              <div className="p-3 rounded-xl bg-muted/20 border border-border/60 text-xs space-y-1">
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
                  Confirm Refund
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
