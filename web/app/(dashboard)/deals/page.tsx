"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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
import { EmptyState } from "@/shared/components/EmptyState";
import { CRMPageContainer, CRMPageHeader } from "@/shared/components/crm";
import { FormModal } from "@/shared/components/crm/FormModal";
import { DealForm } from "@/features/forms/DealForm";
import { useCRMStore } from "@/shared/store/useCRMStore";
import { DealContextualSettings } from "@/features/deals/components/DealContextualSettings";
import { useAuth } from "@/features/auth/components/auth-provider";
import { PipelineLeadType, DealStage } from "@/shared/types/pipeline";

const DealsPage = () => {
  const { isHydrated, isAuthenticated, isInitializing } = useAuth();
  const searchParams = useSearchParams();

  const { data: pipelineData, isLoading: pipelineLoading, isPending: pipelinePending, error: pipelineError, refetch: refetchPipeline } = usePipeline();

  const { pipelineItems, setPipelineItems } = useCRMStore();

  const customizeParam = searchParams.get("customize");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(() => Boolean(customizeParam));
  const customizeDefaultSection = customizeParam && customizeParam !== "true" ? customizeParam : undefined;
  const [selectedDeal, setSelectedDeal] = useState<PipelineLeadType | null>(null);
  const [preselectedStage, setPreselectedStage] = useState<string | undefined>();

  const newParamHandledRef = useRef(false);
  useEffect(() => {
    if (searchParams.get("new") === "true" && !newParamHandledRef.current) {
      newParamHandledRef.current = true;
      setIsAddModalOpen(true);
      if (typeof window !== "undefined") {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
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
    const items = Array.isArray(pipelineItems) ? pipelineItems : [];
    return [...items].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }, [pipelineItems]);

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
      <CRMPageHeader
        title="Deals & Pipeline"
        description="Track sales opportunities, manage stages, and forecast revenue."
        icon={Handshake}
        secondaryActions={[
          {
            label: "Customize",
            icon: Settings,
            onClick: () => setIsCustomizeOpen(true),
            variant: "outline",
          },
        ]}
        primaryAction={{
          label: "Create Deal",
          icon: Plus,
          onClick: () => handleNewDeal(),
        }}
      />

      {sortedPipelineItems.length === 0 ? (
        <div className="flex-1 min-h-0 flex flex-col mt-4">
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
        <div className="flex-1 min-h-0 flex flex-col h-full mt-4">
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
          initialStage={preselectedStage as DealStage | undefined}
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
