"use client";

import { useState, useMemo, useEffect } from "react";
import { Users, UserPlus, Star, Filter, Upload, Settings } from "lucide-react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { useLeads, useCustomers, useDeleteLead, useDeleteCustomer } from "@/shared/hooks/use-crm";
import { PageErrorState } from "@/shared/components/page-states";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/components/EmptyState";
import {
  CRMMetricCard,
  CRMToolbar,
  CRMPageContainer,
  CRMMetricsGrid,
  CRMPageHeader,
} from "@/shared/components/crm";
import { FormModal } from "@/shared/components/form-modal";

import { FormSkeleton } from "@/shared/components/skeletons";
import { LeadContextualSettings } from "@/features/leads/components/LeadContextualSettings";
import { ContactContextualSettings } from "@/features/contacts/components/ContactContextualSettings";

const LeadForm = dynamic(() => import("@/features/forms/LeadForm").then((mod) => ({ default: mod.LeadForm })), {
  loading: () => <FormSkeleton />,
});
const CustomerForm = dynamic(() => import("@/features/forms/CustomerForm").then((mod) => ({ default: mod.CustomerForm })), {
  loading: () => <FormSkeleton />,
});

import { ContactsTable } from "@/features/contacts/components/ContactsTable";
import { useViewMode } from "@/shared/hooks/useViewMode";
import { ContactsSkeleton } from "@/features/contacts/components/ContactsSkeleton";
import { BulkImportModal } from "@/features/leads/components/BulkImportModal";

import { useAuth } from "@/features/auth/components/auth-provider";

