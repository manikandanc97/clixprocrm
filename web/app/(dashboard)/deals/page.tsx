"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Handshake, Plus, TrendingUp, Target, Banknote, Filter, ArrowUpDown, Settings } from "lucide-react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { KanbanSkeleton } from "@/shared/components/skeletons";

const PipelineBoard = dynamic(() => import("@/features/pipeline/components/PipelineBoard"), {
  loading: () => <KanbanSkeleton />
});

import { PageErrorState } from "@/shared/components/page-states";
import { DealsSkeleton } from "@/features/deals/components/DealsSkeleton";
import { usePipeline } from "@/shared/hooks/use-crm";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/components/EmptyState";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { 
  CRMMetricCard, 
  CRMToolbar,
  CRMPageContainer,
  CRMMetricsGrid
} from "@/shared/components/crm";
import { FormModal } from "@/shared/components/form-modal";
import { DealForm } from "@/features/forms/DealForm";
import { formatCurrency } from "@/lib/crm-formatters";
import { useCRMStore } from "@/shared/store/useCRMStore";
import { DealContextualSettings } from "@/features/deals/components/DealContextualSettings";

import { useAuth } from "@/features/auth/components/auth-provider";

const DealsPage = () => {
  const { isHydrated, isAuthenticated, isInitializing } = useAuth();
  const searchParams = useSearchParams();
  const currency = useCRMStore((state) => state.currency);
  
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pipeline specific state
  const [pipelineSort, setPipelineSort] = useState("created_desc");
  const [pipelineFilter, setPipelineFilter] = useState("all");

  const { data: pipelineData, isLoading: pipelineLoading, isPending: pipelinePending, error: pipelineError, refetch: refetchPipeline } = usePipeline();

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

  const handleNewDeal = (stage?: string) => {
    setPreselectedStage(stage);
    setIsAddModalOpen(true);
  };

  const isInitialLoading = !pipelineData && (pipelineLoading || pipelinePending || !isHydrated || !isAuthenticated || isInitializing);

  if (isInitialLoading) {
    return <DealsSkeleton />;
  }

  if (pipelineError) {
    return (
      <PageErrorState
        title="Error Loading Deals"
        message="An error occurred while fetching deals"
        onRetry={() => { refetchPipeline(); }}
      />
    );
  }

  let filteredPipelineItems = [...safePipelineItems];
  if (searchQuery) {
    filteredPipelineItems = filteredPipelineItems.filter(item => 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.company?.toLowerCase().includes(searchQuery.toLowerCase())
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
      {/* 1. Header Layout */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div
            data-animate-target="true"
            className="group h-10 w-10 rounded-xl bg-card border border-border/80 flex items-center justify-center text-muted-foreground shadow-xs shrink-0 hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer select-none"
          >
            <AppIcon
              name="deals"
              icon={Handshake}
              size={18}
              className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors"
            />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              Deals & Pipeline
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track sales opportunities, manage stages, and forecast revenue.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsCustomizeOpen(true)}
            className="group font-semibold text-xs h-9 px-3 rounded-lg shadow-xs gap-1.5 cursor-pointer border-border/70 bg-background hover:bg-muted/50 text-foreground"
          >
            <AppIcon
              name="settings"
              icon={Settings}
              size={14}
              className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
            />
            <span>Customize</span>
          </Button>

          <Button
            onClick={() => handleNewDeal()}
            className="group bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-3.5 rounded-lg shadow-xs gap-1.5 cursor-pointer transition-colors"
          >
            <AppIcon
              name="plus"
              icon={Plus}
              size={14}
              className="w-3.5 h-3.5 text-white shrink-0"
            />
            <span>Create Deal</span>
          </Button>
        </div>
      </div>

      {safePipelineItems.length === 0 ? (
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
                value={safePipelineItems.length}
                change="0%"
                trend="up"
                icon={Target}
                color="blue"
                delay={0.1}
              />
              <CRMMetricCard 
                title="Stuck Deals"
                value={safePipelineItems.filter(item => item.isStuck).length}
                change="0%"
                trend={safePipelineItems.filter(item => item.isStuck).length > 0 ? "down" : "up"}
                icon={TrendingUp}
                color="pink"
                delay={0.2}
              />
              <CRMMetricCard 
                title="Pipeline Value"
                value={formatCurrency(
                  safePipelineItems.reduce((acc, item) => acc + (item.valueAmount || 0), 0), 
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
              placeholder="Search deals by name or company..."
              sticky={false}
            >
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
            </CRMToolbar>

            <div className="flex-1 min-h-0 flex flex-col">
              <AnimatePresence mode="wait">
                {filteredPipelineItems.length > 0 ? (
                  <motion.div
                    key="pipeline-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col min-h-0"
                  >
                    <PipelineBoard 
                      items={filteredPipelineItems} 
                      onAddDeal={handleNewDeal} 
                    />
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
          onSuccess={() => { setIsAddModalOpen(false); setSelectedDeal(null); refetchPipeline(); }} 
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
