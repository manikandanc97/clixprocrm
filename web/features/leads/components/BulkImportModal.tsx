"use client";

import React, { useState, useRef } from "react";
import { FormModal } from "@/shared/components/form-modal";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { toast } from "sonner";
import { parseFile, IMPORT_TEMPLATE_HEADERS } from "@/lib/bulk-import-utils";
import client from "@/shared/lib/api/client";
import { AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  CRM_FIELDS,
  AUTO_MAP,
  IMPORT_STEPS,
  DuplicateStrategy,
  ImportSummaryData,
} from "./import/import-types";
import { ImportUploadStep } from "./import/ImportUploadStep";
import { ImportMappingStep } from "./import/ImportMappingStep";
import { ImportValidationStep } from "./import/ImportValidationStep";
import { ImportProgressStep } from "./import/ImportProgressStep";
import { ImportSummaryStep } from "./import/ImportSummaryStep";

interface BulkImportModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onOpenChange,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const [isOfficialTemplate, setIsOfficialTemplate] = useState(false);
  const [showAdvancedMapping, setShowAdvancedMapping] = useState(false);

  const [validationResults, setValidationResults] = useState<{
    valid: any[];
    invalid: any[];
  }>({ valid: [], invalid: [] });
  const [duplicateStrategy, setDuplicateStrategy] =
    useState<DuplicateStrategy>("skip");

  const [, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<ImportSummaryData | null>(null);

  const [totalProcessed, setTotalProcessed] = useState(0);
  const [currentImported, setCurrentImported] = useState(0);
  const [currentSkipped, setCurrentSkipped] = useState(0);
  const [currentFailed, setCurrentFailed] = useState(0);

  const cancelRef = useRef(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const resetState = () => {
    setStep(1);
    setFile(null);
    setParsedData([]);
    setFileHeaders([]);
    setMapping({});
    setIsOfficialTemplate(false);
    setShowAdvancedMapping(false);
    setValidationResults({ valid: [], invalid: [] });
    setDuplicateStrategy("skip");
    setImporting(false);
    setProgress(0);
    setSummary(null);
    setTotalProcessed(0);
    setCurrentImported(0);
    setCurrentSkipped(0);
    setCurrentFailed(0);
    cancelRef.current = false;
    setIsCancelling(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetState, 300);
  };

  const processFile = async (uploadedFile: File) => {
    if (!uploadedFile) return;

    const ext = uploadedFile.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "xlsx" && ext !== "xls") {
      toast.error("Unsupported file type. Please upload a CSV or Excel file (.csv, .xlsx, .xls).");
      return;
    }

    if (uploadedFile.size > 20 * 1024 * 1024) {
      toast.error("File exceeds 20MB limit.");
      return;
    }

    try {
      const data = await parseFile(uploadedFile);
      if (data.length === 0) {
        toast.error("The file is empty.");
        return;
      }

      const headers = Object.keys(data[0]);
      setFile(uploadedFile);
      setParsedData(data);
      setFileHeaders(headers);

      // Detect official template
      const isOfficial = IMPORT_TEMPLATE_HEADERS.every((h) =>
        headers.includes(h),
      );
      setIsOfficialTemplate(isOfficial);

      const initialMapping: Record<string, string> = {};
      headers.forEach((header) => {
        const lowerHeader = header.toLowerCase().trim();
        const crmKey = AUTO_MAP[lowerHeader];
        if (crmKey && !initialMapping[crmKey]) {
          initialMapping[crmKey] = header;
        }
      });

      if (isOfficial) {
        // Force exact mapping for official template
        IMPORT_TEMPLATE_HEADERS.forEach((h) => {
          const lowerHeader = h.toLowerCase().trim();
          const crmKey = AUTO_MAP[lowerHeader];
          if (crmKey) initialMapping[crmKey] = h;
        });
      }

      setMapping(initialMapping);
      setStep(2);
      setShowAdvancedMapping(false);
    } catch (error) {
      toast.error("Failed to parse the file.");
      console.error(error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      await processFile(uploadedFile);
    }
  };

  const handleValidation = () => {
    const valid: any[] = [];
    const invalid: any[] = [];

    parsedData.forEach((row) => {
      const mappedRow: any = {};
      let hasError = false;
      const errors: string[] = [];

      CRM_FIELDS.forEach((field) => {
        const fileCol = mapping[field.key];
        const val = fileCol ? row[fileCol] : undefined;

        if (field.required && (!val || String(val).trim() === "")) {
          hasError = true;
          errors.push(`Missing ${field.label}`);
        }

        if (field.key === "email" && val) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(String(val))) {
            hasError = true;
            errors.push("Invalid email format");
          }
        }

        if (field.key === "status" && val) {
          const statusStr = String(val).trim().toUpperCase();
          if (statusStr === "NEW LEAD") {
            mappedRow[field.key] = "NEW";
          } else {
            mappedRow[field.key] = statusStr.replace(/\s+/g, "_");
          }
        } else {
          mappedRow[field.key] = val;
        }
      });

      if (hasError) {
        invalid.push({ ...row, _errors: errors.join(", ") });
      } else {
        valid.push(mappedRow);
      }
    });

    setValidationResults({ valid, invalid });
    setStep(3);
  };

  const handleImport = async () => {
    if (validationResults.valid.length === 0) {
      toast.error("No valid rows to import.");
      return;
    }

    setImporting(true);
    setStep(4);

    cancelRef.current = false;
    setIsCancelling(false);
    setTotalProcessed(0);
    setCurrentImported(0);
    setCurrentSkipped(0);
    setCurrentFailed(0);

    try {
      const chunkSize = Math.min(
        100,
        Math.max(2, Math.ceil(validationResults.valid.length / 20)),
      );
      let totalImported = 0;
      let totalSkipped = 0;
      let totalFailed = 0;
      let allFailedRows: any[] = [];
      let processedCount = 0;

      const chunks = [];
      for (let i = 0; i < validationResults.valid.length; i += chunkSize) {
        chunks.push(validationResults.valid.slice(i, i + chunkSize));
      }

      for (let i = 0; i < chunks.length; i++) {
        if (cancelRef.current) {
          break;
        }

        try {
          const res = await client.post("/crm/leads/import", {
            leads: chunks[i],
            duplicateStrategy,
          });

          const data = res.data.data;
          totalImported += data.imported;
          totalSkipped += data.skipped;
          totalFailed += data.failed;
          allFailedRows = [...allFailedRows, ...data.failedRows];
        } catch (err: any) {
          totalFailed += chunks[i].length;
          const chunkFailedRows = chunks[i].map((row: any) => ({
            ...row,
            ErrorReason:
              err.response?.data?.message || err.message || "Batch API error",
          }));
          allFailedRows = [...allFailedRows, ...chunkFailedRows];
        }

        processedCount += chunks[i].length;
        setTotalProcessed(processedCount);
        setCurrentImported(totalImported);
        setCurrentSkipped(totalSkipped);
        setCurrentFailed(totalFailed);

        setProgress(
          Math.round((processedCount / validationResults.valid.length) * 100),
        );
      }

      const frontendFailed = validationResults.invalid.map((inv) => {
        const { _errors, ...rest } = inv;
        return { ...rest, ErrorReason: _errors };
      });

      setSummary({
        imported: totalImported,
        skipped: totalSkipped,
        failed: totalFailed + frontendFailed.length,
        failedRows: [...frontendFailed, ...allFailedRows],
      });

      setStep(5);
      if (cancelRef.current) {
        toast.info("Import cancelled. Showing partial results.");
      } else {
        toast.success("Import completed successfully!");
      }

      // Invalidate all relevant caches
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });

      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to import leads.");
      setImporting(false);
      setStep(3);
    }
  };

  return (
    <FormModal
      title="Bulk Import Leads"
      description="Import multiple leads seamlessly from CSV or Excel files."
      isOpen={isOpen}
      onOpenChange={handleClose}
      size="xl"
    >
      <div className="flex flex-col w-full">
        {/* Stepper Header */}
        <div className="relative mb-4 mt-0.5 px-4 sm:px-8 flex-shrink-0">
          <div className="absolute top-4 left-12 right-12 h-0.5 bg-muted rounded-full -z-0">
            <div
              className="h-full bg-primary transition-all duration-500 ease-in-out"
              style={{ width: `${((Math.min(step, 4) - 1) / 3) * 100}%` }}
            />
          </div>
          <div className="flex justify-between relative z-10">
            {IMPORT_STEPS.map((s) => {
              const isCompleted = step > s.num;
              const isActive = step === s.num;

              return (
                <div key={s.num} className="group/step flex flex-col items-center cursor-default">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 group-hover/step:scale-110 group-hover/step:shadow-md ${
                      isCompleted
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : isActive
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-sm scale-105"
                          : "bg-card border border-border text-muted-foreground group-hover/step:border-primary/50 group-hover/step:text-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <AppIcon name="check" size={13} className="text-primary-foreground" />
                    ) : (
                      s.num
                    )}
                  </div>
                  <span
                    className={`text-[11px] mt-1.5 font-medium tracking-tight transition-colors duration-200 ${isActive ? "text-primary font-semibold" : isCompleted ? "text-foreground" : "text-muted-foreground group-hover/step:text-foreground"}`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative min-h-0">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <ImportUploadStep
                onFileUpload={handleFileUpload}
                onFileSelect={processFile}
              />
            )}

            {step === 2 && (
              <ImportMappingStep
                isOfficialTemplate={isOfficialTemplate}
                fileHeaders={fileHeaders}
                mapping={mapping}
                setMapping={setMapping}
                parsedData={parsedData}
                showAdvancedMapping={showAdvancedMapping}
                setShowAdvancedMapping={setShowAdvancedMapping}
                onBack={() => setStep(1)}
                onContinue={handleValidation}
              />
            )}

            {step === 3 && (
              <ImportValidationStep
                validationResults={validationResults}
                duplicateStrategy={duplicateStrategy}
                setDuplicateStrategy={setDuplicateStrategy}
                onBack={() => setStep(2)}
                onStartImport={handleImport}
              />
            )}

            {step === 4 && (
              <ImportProgressStep
                progress={progress}
                totalProcessed={totalProcessed}
                validRowCount={validationResults.valid.length}
                currentImported={currentImported}
                currentSkipped={currentSkipped}
                currentFailed={currentFailed}
                isCancelling={isCancelling}
                onCancel={() => {
                  cancelRef.current = true;
                  setIsCancelling(true);
                }}
              />
            )}

            {step === 5 && summary && (
              <ImportSummaryStep summary={summary} onClose={handleClose} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </FormModal>
  );
};
