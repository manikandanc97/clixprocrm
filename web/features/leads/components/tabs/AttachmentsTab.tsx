import React, { useRef, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Download, UploadCloud, File, FileText, Image as ImageIcon, Video, Trash2, Loader2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { useLeadAttachments, useUploadLeadAttachment, useDeleteLeadAttachment } from "@/shared/hooks/use-crm";
import { formatBytes } from "@/shared/lib/utils";
import { EmptyState } from "@/shared/components/EmptyState";
import { useViewMode } from "@/shared/hooks/useViewMode";
import { ViewToggle } from "@/shared/components/crm/ViewToggle";
import { AttachmentsSkeleton } from "@/shared/components/skeletons";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const getFileIcon = (fileType: string) => {
  if (fileType?.includes("image")) return <ImageIcon className="w-8 h-8 text-blue-500" />;
  if (fileType?.includes("video")) return <Video className="w-8 h-8 text-indigo-500" />;
  if (fileType?.includes("pdf")) return <FileText className="w-8 h-8 text-rose-500" />;
  return <File className="w-8 h-8 text-muted-foreground" />;
};

export function AttachmentsTab({ leadId }: { leadId: string }) {
  const { data: attachmentsResp, isLoading } = useLeadAttachments(leadId);
  const attachments = attachmentsResp?.data || [];
  const [viewMode, setViewMode] = useViewMode("documents", "grid");
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  
  const uploadAttachment = useUploadLeadAttachment();
  const deleteAttachment = useDeleteLeadAttachment();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFile = (file: File) => {
    uploadAttachment.mutate(
      {
        leadId,
        file,
      },
      {
        onSettled: () => {
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        },
      }
    );
  };

  const handleDragEnter = (e: React.DragEvent) => {
    if (e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files")) {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current += 1;
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files")) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "copy";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const fileList = Array.from(e.dataTransfer.files);
      fileList.forEach((file) => handleUploadFile(file));
      toast.success(`Uploading ${fileList.length} file${fileList.length > 1 ? "s" : ""}...`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadAttachment.mutate(
      {
        leadId,
        file,
      },
      {
        onSettled: () => {
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        },
      }
    );
  };

  const handleDelete = (attachmentId: string) => {
    if (confirm("Are you sure you want to remove this attachment?")) {
      deleteAttachment.mutate({ leadId, attachmentId });
    }
  };

  return (
    <div
      className="space-y-6 relative min-h-[280px]"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Animated Drop Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-30 bg-background/90 dark:bg-black/90 backdrop-blur-sm border-2 border-dashed border-primary rounded-2xl p-6 flex flex-col items-center justify-center text-center pointer-events-none shadow-xl shadow-primary/10"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary border border-primary/40 flex items-center justify-center mb-3 shadow-md">
              <UploadCloud className="w-8 h-8 animate-bounce" />
            </div>
            <h4 className="text-base font-extrabold text-foreground mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" /> Drop files to upload to this lead
            </h4>
            <p className="text-xs text-muted-foreground max-w-xs">
              Release anywhere in this area to upload proposals, screenshots, videos, or documents
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center gap-4">
        <h3 className="text-sm font-bold text-foreground">Files & Documents</h3>
        <div className="flex items-center gap-3">
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
          <Button
            onClick={() => fileInputRef.current?.click()}
            size="sm"
            className="gap-2"
            disabled={uploadAttachment.isPending}
          >
            {uploadAttachment.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Upload File</span>
              </>
            )}
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="pt-2">
          <AttachmentsSkeleton items={3} />
        </div>
      ) : attachments.length === 0 ? (
        <EmptyState
          module="documents"
          description="Upload proposals, contracts, and other related documents."
          action={{
            label: "Upload File",
            onClick: () => fileInputRef.current?.click(),
            icon: UploadCloud,
          }}
          size="sm"
        />
      ) : viewMode === "list" || viewMode === "table" ? (
        <div className="divide-y divide-border/40 rounded-xl border border-border/60 overflow-hidden bg-card">
          {attachments.map((attachment: ReturnType<typeof JSON.parse>) => (
            <div key={attachment.id} className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  {getFileIcon(attachment.fileType)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-foreground truncate">{attachment.fileName}</h4>
                  <p className="text-[10px] font-medium text-muted-foreground">
                    {formatBytes(attachment.fileSize)} • {format(new Date(attachment.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted" asChild>
                  <a href={attachment.fileUrl} target="_blank" rel="noreferrer" download={attachment.fileName}>
                    <Download className="w-4 h-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(attachment.id)}
                  disabled={deleteAttachment.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attachments.map((attachment: ReturnType<typeof JSON.parse>) => (
            <div key={attachment.id} className="flex items-center gap-4 bg-card border rounded-xl p-4 shadow-sm hover:border-primary/30 transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                {getFileIcon(attachment.fileType)}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-foreground truncate">{attachment.fileName}</h4>
                <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground mt-1">
                  <span>{formatBytes(attachment.fileSize)}</span>
                  <span>•</span>
                  <span>{format(new Date(attachment.createdAt), "MMM d, yyyy")}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted" asChild>
                  <a href={attachment.fileUrl} target="_blank" rel="noreferrer" download={attachment.fileName}>
                    <Download className="w-4 h-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(attachment.id)}
                  disabled={deleteAttachment.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
