"use client";

import React from "react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Button } from "@/shared/ui/button";
import { formatBytes } from "@/shared/lib/utils";
import { MediaPreviewItem } from "./ticket-modal-types";

interface TicketMediaPreviewModalProps {
  previewMedia: MediaPreviewItem | null;
  onClose: () => void;
}

export function TicketMediaPreviewModal({
  previewMedia,
  onClose,
}: TicketMediaPreviewModalProps) {
  if (!previewMedia) return null;

  return (
    <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col justify-between overflow-hidden">
      <div className="p-4 border-b border-border/60 flex items-center justify-between">
        <div className="text-sm font-bold truncate pr-6 text-foreground flex items-center gap-2">
          {previewMedia.isVideo ? (
            <AppIcon name="video" size={16} className="text-indigo-500" />
          ) : (
            <AppIcon name="image" size={16} className="text-emerald-500" />
          )}
          <span className="truncate">{previewMedia.filename}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <AppIcon name="close" size={16} />
        </Button>
      </div>

      <div className="flex-1 p-4 flex items-center justify-center bg-black/5 dark:bg-black/60 overflow-hidden select-none">
        {previewMedia.isVideo ? (
          <video
            src={previewMedia.url}
            controls
            autoPlay
            className="max-h-[60vh] w-auto max-w-full rounded-xl shadow-2xl"
          />
        ) : previewMedia.isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewMedia.url}
            alt={previewMedia.filename}
            className="max-h-[60vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
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
          {previewMedia.size ? formatBytes(previewMedia.size) : ""}
        </span>
        <div className="flex items-center gap-2">
          <a
            href={previewMedia.url}
            download={previewMedia.filename}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors shadow-2xs"
          >
            <AppIcon name="download" size={13} className="text-primary-foreground" />
            Download
          </a>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs cursor-pointer"
          >
            Back to Ticket
          </Button>
        </div>
      </div>
    </div>
  );
}
