"use client";

import React from "react";
import { formatBytes } from "@/shared/lib/utils";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { isImageFile, isVideoFile } from "./ticket-shared.constants";

export interface TicketAttachmentItem {
  id?: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
}

export interface TicketAttachmentListProps {
  attachments: TicketAttachmentItem[];
  onPreviewMedia?: (media: {
    filename: string;
    url: string;
    size?: number;
    contentType?: string;
    isImage: boolean;
    isVideo: boolean;
  }) => void;
}

export function TicketAttachmentList({
  attachments,
  onPreviewMedia,
}: TicketAttachmentListProps) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <AppIcon name="paperclip" size={13} className="text-muted-foreground" />
        <span className="text-xs font-bold text-foreground">
          Attachments ({attachments.length})
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {attachments.map((att, idx) => {
          const isImg = isImageFile(att.fileName, att.fileType);
          const isVid = isVideoFile(att.fileName, att.fileType);
          const hasUrl = Boolean(att.fileUrl);

          return (
            <div
              key={att.id || idx}
              className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-card hover:bg-muted/40 transition-colors gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-muted/80 flex items-center justify-center shrink-0 text-muted-foreground">
                  {isImg ? (
                    <AppIcon name="image" size={16} />
                  ) : isVid ? (
                    <AppIcon name="video" size={16} />
                  ) : (
                    <AppIcon name="paperclip" size={16} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate" title={att.fileName}>
                    {att.fileName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {att.fileSize ? formatBytes(att.fileSize) : "—"}
                    </span>
                    {isImg && (
                      <span className="text-[9px] px-1.5 py-0 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                        IMG
                      </span>
                    )}
                    {isVid && (
                      <span className="text-[9px] px-1.5 py-0 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold uppercase">
                        VID
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {hasUrl && (
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onPreviewMedia && (isImg || isVid)) {
                        onPreviewMedia({
                          filename: att.fileName,
                          url: att.fileUrl,
                          size: att.fileSize,
                          contentType: att.fileType,
                          isImage: isImg,
                          isVideo: isVid,
                        });
                      } else {
                        window.open(att.fileUrl, "_blank");
                      }
                    }}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
                    title="Preview"
                  >
                    <AppIcon name="eye" size={14} className="text-muted-foreground group-hover:text-foreground" />
                  </button>
                  <a
                    href={att.fileUrl}
                    download={att.fileName}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
                    title="Download"
                  >
                    <AppIcon name="download" size={14} className="text-muted-foreground group-hover:text-foreground" />
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
