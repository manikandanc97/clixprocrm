"use client";

import { useState, useRef, useMemo } from "react";
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import { 
  arrayMove, 
  sortableKeyboardCoordinates, 
} from "@dnd-kit/sortable";
import PipelineColumn from "./PipelineColumn";
import PipelineCard from "./PipelineCard";
import { PipelineToolbar } from "./PipelineToolbar";
import { PipelineLeadType, DealStage } from "@/shared/types/pipeline";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useCRMStore } from "@/shared/store/useCRMStore";
import { useUpdatePipelineItem } from "@/shared/hooks/use-crm";
import { DealDrawer } from "./DealDrawer";
import { WonLostModal, WonLostSubmitData } from "./WonLostModal";
import { ConfirmMoveModal } from "./ConfirmMoveModal";

const stages: PipelineLeadType["stage"][] = [DealStage.NEW, DealStage.QUALIFIED, DealStage.PROPOSAL, DealStage.NEGOTIATION, DealStage.WON, DealStage.LOST];

interface PipelineBoardProps {
  items: PipelineLeadType[];
  onAddDeal?: (stage: string) => void;
}

const PipelineBoard = ({ items, onAddDeal }: PipelineBoardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortValue, setSortValue] = useState("created_desc");
  const [filterValue, setFilterValue] = useState("all");

  const [activeItem, setActiveItem] = useState<PipelineLeadType | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<PipelineLeadType | null>(null);
  const [wonLostModal, setWonLostModal] = useState<{ isOpen: boolean; type: DealStage.WON | DealStage.LOST | null; deal: PipelineLeadType | null; originalStage: PipelineLeadType["stage"] | null }>({
    isOpen: false,
    type: null,
    deal: null,
    originalStage: null,
  });
  const [confirmMoveModal, setConfirmMoveModal] = useState<{ isOpen: boolean; deal: PipelineLeadType | null; targetStage: string | null; originalStage: string | null }>({
    isOpen: false,
    deal: null,
    targetStage: null,
    originalStage: null,
  });
  const originalStageRef = useRef<PipelineLeadType["stage"] | null>(null);
  
  const { movePipelineItem, setPipelineItems } = useCRMStore();
  const { mutate: updatePipelineItem, isPending: isUpdating } = useUpdatePipelineItem();

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.name?.toLowerCase().includes(q) ||
          item.company?.toLowerCase().includes(q)
      );
    }

    if (filterValue === "hot") {
      result = result.filter(
        (item) =>
          item.priority?.toUpperCase() === "HIGH" ||
          item.priority?.toUpperCase() === "URGENT" ||
          (item.probability || 0) >= 70
      );
    } else if (filterValue === "stuck") {
      result = result.filter((item) => item.isStuck);
    }

    if (sortValue === "value_desc") {
      result.sort((a, b) => (b.valueAmount || 0) - (a.valueAmount || 0));
    } else if (sortValue === "prob_desc") {
      result.sort((a, b) => (b.probability || 0) - (a.probability || 0));
    } else if (sortValue === "created_desc") {
      result.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
    }

    return result;
  }, [items, searchQuery, filterValue, sortValue]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = items.find((i) => i.id === active.id);
    if (item) {
      setActiveItem(item);
      originalStageRef.current = item.stage;
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveACard = active.data.current?.type === "Card";
    const isOverACard = over.data.current?.type === "Card";
    const isOverAColumn = over.data.current?.type === "Column";

    if (!isActiveACard) return;

    if (isOverACard) {
      const activeIndex = items.findIndex((i) => i.id === activeId);
      const overIndex = items.findIndex((i) => i.id === overId);

      if (items[activeIndex].stage !== items[overIndex].stage) {
        movePipelineItem(activeId as string, items[overIndex].stage);
      } else {
        const newItems = arrayMove(items, activeIndex, overIndex);
        setPipelineItems(newItems);
      }
    }

    if (isOverAColumn && stages.includes(overId as PipelineLeadType["stage"])) {
      movePipelineItem(activeId as string, overId as PipelineLeadType["stage"]);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    // Capture the original stage reliably
    const originalStage = originalStageRef.current || activeItem?.stage || active.data.current?.item?.stage || "New Lead";
    setActiveItem(null);
    originalStageRef.current = null;

    if (!over) {
      movePipelineItem(active.id as string, originalStage);
      return;
    }

    const activeId = active.id;

    // Always read from the most up-to-date store state directly,
    // since handleDragOver already moved the item to the new column synchronously.
    const currentStoreItems = useCRMStore.getState().pipelineItems;
    const movedItem = currentStoreItems.find(i => i.id === activeId);

    if (movedItem) {
      const targetStage = movedItem.stage;
      // Unified entry point for handling stage changes (from Drag & Drop or Dropdown)
      handleStageChange(movedItem, targetStage, originalStage);
    }
  };

  const handleStageChange = (deal: PipelineLeadType, targetStage: string, originalStage: string) => {
    // Prevent API call if dropped in the same column, but ensure visual state is correct
    if (targetStage === originalStage) {
      movePipelineItem(deal.id as string, originalStage as ReturnType<typeof JSON.parse>);
      return;
    }

    if (targetStage === DealStage.LOST || targetStage === DealStage.WON) {
      setWonLostModal({
        isOpen: true,
        type: targetStage as DealStage.WON | DealStage.LOST,
        deal: { ...deal, stage: targetStage as ReturnType<typeof JSON.parse> },
        originalStage: originalStage as ReturnType<typeof JSON.parse>
      });
      return;
    }

    // Regular stage change
    setConfirmMoveModal({
      isOpen: true,
      deal: { ...deal, stage: originalStage as ReturnType<typeof JSON.parse> },
      targetStage,
      originalStage,
    });
  };

  const handleConfirmMoveSubmit = () => {
    if (!confirmMoveModal.deal || !confirmMoveModal.targetStage || !confirmMoveModal.originalStage) return;
    
    const deal = confirmMoveModal.deal;
    const targetStage = confirmMoveModal.targetStage;
    const originalStage = confirmMoveModal.originalStage;

    const stage = targetStage;


    // Update local state to reflect the move visually before API if not already done
    movePipelineItem(deal.id as string, targetStage as ReturnType<typeof JSON.parse>);
    
    updatePipelineItem({ 
      id: deal.id as string, 
      data: { stage } 
    }, {
      onSuccess: () => {
        if (originalStage === DealStage.WON) {
          toast.success(`Deal moved from Won to ${targetStage}.`, {
            description: "Customer status updated successfully.",
          });
        } else {
          toast.success(`Deal moved from ${originalStage} to ${targetStage}.`);
        }
        setConfirmMoveModal(prev => ({ ...prev, isOpen: false }));
      },
      onError: () => {
        movePipelineItem(deal.id as string, originalStage as ReturnType<typeof JSON.parse>);
        toast.error("Unable to update deal. No changes were saved.");
        setConfirmMoveModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleConfirmMoveCancel = () => {
    if (confirmMoveModal.deal && confirmMoveModal.originalStage) {
      movePipelineItem(confirmMoveModal.deal.id as string, confirmMoveModal.originalStage as ReturnType<typeof JSON.parse>);
    }
    setConfirmMoveModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleAddStage = () => {
    toast.info("Add Pipeline Stage", {
      description: "Opening stage configuration panel...",
    });
  };

  const handleWonLostSubmit = (data: WonLostSubmitData) => {
    if (!wonLostModal.deal || !wonLostModal.type) return;
    
    
    const stage = wonLostModal.type;
    
    // Update locally
    movePipelineItem(wonLostModal.deal.id as string, stage);

    updatePipelineItem({
      id: wonLostModal.deal.id as string,
      data: {
        stage,
        ...(stage === DealStage.WON 
            ? { wonReason: data.reason, wonDate: data.wonDate, actualRevenue: data.actualRevenue, notes: data.notes } 
            : { lostReason: data.reason, competitor: data.competitor, notes: data.notes })
      }
    }, {
      onSuccess: () => {
        if (wonLostModal.type === DealStage.WON) {
          toast.success(`Deal moved from ${wonLostModal.originalStage} to Won.`, {
            description: "Lead successfully converted to Customer.",
          });
        } else {
          if (wonLostModal.originalStage === DealStage.WON) {
            toast.success(`Deal moved from Won to Lost.`, {
              description: "Customer status updated successfully.",
            });
          } else {
            toast.success(`Deal moved from ${wonLostModal.originalStage} to Lost.`);
          }
        }
        setWonLostModal(prev => ({ ...prev, isOpen: false }));
      },
      onError: () => {
        if (wonLostModal.originalStage && wonLostModal.deal) {
          movePipelineItem(wonLostModal.deal.id as string, wonLostModal.originalStage);
        }
        toast.error("Unable to update deal. No changes were saved.");
        setWonLostModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleWonLostCancel = () => {
    if (wonLostModal.deal && wonLostModal.originalStage) {
      // Revert the move
      movePipelineItem(wonLostModal.deal.id as string, wonLostModal.originalStage);
    }
    setWonLostModal(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="relative flex-1 min-h-0 flex flex-col h-full">
      <PipelineToolbar
        onSearch={setSearchQuery}
        onSort={setSortValue}
        onFilter={setFilterValue}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 min-h-0 flex gap-5 overflow-x-auto overflow-y-hidden pb-2.5 kanban-board-scroll items-stretch">
          {stages.map((stage) => {
            const stageItems = filteredItems.filter((item) => item.stage === stage);

            return (
              <PipelineColumn 
                key={stage} 
                title={stage} 
                items={stageItems} 
                onSelectDeal={setSelectedDeal}
                onAddDeal={onAddDeal}
              />
            );
          })}
          
          {/* Add Stage Placeholder */}
          <div 
            onClick={handleAddStage}
            className="min-w-[340px] max-w-[340px] h-full rounded-xl border-2 border-dashed border-border/60 bg-muted/10 flex flex-col items-center justify-center gap-4 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group shadow-sm relative overflow-hidden shrink-0"
          >
             {/* Subtle Background Pattern/Glow */}
             <div className="absolute inset-0 bg-gradient-to-b from-transparent to-muted/20 pointer-events-none" />
             
             <div className="w-12 h-12 rounded-2xl bg-background border border-border shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:-translate-y-1 group-hover:shadow-md transition-all duration-300 relative z-10">
               <Plus className="w-6 h-6" />
             </div>
             <div className="flex flex-col items-center gap-1 z-10">
                <span className="text-[13px] font-bold uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">Add New Stage</span>
                <span className="text-[11px] font-medium text-muted-foreground/70">Customize your pipeline</span>
             </div>
          </div>
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: "0.5",
              },
            },
          }),
        }}>
          {activeItem ? (
            <PipelineCard item={activeItem} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
      
      <DealDrawer 
        item={selectedDeal} 
        isOpen={!!selectedDeal} 
        onClose={() => setSelectedDeal(null)} 
        onStageChange={(deal, targetStage) => {
          setSelectedDeal(null);
          // Briefly timeout to allow drawer to close before opening the modal
          setTimeout(() => handleStageChange(deal, targetStage, deal.stage), 150);
        }}
      />
      
      <ConfirmMoveModal 
        isOpen={confirmMoveModal.isOpen}
        deal={confirmMoveModal.deal}
        targetStage={confirmMoveModal.targetStage}
        onClose={handleConfirmMoveCancel}
        onSubmit={handleConfirmMoveSubmit}
        isLoading={isUpdating}
      />

      <WonLostModal 
        isOpen={wonLostModal.isOpen}
        type={wonLostModal.type}
        deal={wonLostModal.deal}
        onClose={handleWonLostCancel}
        onSubmit={handleWonLostSubmit}
        isLoading={isUpdating}
      />
    </div>
  );
};

export default PipelineBoard;
