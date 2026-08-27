"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Building2, 
  Hash, 
  Globe, 
  MapPin, 
  Save, 
  Loader2, 
  UploadCloud, 
  Trash2, 
  ImagePlus,
  CheckCircle2,
  Sparkles,
  RotateCcw,
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
import { PlanBadge } from "@/shared/components/PlanBadge";
import { CRMCard } from "@/shared/components/crm";
import { ImageCropperModal } from "@/shared/components/ImageCropperModal";
import { useWorkspace, useUpdateWorkspace, useUploadWorkspaceLogo } from "@/shared/hooks/use-settings";
import { PageErrorState } from "@/shared/components/page-states";
import { WorkspaceSettingsSkeleton } from "./SettingsSkeletons";
import { useCurrency } from "@/shared/hooks/use-currency";
import { useCRMStore } from "@/shared/store/useCRMStore";
import { useAuth } from "@/features/auth/components/auth-provider";
import { useQueryClient } from "@tanstack/react-query";
import { toValidHex7, isValidHexColor, extractLogoPalette } from "@/shared/lib/utils/color-utils";
import { toast } from "sonner";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const PRESET_BRAND_SWATCHES = [
  { name: "Emerald", hex: "#10b981" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Indigo", hex: "#6366f1" },
  { name: "Violet", hex: "#8b5cf6" },
  { name: "Purple", hex: "#a855f7" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Teal", hex: "#14b8a6" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Slate", hex: "#475569" },
];

const WorkspaceSettings = () => {
  const { data: workspace, isLoading: loading, error, refetch } = useWorkspace();
  const mutation = useUpdateWorkspace();
  const uploadLogoMutation = useUploadWorkspaceLogo();
  const { CurrencyIcon } = useCurrency();
  const setStoreCurrency = useCRMStore((state) => state.setCurrency);
  const setAccentColor = useCRMStore((state) => state.setAccentColor);
  const { refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedRawFile, setSelectedRawFile] = useState<File | null>(null);
  const [logoColors, setLogoColors] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    taxId: "",
    currency: "",
    timezone: "",
    address: "",
    logo: null as string | null,
    brandPrimaryColor: "#10b981",
  });

  useEffect(() => {
    if (formData.logo) {
      void extractLogoPalette(formData.logo, 8).then((colors) => {
        if (colors && colors.length > 0) {
          setLogoColors(colors);
        } else {
          setLogoColors([]);
        }
      });
    } else {
      setLogoColors([]);
    }
  }, [formData.logo]);

  useEffect(() => {
    if (workspace) {
      const activeColor = workspace.brandPrimaryColor || "#10b981";
      setFormData({
        name: workspace.name || "",
        taxId: workspace.taxId || "",
        currency: workspace.currency || "INR",
        timezone: workspace.timezone || "ist",
        address: workspace.address || "",
        logo: workspace.logo || null,
        brandPrimaryColor: activeColor,
      });
      if (workspace.currency) {
        setStoreCurrency(workspace.currency);
      }
      if (workspace.brandPrimaryColor) {
        setAccentColor(workspace.brandPrimaryColor);
      }
    }
  }, [workspace, setStoreCurrency, setAccentColor]);

  const handleProcessUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (PNG, JPG, or WebP)");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image file size must be less than 5MB");
      return;
    }

    setUploadingLogo(true);

    try {
      const result = await uploadLogoMutation.mutateAsync(file);
      if (result?.logo) {
        setFormData((prev) => ({
          ...prev,
          logo: result.logo,
          brandPrimaryColor: result.brandPrimaryColor || prev.brandPrimaryColor,
        }));
        if (result.brandPrimaryColor) {
          setAccentColor(result.brandPrimaryColor);
        }
        queryClient.invalidateQueries({ queryKey: ["workspace"] });
        void refreshUser();
        toast.success("Logo uploaded & brand color extracted successfully!");
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to upload logo"
      );
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSelectRawFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (PNG, JPG, or WebP)");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image file size must be less than 5MB");
      return;
    }

    setSelectedRawFile(file);
    setCropModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSelectRawFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleSelectRawFile(file);
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    void handleProcessUpload(croppedFile);
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logo: null, brandPrimaryColor: "#10b981" }));
    setLogoColors([]);
    setAccentColor("#10b981");
    toast.info("Logo removed. Save changes to finalize.");
  };

  const handleColorChange = (hex: string) => {
    setFormData((prev) => ({ ...prev, brandPrimaryColor: hex }));
    if (isValidHexColor(hex)) {
      setAccentColor(hex);
    }
  };

  if (loading) {
    return <WorkspaceSettingsSkeleton />;
  }

  if (error) {
    return (
      <PageErrorState
        title="Workspace settings unavailable"
        message={(error as Error).message}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const handleSave = () => {
    mutation.mutate(formData, {
      onSuccess: () => {
        if (formData.currency) {
          setStoreCurrency(formData.currency);
        }
        if (formData.brandPrimaryColor) {
          setAccentColor(formData.brandPrimaryColor);
        }
        queryClient.invalidateQueries({ queryKey: ["workspace"] });
        void refreshUser();
        toast.success("Workspace settings updated successfully!");
      },
      onError: (err: any) => {
        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to update workspace settings"
        );
      },
    });
  };

  const hasChanges =
    formData.name !== (workspace?.name || "") ||
    formData.taxId !== (workspace?.taxId || "") ||
    formData.currency !== (workspace?.currency || "INR") ||
    formData.timezone !== (workspace?.timezone || "ist") ||
    formData.address !== (workspace?.address || "") ||
    formData.logo !== (workspace?.logo || null) ||
    formData.brandPrimaryColor !== (workspace?.brandPrimaryColor || "#10b981");

  return (
    <div className="space-y-6">
      {/* Branding Section */}
      <CRMCard>
        <div className="flex items-start justify-between mb-6 pb-4 border-b border-border/40">
          <div>
            <h3 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
              Workspace Branding
            </h3>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Manage your company logo, brand color theme, and visual identity across all employee workspaces.
            </p>
          </div>
          {workspace?.plan && <PlanBadge plan={workspace.plan} size="sm" />}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col lg:flex-row items-stretch gap-5">
          {/* Left: Logo Card */}
          <div className="p-4 sm:p-5 rounded-xl border border-border/60 bg-muted/20 flex flex-row items-center gap-4 lg:w-[360px] shrink-0">
            {/* Logo Box */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative group cursor-pointer w-20 h-20 sm:w-22 sm:h-22 rounded-xl border-2 transition-all flex items-center justify-center overflow-hidden bg-card/80 backdrop-blur-sm shadow-inner shrink-0 ${
                isDragging
                  ? "border-primary bg-primary/10 ring-4 ring-primary/20 scale-[1.02]"
                  : "border-dashed border-border/80 hover:border-primary/60 hover:bg-muted/40"
              }`}
            >
              {uploadingLogo ? (
                <div className="flex flex-col items-center justify-center p-2 text-center gap-1">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-[9px] font-semibold text-muted-foreground">Uploading...</span>
                </div>
              ) : formData.logo ? (
                <div className="relative w-full h-full p-2 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formData.logo}
                    alt="Company Logo"
                    className="w-full h-full object-contain rounded-lg transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white rounded-xl gap-0.5">
                    <ImagePlus className="w-4 h-4" />
                    <span className="text-[9px] font-semibold">Change</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-2 text-center">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-0.5 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-semibold text-foreground">Upload</span>
                </div>
              )}
            </div>

            {/* Logo Info & Actions */}
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <h4 className="text-xs font-bold text-foreground">Company Logo</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  PNG, JPG, or WebP (max 5MB)
                </p>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs font-semibold px-2.5 rounded-lg border-border/60 hover:bg-muted/60"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                >
                  <ImagePlus className="w-3.5 h-3.5 mr-1 text-primary" />
                  {formData.logo ? "Change" : "Upload"}
                </Button>
                {formData.logo && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs font-semibold px-2.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                    onClick={handleRemoveLogo}
                    disabled={uploadingLogo}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Image Cropper Modal (Triggered on file upload) */}
          <ImageCropperModal
            open={cropModalOpen}
            onOpenChange={setCropModalOpen}
            imageFile={selectedRawFile}
            onCropComplete={handleCropComplete}
            title="Crop & Align Workspace Logo"
            description="Position and crop your logo with proper aspect ratio for best visual appearance across CRM."
          />

          {/* Right: Theme Color Customizer */}
          <div className="flex-1 p-4 sm:p-5 rounded-xl border border-border/60 bg-muted/20 flex flex-col justify-between gap-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Workspace Primary Theme Color
                </h4>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  Extracted from logo or customized for primary buttons, active navigation, and focus accents.
                </p>
              </div>
              {formData.logo && (
                <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 shrink-0 self-start sm:self-auto">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Synced with logo
                </span>
              )}
            </div>

            {/* Clean Color Picker & Preset Swatches */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40">
              {/* Color Picker + Editable Hex Pill */}
              <div className="flex items-center gap-2.5 bg-background px-3 py-1.5 rounded-lg border border-border/80 shadow-sm">
                <input
                  type="color"
                  value={toValidHex7(formData.brandPrimaryColor)}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-6 h-6 rounded-full border-0 p-0 cursor-pointer bg-transparent"
                  title="Pick custom color"
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
                  className="h-6 w-20 border-0 p-0 font-mono text-xs uppercase font-semibold text-foreground bg-transparent focus-visible:ring-0 shadow-none"
                />
              </div>

              {/* Quick Brand Colors / Logo Colors */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-0.5 hidden sm:inline">
                  {formData.logo && logoColors.length > 0 ? "Logo Colors:" : "Presets:"}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {formData.logo && logoColors.length > 0
                    ? logoColors.map((hex, idx) => {
                        const isSelected =
                          formData.brandPrimaryColor.toLowerCase() === hex.toLowerCase();
                        return (
                          <button
                            key={`${hex}-${idx}`}
                            type="button"
                            onClick={() => handleColorChange(hex)}
                            className={`w-6 h-6 rounded-md transition-transform hover:scale-110 shadow-sm flex items-center justify-center ${
                              isSelected ? "ring-2 ring-offset-1 ring-primary scale-105" : ""
                            }`}
                            style={{ backgroundColor: hex }}
                            title={hex}
                          >
                            {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </button>
                        );
                      })
                    : PRESET_BRAND_SWATCHES.map((swatch) => {
                        const isSelected =
                          formData.brandPrimaryColor.toLowerCase() === swatch.hex.toLowerCase();
                        return (
                          <button
                            key={swatch.name}
                            type="button"
                            onClick={() => handleColorChange(swatch.hex)}
                            className={`w-6 h-6 rounded-md transition-transform hover:scale-110 shadow-sm flex items-center justify-center ${
                              isSelected ? "ring-2 ring-offset-1 ring-primary scale-105" : ""
                            }`}
                            style={{ backgroundColor: swatch.hex }}
                            title={swatch.name}
                          >
                            {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </button>
                        );
                      })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CRMCard>

      {/* Organization Details */}
      <CRMCard>
        <div className="mb-6 pb-4 border-b border-border/40 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold tracking-tight text-foreground">
              Organization Details
            </h3>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Manage your business identity, legal registration, and regional settings.
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || mutation.isPending}
            className="flex items-center gap-2 font-semibold shadow-sm"
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">
              Company / Workspace Name
            </Label>
            <div className="relative group">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                value={formData.name}
                placeholder="Enter company or workspace name"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="pl-9 h-10 rounded-lg border-border/60 bg-muted/30 focus:bg-card focus:border-primary/30 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">
              Tax ID / Registration Number
            </Label>
            <div className="relative group">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                value={formData.taxId}
                placeholder="Enter GSTIN / EIN / VAT number"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, taxId: e.target.value }))
                }
                className="pl-9 h-10 rounded-lg border-border/60 bg-muted/30 focus:bg-card focus:border-primary/30 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">
              Default Currency
            </Label>
            <div className="relative">
              <CurrencyIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <Select
                value={formData.currency || "INR"}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, currency: val }))
                }
              >
                <SelectTrigger className="pl-9 h-10 rounded-lg border-border/60 bg-muted/30 focus:ring-primary/20 font-medium text-sm">
                  <SelectValue placeholder="Select Currency" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border">
                  <SelectItem value="INR" className="text-xs font-medium">
                    INR – Indian Rupee (₹)
                  </SelectItem>
                  <SelectItem value="USD" className="text-xs font-medium">
                    USD – US Dollar ($)
                  </SelectItem>
                  <SelectItem value="EUR" className="text-xs font-medium">
                    EUR – Euro (€)
                  </SelectItem>
                  <SelectItem value="GBP" className="text-xs font-medium">
                    GBP – British Pound (£)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">
              Timezone
            </Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <Select
                value={formData.timezone}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, timezone: val }))
                }
              >
                <SelectTrigger className="pl-9 h-10 rounded-lg border-border/60 bg-muted/30 focus:ring-primary/20 font-medium text-sm">
                  <SelectValue placeholder="Select Timezone" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border">
                  <SelectItem value="ist" className="text-xs font-medium">
                    Asia/Kolkata (IST - UTC+5:30)
                  </SelectItem>
                  <SelectItem value="utc" className="text-xs font-medium">
                    UTC (Coordinated Universal Time)
                  </SelectItem>
                  <SelectItem value="est" className="text-xs font-medium">
                    America/New_York (EST - UTC-5:00)
                  </SelectItem>
                  <SelectItem value="pst" className="text-xs font-medium">
                    America/Los_Angeles (PST - UTC-8:00)
                  </SelectItem>
                  <SelectItem value="gst" className="text-xs font-medium">
                    Asia/Dubai (GST - UTC+4:00)
                  </SelectItem>
                  <SelectItem value="sgt" className="text-xs font-medium">
                    Asia/Singapore (SGT - UTC+8:00)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-semibold text-muted-foreground">
              Business Address
            </Label>
            <div className="relative group">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                value={formData.address}
                placeholder="Street address, City, State, Country, Postal code"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                className="pl-9 h-10 rounded-lg border-border/60 bg-muted/30 focus:bg-card focus:border-primary/30 transition-all"
              />
            </div>
          </div>
        </div>
      </CRMCard>
    </div>
  );
};

export default WorkspaceSettings;
