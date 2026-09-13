"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Download } from "lucide-react";
import { formatBytes } from "@/shared/lib/utils";

export interface PreviewMediaData {
  filename: string;
  url: string;
  size?: number;
  contentType?: string;
  isImage: boolean;
  isVideo: boolean;
}

interface TicketMediaPreviewDialogProps {
  previewMedia: PreviewMediaData | null;
  onOpenChange: (open: boolean) => void;
}

export function TicketMediaPreviewDialog({
  previewMedia,
  onOpenChange,
}: TicketMediaPreviewDialogProps) {
  return (
    <Dialog open={!!previewMedia} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-card/95 border-border rounded-2xl shadow-2xl backdrop-blur-xl">
        <DialogHeader className="p-4 border-b border-border/60 flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-sm font-bold truncate pr-6 text-foreground flex items-center gap-2">
            {previewMedia?.filename}
          </DialogTitle>
          <DialogDescription className="sr-only">Attached media preview lightbox</DialogDescription>
        </DialogHeader>

        <div className="p-4 flex items-center justify-center bg-black/5 dark:bg-black/60 min-h-[300px] max-h-[72vh] overflow-hidden select-none">
          {previewMedia?.isVideo ? (
            <video
              src={previewMedia.url}
              controls
              autoPlay
              className="max-h-[68vh] w-auto max-w-full rounded-xl shadow-2xl"
            />
          ) : previewMedia?.isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewMedia.url}
              alt={previewMedia.filename}
              className="max-h-[68vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
            />
          ) : (
            <div className="text-center py-10">
              <AppIcon name="file" size={44} className="text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Preview not available for this file type.</p>
            </div>
          )}
        </div>

        <div className="p-3.5 bg-muted/40 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground px-5">
          <span className="font-mono font-medium">
            {previewMedia?.size ? formatBytes(previewMedia.size) : ""}
          </span>
          <div className="flex items-center gap-2">
            {previewMedia?.url && (
              <a
                href={previewMedia.url}
                download={previewMedia.filename}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1.5 group cursor-pointer"
              >
                <AppIcon name="download" icon={Download} size={14} className="text-primary" /> Download File
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
