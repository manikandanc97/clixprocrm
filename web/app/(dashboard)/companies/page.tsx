"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Plus, Factory, Briefcase, Settings } from "lucide-react";
import { useSearchParams } from "next/navigation";

import dynamic from "next/dynamic";
import { TableSkeleton } from "@/shared/components/skeletons";

const CompaniesTable = dynamic(() => import("@/features/companies/components/CompaniesTable").then(mod => ({ default: mod.CompaniesTable })), {
  loading: () => <TableSkeleton rows={8} cols={6} showPagination={true} />
});
import { PageErrorState } from "@/shared/components/page-states";
import { CompaniesSkeleton } from "@/features/companies/components/CompaniesSkeleton";
import { useCompanies, useDeleteCompany } from "@/shared/hooks/use-crm";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/components/EmptyState";
import { 
  CRMMetricCard, 
  CRMToolbar,
  CRMPageContainer,
  CRMMetricsGrid,
  CRMPageHeader
} from "@/shared/components/crm";
import { FormModal } from "@/shared/components/form-modal";
import { CompanyForm } from "@/features/forms/CompanyForm";
import { CompanyContextualSettings } from "@/features/companies/components/CompanyContextualSettings";

import { useAuth } from "@/features/auth/components/auth-provider";

const CompaniesPage = () => {
  const { isHydrated, isAuthenticated, isInitializing } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading: loading, isPending, error, refetch } = useCompanies();
  const safeCompanies = useMemo(() => Array.isArray(data?.companies) ? data.companies : [], [data]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);

  const searchParams = useSearchParams();
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [customizeDefaultSection, setCustomizeDefaultSection] = useState<string | undefined>();

  const { mutate: deleteCompany } = useDeleteCompany();

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this company?")) {
      deleteCompany(id);
    }
  };

  useEffect(() => {
    const cust = searchParams.get("customize");
    if (cust) {
      if (cust !== "true") {
        setCustomizeDefaultSection(cust);
      }
      setIsCustomizeOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "true") {
      const timer = setTimeout(() => {
        setIsAddModalOpen(true);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  const filteredCompanies = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return safeCompanies.filter((company: any) => {
      const normalizedQuery = searchQuery.toLowerCase();
      const matchesSearch =
        company.name?.toLowerCase().includes(normalizedQuery) ||
        company.industry?.toLowerCase().includes(normalizedQuery);
      
      const matchesStatus =
        statusFilter === "all" || (company.status || "ACTIVE").toLowerCase() === statusFilter.toLowerCase();
      
      return matchesSearch && matchesStatus;
    });
  }, [safeCompanies, searchQuery, statusFilter]);

  const handleNewCompany = () => {
    setIsAddModalOpen(true);
  };

  const isInitialLoading = !data && (loading || isPending || !isHydrated || !isAuthenticated || isInitializing);

  if (isInitialLoading && safeCompanies.length === 0) {
    return <CompaniesSkeleton />;
  }

  if (error && safeCompanies.length === 0) {
    return (
      <PageErrorState
        title="Error Loading Companies"
        message={(error as Error).message || "An error occurred"}
        onRetry={() => { refetch(); }}
      />
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeCount = safeCompanies.filter((c: any) => c.status === "ACTIVE").length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalCustomers = safeCompanies.reduce((acc: number, c: any) => acc + (c._count?.customers || 0), 0);

  return (
    <CRMPageContainer twoStageScroll>
      <CRMPageHeader 
        title="Companies"
        subtitle="Manage B2B accounts, track pipeline value, and view customer health at the company level."
        icon={Building2}
        badge="Account Management"
        actions={[
          {
            label: "Customize",
            icon: Settings,
            onClick: () => setIsCustomizeOpen(true),
            variant: "outline",
          },
          {
            label: "New Company",
            icon: Plus,
            onClick: handleNewCompany,
            variant: "default"
          }
        ]}
      />

      {safeCompanies.length === 0 ? (
        <div className="flex-1 min-h-0 flex flex-col">
          <EmptyState
            module="companies"
            action={{
              label: "Add Company",
              onClick: handleNewCompany,
              icon: Plus,
            }}
          />
        </div>
      ) : (
        <>
          <div className="shrink-0">
            <CRMMetricsGrid cols={3}>
              <CRMMetricCard 
                title="Total Companies"
                value={safeCompanies.length}
                change="0%"
                trend="up"
                icon={Building2}
                color="blue"
                delay={0.1}
              />
              <CRMMetricCard 
                title="Active Accounts"
                value={activeCount}
                change="0%"
                trend="up"
                icon={Factory}
                color="emerald"
                delay={0.2}
              />
              <CRMMetricCard 
                title="Total Linked Customers"
                value={totalCustomers}
                change="0%"
                trend="up"
                icon={Briefcase}
                color="purple"
                delay={0.3}
              />
            </CRMMetricsGrid>
          </div>

          {/* Two-Stage Scroll Workspace */}
          <div className="crm-table-workspace-sticky">
            <CRMToolbar 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              placeholder="Search companies by name or industry..."
              sticky={false}
            >
              <div className="flex items-center gap-2">
                {["All", "Active", "Inactive"].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status.toLowerCase() ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setStatusFilter(status.toLowerCase())}
                    className="h-8 px-3 text-xs font-semibold"
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </CRMToolbar>

            <div className="flex-1 min-h-0 flex flex-col">
              <AnimatePresence mode="wait">
                {filteredCompanies.length > 0 ? (
                  <motion.div
                    key="companies-table"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col min-h-0"
                  >
                    <CompaniesTable 
                      companies={filteredCompanies} 
                      onEdit={(company) => {
                        setSelectedCompany(company);
                        setIsAddModalOpen(true);
                      }}
                      onDelete={handleDelete}
                    />
                  </motion.div>
                ) : (
                  <EmptyState
                    icon={Building2}
                    title="No companies found"
                    description="No companies match the current search or filters."
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
        title={selectedCompany ? "Edit Company" : "Add New Company"}
        description={selectedCompany ? "Update company details." : "Add a new company account to your CRM database."}
        isOpen={isAddModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) setSelectedCompany(null);
        }}
        size="lg"
      >
        <CompanyForm 
          initialData={selectedCompany || undefined}
          onSuccess={() => { setIsAddModalOpen(false); setSelectedCompany(null); refetch(); }} 
          onCancel={() => { setIsAddModalOpen(false); setSelectedCompany(null); }} 
        />
      </FormModal>

      <CompanyContextualSettings
        open={isCustomizeOpen}
        onOpenChange={setIsCustomizeOpen}
        defaultSection={customizeDefaultSection || "industries"}
      />
    </CRMPageContainer>
  );
};

export default CompaniesPage;
