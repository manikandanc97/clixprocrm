"use client";

import React, { useState, useEffect, ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/shared/ui/sheet";
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
}

export function ContextualSettingsDrawer({
  open,
  onOpenChange,
  title,
  subtitle = "Configure module preferences, custom fields, and automated workflows.",
  icon: Icon,
  badge = "Customization",
  sections,
  defaultSection,
  isSaving = false,
  hasUnsavedChanges = false,
  onSave,
  onReset,
  className,
}: ContextualSettingsDrawerProps) {
  const [activeSectionId, setActiveSectionId] = useState<string>(
    defaultSection || sections[0]?.id || ""
  );
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    if (defaultSection) {
      setActiveSectionId(defaultSection);
    } else if (sections.length > 0 && !sections.some((s) => s.id === activeSectionId)) {
      setActiveSectionId(sections[0].id);
    }
  }, [defaultSection, sections, activeSectionId]);

  const handleRequestClose = (nextOpen: boolean) => {
    if (!nextOpen && hasUnsavedChanges) {
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
      <Sheet open={open} onOpenChange={handleRequestClose}>
        <SheetContent
          side="right"
          className={cn(
            "p-0 sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl w-full flex flex-col h-full bg-background border-l border-border/80 shadow-2xl z-50",
            className
          )}
          showCloseButton={false}
        >
          {/* Header */}
          <div className="shrink-0 px-5 py-4 border-b border-border/60 bg-muted/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {Icon && (
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-xs">
                  <AppIcon name={title} icon={Icon} size={18} className="w-4.5 h-4.5" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground tracking-tight truncate">
                    {title}
                  </h3>
                  {badge && (
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border-primary/20 bg-primary/10 text-primary"
                    >
                      {badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate max-w-md sm:max-w-lg">
                  {subtitle}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleRequestClose(false)}
              className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-lg shrink-0"
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* Drawer Body: Sidebar Tabs + Content Area */}
          <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
            {/* Navigation Tabs Rail */}
            <div className="w-full md:w-56 lg:w-64 shrink-0 border-b md:border-b-0 md:border-r border-border/60 bg-muted/10 p-3 overflow-x-auto md:overflow-y-auto flex md:flex-col gap-1 custom-scrollbar">
              <div className="hidden md:block px-2.5 py-1.5 text-[10.5px] font-bold text-muted-foreground/75 uppercase tracking-wider mb-1">
                Configuration Sections
              </div>
              {sections.map((section) => {
                const isSelected = section.id === activeSection?.id;
                const SecIcon = section.icon;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSectionId(section.id)}
                    className={cn(
                      "group relative flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-all duration-150 text-left outline-none cursor-pointer whitespace-nowrap md:whitespace-normal",
                      isSelected
                        ? "text-primary font-semibold bg-primary/10 border border-primary/20 shadow-xs"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground font-medium"
                    )}
                  >
                    {SecIcon && (
                      <SecIcon
                        className={cn(
                          "w-3.5 h-3.5 shrink-0 transition-colors",
                          isSelected
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                    )}
                    <span className="flex-1 truncate">{section.label}</span>
                    {section.badge && (
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1.5 py-0 h-4 font-medium hidden sm:inline-flex"
                      >
                        {section.badge}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Section Content */}
            <div className="flex-1 min-w-0 h-full overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-background/50">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeSection?.id || "empty"}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-6 max-w-4xl"
                >
                  {activeSection?.component}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Sticky Footer Save Bar */}
          <div className="shrink-0 px-5 py-3.5 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              {hasUnsavedChanges ? (
                <span className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Unsaved changes
                </span>
              ) : (
                <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                  <Check className="w-3 h-3 text-primary" /> Auto-synced with workspace
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleRequestClose(false)}
                className="h-8.5 px-3.5 text-xs font-semibold"
                disabled={isSaving}
              >
                Close
              </Button>
              {onSave && (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={onSave}
                  disabled={isSaving}
                  className="h-8.5 px-4 text-xs font-semibold gap-1.5 shadow-sm"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Save Changes
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

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
