"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  UploadCloud,
  X,
  File,
  Image as ImageIcon,
  Video,
  FileText,
  CheckCircle2,
  Paperclip,
  Archive,
  Code2,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Progress } from "@/shared/ui/progress";
import { toast } from "sonner";

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
  maxSizeMB = 20,
}: FileUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleProcessFiles = useCallback(
    (newFiles: File[] | FileList | null) => {
      if (!newFiles) return;

      const fileArray = Array.from(newFiles);
      if (fileArray.length === 0) return;

      const validFiles: File[] = [];
      for (const file of fileArray) {
        if (file.size > maxSizeMB * 1024 * 1024) {
          toast.error(`File "${file.name}" exceeds the ${maxSizeMB}MB limit.`);
          continue;
        }
        validFiles.push(file);
      }

      if (files.length + validFiles.length > maxFiles) {
        toast.warning(`Maximum ${maxFiles} attachments allowed. Some files were skipped.`);
        validFiles.splice(maxFiles - files.length);
      }

      if (validFiles.length === 0) return;

      const mappedFiles: FileWithPreview[] = validFiles.map((file) =>
        Object.assign(file, {
          preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
          id: `file_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          progress: 100,
          status: "success" as const,
        })
      );

      setFiles((prev) => [...prev, ...mappedFiles]);
      toast.success(
        `Attached ${validFiles.length} file${validFiles.length > 1 ? "s" : ""}`
      );
    },
    [files.length, maxFiles, maxSizeMB, setFiles]
  );

  // Global clipboard paste listener for pasted screenshots
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
          const blob = items[i].getAsFile();
          if (blob && typeof window !== "undefined" && window.File) {
            const fileName = `screenshot-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.png`;
            const file = new (window.File as any)([blob], fileName, { type: blob.type }) as File;
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

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
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
  };

  const getFileIcon = (type: string, name: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-5 h-5 text-emerald-500" />;
    if (type.startsWith("video/")) return <Video className="w-5 h-5 text-indigo-500" />;
    if (type === "application/pdf") return <FileText className="w-5 h-5 text-rose-500" />;
    if (name.endsWith(".zip") || name.endsWith(".tar") || name.endsWith(".gz"))
      return <Archive className="w-5 h-5 text-amber-500" />;
    if (name.endsWith(".json") || name.endsWith(".log") || name.endsWith(".csv"))
      return <Code2 className="w-5 h-5 text-sky-500" />;
    return <File className="w-5 h-5 text-slate-500" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer group bg-card hover:bg-muted/40",
          isDragActive
            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
            : "border-border hover:border-primary/50"
        )}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={() => document.getElementById("support-file-upload")?.click()}
      >
        <input
          id="support-file-upload"
          type="file"
          multiple
          className="hidden"
          onChange={onFileInputChange}
          accept="image/*,video/*,.pdf,.txt,.log,.json,.csv,.zip,.xlsx,.xls,.doc,.docx"
        />
        <div className="p-3 bg-primary/10 rounded-full mb-2.5 text-primary group-hover:scale-110 transition-transform">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h4 className="font-semibold text-xs text-foreground mb-0.5">
          Drag & drop files, or <span className="text-primary underline">browse</span>
        </h4>
        <p className="text-[11px] text-muted-foreground mb-3">
          Tip: You can also press <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono text-[10px] text-foreground">Ctrl+V</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono text-[10px] text-foreground">⌘+V</kbd> anywhere to paste screenshot
        </p>
        <div className="flex flex-wrap gap-1.5 justify-center text-[10px] font-semibold text-muted-foreground">
          <span className="bg-muted px-2 py-0.5 rounded border border-border/60">Images (PNG, JPG, WebP)</span>
          <span className="bg-muted px-2 py-0.5 rounded border border-border/60">PDF & Docs</span>
          <span className="bg-muted px-2 py-0.5 rounded border border-border/60">Logs & JSON</span>
          <span className="bg-muted px-2 py-0.5 rounded border border-border/60">Max {maxSizeMB}MB / {maxFiles} files</span>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground px-1">
            <span className="flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-primary" /> Attached Files ({files.length}/{maxFiles})
            </span>
            <button
              type="button"
              onClick={() => setFiles([])}
              className="text-xs text-destructive hover:underline"
            >
              Remove all
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center p-2.5 border rounded-lg bg-card/80 hover:bg-card shadow-xs gap-3 group relative transition-colors"
              >
                <div className="shrink-0 w-9 h-9 rounded-md bg-muted/60 flex items-center justify-center overflow-hidden border border-border/50">
                  {file.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={file.preview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    getFileIcon(file.type, file.name)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{file.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground font-mono">{formatSize(file.size)}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Ready
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
                  title="Remove attachment"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
