"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Building2,
  Hash,
  Globe,
  MapPin,
  Save as SaveIcon,
  Loader2,
  Upload,
  Trash2 as Trash2Icon,
  Pencil,
  X,
  Palette,
  Check as CheckIcon,
  ShieldCheck as ShieldCheckIcon,
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
import { Badge } from "@/shared/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { CRMCard } from "@/shared/components/crm";
import { ImageCropperModal } from "@/shared/components/ImageCropperModal";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import {
  useWorkspace,
  useUpdateWorkspace,
  useUploadWorkspaceLogo,
} from "@/shared/hooks/use-settings";
import { PageErrorState } from "@/shared/components/crm/PageFeedbackStates";
import { WorkspaceSettingsSkeleton } from "./SettingsSkeletons";
import { useCurrency } from "@/shared/hooks/use-currency";
import { useCRMStore } from "@/shared/store/useCRMStore";
import { useAuth } from "@/features/auth/components/auth-provider";
import { useQueryClient } from "@tanstack/react-query";
import {
  toValidHex7,
  isValidHexColor,
  extractLogoPalette,
} from "@/shared/lib/utils/color-utils";
import { toast } from "sonner";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const PRESET_BRAND_SWATCHES = [
  { name: "Emerald", hex: "#10b981" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Indigo", hex: "#6366f1" },
  { name: "Violet", hex: "#8b5cf6" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Amber", hex: "#f59e0b" },
];

function getInitials(name?: string) {
  if (!name) return "WS";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

const normalizeCurrency = (curr?: string | null) => {
  if (!curr) return "INR";
  return curr.toUpperCase() === "INR" ? "INR" : "INR";
};

const normalizeTimezone = (tz?: string | null) => {
  if (!tz) return "ist";
  return tz.toLowerCase() === "ist" || tz === "Asia/Kolkata" ? "ist" : "ist";
};

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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [logoColors, setLogoColors] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    taxId: "",
    currency: "INR",
    timezone: "ist",
    address: "",
    logo: null as string | null,
    brandPrimaryColor: "#10b981",
  });

  useEffect(() => {
    if (workspace?.logo) {
      void extractLogoPalette(workspace.logo, 6).then((colors) => {
        if (colors && colors.length > 0) {
          setLogoColors(colors);
        } else {
          setLogoColors([]);
        }
      });
    } else {
      setLogoColors([]);
    }
  }, [workspace?.logo]);

  useEffect(() => {
    if (workspace) {
      const activeColor = workspace.brandPrimaryColor || "#10b981";
      setFormData({
        name: workspace.name || "",
        taxId: workspace.taxId || "",
        currency: normalizeCurrency(workspace.currency),
        timezone: normalizeTimezone(workspace.timezone),
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

  const handleCropComplete = async (croppedFile: File) => {
    setUploadingLogo(true);
    try {
      const result = await uploadLogoMutation.mutateAsync(croppedFile);
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
        toast.success("Workspace logo updated successfully!");
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to upload workspace logo"
      );
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    mutation.mutate(
      { ...formData, logo: null, brandPrimaryColor: "#10b981" },
      {
        onSuccess: () => {
          setFormData((prev) => ({ ...prev, logo: null, brandPrimaryColor: "#10b981" }));
          setLogoColors([]);
          setAccentColor("#10b981");
          queryClient.invalidateQueries({ queryKey: ["workspace"] });
          void refreshUser();
          toast.success("Logo removed successfully");
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || err?.message || "Failed to remove logo");
        },
      }
    );
  };

  const handleOpenEditModal = () => {
    if (workspace) {
      setFormData({
        name: workspace.name || "",
        taxId: workspace.taxId || "",
        currency: normalizeCurrency(workspace.currency),
        timezone: normalizeTimezone(workspace.timezone),
        address: workspace.address || "",
        logo: workspace.logo || null,
        brandPrimaryColor: workspace.brandPrimaryColor || "#10b981",
      });
    }
    setEditModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
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
        setEditModalOpen(false);
        toast.success("Workspace details updated successfully!");
      },
      onError: (err: any) => {
        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to update workspace details"
        );
      },
    });
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

  const initials = getInitials(workspace?.name || undefined);
  const displaySwatches =
    formData.logo && logoColors.length > 0
      ? logoColors.map((hex) => ({ name: hex, hex }))
      : PRESET_BRAND_SWATCHES;

  return (
    <div className="space-y-3.5 min-h-full flex flex-col">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Image Cropper Modal */}
      <ImageCropperModal
        open={cropModalOpen}
        onOpenChange={setCropModalOpen}
        imageFile={selectedRawFile}
        onCropComplete={(croppedFile) => {
          void handleCropComplete(croppedFile);
        }}
        title="Crop Workspace Logo"
        description="Position and crop your company logo for crisp display across CRM, invoices, and quotations."
      />

      {/* Workspace Identity Card */}
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
                <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-none rounded-md px-1.5 py-0.2 text-[8.5px] font-bold uppercase tracking-widest">
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

      {/* Organization Details Overview Card */}
      <CRMCard className="p-3.5 sm:p-4.5">
        <div className="mb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-foreground">
                Organization Information
              </h3>
              <Badge
                variant="outline"
                className="text-[9.5px] font-semibold text-muted-foreground bg-muted/40 border-border/60 px-1.5 py-0"
              >
                Business Profile
              </Badge>
            </div>
            <p className="text-[11.5px] text-muted-foreground font-medium mt-0.5">
              Your company identity, tax registration, and regional settings across the CRM.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Edit Workspace Button that triggers the modal */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenEditModal}
              className="group h-7.5 px-3 text-xs font-semibold rounded-lg border-border/70 hover:bg-muted/70 hover:border-primary/40 transition-colors shadow-2xs flex items-center gap-1.5"
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

      {/* Edit Workspace Details Popup Modal */}
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
                  placeholder="e.g. 29AAAAA0000A1Z5"
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
                        className={`w-5 h-5 rounded-full transition-transform hover:scale-110 flex items-center justify-center ${
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
                disabled={mutation.isPending}
                className="group rounded-lg text-xs font-semibold h-8 px-3.5 border-border/80 hover:bg-muted gap-1.5"
              >
                <AppIcon name="close" icon={X} size={12} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={mutation.isPending}
                className="group rounded-lg text-xs font-bold gap-1.5 h-8 px-4 shadow-xs"
              >
                {mutation.isPending ? (
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
    </div>
  );
};

export default WorkspaceSettings;
