"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Button } from "@/shared/ui/button";
import { downloadSampleTemplate } from "@/lib/bulk-import-utils";
import { slideVariants } from "./import-types";
import { toast } from "sonner";

interface ImportUploadStepProps {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileSelect?: (file: File) => void;
}

export function ImportUploadStep({
  onFileUpload,
  onFileSelect,
}: ImportUploadStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  return (
    <motion.div
      key="step1"
      variants={slideVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col w-full py-1"
    >
      {/* Upload Dropzone Card */}
      <div
        data-no-icon-delegate="true"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => {
          handleDrop(e);
          const droppedFiles = e.dataTransfer.files;
          if (droppedFiles && droppedFiles.length > 0) {
            const file = droppedFiles[0];
            const ext = file.name.split(".").pop()?.toLowerCase();
            if (ext !== "csv" && ext !== "xlsx" && ext !== "xls") {
              toast.error("Please drop a valid CSV or Excel file (.csv, .xlsx, .xls)");
              return;
            }
            if (onFileSelect) {
              onFileSelect(file);
            }
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-300 p-6 sm:p-7 text-center cursor-pointer select-none ${
          isDragging
            ? "border-primary bg-primary/10 shadow-lg ring-4 ring-primary/10 scale-[1.005]"
            : "border-primary/30 hover:border-primary/70 bg-gradient-to-b from-card to-muted/20 hover:bg-primary/[0.02] hover:shadow-md"
        }`}
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          className="hidden"
          onChange={onFileUpload}
        />

        {/* Center Animated Icon Container - Animates strictly on its own hover */}
        <motion.div
          data-animate-target="true"
          whileHover={{ scale: 1.08, y: -3 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 shadow-sm relative cursor-pointer ${
            isDragging
              ? "bg-primary text-primary-foreground scale-110 shadow-primary/25 ring-4 ring-primary/20"
              : "bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
          }`}
        >
          {isDragging ? (
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
            >
              <AppIcon name="file" size={28} standalone />
            </motion.div>
          ) : (
            <div className="relative flex items-center justify-center">
              <AppIcon
                name="upload"
                size={28}
                standalone
                className="transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}
        </motion.div>

        {/* Title & Subtitle */}
        <h3 className="text-base sm:text-lg font-bold text-foreground mb-1 tracking-tight group-hover:text-primary transition-colors duration-200">
          {isDragging ? "Drop your file here" : "Drag and drop your spreadsheet here"}
        </h3>
        <p className="text-xs text-muted-foreground mb-4 max-w-md">
          Supports <span className="font-semibold text-foreground">.CSV</span>,{" "}
          <span className="font-semibold text-foreground">.XLSX</span>, and{" "}
          <span className="font-semibold text-foreground">.XLS</span> files up to 20MB
        </p>

        {/* Action Buttons with Animated Icons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 relative z-10">
          <Button
            type="button"
            size="sm"
            className="group/btn rounded-xl font-semibold px-4 h-9 shadow-sm hover:shadow-md gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 active:scale-95 cursor-pointer text-xs"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <AppIcon name="upload" size={14} />
            <span>Browse Files</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              downloadSampleTemplate("csv");
            }}
            className="group/btn rounded-xl font-medium px-3.5 h-9 bg-background hover:bg-muted/60 border-border text-foreground gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer text-xs"
          >
            <AppIcon
              name="download"
              size={14}
              className="text-muted-foreground group-hover/btn:text-primary"
            />
            <span>Download CSV Template</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              downloadSampleTemplate("xlsx");
            }}
            className="group/btn rounded-xl font-medium px-2.5 h-9 hover:bg-muted/60 text-muted-foreground hover:text-foreground text-xs gap-1 transition-all duration-200 active:scale-95 cursor-pointer"
            title="Download Excel format template"
          >
            <AppIcon
              name="file"
              size={14}
              className="text-muted-foreground group-hover/btn:text-emerald-600 dark:group-hover/btn:text-emerald-400"
            />
            <span>.XLSX</span>
          </Button>
        </div>
      </div>

      {/* Feature / Highlight Cards with Consistent Animated Icons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        {/* Card 1: AI / Sparkles / Auto Mapping */}
        <div
          className="group/card flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-emerald-500/[0.03] border border-border/70 hover:border-emerald-500/30 shadow-2xs hover:shadow-xs transition-colors duration-200 cursor-pointer select-none"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover/card:scale-110 group-hover/card:bg-emerald-500/20">
            <AppIcon
              name="ai"
              size={18}
              className="text-emerald-600 dark:text-emerald-400"
            />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-foreground truncate group-hover/card:text-emerald-600 dark:group-hover/card:text-emerald-400 transition-colors">
              Auto Column Mapping
            </h4>
            <p className="text-[11px] text-muted-foreground truncate">
              Smart CRM field detection
            </p>
          </div>
        </div>

        {/* Card 2: Security / Instant Validation */}
        <div
          className="group/card flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-blue-500/[0.03] border border-border/70 hover:border-blue-500/30 shadow-2xs hover:shadow-xs transition-colors duration-200 cursor-pointer select-none"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover/card:scale-110 group-hover/card:bg-blue-500/20">
            <AppIcon
              name="security"
              size={18}
              className="text-blue-600 dark:text-blue-400"
            />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-foreground truncate group-hover/card:text-blue-600 dark:group-hover/card:text-blue-400 transition-colors">
              Instant Validation
            </h4>
            <p className="text-[11px] text-muted-foreground truncate">
              Email & required checks
            </p>
          </div>
        </div>

        {/* Card 3: Modules / Duplicate Protection */}
        <div
          className="group/card flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-amber-500/[0.03] border border-border/70 hover:border-amber-500/30 shadow-2xs hover:shadow-xs transition-colors duration-200 cursor-pointer select-none"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover/card:scale-110 group-hover/card:bg-amber-500/20">
            <AppIcon
              name="modules"
              size={18}
              className="text-amber-600 dark:text-amber-400"
            />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-foreground truncate group-hover/card:text-amber-600 dark:group-hover/card:text-amber-400 transition-colors">
              Duplicate Protection
            </h4>
            <p className="text-[11px] text-muted-foreground truncate">
              Skip, update or append
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
