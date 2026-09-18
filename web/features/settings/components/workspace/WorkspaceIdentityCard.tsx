"use client";

import React from "react";
import {
  Upload,
  Trash2 as Trash2Icon,
  Loader2,
  ShieldCheck as ShieldCheckIcon,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { CRMCard } from "@/shared/components/crm";
import { AppIcon } from "@/shared/components/icons/icon-registry";

interface WorkspaceIdentityCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workspace: any;
  initials: string;
  uploadingLogo: boolean;
  isDragging: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleRemoveLogo: () => void;
}

export function WorkspaceIdentityCard({
  workspace,
  initials,
  uploadingLogo,
  isDragging,
  fileInputRef,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleRemoveLogo,
}: WorkspaceIdentityCardProps) {
  return (
    <CRMCard className="p-3.5 sm:p-4.5">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left section: Logo + Name & Subtitle */}
        <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
          {/* Logo Box */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !uploadingLogo && fileInputRef.current?.click()}
            className={`relative group cursor-pointer w-13 h-13 sm:w-14 sm:h-14 rounded-xl border transition-all flex items-center justify-center overflow-hidden bg-muted/40 backdrop-blur-sm shadow-xs shrink-0 ${
              isDragging
                ? "border-primary bg-primary/10 ring-2 ring-primary/20 scale-[1.02]"
                : "border-border/70 hover:border-primary/60 hover:bg-muted/60"
            }`}
          >
            {uploadingLogo ? (
              <div className="flex flex-col items-center justify-center p-1 text-center gap-0.5">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-[8px] font-semibold text-muted-foreground">Uploading</span>
              </div>
            ) : workspace?.logo ? (
              <div className="relative w-full h-full p-2 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={workspace.logo}
                  alt={workspace.name || "Company Logo"}
                  className="w-full h-full object-contain transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white rounded-xl gap-0.5">
                  <AppIcon name="upload" icon={Upload} size={13} className="text-white" />
                  <span className="text-[8.5px] font-semibold">Change</span>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-base sm:text-lg font-bold w-full h-full rounded-xl flex items-center justify-center select-none shadow-xs">
                  {initials}
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white rounded-xl gap-0.5">
                  <AppIcon name="upload" icon={Upload} size={13} className="text-white" />
                  <span className="text-[8.5px] font-semibold">Upload</span>
                </div>
              </div>
            )}
          </div>

          {/* Name and Tagline */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                {workspace?.name || "My Workspace"}
              </h2>
              <Badge variant="success" className="px-1.5 py-0.2 text-[8.5px] font-bold uppercase tracking-widest">
                Verified
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-medium truncate">
              {workspace?.taxId ? `GSTIN: ${workspace.taxId}` : "Business Workspace"}
            </p>
          </div>
        </div>

        {/* Right section: Badge + Action Buttons + Specs */}
        <div className="flex flex-col items-start sm:items-end gap-1 shrink-0 w-full sm:w-auto">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-semibold tracking-wide border border-primary/15">
              <AppIcon name="security" icon={ShieldCheckIcon} size={13} className="text-primary" />
              Active Organization
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="group h-7.5 text-xs font-semibold px-2.5 rounded-md border-border/70 hover:bg-muted/70 hover:border-primary/40 transition-colors shadow-2xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
            >
              <AppIcon name="upload" icon={Upload} size={12} className="mr-1 text-primary group-hover:text-primary transition-colors" />
              {workspace?.logo ? "Change Logo" : "Upload Logo"}
            </Button>

            {workspace?.logo && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="group h-7.5 text-xs font-semibold px-2 rounded-md text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                onClick={handleRemoveLogo}
                disabled={uploadingLogo}
              >
                <AppIcon name="trash" icon={Trash2Icon} size={12} className="mr-1" />
                Remove
              </Button>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground/70 pr-0.5">
            PNG, JPG, or WebP (max 5MB)
          </p>
        </div>
      </div>
    </CRMCard>
  );
}
