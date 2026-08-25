"use client";

import React, { useState, useMemo } from "react";
import { Receipt, Plus, IndianRupee, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useInvoices } from "@/shared/hooks/use-crm";
import { useCurrency } from "@/shared/hooks/use-currency";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageErrorState } from "@/shared/components/page-states";
import {
  CRMPageHeader,
  CRMMetricCard,
  CRMToolbar,
  CRMPageContainer,
  CRMMetricsGrid,
} from "@/shared/components/crm";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { InvoicesSkeleton } from "@/features/invoices/components/InvoicesSkeleton";

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { formatCurrency } = useCurrency();

  const { data, isLoading: loading, error, refetch } = useInvoices();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safeInvoices: any[] = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray((data as any).invoices)) return (data as any).invoices;
    return [];
  }, [data]);

  const filteredInvoices = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return safeInvoices.filter((inv: any) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        inv.invoiceNumber?.toLowerCase().includes(q) ||
        inv.client?.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" || inv.status?.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [safeInvoices, searchQuery, statusFilter]);

  const handleCreateInvoice = () => {
    toast.info("Invoice creation modal coming soon.");
  };

  if (loading && safeInvoices.length === 0) {
    return <InvoicesSkeleton />;
  }

  if (error && safeInvoices.length === 0) {
    return (
      <PageErrorState
        title="Invoices unavailable"
        message={(error as Error).message || "An error occurred fetching invoices."}
        onRetry={() => {
          refetch();
        }}
      />
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalBilled = safeInvoices.reduce((acc: number, inv: any) => acc + (Number(inv.total) || 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paidCount = safeInvoices.filter((i: any) => i.status === "PAID").length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingCount = safeInvoices.filter((i: any) => i.status === "PENDING" || i.status === "SENT").length;

  return (
    <CRMPageContainer>
      <CRMPageHeader
        title="Invoices"
        subtitle="Generate, send, and track client invoices and payment status in real-time."
        icon={Receipt}
        badge="Billing & Revenue"
        actions={[
          {
            label: "Create Invoice",
            icon: Plus,
            onClick: handleCreateInvoice,
            variant: "default",
          },
        ]}
      />

      {safeInvoices.length === 0 ? (
        <div className="flex-1 min-h-0 flex flex-col pt-2">
          <EmptyState
            module="invoices"
            action={{
              label: "Create Invoice",
              onClick: handleCreateInvoice,
              icon: Plus,
            }}
          />
        </div>
      ) : (
        <>
          <div className="shrink-0">
            <CRMMetricsGrid cols={4} className="gap-4">
              <CRMMetricCard
                title="Total Invoiced"
                value={formatCurrency(totalBilled)}
                change="0%"
                trend="up"
                icon={IndianRupee}
                color="indigo"
                delay={0.1}
              />
              <CRMMetricCard
                title="Paid Invoices"
                value={paidCount}
                change="0%"
                trend="up"
                icon={CheckCircle2}
                color="emerald"
                delay={0.2}
              />
              <CRMMetricCard
                title="Pending Payment"
                value={pendingCount}
                change="0%"
                trend="neutral"
                icon={Clock}
                color="orange"
                delay={0.3}
              />
              <CRMMetricCard
                title="Overdue"
                value={0}
                change="0%"
                trend="neutral"
                icon={AlertCircle}
                color="pink"
                delay={0.4}
              />
            </CRMMetricsGrid>
          </div>

          <div className="flex-1 flex flex-col gap-4 min-h-0">
            <CRMToolbar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              placeholder="Search invoices by number, client..."
            >
              <div className="flex items-center gap-2">
                {["All", "Paid", "Pending", "Overdue", "Draft"].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status.toLowerCase() ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setStatusFilter(status.toLowerCase())}
                    className="h-9 px-3 text-xs font-semibold"
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </CRMToolbar>

            <div className="flex-1 min-h-0 flex flex-col" data-testid="invoices-list">
              <AnimatePresence mode="wait">
                {filteredInvoices.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col min-h-0"
                  >
                    {/* Table will render when records exist */}
                  </motion.div>
                ) : (
                  <EmptyState
                    icon={Receipt}
                    title="No invoices found"
                    description="No invoices match the current search or status filter."
                    action={{
                      label: "Clear Filters",
                      onClick: () => {
                        setSearchQuery("");
                        setStatusFilter("all");
                      },
                      variant: "outline",
                    }}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </>
      )}
    </CRMPageContainer>
  );
}
