"use client";

import React, { useState, useEffect } from "react";
import { ImageCropperModal } from "@/shared/components/ImageCropperModal";
import { useImageCropper } from "@/shared/hooks/use-image-cropper";
import { getInitials } from "@/shared/utils/formatters";
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
  isValidHexColor,
  extractLogoPalette,
} from "@/shared/lib/utils/color-utils";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/shared/lib/api/error";
import { WorkspaceIdentityCard } from "./workspace/WorkspaceIdentityCard";
import { WorkspaceOverviewCard } from "./workspace/WorkspaceOverviewCard";
import { WorkspaceEditModal } from "./workspace/WorkspaceEditModal";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const PRESET_BRAND_SWATCHES = [
  { name: "Emerald", hex: "#10b981" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Indigo", hex: "#6366f1" },
  { name: "Violet", hex: "#8b5cf6" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Amber", hex: "#f59e0b" },
];

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

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const {
    fileInputRef,
    isDragging,
    cropModalOpen,
    setCropModalOpen,
    selectedRawFile,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useImageCropper();
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

  const [prevLogo, setPrevLogo] = useState(workspace?.logo);
  if (workspace?.logo !== prevLogo) {
    setPrevLogo(workspace?.logo);
    if (!workspace?.logo) {
      setLogoColors([]);
    }
  }

  useEffect(() => {
    if (!workspace?.logo) return;
    let active = true;
    void extractLogoPalette(workspace.logo, 6).then((colors) => {
      if (!active) return;
      if (colors && colors.length > 0) {
        setLogoColors(colors);
      } else {
        setLogoColors([]);
      }
    });
    return () => {
      active = false;
    };
  }, [workspace?.logo]);

  // Sync form data when workspace data loads or updates
  const [prevWorkspace, setPrevWorkspace] = useState(workspace);
  if (workspace && workspace !== prevWorkspace) {
    setPrevWorkspace(workspace);
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
    setAccentColor(activeColor);
  }

  const handleColorChange = (newColor: string) => {
    setFormData((prev) => ({ ...prev, brandPrimaryColor: newColor }));
    if (isValidHexColor(newColor)) {
      setAccentColor(newColor);
    }
  };

  const handleCropComplete = async (croppedFile: File) => {
    if (croppedFile.size > MAX_FILE_SIZE) {
      toast.error("Cropped image exceeds 5MB limit. Please choose a smaller image.");
      return;
    }

    try {
      setUploadingLogo(true);
      const res = await uploadLogoMutation.mutateAsync(croppedFile);
      setFormData((prev) => ({ ...prev, logo: res.logo }));
      await queryClient.invalidateQueries({ queryKey: ["workspace"] });
      await refreshUser();
      toast.success("Logo uploaded and updated successfully!");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to upload logo"));
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveLogo = async () => {
    try {
      setUploadingLogo(true);
      await mutation.mutateAsync({ logo: null });
      setFormData((prev) => ({ ...prev, logo: null }));
      setLogoColors([]);
      await queryClient.invalidateQueries({ queryKey: ["workspace"] });
      await refreshUser();
      toast.success("Logo removed");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to remove logo"));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleOpenEditModal = () => {
    setFormData({
      name: workspace?.name || "",
      taxId: workspace?.taxId || "",
      currency: normalizeCurrency(workspace?.currency),
      timezone: normalizeTimezone(workspace?.timezone),
      address: workspace?.address || "",
      logo: workspace?.logo || null,
      brandPrimaryColor: workspace?.brandPrimaryColor || "#10b981",
    });
    setEditModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Company name is required");
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        taxId: formData.taxId ? formData.taxId.trim() : null,
        currency: formData.currency,
        timezone: formData.timezone,
        address: formData.address ? formData.address.trim() : null,
        brandPrimaryColor: isValidHexColor(formData.brandPrimaryColor)
          ? formData.brandPrimaryColor
          : "#10b981",
      };

      await mutation.mutateAsync(payload);
      setStoreCurrency(formData.currency);
      setAccentColor(payload.brandPrimaryColor);
      await queryClient.invalidateQueries({ queryKey: ["workspace"] });
      await refreshUser();
      setEditModalOpen(false);
      toast.success("Workspace details updated successfully!");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to update workspace settings"));
    }
  };

  if (loading) {
    return <WorkspaceSettingsSkeleton />;
  }

  if (error) {
    return (
      <PageErrorState
        title="Failed to load workspace settings"
        message={getApiErrorMessage(error, "An unexpected error occurred while loading your workspace settings.")}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const initials = getInitials(workspace?.name || "Workspace");

  const displaySwatches =
    logoColors.length > 0
      ? [
          ...logoColors.map((hex, i) => ({ name: `Logo Tone ${i + 1}`, hex })),
          ...PRESET_BRAND_SWATCHES.slice(0, Math.max(0, 6 - logoColors.length)),
        ]
      : PRESET_BRAND_SWATCHES;

  return (
    <div className="space-y-4">
      {/* Hidden File Input for Direct Upload */}
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
      <WorkspaceIdentityCard
        workspace={workspace}
        initials={initials}
        uploadingLogo={uploadingLogo}
        isDragging={isDragging}
        fileInputRef={fileInputRef}
        handleDragOver={handleDragOver}
        handleDragLeave={handleDragLeave}
        handleDrop={handleDrop}
        handleRemoveLogo={handleRemoveLogo}
      />

      {/* Organization Details Overview Card */}
      <WorkspaceOverviewCard
        workspace={workspace}
        CurrencyIcon={CurrencyIcon}
        onOpenEditModal={handleOpenEditModal}
      />

      {/* Edit Workspace Details Popup Modal */}
      <WorkspaceEditModal
        editModalOpen={editModalOpen}
        setEditModalOpen={setEditModalOpen}
        formData={formData}
        setFormData={setFormData}
        handleColorChange={handleColorChange}
        displaySwatches={displaySwatches}
        CurrencyIcon={CurrencyIcon}
        handleSaveModal={handleSaveModal}
        isSaving={mutation.isPending}
      />
    </div>
  );
};

export default WorkspaceSettings;
