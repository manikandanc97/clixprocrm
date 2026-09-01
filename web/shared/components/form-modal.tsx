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

interface FormModalProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  isOpen: boolean;
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
  isOpen,
  onOpenChange,
  variant = "dialog",
  size = "md",
  isDirty = false,
  contentClassName,
}: FormModalProps) => {
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
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
          <SheetContent className={cn(
            "overflow-y-auto sm:max-w-xl",
            size === "lg" && "sm:max-w-2xl",
            size === "xl" && "sm:max-w-3xl",
            size === "full" && "sm:max-w-[90vw]"
          )}>
            <SheetHeader className="mb-6">
              <SheetTitle className="text-2xl font-bold tracking-tight">{title}</SheetTitle>
              {description && (
                <SheetDescription className="text-sm text-muted-foreground">
                  {description}
                </SheetDescription>
              )}
            </SheetHeader>
            {children}
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
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className={cn("overflow-hidden p-0", sizeClasses[size])}>
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold tracking-tight">{title}</DialogTitle>
            {description && (
              <DialogDescription className="text-sm text-muted-foreground">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className={cn("p-6 overflow-y-auto max-h-[85vh] custom-scrollbar", contentClassName)}>
            {children}
          </div>
        </DialogContent>
      </Dialog>
      {UnsavedChangesWarning}
    </>
  );
};
