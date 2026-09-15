"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";

export interface UseImageCropperOptions {
  maxSize?: number; // In bytes, defaults to 5MB (5 * 1024 * 1024)
  allowedTypesMessage?: string;
  maxSizeMessage?: string;
}

export function useImageCropper(options: UseImageCropperOptions = {}) {
  const {
    maxSize = 5 * 1024 * 1024,
    allowedTypesMessage = "Please upload a valid image file (PNG, JPG, or WebP)",
    maxSizeMessage = "Image file size must be less than 5MB",
  } = options;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedRawFile, setSelectedRawFile] = useState<File | null>(null);

  const handleSelectRawFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error(allowedTypesMessage);
        return false;
      }

      if (file.size > maxSize) {
        toast.error(maxSizeMessage);
        return false;
      }

      setSelectedRawFile(file);
      setCropModalOpen(true);
      return true;
    },
    [maxSize, allowedTypesMessage, maxSizeMessage]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleSelectRawFile(file);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleSelectRawFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleSelectRawFile(file);
      }
    },
    [handleSelectRawFile]
  );

  const openCropperForFile = useCallback((file: File | null) => {
    if (!file) return;
    setSelectedRawFile(file);
    setCropModalOpen(true);
  }, []);

  const closeCropper = useCallback(() => {
    setCropModalOpen(false);
    setSelectedRawFile(null);
  }, []);

  return {
    fileInputRef,
    isDragging,
    cropModalOpen,
    setCropModalOpen,
    selectedRawFile,
    setSelectedRawFile,
    handleSelectRawFile,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    openCropperForFile,
    closeCropper,
  };
}
