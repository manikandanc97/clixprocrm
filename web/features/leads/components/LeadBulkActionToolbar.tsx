"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/shared/ui/button";
import { AppIcon } from "@/shared/components/icons/icon-registry";

interface LeadBulkActionToolbarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onBulkEmail: () => void;
  onBulkUpdateStage: () => void;
  onBulkDelete: () => void;
}

export function LeadBulkActionToolbar({
  selectedIds,
  onClearSelection,
  onBulkEmail,
  onBulkUpdateStage,
  onBulkDelete,
}: LeadBulkActionToolbarProps) {
  return (
    <AnimatePresence>
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ y: 50, opacity: 0, x: "-50%" }}
          animate={{ y: 0, opacity: 1, x: "-50%" }}
          exit={{ y: 50, opacity: 0, x: "-50%" }}
          className="fixed bottom-8 left-1/2 z-50 w-[90%] md:w-auto"
        >
          <div className="bg-foreground text-background rounded-xl px-6 py-4 shadow-premium flex flex-col md:flex-row items-center gap-4 md:gap-6 border border-border/10 backdrop-blur-xl">
            <div className="flex items-center gap-3 md:pr-6 md:border-r border-background/20 w-full md:w-auto justify-between md:justify-start">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground text-xs shadow-sm">
                  {selectedIds.length}
                </div>
                <span className="text-xs font-bold whitespace-nowrap">Leads Selected</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="h-8 w-8 p-0 md:hidden text-muted hover:text-background"
              >
                <AppIcon name="close" size={16} />
              </Button>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
              <Button
                variant="ghost"
                size="sm"
                className="text-background/70 hover:text-background hover:bg-background/10 h-9 whitespace-nowrap gap-1.5"
                onClick={onBulkEmail}
              >
                <AppIcon name="mail" size={16} /> <span>Email</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-background/70 hover:text-background hover:bg-background/10 h-9 whitespace-nowrap gap-1.5"
                onClick={onBulkUpdateStage}
              >
                <AppIcon name="edit" size={16} /> <span>Update Stage</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-background/10 h-9 whitespace-nowrap text-rose-400 hover:text-rose-300 gap-1.5"
                onClick={onBulkDelete}
              >
                <AppIcon name="trash" size={16} className="text-rose-400" /> <span>Delete</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="h-9 w-9 p-0 hidden md:flex text-muted hover:text-background"
              >
                <AppIcon name="close" size={16} />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
