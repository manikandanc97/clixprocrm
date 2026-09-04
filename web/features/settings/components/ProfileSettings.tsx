"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { 
  Loader2, 
  Camera,
  Upload,
  User as UserIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  ShieldCheck as ShieldCheckIcon,
  Check as CheckIcon,
  AlertTriangle as AlertTriangleIcon,
  Trash2 as Trash2Icon,
  Save as SaveIcon,
  Pencil,
  X,
} from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { useAuth } from "@/features/auth/components/auth-provider";
import { CRMCard } from "@/shared/components/crm";
import { useMutation } from "@tanstack/react-query";
import { updateProfile, uploadUserAvatar } from "@/shared/lib/api/auth";
import { ImageCropperModal } from "@/shared/components/ImageCropperModal";
import { DeleteAccountModal } from "./DeleteAccountModal";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { toast } from "sonner";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function formatRole(role?: string) {
  if (!role) return "Member";
  return role
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getInitials(name?: string) {
  if (!name) return "CR";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

const ProfileSettings = () => {
  const { user, refreshUser } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedRawFile, setSelectedRawFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const initials = getInitials(user?.name);
  
  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      void refreshUser();
      setEditModalOpen(false);
      toast.success("Profile details updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update profile");
    }
  });

  const completion = useMemo(() => {
    let score = 0;
    if (user?.name) score += 25;
    if (user?.email) score += 25;
    if (user?.role) score += 20;
    if (user?.phone) score += 15;
    if (user?.avatar) score += 15;
    return score;
  }, [user]);

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
    setUploadingAvatar(true);
    try {
      const result = await uploadUserAvatar(croppedFile);
      if (result?.avatar) {
        await refreshUser();
        toast.success("Profile photo updated successfully!");
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to upload profile photo"
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      await updateProfile({ avatar: null });
      await refreshUser();
      toast.success("Profile photo removed successfully");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to remove profile photo"
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleOpenEditModal = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
    setEditModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

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
        title="Crop & Align Profile Photo"
        description="Position and crop your photo with proper 1:1 aspect ratio for optimal display across the CRM."
      />

      {/* Profile Identity Card */}
      <CRMCard className="p-3.5 sm:p-4.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left section: Avatar + Name & Email */}
          <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
            {/* Compact Modern Avatar Box */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
              className={`relative group cursor-pointer w-13 h-13 sm:w-14 sm:h-14 rounded-xl border transition-all flex items-center justify-center overflow-hidden bg-muted/40 backdrop-blur-sm shadow-xs shrink-0 ${
                isDragging
                  ? "border-primary bg-primary/10 ring-2 ring-primary/20 scale-[1.02]"
                  : "border-border/70 hover:border-primary/60 hover:bg-muted/60"
              }`}
            >
              {uploadingAvatar ? (
                <div className="flex flex-col items-center justify-center p-1 text-center gap-0.5">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-[8px] font-semibold text-muted-foreground">Uploading</span>
                </div>
              ) : user?.avatar ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.avatar}
                    alt={user.name || "Profile Photo"}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
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
                    <AppIcon icon={Camera} size={13} className="text-white" />
                    <span className="text-[8.5px] font-semibold">Upload</span>
                  </div>
                </div>
              )}
            </div>

            {/* Name and Email */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                  {user?.name || "User Name"}
                </h2>
                {completion === 100 && (
                  <Badge variant="success" className="px-1.5 py-0.2 text-[8.5px] font-bold uppercase tracking-widest">
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-medium truncate">{user?.email}</p>
            </div>
          </div>

          {/* Right section: Admin Badge + Upload Button + Remove + File format info */}
          <div className="flex flex-col items-start sm:items-end gap-1 shrink-0 w-full sm:w-auto">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-semibold tracking-wide border border-primary/15">
                <AppIcon name="security" icon={ShieldCheckIcon} size={13} className="text-primary" />
                {formatRole(user?.role)}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="group h-7.5 text-xs font-semibold px-2.5 rounded-md border-border/70 hover:bg-muted/70 hover:border-primary/40 transition-colors shadow-2xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                <AppIcon name="upload" icon={Upload} size={12} className="mr-1 text-primary group-hover:text-primary transition-colors" />
                {user?.avatar ? "Change Photo" : "Upload Photo"}
              </Button>

              {user?.avatar && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="group h-7.5 text-xs font-semibold px-2 rounded-md text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={handleRemoveAvatar}
                  disabled={uploadingAvatar}
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

      {/* Enterprise Personal Details Overview Card with Inline Profile Completion */}
      <CRMCard className="p-3.5 sm:p-4.5">
        <div className="mb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-foreground">Personal Information</h3>
              <Badge variant="neutral" className="text-[9.5px] font-semibold px-1.5 py-0">
                Verified Credentials
              </Badge>
            </div>
            <p className="text-[11.5px] text-muted-foreground font-medium mt-0.5">
              Your personal credentials and contact details across the CRM.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Inline Sleek Profile Completion Indicator */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/60 shadow-2xs">
              <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <AppIcon name="check" icon={CheckIcon} size={11} className="text-emerald-600" />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold text-muted-foreground">Profile</span>
                  <span className="text-[10px] font-bold text-primary">{completion}%</span>
                </div>
                <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-primary h-full transition-all duration-500 rounded-full"
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Edit Profile Button that triggers the modal */}
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
          {/* Tile 1: Full Name */}
          <div className="p-3 rounded-xl bg-muted/20 border border-border/60 hover:bg-muted/30 transition-colors space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <AppIcon name="user" icon={UserIcon} size={13} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Display Name</span>
            </div>
            <p className="text-xs sm:text-[13px] font-semibold text-foreground truncate pl-8">
              {user?.name || "Not provided"}
            </p>
          </div>

          {/* Tile 2: Email Address */}
          <div className="p-3 rounded-xl bg-muted/20 border border-border/60 hover:bg-muted/30 transition-colors space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <AppIcon name="mail" icon={MailIcon} size={13} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</span>
            </div>
            <p className="text-xs sm:text-[13px] font-semibold text-foreground truncate pl-8 flex items-center gap-1">
              <span className="truncate">{user?.email || "Not configured"}</span>
            </p>
          </div>

          {/* Tile 3: Phone Number */}
          <div className="p-3 rounded-xl bg-muted/20 border border-border/60 hover:bg-muted/30 transition-colors space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <AppIcon name="phone" icon={PhoneIcon} size={13} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Phone Number</span>
            </div>
            <p className="text-xs sm:text-[13px] font-semibold text-foreground truncate pl-8">
              {user?.phone || <span className="text-muted-foreground/60 italic font-normal text-xs">Not provided</span>}
            </p>
          </div>
        </div>
      </CRMCard>

      {/* Danger Zone */}
      <CRMCard className="p-3.5 sm:p-4 border-destructive/20 bg-destructive/[0.03] overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-bold tracking-tight text-destructive flex items-center gap-1.5">
                <AppIcon name="alert" icon={AlertTriangleIcon} size={14} className="text-destructive" />
                Danger Zone
              </h3>
              <Badge variant="destructive" className="text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.2">
                Irreversible
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">
              Permanently delete your account, workspace, and all associated CRM records.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            className="group font-semibold text-xs gap-1.5 shrink-0 h-8 px-3 shadow-xs"
          >
            <AppIcon name="trash" icon={Trash2Icon} size={12} />
            Delete Account
          </Button>
        </div>
      </CRMCard>

      {/* Enterprise Edit Profile Details Popup Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card p-0 overflow-hidden shadow-2xl rounded-2xl">
          <div className="p-5 pb-3.5 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                <AppIcon name="edit" icon={Pencil} size={16} />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Edit Personal Details
                </DialogTitle>
                <DialogDescription className="text-[11.5px] text-muted-foreground mt-0.5">
                  Update your personal profile information and contact details.
                </DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveModal} className="px-5 py-4 space-y-3.5">
            {/* Field: Display Name */}
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-foreground/80 uppercase tracking-wider">
                Display Name
              </Label>
              <div className="relative group">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 group-focus-within:text-primary transition-colors pointer-events-none flex items-center justify-center">
                  <AppIcon name="user" icon={UserIcon} size={14} />
                </div>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Full Name"
                  required
                  className="pl-8.5 h-9 text-xs sm:text-sm rounded-lg border-border/70 bg-muted/20 hover:bg-muted/30 focus:bg-background focus:border-primary/40 transition-all font-medium"
                />
              </div>
            </div>

            {/* Field: Email Address */}
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-foreground/80 uppercase tracking-wider">
                Email Address
              </Label>
              <div className="relative group">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 group-focus-within:text-primary transition-colors pointer-events-none flex items-center justify-center">
                  <AppIcon name="mail" icon={MailIcon} size={14} />
                </div>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@company.com"
                  required
                  type="email"
                  className="pl-8.5 h-9 text-xs sm:text-sm rounded-lg border-border/70 bg-muted/20 hover:bg-muted/30 focus:bg-background focus:border-primary/40 transition-all font-medium"
                />
              </div>
            </div>

            {/* Field: Phone Number */}
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-foreground/80 uppercase tracking-wider">
                Phone Number
              </Label>
              <div className="relative group">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 group-focus-within:text-primary transition-colors pointer-events-none flex items-center justify-center">
                  <AppIcon name="phone" icon={PhoneIcon} size={14} />
                </div>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 000-0000"
                  className="pl-8.5 h-9 text-xs sm:text-sm rounded-lg border-border/70 bg-muted/20 hover:bg-muted/30 focus:bg-background focus:border-primary/40 transition-all font-medium"
                />
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

      <DeleteAccountModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
      />
    </div>
  );
};

export default ProfileSettings;
