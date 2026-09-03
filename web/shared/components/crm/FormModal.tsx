"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";
import { UnsavedWarning } from "@/shared/components/unsaved-warning";
import { cn } from "@/shared/lib/utils";

export interface FormModalProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Optional footer action buttons slot */
  footer?: React.ReactNode;
  isOpen?: boolean;
  /** Canonical open prop (alias for isOpen) */
  open?: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: "dialog" | "sheet";
  size?: "sm" | "md" | "lg" | "xl" | "full";
  isDirty?: boolean; // Added for unsaved changes detection
  contentClassName?: string;
}

export const FormModal = ({
  title,
  description,
  children,
  footer,
  isOpen,
  open: directOpen,
  onOpenChange,
  variant = "dialog",
  size = "md",
  isDirty = false,
  contentClassName,
}: FormModalProps) => {
  const effectiveOpen = directOpen ?? isOpen ?? false;
  const [showWarning, setShowWarning] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (!open && isDirty) {
      setShowWarning(true);
      return;
    }
    onOpenChange(open);
  };

  const confirmClose = () => {
    setShowWarning(false);
    onOpenChange(false);
  };

  const cancelClose = () => {
    setShowWarning(false);
  };

  const UnsavedChangesWarning = (
    <UnsavedWarning 
      open={showWarning} 
      onOpenChange={setShowWarning} 
      onConfirm={confirmClose} 
      onCancel={cancelClose} 
    />
  );

  if (variant === "sheet") {
    return (
      <>
        <Sheet open={effectiveOpen} onOpenChange={handleOpenChange}>
          <SheetContent className={cn(
            "overflow-y-auto sm:max-w-xl flex flex-col",
            size === "lg" && "sm:max-w-2xl",
            size === "xl" && "sm:max-w-3xl",
            size === "full" && "sm:max-w-[90vw]"
          )}>
            <SheetHeader className="mb-6">
              <SheetTitle className="text-xl font-bold tracking-tight text-foreground">{title}</SheetTitle>
              {description && (
                <SheetDescription className="text-xs sm:text-sm text-muted-foreground">
                  {description}
                </SheetDescription>
              )}
            </SheetHeader>
            <div className="flex-1 min-h-0">
              {children}
            </div>
            {footer && (
              <div className="mt-auto pt-4 border-t border-border flex items-center justify-end gap-2.5">
                {footer}
              </div>
            )}
          </SheetContent>
        </Sheet>
        {UnsavedChangesWarning}
      </>
    );
  }

  const sizeClasses = {
    sm: "sm:max-w-[425px]",
    md: "sm:max-w-[600px]",
    lg: "sm:max-w-[800px]",
    xl: "sm:max-w-[1000px]",
    full: "sm:max-w-[95vw]",
  };

  return (
    <>
      <Dialog open={effectiveOpen} onOpenChange={handleOpenChange}>
        <DialogContent className={cn("overflow-hidden p-0", sizeClasses[size])}>
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">{title}</DialogTitle>
            {description && (
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className={cn("p-6 overflow-y-auto max-h-[80vh] custom-scrollbar", contentClassName)}>
            {children}
          </div>
          {footer && (
            <div className="flex items-center justify-end gap-2.5 p-4 sm:px-6 border-t border-border bg-muted/20">
              {footer}
            </div>
          )}
        </DialogContent>
      </Dialog>
      {UnsavedChangesWarning}
    </>
  );
};
