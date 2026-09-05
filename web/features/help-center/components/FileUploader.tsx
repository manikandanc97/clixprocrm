"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  File as FileIcon,
  Image as ImageIcon,
  Video,
  FileText,
  Paperclip,
  Archive,
  Code2,
  Film,
} from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { cn, formatBytes } from "@/shared/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";

export interface FileWithPreview extends File {
  preview?: string;
  id: string;
  progress?: number;
  status?: "uploading" | "success" | "error";
}

interface FileUploaderProps {
  files: FileWithPreview[];
  setFiles: React.Dispatch<React.SetStateAction<FileWithPreview[]>>;
  maxFiles?: number;
  maxSizeMB?: number;
}

export function FileUploader({
  files,
  setFiles,
  maxFiles = 10,
  maxSizeMB = 50,
}: FileUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileWithPreview | null>(null);

  const windowDragCounterRef = useRef(0);
  const localDragCounterRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleProcessFiles = useCallback(
    (newFiles: File[] | FileList | null) => {
      if (!newFiles) return;

      const fileArray = Array.from(newFiles);
      if (fileArray.length === 0) return;

      const validFiles: File[] = [];
      for (const file of fileArray) {
        if (file.size > maxSizeMB * 1024 * 1024) {
          toast.error(`File "${file.name}" exceeds the ${maxSizeMB}MB size limit.`);
          continue;
        }
        validFiles.push(file);
      }

      if (files.length + validFiles.length > maxFiles) {
        toast.warning(`Maximum ${maxFiles} attachments allowed. Extra files were skipped.`);
        validFiles.splice(maxFiles - files.length);
      }

      if (validFiles.length === 0) return;

      const mappedFiles: FileWithPreview[] = validFiles.map((file) => {
        const isMedia = file.type.startsWith("image/") || file.type.startsWith("video/");
        return Object.assign(file, {
          preview: isMedia ? URL.createObjectURL(file) : undefined,
          id: `file_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          progress: 100,
          status: "success" as const,
        });
      });

      setFiles((prev) => [...prev, ...mappedFiles]);

      const imageCount = validFiles.filter((f) => f.type.startsWith("image/")).length;
      const videoCount = validFiles.filter((f) => f.type.startsWith("video/")).length;
      const otherCount = validFiles.length - imageCount - videoCount;

      const details: string[] = [];
      if (imageCount > 0) details.push(`${imageCount} image${imageCount > 1 ? "s" : ""}`);
      if (videoCount > 0) details.push(`${videoCount} video${videoCount > 1 ? "s" : ""}`);
      if (otherCount > 0) details.push(`${otherCount} doc${otherCount > 1 ? "s" : ""}`);

      toast.success(`Attached ${details.join(", ")} successfully!`);
    },
    [files.length, maxFiles, maxSizeMB, setFiles]
  );

  // Global window drag detection for enterprise screen-level drag indication
  useEffect(() => {
    const handleWindowDragEnter = (e: DragEvent) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files")) {
        e.preventDefault();
        windowDragCounterRef.current += 1;
        if (windowDragCounterRef.current === 1) {
          setIsWindowDragging(true);
        }
      }
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      windowDragCounterRef.current -= 1;
      if (windowDragCounterRef.current <= 0) {
        windowDragCounterRef.current = 0;
        setIsWindowDragging(false);
      }
    };

    const handleWindowDragOver = (e: DragEvent) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files")) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      windowDragCounterRef.current = 0;
      localDragCounterRef.current = 0;
      setIsWindowDragging(false);
      setIsDragActive(false);

      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleProcessFiles(e.dataTransfer.files);
      }
    };

    window.addEventListener("dragenter", handleWindowDragEnter);
    window.addEventListener("dragleave", handleWindowDragLeave);
    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("drop", handleWindowDrop);

    return () => {
      window.removeEventListener("dragenter", handleWindowDragEnter);
      window.removeEventListener("dragleave", handleWindowDragLeave);
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("drop", handleWindowDrop);
    };
  }, [handleProcessFiles]);

  // Global clipboard paste listener for pasted screenshots
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const blob = items[i].getAsFile();
        if (blob && typeof window !== "undefined" && window.File) {
          const isVideo = blob.type.startsWith("video/");
          const prefix = isVideo ? "screen-recording" : "screenshot";
          const ext = isVideo ? "mp4" : "png";
          const fileName = `${prefix}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.${ext}`;
          const file = new File([blob], fileName, { type: blob.type });
          pastedFiles.push(file);
        }
      }

      if (pastedFiles.length > 0) {
        handleProcessFiles(pastedFiles);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleProcessFiles]);

  // Local Dropzone Drag Handlers (with counter to eliminate child flicker)
  const onLocalDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    localDragCounterRef.current += 1;
    setIsDragActive(true);
  };

  const onLocalDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    localDragCounterRef.current -= 1;
    if (localDragCounterRef.current <= 0) {
      localDragCounterRef.current = 0;
      setIsDragActive(false);
    }
  };

  const onLocalDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
  };

  const onLocalDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    localDragCounterRef.current = 0;
    windowDragCounterRef.current = 0;
    setIsDragActive(false);
    setIsWindowDragging(false);
    handleProcessFiles(e.dataTransfer.files);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleProcessFiles(e.target.files);
    e.target.value = "";
  };

  const removeFile = (idToRemove: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === idToRemove);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((f) => f.id !== idToRemove);
    });
    if (previewFile?.id === idToRemove) {
      setPreviewFile(null);
    }
  };

  const getFileIcon = (type: string, name: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-5 h-5 text-emerald-500" />;
    if (
      type.startsWith("video/") ||
      name.endsWith(".mp4") ||
      name.endsWith(".webm") ||
      name.endsWith(".mov") ||
      name.endsWith(".avi") ||
      name.endsWith(".mkv")
    )
      return <Video className="w-5 h-5 text-indigo-500" />;
    if (type === "application/pdf") return <FileText className="w-5 h-5 text-rose-500" />;
    if (name.endsWith(".zip") || name.endsWith(".tar") || name.endsWith(".gz"))
      return <Archive className="w-5 h-5 text-amber-500" />;
    if (name.endsWith(".json") || name.endsWith(".log") || name.endsWith(".csv"))
      return <Code2 className="w-5 h-5 text-sky-500" />;
    return <FileIcon className="w-5 h-5 text-slate-500" />;
  };

  // Screen-wide enterprise drag overlay portal
  const screenDragOverlay = mounted
    ? createPortal(
        <AnimatePresence>
          {isWindowDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[99999] pointer-events-none flex items-center justify-center p-6 sm:p-12 bg-background/85 dark:bg-black/90 backdrop-blur-md select-none"
            >
              <motion.div
                initial={{ scale: 0.93, y: 12 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.93, y: 12 }}
                transition={{ type: "spring", stiffness: 350, damping: 26 }}
                className="w-full max-w-2xl border-3 border-dashed border-primary bg-primary/10 dark:bg-primary/15 rounded-3xl p-8 sm:p-14 flex flex-col items-center justify-center text-center shadow-2xl shadow-primary/30 relative overflow-hidden"
              >
                {/* Radial Glow & Pulse */}
                <div className="absolute inset-0 bg-radial from-primary/20 via-transparent to-transparent pointer-events-none animate-pulse" />

                {/* Animated Floating Badges and Central Icon */}
                <div className="relative mb-6">
                  <motion.div
                    animate={{ y: [-4, 4, -4] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-24 h-24 rounded-3xl bg-primary/20 border-2 border-primary/40 flex items-center justify-center shadow-xl shadow-primary/25"
                  >
                    <UploadCloud className="w-12 h-12 text-primary drop-shadow-md animate-pulse" />
                  </motion.div>
                  <motion.div
                    animate={{ y: [4, -4, 4] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-2 -right-3 px-2 py-1 rounded-xl bg-emerald-500 text-white flex items-center gap-1 text-[11px] font-bold shadow-lg"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Images</span>
                  </motion.div>
                  <motion.div
                    animate={{ y: [-3, 3, -3] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -bottom-2 -left-3 px-2 py-1 rounded-xl bg-indigo-600 text-white flex items-center gap-1 text-[11px] font-bold shadow-lg"
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Videos</span>
                  </motion.div>
                </div>

                {/* Main Headline */}
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-2">
                  Drop Images, Videos or Files Anywhere
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mb-6 font-medium">
                  Release anywhere on your screen to instantly attach files to your ticket.
                </p>

                {/* Supported Capabilities Chips */}
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold">
                  <span className="px-3 py-1 rounded-full bg-card border border-border shadow-xs text-foreground flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                    PNG, JPG, WebP, GIF
                  </span>
                  <span className="px-3 py-1 rounded-full bg-card border border-border shadow-xs text-foreground flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-indigo-500" />
                    MP4, WebM, MOV
                  </span>
                  <span className="px-3 py-1 rounded-full bg-card border border-border shadow-xs text-foreground flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-rose-500" />
                    PDF, Logs & Docs
                  </span>
                  <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-primary font-bold">
                    Up to {maxSizeMB}MB
                  </span>
                </div>

                {/* Attached Counter Pill */}
                <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-foreground/80">
                  <Paperclip className="w-3.5 h-3.5 text-primary" />
                  <span>Currently attached: {files.length} / {maxFiles}</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )
    : null;

  return (
    <div className="space-y-3">
      {/* Screen-wide Drag Overlay Portal */}
      {screenDragOverlay}

      {/* Local Dropzone Box */}
      <div
        role="region"
        aria-label="Upload files dropzone"
        tabIndex={0}
        data-interactive="true"
        data-no-icon-delegate="true"
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-6 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-primary/40 overflow-hidden",
          isDragActive
            ? "border-primary bg-primary/15 ring-4 ring-primary/25 scale-[1.01] shadow-xl shadow-primary/20"
            : "border-border/80 bg-card/60 hover:bg-muted/40 hover:border-primary/50 shadow-xs"
        )}
        onDragEnter={onLocalDragEnter}
        onDragLeave={onLocalDragLeave}
        onDragOver={onLocalDragOver}
        onDrop={onLocalDrop}
        onClick={() => document.getElementById("support-file-upload")?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            document.getElementById("support-file-upload")?.click();
          }
        }}
      >
        <input
          id="support-file-upload"
          type="file"
          multiple
          className="hidden"
          onChange={onFileInputChange}
          accept="image/*,video/*,.mp4,.webm,.mov,.avi,.mkv,.m4v,.pdf,.txt,.log,.json,.csv,.zip,.xlsx,.xls,.doc,.docx"
        />

        {/* Ambient background glow on hover or active */}
        <div
          className={cn(
            "absolute inset-0 bg-radial from-primary/10 to-transparent pointer-events-none transition-opacity duration-300",
            isDragActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        />

        {/* Upload Icon - Animates only when hovering over icon directly */}
        <div
          data-animate-target="true"
          className={cn(
            "p-3.5 rounded-2xl mb-3 flex items-center justify-center transition-colors duration-200 relative cursor-pointer",
            isDragActive
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
              : "bg-primary/10 text-primary hover:bg-primary/20"
          )}
        >
          <AppIcon name="upload" size={24} standalone />
          {isDragActive && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
            </span>
          )}
        </div>

        <h4 className="font-bold text-xs text-foreground mb-1">
          {isDragActive ? (
            <span className="text-primary font-extrabold flex items-center gap-1.5 justify-center">
              <AppIcon name="ai" size={14} standalone /> Release mouse to attach files right here
            </span>
          ) : (
            <>
              Drag & drop files anywhere, or <span className="text-primary underline font-extrabold">browse</span>
            </>
          )}
        </h4>

        <p className="text-[11px] text-muted-foreground mb-3 pointer-events-none">
          Tip: You can also press{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono text-[10px] text-foreground font-semibold">
            Ctrl+V
          </kbd>{" "}
          /{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono text-[10px] text-foreground font-semibold">
            ⌘+V
          </kbd>{" "}
          anywhere to paste screenshots or screen clips
        </p>

        {/* Category Pills - Animates icons only on hover without scaling */}
        <div className="flex flex-wrap gap-1.5 justify-center text-[10px] font-semibold text-muted-foreground">
          <span data-animate-target="true" className="bg-muted/80 px-2 py-0.5 rounded-lg border border-border/60 flex items-center gap-1 transition-colors duration-150 hover:bg-muted hover:border-emerald-500/40 hover:text-foreground cursor-pointer">
            <AppIcon name="image" size={12} standalone className="text-emerald-500" /> Images
          </span>
          <span data-animate-target="true" className="bg-muted/80 px-2 py-0.5 rounded-lg border border-border/60 flex items-center gap-1 transition-colors duration-150 hover:bg-muted hover:border-indigo-500/40 hover:text-foreground cursor-pointer">
            <AppIcon name="video" size={12} standalone className="text-indigo-500" /> Videos
          </span>
          <span data-animate-target="true" className="bg-muted/80 px-2 py-0.5 rounded-lg border border-border/60 flex items-center gap-1 transition-colors duration-150 hover:bg-muted hover:border-rose-500/40 hover:text-foreground cursor-pointer">
            <AppIcon name="file" size={12} standalone className="text-rose-500" /> PDF & Docs
          </span>
          <span className="bg-muted/80 px-2 py-0.5 rounded-lg border border-border/60 flex items-center gap-1 transition-colors duration-150 hover:bg-muted hover:border-sky-500/40 hover:text-foreground cursor-pointer">
            Logs & JSON
          </span>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-lg border border-primary/20 font-bold">
            Max {maxSizeMB}MB / {maxFiles} files
          </span>
        </div>
      </div>

      {/* Attached Files List */}
      {files.length > 0 && (
        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground px-1">
            <span className="flex items-center gap-1.5 text-foreground">
              <AppIcon name="paperclip" size={14} className="text-primary" /> Attached Files ({files.length}/{maxFiles})
            </span>
            <button
              type="button"
              onClick={() => setFiles([])}
              className="text-xs text-destructive hover:underline font-semibold cursor-pointer"
            >
              Remove all
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {files.map((file) => {
              const isImage = file.type.startsWith("image/");
              const isVideo = file.type.startsWith("video/");

              return (
                <div
                  key={file.id}
                  className="flex items-center p-2.5 border border-border/70 rounded-xl bg-card hover:border-border hover:shadow-sm gap-3 group relative transition-all"
                >
                  {/* Thumbnail / Icon with Click to Preview */}
                  <div
                    onClick={() => {
                      if (file.preview) {
                        setPreviewFile(file);
                      }
                    }}
                    className={cn(
                      "shrink-0 w-11 h-11 rounded-lg bg-muted/60 flex items-center justify-center overflow-hidden border border-border/60 relative select-none",
                      file.preview ? "cursor-pointer group/thumb" : ""
                    )}
                    title={file.preview ? "Click to preview" : undefined}
                  >
                    {file.preview ? (
                      isVideo ? (
                        <div className="relative w-full h-full flex items-center justify-center bg-black">
                          <video src={file.preview} className="w-full h-full object-cover opacity-80" muted />
                          <div className="absolute inset-0 bg-black/30 group-hover/thumb:bg-black/10 flex items-center justify-center transition-colors">
                            <AppIcon name="play" size={16} className="text-white fill-white drop-shadow" />
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-full h-full flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={file.preview} alt="preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/25 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                            <AppIcon name="eye" size={14} className="text-white drop-shadow" />
                          </div>
                        </div>
                      )
                    ) : (
                      getFileIcon(file.type, file.name)
                    )}
                  </div>

                  {/* File Metadata */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-semibold text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                      onClick={() => file.preview && setPreviewFile(file)}
                      title={file.name}
                    >
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground font-mono font-medium">
                        {formatBytes(file.size)}
                      </span>
                      {isVideo && (
                        <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold uppercase">
                          Video
                        </span>
                      )}
                      {isImage && (
                        <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                          Image
                        </span>
                      )}
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5 ml-auto">
                        <AppIcon name="circleCheck" size={12} className="text-emerald-500" /> Ready
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons: Preview & Remove */}
                  <div className="flex items-center gap-1 shrink-0">
                    {file.preview && (
                      <button
                        type="button"
                        onClick={() => setPreviewFile(file)}
                        className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer group/btn"
                        title="Preview attachment"
                      >
                        <AppIcon name="eye" size={14} className="text-muted-foreground group-hover/btn:text-foreground" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.id);
                      }}
                      className="p-1 hover:bg-destructive/15 text-muted-foreground hover:text-destructive rounded-lg transition-colors cursor-pointer group/btn"
                      title="Remove attachment"
                    >
                      <AppIcon name="close" size={14} className="text-muted-foreground group-hover/btn:text-destructive" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Media Preview Lightbox Modal */}
      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-card/95 border-border rounded-2xl shadow-2xl backdrop-blur-xl">
          <DialogHeader className="p-4 border-b border-border/60 flex flex-row items-center justify-between space-y-0">
            <DialogTitle className="text-sm font-bold truncate pr-6 text-foreground flex items-center gap-2">
              {previewFile?.type.startsWith("video/") ? (
                <AppIcon name="video" size={16} className="text-indigo-500" />
              ) : (
                <AppIcon name="image" size={16} className="text-emerald-500" />
              )}
              <span className="truncate">{previewFile?.name}</span>
            </DialogTitle>
            <DialogDescription className="sr-only">Media file preview lightbox</DialogDescription>
          </DialogHeader>

          <div className="p-4 flex items-center justify-center bg-black/5 dark:bg-black/40 min-h-[250px] max-h-[70vh] overflow-hidden">
            {previewFile?.type.startsWith("video/") && previewFile.preview ? (
              <video
                src={previewFile.preview}
                controls
                autoPlay
                className="max-h-[65vh] w-auto max-w-full rounded-xl shadow-lg"
              />
            ) : previewFile?.preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewFile.preview}
                alt={previewFile.name}
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
              />
            ) : (
              <p className="text-xs text-muted-foreground">Preview not available for this file type.</p>
            )}
          </div>

          <div className="p-3 bg-muted/30 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground px-4">
            <span className="font-mono">{previewFile ? formatBytes(previewFile.size) : ""}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (previewFile) removeFile(previewFile.id);
                }}
                className="text-xs text-destructive hover:underline font-semibold cursor-pointer flex items-center gap-1 group"
              >
                <AppIcon name="trash" size={13} className="text-destructive" /> Delete File
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
