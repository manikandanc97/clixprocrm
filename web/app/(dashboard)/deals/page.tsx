"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Handshake, Plus, TrendingUp, Target, Banknote, List, GitBranch, Filter, ArrowUpDown, Settings } from "lucide-react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { TableSkeleton, KanbanSkeleton } from "@/shared/components/skeletons";

const DealsTable = dynamic(() => import("@/features/deals/components/DealsTable").then(mod => ({ default: mod.DealsTable })), {
  loading: () => <TableSkeleton rows={8} cols={7} showPagination={true} />
});
const PipelineBoard = dynamic(() => import("@/features/pipeline/components/PipelineBoard"), {
  loading: () => <KanbanSkeleton />
});

import { PageErrorState } from "@/shared/components/page-states";
import { DealsSkeleton } from "@/features/deals/components/DealsSkeleton";
import { useDeals, useDeleteDeal, useBulkDeleteDeals, usePipeline } from "@/shared/hooks/use-crm";
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
import { DealForm } from "@/features/forms/DealForm";
import { useViewMode } from "@/shared/hooks/useViewMode";
import { formatCurrency } from "@/lib/crm-formatters";
import { useCRMStore } from "@/shared/store/useCRMStore";
import { DealContextualSettings } from "@/features/deals/components/DealContextualSettings";

import { useAuth } from "@/features/auth/components/auth-provider";

