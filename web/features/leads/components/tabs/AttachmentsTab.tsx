import React, { useRef } from "react";
import { Button } from "@/shared/ui/button";
import { Download, UploadCloud, File, FileText, Image as ImageIcon, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useLeadAttachments, useUploadLeadAttachment, useDeleteLeadAttachment } from "@/shared/hooks/use-crm";
import { formatBytes } from "@/shared/lib/utils";
import { EmptyState } from "@/shared/components/EmptyState";
import { useViewMode } from "@/shared/hooks/useViewMode";
import { ViewToggle } from "@/shared/components/crm/ViewToggle";
import { AttachmentsSkeleton } from "@/shared/components/skeletons";

const getFileIcon = (fileType: string) => {
  if (fileType?.includes("image")) return <ImageIcon className="w-8 h-8 text-blue-500" />;
  if (fileType?.includes("pdf")) return <FileText className="w-8 h-8 text-rose-500" />;
  return <File className="w-8 h-8 text-muted-foreground" />;
};

export function AttachmentsTab({ leadId }: { leadId: string }) {
  const { data: attachmentsResp, isLoading } = useLeadAttachments(leadId);
  const attachments = attachmentsResp?.data || [];
  const [viewMode, setViewMode] = useViewMode("documents", "grid");
  
  const uploadAttachment = useUploadLeadAttachment();
  const deleteAttachment = useDeleteLeadAttachment();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="space-y-6">
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