const ContactsPage = () => {
  const searchParams = useSearchParams();
  const { isHydrated, isAuthenticated, isInitializing } = useAuth();

  // URL State Sync
  const initialStatus = searchParams.get("status") || "all";
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useViewMode("contacts", "list");

  const { data: leadsData, isLoading: leadsLoading, isPending: leadsPending, error: leadsError, refetch: refetchLeads } = useLeads();
  const { data: customersData, isLoading: customersLoading, isPending: customersPending, error: customersError, refetch: refetchCustomers } = useCustomers();

  const { mutate: deleteLead } = useDeleteLead();
  const { mutate: deleteCustomer } = useDeleteCustomer();

  const safeLeads = useMemo(() => Array.isArray(leadsData?.leads) ? leadsData.leads : [], [leadsData]);
  const safeCustomers = useMemo(() => Array.isArray(customersData?.customers) ? customersData.customers : [], [customersData]);

  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [customizeDefaultSection, setCustomizeDefaultSection] = useState<string | undefined>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedLead, setSelectedLead] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Sync customize query param
  useEffect(() => {
    const cust = searchParams.get("customize");
    if (cust) {
      if (cust !== "true") {
        setCustomizeDefaultSection(cust);
      }
      setIsCustomizeOpen(true);
    }
  }, [searchParams]);

  // Sync state back to URL if filter changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const params = new URLSearchParams(window.location.search);
    const currentStatus = params.get("status") || "all";
    
    // Only trigger URL update if statusFilter differs from current URL
    if (statusFilter !== currentStatus) {
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      } else {
        params.delete("status");
      }
      
      const newQueryString = params.toString();
      const newUrl = `${window.location.pathname}${newQueryString ? `?${newQueryString}` : ""}`;
      
      window.history.replaceState({}, "", newUrl);
    }
  }, [statusFilter]);

  // Combined Data Mapping
  const combinedContacts = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedLeads = safeLeads.map((lead: any) => ({
      ...lead,
      type: "Lead",
      raw: lead,
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedCustomers = safeCustomers.map((customer: any) => ({
      ...customer,
      type: "Customer",
      raw: customer,
    }));
    return [...mappedLeads, ...mappedCustomers].sort(
      (a, b) => new Date(b.createdAt || b.lastContact || 0).getTime() - new Date(a.createdAt || a.lastContact || 0).getTime()
    );
  }, [safeLeads, safeCustomers]);

  const filteredContacts = useMemo(() => {
    return combinedContacts.filter((contact) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        contact.name?.toLowerCase().includes(q) ||
        contact.company?.toLowerCase().includes(q) ||
        contact.email?.toLowerCase().includes(q) ||
        contact.phone?.toLowerCase().includes(q);

      let matchesStatus = true;
      if (statusFilter === "lead") matchesStatus = contact.type === "Lead";
      else if (statusFilter === "customer") matchesStatus = contact.type === "Customer";
      else if (statusFilter === "inactive") {
        matchesStatus =
          (contact.type === "Customer" && contact.status === "INACTIVE") ||
          (contact.type === "Lead" && contact.stage === "LOST");
      }

      return matchesSearch && matchesStatus;
    });
  }, [combinedContacts, searchQuery, statusFilter]);

  const isInitialLoading =
    (!leadsData || !customersData) &&
    (leadsLoading || customersLoading || leadsPending || customersPending || !isHydrated || !isAuthenticated || isInitializing);

  if (isInitialLoading && combinedContacts.length === 0) {
    return <ContactsSkeleton viewMode={viewMode} />;
  }

  if ((leadsError || customersError) && combinedContacts.length === 0) {
    return (
      <PageErrorState
        title="Contacts unavailable"
        message="An error occurred while fetching contacts data"
        onRetry={() => {
          refetchLeads();
          refetchCustomers();
        }}
      />
    );
  }
  return (
    <CRMPageContainer twoStageScroll>
      <CRMPageHeader
        title="Contacts"
        subtitle="Manage leads and customers in one unified view with AI-powered insights."
        icon={Users}
        badge="Unified Contacts"
        actions={[
          {
            label: "Customize",
            icon: Settings,
            onClick: () => setIsCustomizeOpen(true),
            variant: "outline",
          },
          {
            label: "Bulk Upload",
            icon: Upload,
            onClick: () => setIsBulkImportModalOpen(true),
            variant: "outline",
          },
          {
            label: "Add Lead",
            icon: UserPlus,
            onClick: () => setIsLeadModalOpen(true),
            variant: "default",
          },
        ]}
      />

      {combinedContacts.length === 0 ? (
        <div className="flex-1 min-h-0 flex flex-col">
          {statusFilter === "lead" ? (
            <EmptyState
              module="leads"
              action={{
                label: "Create Lead",
                onClick: () => setIsLeadModalOpen(true),
                icon: UserPlus,
              }}
              secondaryAction={{
                label: "Import Leads",
                onClick: () => setIsBulkImportModalOpen(true),
                icon: Upload,
              }}
            />
          ) : statusFilter === "customer" ? (
            <EmptyState
              module="customers"
              action={{
                label: "Add Customer",
                onClick: () => setIsCustomerModalOpen(true),
                icon: UserPlus,
              }}
              secondaryAction={{
                label: "Import Customers",
                onClick: () => setIsBulkImportModalOpen(true),
                icon: Upload,
              }}
            />
          ) : (
            <EmptyState
              module="leads"
              title="How to get the most out of your contacts?"
              description="Start building your network by creating your first lead or adding a customer account."
              action={{
                label: "Create Lead",
                onClick: () => setIsLeadModalOpen(true),
                icon: UserPlus,
              }}
              secondaryAction={{
                label: "Import Contacts",
                onClick: () => setIsBulkImportModalOpen(true),
                icon: Upload,
              }}
            />
          )}
        </div>
      ) : (
        <>
          <div className="shrink-0">
            <CRMMetricsGrid cols={3}>
              <CRMMetricCard
                title="Total Contacts"
                value={combinedContacts.length}
                change="0%"
                trend="up"
                icon={Users}
                color="indigo"
                delay={0.1}
              />
              <CRMMetricCard
                title="Active Customers"
                value={safeCustomers.length}
                change="0%"
                trend="up"
                icon={Star}
                color="emerald"
                delay={0.2}
              />
              <CRMMetricCard
                title="Active Leads"
                value={safeLeads.length}
                change="0%"
                trend="up"
                icon={Filter}
                color="orange"
                delay={0.3}
              />
            </CRMMetricsGrid>
          </div>

          {/* Two-Stage Scroll Workspace: sticks at top after KPI cards scroll away */}
          <div className="crm-table-workspace-sticky">
            <CRMToolbar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              viewMode={viewMode}
              setViewMode={setViewMode}
              placeholder="Search contacts by name, email, company, or phone..."
            >
              <div className="flex items-center gap-2">
                {[
                  { label: "All", value: "all" },
                  { label: "Leads", value: "lead" },
                  { label: "Customers", value: "customer" },
                  { label: "Inactive", value: "inactive" },
                ].map((statusObj) => (
                  <Button
                    key={statusObj.value}
                    variant={statusFilter === statusObj.value ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setStatusFilter(statusObj.value)}
                    className="h-8 px-3 text-xs font-semibold"
                  >
                    {statusObj.label}
                  </Button>
                ))}
              </div>
            </CRMToolbar>

            <div className="flex-1 min-h-0 flex flex-col">
              <AnimatePresence mode="wait">
                {filteredContacts.length > 0 ? (
                  <motion.div
                    key={viewMode}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col min-h-0"
                  >
                    <ContactsTable
                      contacts={filteredContacts}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      onEditLead={(lead: any) => {
                        setSelectedLead(lead);
                        setIsLeadModalOpen(true);
                      }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      onEditCustomer={(customer: any) => {
                        setSelectedCustomer(customer);
                        setIsCustomerModalOpen(true);
                      }}
                      onDeleteLead={(id: string) => deleteLead(id)}
                      onDeleteCustomer={(id: string) => deleteCustomer(id)}
                    />
                  </motion.div>
                ) : (
                  <EmptyState
                    icon={Users}
                    title="No contacts found"
                    description="No contacts match your current search or filter criteria."
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

      <FormModal
        title={selectedLead ? "Edit Lead" : "Create New Lead"}
        description="Manage your prospect details."
        isOpen={isLeadModalOpen}
        onOpenChange={(open) => {
          setIsLeadModalOpen(open);
          if (!open) setSelectedLead(null);
        }}
        size="lg"
      >
        <LeadForm
          initialData={selectedLead || undefined}
          onSuccess={() => {
            setIsLeadModalOpen(false);
            setSelectedLead(null);
            refetchLeads();
          }}
          onCancel={() => {
            setIsLeadModalOpen(false);
            setSelectedLead(null);
          }}
        />
      </FormModal>

      <FormModal
        title={selectedCustomer ? "Edit Customer" : "Register New Customer"}
        description="Manage your client details."
        isOpen={isCustomerModalOpen}
        onOpenChange={(open) => {
          setIsCustomerModalOpen(open);
          if (!open) setSelectedCustomer(null);
        }}
        size="lg"
      >
        <CustomerForm
          initialData={selectedCustomer || undefined}
          onSuccess={() => {
            setIsCustomerModalOpen(false);
            setSelectedCustomer(null);
            refetchCustomers();
          }}
          onCancel={() => {
            setIsCustomerModalOpen(false);
            setSelectedCustomer(null);
          }}
        />
      </FormModal>

      <BulkImportModal
        isOpen={isBulkImportModalOpen}
        onOpenChange={setIsBulkImportModalOpen}
        onSuccess={() => {
          setIsBulkImportModalOpen(false);
          refetchLeads();
          refetchCustomers();
        }}
      />

      {statusFilter === "lead" ? (
        <LeadContextualSettings
          open={isCustomizeOpen}
          onOpenChange={setIsCustomizeOpen}
          defaultSection={customizeDefaultSection || "sources"}
        />
      ) : (
        <ContactContextualSettings
          open={isCustomizeOpen}
          onOpenChange={setIsCustomizeOpen}
          defaultSection={customizeDefaultSection || "fields"}
        />
      )}
    </CRMPageContainer>
  );
};

export default ContactsPage;
