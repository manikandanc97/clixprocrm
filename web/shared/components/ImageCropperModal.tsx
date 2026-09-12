"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Slider } from "@/shared/ui/slider";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  Check,
  Crop as CropIcon,
} from "lucide-react";

interface ImageCropperModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File | null;
  imageSrc?: string | null;
  onCropComplete: (croppedFile: File, previewUrl: string) => void;
  title?: string;
  description?: string;
}

export function ImageCropperModal({
  open,
  onOpenChange,
  imageFile,
  imageSrc,
  onCropComplete,
  title = "Crop & Align Workspace Logo",
  description = "Drag to reposition and zoom for a perfect square logo display.",
}: ImageCropperModalProps) {
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Position offset (pan)
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const offsetStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  // Source identity tracking for transform resets
  const sourceKey = open
    ? imageFile
      ? `${imageFile.name}_${imageFile.lastModified}_${imageFile.size}`
      : imageSrc || ""
    : "";
  const [prevSourceKey, setPrevSourceKey] = useState(sourceKey);

  if (sourceKey !== prevSourceKey) {
    setPrevSourceKey(sourceKey);
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
    setImageLoaded(false);
  }

  // Convert imageFile to Data URL asynchronously
  useEffect(() => {
    if (!open || !imageFile) return;

    let active = true;
    const reader = new FileReader();
    reader.onload = () => {
      if (active && typeof reader.result === "string") {
        setFileDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(imageFile);

    return () => {
      active = false;
    };
  }, [open, imageFile]);

  const activeImageUrl = imageFile ? fileDataUrl : (imageSrc || null);

  // Fixed 1:1 Square Crop Dimensions (220px x 220px)
  const cropSize = 220;

  // Pointer drag for panning image
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    offsetStartRef.current = { ...offset };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setOffset({
      x: offsetStartRef.current.x + dx,
      y: offsetStartRef.current.y + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.002;
    setZoom((prev) => Math.min(3, Math.max(0.5, +(prev + delta).toFixed(2))));
  };

  // Reset transforms
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  // Generate high quality canvas output (512x512 Square)
  const handleApplyCrop = async () => {
    if (!imgRef.current || !activeImageUrl) return;
    setIsProcessing(true);

    try {
      const img = imgRef.current;
      const targetSize = 512;

      const canvas = document.createElement("canvas");
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, targetSize, targetSize);

      // Coordinate transformations
      ctx.save();
      ctx.translate(targetSize / 2, targetSize / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      // Scale calculations
      const scaleMultiplier = targetSize / cropSize;

      // Base display bounds
      const naturalWidth = img.naturalWidth || 300;
      const naturalHeight = img.naturalHeight || 300;
      const naturalAspect = naturalWidth / naturalHeight;

      const stageW = 320;
      const stageH = 240;
      let displayW = stageW;
      let displayH = stageW / naturalAspect;

      if (displayH > stageH) {
        displayH = stageH;
        displayW = stageH * naturalAspect;
      }

      const drawW = displayW * zoom * scaleMultiplier;
      const drawH = displayH * zoom * scaleMultiplier;
      const drawX = offset.x * scaleMultiplier;
      const drawY = offset.y * scaleMultiplier;

      ctx.drawImage(img, -drawW / 2 + drawX, -drawH / 2 + drawY, drawW, drawH);
      ctx.restore();

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const fileName = imageFile?.name
            ? imageFile.name.replace(/\.[^/.]+$/, "") + "-cropped.png"
            : "logo.png";
          const croppedFile = new File([blob], fileName, { type: "image/png" });
          const previewUrl = URL.createObjectURL(blob);
          onCropComplete(croppedFile, previewUrl);
          onOpenChange(false);
        },
        "image/png",
        0.95
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] w-full p-0 overflow-hidden border border-border/80 bg-background shadow-2xl rounded-2xl">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
              <CropIcon className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Main Simple Cropping Stage */}
        <div className="px-6 space-y-4">
          {/* Visual Crop Box Area */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
            className="relative w-full h-[270px] rounded-xl overflow-hidden flex items-center justify-center bg-zinc-950 select-none cursor-grab active:cursor-grabbing border border-zinc-800 shadow-inner"
          >
            {/* Background Checkered pattern */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
                backgroundSize: "14px 14px",
              }}
            />

            {/* Rendered Image */}
            {activeImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imgRef}
                src={activeImageUrl}
                alt="Crop target"
                crossOrigin="anonymous"
                onLoad={() => setImageLoaded(true)}
                draggable={false}
                className={`pointer-events-none max-w-none transition-opacity origin-center ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  maxHeight: "240px",
                  maxWidth: "300px",
                  objectFit: "contain",
                }}
              />
            )}

            {!imageLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 gap-2">
                <div className="w-6 h-6 border-2 border-zinc-600 border-t-primary rounded-full animate-spin" />
                <span className="text-xs font-medium">Loading image...</span>
              </div>
            )}

            {/* Dark Mask Vignette around Square crop frame */}
            <div
              className="absolute pointer-events-none transition-all duration-200 border-2 border-primary rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]"
              style={{
                width: `${cropSize}px`,
                height: `${cropSize}px`,
              }}
            >
              {/* Subtle Rule-of-Thirds Grid */}
              <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-30">
                <div className="border-r border-b border-white/80" />
                <div className="border-r border-b border-white/80" />
                <div className="border-b border-white/80" />
                <div className="border-r border-b border-white/80" />
                <div className="border-r border-b border-white/80" />
                <div className="border-b border-white/80" />
                <div className="border-r border-b border-white/80" />
                <div className="border-r border-white/80" />
                <div />
              </div>
            </div>

            {/* Helper Tag */}
            <div className="absolute bottom-2.5 px-3 py-1 rounded-full bg-black/80 backdrop-blur-sm text-[11px] font-medium text-zinc-300 pointer-events-none border border-white/10 shadow-sm">
              🖐️ Drag to reposition • Scroll to zoom
            </div>
          </div>

          {/* Clean Controls: Zoom Slider + Rotate + Reset */}
          <div className="space-y-3 pt-1">
            {/* Zoom Bar */}
            <div className="flex items-center gap-3 bg-muted/40 p-2.5 rounded-xl border border-border/60">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                onClick={() =>
                  setZoom((prev) => Math.max(0.5, +(prev - 0.1).toFixed(2)))
                }
              >
                <ZoomOut className="w-4 h-4" />
              </Button>

              <Slider
                value={[zoom]}
                min={0.5}
                max={2.5}
                step={0.05}
                onValueChange={([val]) => setZoom(val)}
                className="flex-1 cursor-pointer"
              />

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                onClick={() =>
                  setZoom((prev) => Math.min(2.5, +(prev + 0.1).toFixed(2)))
                }
              >
                <ZoomIn className="w-4 h-4" />
              </Button>

              <span className="text-xs font-mono font-semibold text-muted-foreground w-10 text-right shrink-0">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Bottom Actions: Rotate & Reset */}
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                title="Rotate 90°"
                className="h-8 px-3 text-xs font-semibold rounded-lg border-border/60"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
              >
                <RotateCw className="w-3.5 h-3.5 mr-1" />
                Rotate 90°
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                title="Reset Position"
                className="h-8 px-3 text-xs font-semibold rounded-lg border-border/60 text-muted-foreground hover:text-foreground"
                onClick={handleReset}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Actions with generous padding and space */}
        <div className="px-6 py-4 mt-4 bg-muted/20 border-t border-border/50 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 px-4 rounded-xl text-xs font-semibold border-border/70 hover:bg-muted"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            className="h-9 px-5 rounded-xl text-xs font-bold gap-1.5 shadow-sm"
            onClick={handleApplyCrop}
            disabled={isProcessing || !imageLoaded}
          >
            <Check className="w-4 h-4" />
            {isProcessing ? "Processing..." : "Crop & Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
