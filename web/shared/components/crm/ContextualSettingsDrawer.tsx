"use client";

import React, { useState, useEffect, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { LucideIcon, Save, X, Check, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AppIcon } from "@/shared/components/icons/icon-registry";

export interface ContextualSettingSection {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: string;
  component: ReactNode;
}

export interface ContextualSettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: string;
  sections: ContextualSettingSection[];
  defaultSection?: string;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  onSave?: () => Promise<void> | void;
  onReset?: () => void;
  className?: string;
  autoSave?: boolean;
  autoSaveStatus?: "saved" | "saving" | "idle";
}

export function ContextualSettingsDrawer({
  open,
  onOpenChange,
  title,
  subtitle = "Configure module preferences, custom fields, and automated workflows.",
  icon: Icon,
  badge,
  sections,
  defaultSection,
  isSaving = false,
  hasUnsavedChanges = false,
  onSave,
  onReset,
  className,
  autoSave = false,
  autoSaveStatus = "idle",
}: ContextualSettingsDrawerProps) {
  const [activeSectionId, setActiveSectionId] = useState<string>(
    defaultSection || sections[0]?.id || ""
  );
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Sync active section ONLY when drawer opens
  useEffect(() => {
    if (open) {
      setActiveSectionId(defaultSection || sections[0]?.id || "");
    }
  }, [open, defaultSection]);

  // Fallback if current activeSectionId no longer exists
  useEffect(() => {
    if (sections.length > 0 && !sections.some((s) => s.id === activeSectionId)) {
      setActiveSectionId(sections[0].id);
    }
  }, [sections, activeSectionId]);

  const handleRequestClose = (nextOpen: boolean) => {
    if (!nextOpen && hasUnsavedChanges && !autoSave) {
      setShowExitConfirm(true);
      return;
    }
    onOpenChange(nextOpen);
  };

  const handleConfirmDiscard = () => {
    setShowExitConfirm(false);
    if (onReset) onReset();
    onOpenChange(false);
  };

  const activeSection = sections.find((s) => s.id === activeSectionId) || sections[0];

  return (
    <>
      <Dialog open={open} onOpenChange={handleRequestClose}>
        <DialogContent
          className={cn(
            "w-full sm:max-w-4xl lg:max-w-5xl md:w-[860px] lg:w-[980px] h-[600px] max-h-[85vh] p-0 gap-0 overflow-hidden border border-border/80 bg-card text-foreground shadow-2xl rounded-2xl flex flex-col duration-200 outline-none",
            className
          )}
          showCloseButton={false}
        >
          {/* Header */}
          <DialogHeader className="shrink-0 px-5 sm:px-6 py-3 border-b border-border/60 bg-muted/20 flex-row items-center justify-between gap-4 space-y-0">
            <div className="flex items-center gap-3 min-w-0">
              {Icon && (
                <div
                  data-animate-target="true"
                  className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-xs group"
                >
                  <AppIcon name={title} icon={Icon} size={18} className="w-4.5 h-4.5" animateOnMount />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-sm sm:text-base font-bold text-foreground tracking-tight truncate">
                    {title}
                  </DialogTitle>
                  {badge && (
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shrink-0"
                    >
                      {badge}
                    </Badge>
                  )}
                </div>
                <DialogDescription className="text-xs text-muted-foreground truncate max-w-md sm:max-w-xl mt-0.5">
                  {subtitle}
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleRequestClose(false)}
              className="group text-muted-foreground hover:text-foreground h-8 w-8 rounded-lg shrink-0 cursor-pointer hover:bg-muted/60"
            >
              <AppIcon name="close" icon={X} size={16} className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogHeader>

          {/* Modal Body: Sidebar Tabs + Content Area */}
          <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
            {/* Navigation Tabs Rail */}
            <div className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-border/60 bg-muted/10 p-3 overflow-x-auto md:overflow-y-auto flex md:flex-col gap-1.5 custom-scrollbar">
              <div className="hidden md:block px-2.5 py-1 text-[10.5px] font-bold text-muted-foreground/75 uppercase tracking-wider mb-1">
                Configuration Sections
              </div>
              {sections.map((section) => {
                const isSelected = section.id === activeSection?.id;
                const SecIcon = section.icon;
                return (
                  <button
                    key={section.id}
                    type="button"
                    data-animate-target="true"
                    onClick={() => setActiveSectionId(section.id)}
                    className={cn(
                      "group relative flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl transition-all duration-150 text-left outline-none cursor-pointer whitespace-nowrap md:whitespace-normal font-medium",
                      isSelected
                        ? "text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-500/10 border border-emerald-500/20 shadow-xs"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground border border-transparent"
                    )}
                  >
                    {SecIcon && (
                      <div className="shrink-0 flex items-center justify-center">
                        <AppIcon
                          name={section.label}
                          icon={SecIcon}
                          size={16}
                          className={cn(
                            "w-4 h-4 transition-colors",
                            isSelected
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />
                      </div>
                    )}
                    <span className="flex-1 truncate">{section.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Section Content */}
            <div className="flex-1 min-w-0 h-full overflow-y-auto p-4 sm:p-5 custom-scrollbar bg-background/50">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeSection?.id || "empty"}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-4 max-w-4xl"
                >
                  {activeSection?.component}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Sticky Footer Save Bar */}
          <div className="shrink-0 px-5 sm:px-6 py-3.5 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              {autoSave ? (
                autoSaveStatus === "saving" ? (
                  <span className="flex items-center gap-1.5 text-muted-foreground font-medium animate-in fade-in duration-150">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                    Saving...
                  </span>
                ) : autoSaveStatus === "saved" ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold animate-in fade-in duration-150">
                    <AppIcon name="check" icon={Check} size={13} className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ✓ Saved
                  </span>
                ) : (
                  <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium">
                    <AppIcon name="check" icon={Check} size={13} className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ✓ Changes saved automatically
                  </span>
                )
              ) : hasUnsavedChanges ? (
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold animate-in fade-in duration-200">
                  <AppIcon name="alert" icon={AlertTriangle} size={14} className="w-3.5 h-3.5 text-amber-500" />
                  Unsaved changes
                </span>
              ) : (
                <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium">
                  <AppIcon name="check" icon={Check} size={13} className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Auto-synced with workspace
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleRequestClose(false)}
                className="h-8.5 px-3.5 text-xs font-semibold rounded-lg border-border/70 bg-background hover:bg-muted/50 cursor-pointer"
                disabled={isSaving}
              >
                Close
              </Button>
              {!autoSave && onSave && (
                <Button
                  type="button"
                  size="sm"
                  onClick={onSave}
                  disabled={isSaving || !hasUnsavedChanges}
                  className={cn(
                    "group h-8.5 px-4 text-xs font-semibold gap-1.5 rounded-lg shadow-sm transition-all duration-150",
                    hasUnsavedChanges
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs active:scale-98"
                      : "bg-muted text-muted-foreground/60 border border-border/50 cursor-not-allowed opacity-60 hover:bg-muted hover:text-muted-foreground/60"
                  )}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <AppIcon
                        name="save"
                        icon={Save}
                        size={14}
                        className={cn(
                          "w-3.5 h-3.5 shrink-0",
                          hasUnsavedChanges ? "text-white" : "text-muted-foreground/60"
                        )}
                      />
                      Save Changes
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Discard Unsaved Changes?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              You have unsaved changes in this module configuration. If you close now, your pending modifications will be discarded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs font-semibold h-8.5">
              Keep Editing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDiscard}
              className="text-xs font-semibold h-8.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Discard & Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
export { ContextualSettingsDrawer as ContextualSettingsModal };
