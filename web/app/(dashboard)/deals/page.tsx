"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Handshake, Plus, Settings } from "lucide-react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

import { KanbanSkeleton } from "@/shared/components/skeletons";

const PipelineBoard = dynamic(() => import("@/features/pipeline/components/PipelineBoard"), {
  loading: () => <KanbanSkeleton />
});

import { PageErrorState } from "@/shared/components/crm/PageFeedbackStates";
import { DealsSkeleton } from "@/features/deals/components/DealsSkeleton";
import { usePipeline } from "@/shared/hooks/use-crm";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/components/EmptyState";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { CRMPageContainer } from "@/shared/components/crm";
import { FormModal } from "@/shared/components/crm/FormModal";
import { DealForm } from "@/features/forms/DealForm";
import { useCRMStore } from "@/shared/store/useCRMStore";
import { DealContextualSettings } from "@/features/deals/components/DealContextualSettings";
import { useAuth } from "@/features/auth/components/auth-provider";

const DealsPage = () => {
  const { isHydrated, isAuthenticated, isInitializing } = useAuth();
  const searchParams = useSearchParams();

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

  const sortedPipelineItems = useMemo(() => {
    return [...safePipelineItems].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }, [safePipelineItems]);

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

  return (
    <CRMPageContainer className="h-full">
      {/* 1. Header Layout */}
      <div className="shrink-0 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
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
        <div className="flex-1 min-h-0 flex flex-col h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key="pipeline-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col min-h-0 h-full"
            >
              <PipelineBoard 
                items={sortedPipelineItems} 
                onAddDeal={handleNewDeal} 
              />
            </motion.div>
          </AnimatePresence>
        </div>
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
