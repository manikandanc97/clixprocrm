"use client";

import React from "react";
import {
  Building2,
  Hash,
  Globe,
  MapPin,
  Pencil,
  Palette,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { CRMCard } from "@/shared/components/crm";
import { AppIcon } from "@/shared/components/icons/icon-registry";

interface WorkspaceOverviewCardProps {
  workspace: any;
  CurrencyIcon: React.ComponentType<{ className?: string }>;
  onOpenEditModal: () => void;
}

export function WorkspaceOverviewCard({
  workspace,
  CurrencyIcon,
  onOpenEditModal,
}: WorkspaceOverviewCardProps) {
  return (
    <CRMCard className="p-3.5 sm:p-4.5">
      <div className="mb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold tracking-tight text-foreground">
              Organization Information
            </h3>
            <Badge
              variant="neutral"
              className="text-[9.5px] font-semibold px-1.5 py-0"
            >
              Business Profile
            </Badge>
          </div>
          <p className="text-[11.5px] text-muted-foreground font-medium mt-0.5">
            Your company identity, tax registration, and regional settings across the CRM.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenEditModal}
            className="group h-7.5 px-3 text-xs font-semibold rounded-lg border-border/70 hover:bg-muted/70 hover:border-primary/40 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <AppIcon name="edit" icon={Pencil} size={12} className="text-primary group-hover:text-primary transition-colors" />
            Edit Details
          </Button>
        </div>
      </div>

      {/* Enterprise Detail Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
        {/* Tile 1: Company Name */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/60 hover:bg-muted/30 transition-colors space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <AppIcon name="companies" icon={Building2} size={13} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Company Name
            </span>
          </div>
          <p className="text-xs sm:text-[13px] font-semibold text-foreground truncate pl-8">
            {workspace?.name || "Not provided"}
          </p>
        </div>

        {/* Tile 2: GSTIN / Tax ID */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/60 hover:bg-muted/30 transition-colors space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <AppIcon name="hash" icon={Hash} size={13} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              GSTIN / Tax ID
            </span>
          </div>
          <p className="text-xs sm:text-[13px] font-semibold text-foreground truncate pl-8">
            {workspace?.taxId || (
              <span className="text-muted-foreground/60 italic font-normal text-xs">
                Not registered
              </span>
            )}
          </p>
        </div>

        {/* Tile 3: Brand Theme Color */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/60 hover:bg-muted/30 transition-colors space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <AppIcon name="palette" icon={Palette} size={13} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Brand Accent
            </span>
          </div>
          <div className="pl-8 flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full border border-border shadow-xs"
              style={{ backgroundColor: workspace?.brandPrimaryColor || "#10b981" }}
            />
            <span className="text-xs sm:text-[13px] font-semibold text-foreground font-mono uppercase">
              {workspace?.brandPrimaryColor || "#10B981"}
            </span>
          </div>
        </div>

        {/* Tile 4: Default Currency */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/60 hover:bg-muted/30 transition-colors space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CurrencyIcon className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Default Currency
            </span>
          </div>
          <p className="text-xs sm:text-[13px] font-semibold text-foreground truncate pl-8">
            INR – Indian Rupee (₹)
          </p>
        </div>

        {/* Tile 5: Timezone */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/60 hover:bg-muted/30 transition-colors space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AppIcon name="globe" icon={Globe} size={13} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Timezone
            </span>
          </div>
          <p className="text-xs sm:text-[13px] font-semibold text-foreground truncate pl-8">
            Asia/Kolkata (IST - UTC+5:30)
          </p>
        </div>

        {/* Tile 6: Business Address */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/60 hover:bg-muted/30 transition-colors space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AppIcon name="mapPin" icon={MapPin} size={13} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Business Address
            </span>
          </div>
          <p className="text-xs sm:text-[13px] font-semibold text-foreground truncate pl-8">
            {workspace?.address || (
              <span className="text-muted-foreground/60 italic font-normal text-xs">
                Not provided
              </span>
            )}
          </p>
        </div>
      </div>
    </CRMCard>
  );
}