const DealsPage = () => {
  const { isHydrated, isAuthenticated, isInitializing } = useAuth();
  const searchParams = useSearchParams();
  const currency = useCRMStore((state) => state.currency);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  
  // Pipeline specific state
  const [pipelineSort, setPipelineSort] = useState("created_desc");
  const [pipelineFilter, setPipelineFilter] = useState("all");

  const [viewMode, setViewMode] = useViewMode("deals", "list");

  // Sync viewMode with URL
  useEffect(() => {
    const v = searchParams.get("view");
    if (v === "pipeline" && viewMode !== "pipeline") {
      setViewMode("pipeline");
    } else if (viewMode === "pipeline" && v !== "pipeline") {
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", "pipeline");
      window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
    } else if (viewMode !== "pipeline" && v === "pipeline") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("view");
      window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
    }
  }, [searchParams, viewMode, setViewMode]);

  const { data: dealsData, isLoading: dealsLoading, isPending: dealsPending, error: dealsError, refetch: refetchDeals } = useDeals();
  const { data: pipelineData, isLoading: pipelineLoading, isPending: pipelinePending, error: pipelineError, refetch: refetchPipeline } = usePipeline();

  const deleteDeal = useDeleteDeal();
  const deleteDealsBulk = useBulkDeleteDeals();
  
  const safeDeals = useMemo(() => Array.isArray(dealsData?.deals) ? dealsData.deals : [], [dealsData]);
  
  const { pipelineItems, setPipelineItems } = useCRMStore();
  const safePipelineItems = Array.isArray(pipelineItems) ? pipelineItems : [];

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [customizeDefaultSection, setCustomizeDefaultSection] = useState<string | undefined>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null);
  const [preselectedStage, setPreselectedStage] = useState<string | undefined>();

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
    if (searchParams.get("new") === "true") {
      const timer = setTimeout(() => {
        setIsAddModalOpen(true);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  useEffect(() => {
    if (pipelineData?.items) {
      setPipelineItems(pipelineData.items);
    }
  }, [pipelineData?.items, setPipelineItems]);

  const filteredDeals = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return safeDeals.filter((deal: any) => {
      const normalizedQuery = searchQuery.toLowerCase();
      const matchesSearch =
        deal.name?.toLowerCase().includes(normalizedQuery) ||
        deal.company?.name?.toLowerCase().includes(normalizedQuery);
      
      const matchesStage =
        stageFilter === "all" || (deal.stage || "NEW").toLowerCase() === stageFilter.toLowerCase();
      
      return matchesSearch && matchesStage;
    });
  }, [safeDeals, searchQuery, stageFilter]);

  const handleNewDeal = (stage?: string) => {
    setPreselectedStage(stage);
    setIsAddModalOpen(true);
  };

  const isInitialLoading =
    viewMode === "pipeline"
      ? !pipelineData && (pipelineLoading || pipelinePending || !isHydrated || !isAuthenticated || isInitializing)
      : !dealsData && (dealsLoading || dealsPending || !isHydrated || !isAuthenticated || isInitializing);

  if (isInitialLoading) {
    return <DealsSkeleton viewMode={viewMode} />;
  }

  if ((dealsError && viewMode !== "pipeline") || (pipelineError && viewMode === "pipeline")) {
    return (
      <PageErrorState
        title="Error Loading Deals"
        message="An error occurred while fetching deals"
        onRetry={() => { refetchDeals(); refetchPipeline(); }}
      />
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalValue = safeDeals.reduce((acc: number, d: any) => acc + (parseFloat(d.value) || 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wonDeals = safeDeals.filter((d: any) => d.stage === "WON");

  let filteredPipelineItems = [...safePipelineItems];
  if (searchQuery) {
    filteredPipelineItems = filteredPipelineItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.company.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  if (pipelineFilter === "hot") {
    filteredPipelineItems = filteredPipelineItems.filter(item => item.temperature === "Hot");
  } else if (pipelineFilter === "stuck") {
    filteredPipelineItems = filteredPipelineItems.filter(item => item.isStuck);
  }
  if (pipelineSort === "value_desc") {
    filteredPipelineItems.sort((a, b) => (b.valueAmount || 0) - (a.valueAmount || 0));
  } else if (pipelineSort === "prob_desc") {
    filteredPipelineItems.sort((a, b) => (b.probability || 0) - (a.probability || 0));
  } else {
    filteredPipelineItems.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  return (
    <CRMPageContainer twoStageScroll>
      <CRMPageHeader 
        title="Deals & Pipeline"
        subtitle="Track sales opportunities, manage stages, and forecast revenue."
        icon={Handshake}
        badge="Sales Operations"
        actions={[
          {
            label: "Customize",
            icon: Settings,
            onClick: () => setIsCustomizeOpen(true),
            variant: "outline",
          },
          {
            label: "New Deal",
            icon: Plus,
            onClick: () => handleNewDeal(),
            variant: "default"
          }
        ]}
      />

      {(viewMode === "pipeline" ? safePipelineItems.length === 0 : safeDeals.length === 0) ? (
        <div className="flex-1 min-h-0 flex flex-col">
          <EmptyState
            module="deals"
            action={{
              label: "Create Deal",
              onClick: () => handleNewDeal(),
              icon: Plus,
            }}
          />
        </div>
      ) : (
        <>
          <div className="shrink-0">
            <CRMMetricsGrid cols={3}>
              <CRMMetricCard 
                title="Total Opportunities"
                value={viewMode === "pipeline" ? safePipelineItems.length : safeDeals.length}
                change="0%"
                trend="up"
                icon={Target}
                color="blue"
                delay={0.1}
              />
              <CRMMetricCard 
                title={viewMode === "pipeline" ? "Stuck Deals" : "Deals Won"}
                value={viewMode === "pipeline" ? safePipelineItems.filter(item => item.isStuck).length : wonDeals.length}
                change="0%"
                trend={viewMode === "pipeline" && safePipelineItems.filter(item => item.isStuck).length > 0 ? "down" : "up"}
                icon={TrendingUp}
                color={viewMode === "pipeline" ? "pink" : "emerald"}
                delay={0.2}
              />
              <CRMMetricCard 
                title="Pipeline Value"
                value={formatCurrency(
                  viewMode === "pipeline" ? safePipelineItems.reduce((acc, item) => acc + (item.valueAmount || 0), 0) : totalValue, 
                  currency
                )}
                change="0%"
                trend="up"
                icon={Banknote}
                color="purple"
                delay={0.3}
              />
            </CRMMetricsGrid>
          </div>

          <div className="crm-table-workspace-sticky">
            <CRMToolbar 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                viewMode={viewMode}
                setViewMode={(m: string) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  setViewMode(m as any);
                  const params = new URLSearchParams(searchParams.toString());
                  if (m === "pipeline") {
                    params.set("view", "pipeline");
                  } else {
                    params.delete("view");
                  }
                  window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
                }}
                viewOptions={[
                  { id: "list", icon: List, label: "Table" },
                  { id: "pipeline", icon: GitBranch, label: "Pipeline" },
                ]}
                placeholder="Search deals by name or company..."
                sticky={false}
              >
                {viewMode === "pipeline" ? (
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 border-dashed">
                          <Filter className="w-4 h-4 mr-2" />
                          Filter
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuRadioGroup value={pipelineFilter} onValueChange={setPipelineFilter}>
                          <DropdownMenuRadioItem value="all">All Deals</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="hot">Hot Deals</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="stuck">Stuck Deals</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 border-dashed">
                          <ArrowUpDown className="w-4 h-4 mr-2" />
                          Sort
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuRadioGroup value={pipelineSort} onValueChange={setPipelineSort}>
                          <DropdownMenuRadioItem value="created_desc">Newest First</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="value_desc">Highest Value</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="prob_desc">Highest Probability</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
                    {["All", "New", "Qualified", "Proposal", "Negotiation", "Won", "Lost"].map((stage) => (
                      <Button
                        key={stage}
                        variant={stageFilter === stage.toLowerCase() ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setStageFilter(stage.toLowerCase())}
                        className="h-8 px-3 text-xs font-semibold whitespace-nowrap"
                      >
                        {stage.replace("_", " ")}
                      </Button>
                    ))}
                  </div>
                )}
              </CRMToolbar>

            <div className="flex-1 min-h-0 flex flex-col">
              <AnimatePresence mode="wait">
                {(viewMode === "pipeline" ? filteredPipelineItems.length > 0 : filteredDeals.length > 0) ? (
                  <motion.div
                    key={viewMode}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col min-h-0"
                  >
                    {viewMode !== "pipeline" ? (
                      <DealsTable 
                        deals={filteredDeals} 
                        onEdit={(deal) => {
                          setSelectedDeal(deal);
                          setIsAddModalOpen(true);
                        }}
                        onDelete={(id) => {
                          if (id.includes(",")) deleteDealsBulk.mutate(id.split(","));
                          else deleteDeal.mutate(id);
                        }}
                      />
                    ) : (
                      <PipelineBoard 
                        items={filteredPipelineItems} 
                        onAddDeal={handleNewDeal} 
                      />
                    )}
                  </motion.div>
                ) : (
                  <EmptyState
                    icon={Handshake}
                    title="No deals found"
                    description="No deals match the current search or filters."
                    action={{
                      label: "Clear Filters",
                      onClick: () => {
                        setSearchQuery("");
                        setStageFilter("all");
                        setPipelineFilter("all");
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
        title={selectedDeal ? "Edit Deal" : "Create New Deal"}
        description={selectedDeal ? "Update opportunity details." : "Add a new sales opportunity to your pipeline."}
        isOpen={isAddModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) setSelectedDeal(null);
        }}
        size="lg"
      >
        <DealForm 
          initialData={selectedDeal || undefined}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialStage={preselectedStage as any}
          onSuccess={() => { setIsAddModalOpen(false); setSelectedDeal(null); refetchDeals(); refetchPipeline(); }} 
          onCancel={() => { setIsAddModalOpen(false); setSelectedDeal(null); }} 
        />
      </FormModal>

      <DealContextualSettings
        open={isCustomizeOpen}
        onOpenChange={setIsCustomizeOpen}
        defaultSection={customizeDefaultSection || "pipelines"}
      />
    </CRMPageContainer>
  );
};

export default DealsPage;
