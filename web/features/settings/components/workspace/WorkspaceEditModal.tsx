"use client";

import React from "react";
import {
  Building2,
  Hash,
  Globe,
  MapPin,
  Save as SaveIcon,
  Loader2,
  Pencil,
  X,
  Check as CheckIcon,
} from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { toValidHex7 } from "@/shared/lib/utils/color-utils";

interface WorkspaceEditModalProps {
  editModalOpen: boolean;
  setEditModalOpen: (open: boolean) => void;
  formData: {
    name: string;
    taxId: string;
    currency: string;
    timezone: string;
    address: string;
    logo: string | null;
    brandPrimaryColor: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      taxId: string;
      currency: string;
      timezone: string;
      address: string;
      logo: string | null;
      brandPrimaryColor: string;
    }>
  >;
  handleColorChange: (color: string) => void;
  displaySwatches: { name: string; hex: string }[];
  CurrencyIcon: React.ComponentType<{ className?: string }>;
  handleSaveModal: (e: React.FormEvent) => void;
  isSaving: boolean;
}

export function WorkspaceEditModal({
  editModalOpen,
  setEditModalOpen,
  formData,
  setFormData,
  handleColorChange,
  displaySwatches,
  CurrencyIcon,
  handleSaveModal,
  isSaving,
}: WorkspaceEditModalProps) {
  return (
    <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
      <DialogContent className="sm:max-w-lg border-border bg-card p-0 overflow-hidden shadow-2xl rounded-2xl">
        <div className="p-5 pb-3.5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
              <AppIcon name="edit" icon={Pencil} size={16} />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Edit Workspace Details
              </DialogTitle>
              <DialogDescription className="text-[11.5px] text-muted-foreground mt-0.5">
                Update your organization identity, tax registration, and regional settings.
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveModal} className="px-5 py-4 space-y-3.5">
          {/* Field: Company Name */}
          <div className="space-y-1">
            <Label className="text-[11px] font-semibold text-foreground/80 uppercase tracking-wider">
              Company / Organization Name
            </Label>
            <div className="relative group">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 group-focus-within:text-primary transition-colors pointer-events-none flex items-center justify-center">
                <AppIcon name="companies" icon={Building2} size={14} />
              </div>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Company or Organization Name"
                required
                className="pl-8.5 h-9 text-xs sm:text-sm rounded-lg border-border/70 bg-muted/20 hover:bg-muted/30 focus:bg-background focus:border-primary/40 transition-all font-medium"
              />
            </div>
          </div>

          {/* Field: GSTIN / Tax ID */}
          <div className="space-y-1">
            <Label className="text-[11px] font-semibold text-foreground/80 uppercase tracking-wider">
              GSTIN / Tax ID
            </Label>
            <div className="relative group">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 group-focus-within:text-primary transition-colors pointer-events-none flex items-center justify-center">
                <AppIcon name="hash" icon={Hash} size={14} />
              </div>
              <Input
                value={formData.taxId}
                onChange={(e) => setFormData((prev) => ({ ...prev, taxId: e.target.value }))}
                placeholder="Enter tax ID / GSTIN"
                className="pl-8.5 h-9 text-xs sm:text-sm rounded-lg border-border/70 bg-muted/20 hover:bg-muted/30 focus:bg-background focus:border-primary/40 transition-all font-medium"
              />
            </div>
          </div>

          {/* Field: Business Address */}
          <div className="space-y-1">
            <Label className="text-[11px] font-semibold text-foreground/80 uppercase tracking-wider">
              Business Address
            </Label>
            <div className="relative group">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 group-focus-within:text-primary transition-colors pointer-events-none flex items-center justify-center">
                <AppIcon name="mapPin" icon={MapPin} size={14} />
              </div>
              <Input
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Street Address, City, State, PIN Code"
                className="pl-8.5 h-9 text-xs sm:text-sm rounded-lg border-border/70 bg-muted/20 hover:bg-muted/30 focus:bg-background focus:border-primary/40 transition-all font-medium"
              />
            </div>
          </div>

          {/* Field: Brand Accent Color */}
          <div className="space-y-1.5 pt-1">
            <Label className="text-[11px] font-semibold text-foreground/80 uppercase tracking-wider">
              Brand Accent Color
            </Label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-muted/30 px-2.5 py-1 rounded-lg border border-border/70">
                <input
                  type="color"
                  value={toValidHex7(formData.brandPrimaryColor)}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-5 h-5 rounded-full border-0 p-0 cursor-pointer bg-transparent"
                  title="Custom Color"
                />
                <Input
                  value={formData.brandPrimaryColor || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || val === "#") {
                      setFormData((prev) => ({ ...prev, brandPrimaryColor: val }));
                      return;
                    }
                    if (val.startsWith("#") && val.length <= 7) {
                      handleColorChange(val);
                    } else if (!val.startsWith("#") && val.length <= 6) {
                      handleColorChange(`#${val}`);
                    }
                  }}
                  placeholder="#10b981"
                  className="h-6 w-18 border-0 p-0 font-mono text-xs uppercase font-semibold text-foreground bg-transparent focus-visible:ring-0 shadow-none"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {displaySwatches.map((swatch) => {
                  const isSelected =
                    formData.brandPrimaryColor.toLowerCase() === swatch.hex.toLowerCase();
                  return (
                    <button
                      key={swatch.hex}
                      type="button"
                      onClick={() => handleColorChange(swatch.hex)}
                      className={`w-5 h-5 rounded-full transition-transform hover:scale-110 flex items-center justify-center cursor-pointer ${
                        isSelected ? "ring-2 ring-offset-2 ring-primary scale-105" : ""
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                      title={swatch.name}
                    >
                      {isSelected && <AppIcon name="check" icon={CheckIcon} size={10} className="text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Regional Settings in Modal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-foreground/80 uppercase tracking-wider">
                Default Currency
              </Label>
              <div className="relative group">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 group-focus-within:text-primary transition-colors pointer-events-none flex items-center justify-center z-10">
                  <CurrencyIcon className="w-3.5 h-3.5" />
                </div>
                <Select
                  value={formData.currency || "INR"}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, currency: val }))}
                >
                  <SelectTrigger className="w-full pl-8.5 h-9 text-xs sm:text-sm rounded-lg border-border/70 bg-muted/20 hover:bg-muted/30 focus:bg-background focus:border-primary/40 transition-all font-medium flex items-center justify-between">
                    <SelectValue placeholder="Select Currency" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border">
                    <SelectItem value="INR" className="text-xs font-medium">
                      INR – Indian Rupee (₹)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-foreground/80 uppercase tracking-wider">
                Timezone
              </Label>
              <div className="relative group">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 group-focus-within:text-primary transition-colors pointer-events-none flex items-center justify-center z-10">
                  <AppIcon name="globe" icon={Globe} size={14} />
                </div>
                <Select
                  value={formData.timezone || "ist"}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, timezone: val }))}
                >
                  <SelectTrigger className="w-full pl-8.5 h-9 text-xs sm:text-sm rounded-lg border-border/70 bg-muted/20 hover:bg-muted/30 focus:bg-background focus:border-primary/40 transition-all font-medium flex items-center justify-between">
                    <SelectValue placeholder="Select Timezone" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border">
                    <SelectItem value="ist" className="text-xs font-medium">
                      Asia/Kolkata (IST - UTC+5:30)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-3.5 px-5 bg-muted/30 border-t border-border/70 flex flex-row items-center justify-end gap-2.5 -mx-5 -mb-4 mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditModalOpen(false)}
              disabled={isSaving}
              className="group rounded-lg text-xs font-semibold h-8 px-3.5 border-border/80 hover:bg-muted gap-1.5 cursor-pointer"
            >
              <AppIcon name="close" icon={X} size={12} className="text-muted-foreground group-hover:text-foreground transition-colors" />
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              className="group rounded-lg text-xs font-bold gap-1.5 h-8 px-4 shadow-xs cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <AppIcon name="save" icon={SaveIcon} size={13} />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
