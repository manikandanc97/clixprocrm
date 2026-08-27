"use client";

import { useState, useRef } from "react";
import { Loader2, ArrowRight, UploadCloud, ImagePlus, X, Sparkles, Crop } from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import client from "@/shared/lib/api/client";
import { useAuth } from "@/features/auth/components/auth-provider";
import { fetchDashboardData } from "@/shared/lib/api/crm";
import { extractErrorMessage } from "@/shared/lib/api/error";
import { extractDominantColorClient } from "@/shared/lib/utils/color-utils";
import { ImageCropperModal } from "@/shared/components/ImageCropperModal";
import { toast } from "sonner";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function OnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [companyName, setCompanyName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [detectedColor, setDetectedColor] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedRawFile, setSelectedRawFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectRawFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, or WebP)");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image file size must be less than 5MB");
      return;
    }

    setSelectedRawFile(file);
    setCropModalOpen(true);
  };

  const handleCropComplete = async (croppedFile: File, previewUrl: string) => {
    setLogoFile(croppedFile);
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoPreview(previewUrl);

    // Instant client-side color extraction for interactive delight
    try {
      const hex = await extractDominantColorClient(croppedFile);
      setDetectedColor(hex);
    } catch {
      setDetectedColor(null);
    }
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

  const handleOpenCropForCurrentLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!logoFile && !logoPreview) return;
    setSelectedRawFile(logoFile);
    setCropModalOpen(true);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoPreview(null);
    setDetectedColor(null);
  };

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);

    const trimmedCompany = companyName.trim();
    if (!trimmedCompany) {
      setError("Company Name is required");
      return;
    }

    setLoading(true);

    try {
      let response;

      if (logoFile) {
        // Read as base64 to ensure seamless multipart/json transmission
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(logoFile);
        });

        response = await client.post("/auth/onboarding", {
          companyName: trimmedCompany,
          logoData: base64Data,
          logoFilename: logoFile.name,
        });
      } else {
        response = await client.post("/auth/onboarding", {
          companyName: trimmedCompany,
        });
      }

      if (!response.data?.success) {
        throw new Error(extractErrorMessage(response.data, "Failed to create workspace"));
      }

      // Hydrate session & auth context
      if (typeof window !== "undefined") {
        localStorage.setItem("has_session", "1");
        sessionStorage.setItem("workspace_activation_celebration_pending", "1");
      }

      await refreshUser();

      // Warm dashboard query cache
      try {
        await queryClient.prefetchQuery({
          queryKey: ["dashboardData", "month"],
          queryFn: () => fetchDashboardData("month"),
          staleTime: 2 * 60 * 1000,
        });
      } catch {
        // Prefetch optimization
      }

      router.push("/dashboard");
    } catch (err: any) {
      const msg = extractErrorMessage(
        err.response?.data,
        err.message || "Something went wrong creating your workspace. Please try again."
      );
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <>
      <div className="auth-card-header">
        <h2 className="auth-card-title">Create Your Workspace 🚀</h2>
        <p className="auth-card-subtitle">
          Set up your company identity and brand styling in seconds.
        </p>
      </div>

      <form onSubmit={handleOnboarding} className="space-y-5">
        {/* Company Name */}
        <div className="space-y-2">
          <Label htmlFor="companyName" className="text-sm font-semibold">
            Company / Workspace Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="companyName"
            type="text"
            placeholder="e.g. Acme Corp or Growth Labs"
            className={`rounded-xl h-11 transition-all ${
              error ? "border-destructive focus-visible:ring-destructive" : ""
            }`}
            value={companyName}
            onChange={(e) => {
              setCompanyName(e.target.value);
              if (error) setError(null);
            }}
            required
            disabled={loading}
            autoFocus
          />
          {error && (
            <p className="text-xs text-destructive font-medium mt-1.5 flex items-center gap-1">
              {error}
            </p>
          )}
        </div>

        {/* Company Logo Upload */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">
              Company Logo <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
            </Label>
            {detectedColor && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground animate-fadeIn">
                <AppIcon name="ai" icon={Sparkles} size={14} className="text-primary" />
                <span>Detected Color:</span>
                <span
                  className="inline-block w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm"
                  style={{ backgroundColor: detectedColor }}
                />
                <span className="font-mono text-[11px] font-semibold text-foreground uppercase">
                  {detectedColor}
                </span>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={handleFileChange}
            disabled={loading}
          />

          {logoPreview ? (
            <div className="relative rounded-2xl border-2 border-border/80 p-3 bg-card/60 flex items-center gap-4 transition-all">
              <div className="w-16 h-16 rounded-xl border border-border/60 bg-muted/30 flex items-center justify-center p-2 overflow-hidden shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoPreview}
                  alt="Company Logo Preview"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">
                  {logoFile?.name || "logo.png"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {logoFile ? `${(logoFile.size / 1024).toFixed(1)} KB` : "Selected"} • Dominant brand color will be extracted
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] px-2.5 rounded-lg"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                  >
                    <AppIcon name="upload" icon={ImagePlus} size={12} className="mr-1 text-primary" />
                    Change
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] px-2.5 rounded-lg"
                    onClick={handleOpenCropForCurrentLogo}
                    disabled={loading}
                  >
                    <AppIcon name="edit" icon={Crop} size={12} className="mr-1 text-primary" />
                    Crop
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px] px-2 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                    onClick={handleRemoveLogo}
                    disabled={loading}
                  >
                    <AppIcon name="close" icon={X} size={12} className="mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 bg-muted/20 hover:bg-muted/40 ${
                isDragging
                  ? "border-primary bg-primary/10 ring-4 ring-primary/20 scale-[1.01]"
                  : "border-border/80 hover:border-primary/60"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110">
                <AppIcon name="upload" icon={UploadCloud} size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  PNG, JPG, or WebP (max. 5MB)
                </p>
              </div>
            </div>
          )}

          {/* Image Cropper Modal */}
          <ImageCropperModal
            open={cropModalOpen}
            onOpenChange={setCropModalOpen}
            imageFile={selectedRawFile}
            imageSrc={logoPreview}
            onCropComplete={handleCropComplete}
            title="Crop Company Logo"
            description="Adjust framing, zoom and aspect ratio to ensure your company logo looks sharp."
          />
        </div>

        {/* Submit Action */}
        <Button
          type="submit"
          disabled={loading}
          className="rounded-xl w-full h-11 flex items-center justify-center gap-2 font-semibold shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Setting up your workspace & brand...</span>
            </>
          ) : (
            <>
              <span>Create Workspace</span>
              <AppIcon name="arrowRight" icon={ArrowRight} size={16} />
            </>
          )}
        </Button>
      </form>
    </>
  );
}
