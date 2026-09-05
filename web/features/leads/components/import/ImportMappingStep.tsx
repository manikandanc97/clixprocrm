"use client";

import React from "react";
import { motion } from "framer-motion";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { CRM_FIELDS, CRMField, slideVariants } from "./import-types";

interface ImportMappingStepProps {
  isOfficialTemplate: boolean;
  fileHeaders: string[];
  mapping: Record<string, string>;
  setMapping: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  parsedData: Record<string, unknown>[];
  showAdvancedMapping: boolean;
  setShowAdvancedMapping: React.Dispatch<React.SetStateAction<boolean>>;
  onBack: () => void;
  onContinue: () => void;
}

export function ImportMappingStep({
  isOfficialTemplate,
  fileHeaders,
  mapping,
  setMapping,
  parsedData,
  showAdvancedMapping,
  setShowAdvancedMapping,
  onBack,
  onContinue,
}: ImportMappingStepProps) {
  const getMissingRequiredFields = () => {
    return CRM_FIELDS.filter((f) => f.required && !mapping[f.key]);
  };

  const getUnmappedFields = (fields: CRMField[]) => {
    return fields.filter((f) => !mapping[f.key]);
  };

  const renderPreviewValue = (fieldKey: string) => {
    const fileCol = mapping[fieldKey];
    if (!fileCol || !parsedData[0]) return "-";
    const val = parsedData[0][fileCol];
    return val ? String(val) : "-";
  };

  const renderPreviewCard = () => {
    const emailVal = mapping["email"]
      ? String(parsedData[0]?.[mapping["email"]])
      : "";
    const isEmailValid =
      mapping["email"] &&
      parsedData[0]?.[mapping["email"]] &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
    const hasRequired = mapping["name"] && mapping["email"];

    return (
      <div className="bg-card p-3.5 rounded-xl border border-border/70 shadow-2xs flex flex-col gap-2.5">
        <div className="flex justify-between items-center pb-2 border-b border-border/50">
          <div className="flex items-center gap-1.5">
            <AppIcon name="file" size={14} className="text-muted-foreground" />
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Record Preview
            </h4>
          </div>
          {hasRequired && (mapping["email"] ? isEmailValid : true) ? (
            <Badge variant="success" className="font-bold px-2 py-0.5 text-[10px]">
              ✓ Valid
            </Badge>
          ) : (
            <Badge variant="warning" className="font-bold px-2 py-0.5 text-[10px]">
              ⚠ Needs Fix
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-y-2 gap-x-2 text-xs">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-0.5">
              Full Name
            </p>
            <p
              className="font-medium truncate text-foreground text-xs"
              title={renderPreviewValue("name")}
            >
              {renderPreviewValue("name")}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-0.5">
              Company
            </p>
            <p
              className="font-medium truncate text-foreground text-xs"
              title={renderPreviewValue("company")}
            >
              {renderPreviewValue("company")}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-0.5">
              Email
            </p>
            <p
              className="font-medium truncate text-foreground text-xs"
              title={renderPreviewValue("email")}
            >
              {renderPreviewValue("email")}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-0.5">
              Phone
            </p>
            <p
              className="font-medium truncate text-foreground text-xs"
              title={renderPreviewValue("phone")}
            >
              {renderPreviewValue("phone")}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-0.5">
              Status
            </p>
            <p
              className="font-medium truncate text-foreground text-xs"
              title={renderPreviewValue("status")}
            >
              {renderPreviewValue("status")}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-0.5">
              Deal Value
            </p>
            <p
              className="font-medium truncate text-foreground text-xs"
              title={renderPreviewValue("valueAmount")}
            >
              {renderPreviewValue("valueAmount")}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      key="step2"
      variants={slideVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col w-full"
    >
      <div className="flex flex-col w-full">
        {isOfficialTemplate ? (
          // Official Template View
          <div className="flex flex-col items-center justify-center text-center py-6 space-y-5">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
              <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center relative z-10 border-4 border-white dark:border-background shadow-lg">
                <AppIcon name="circleCheck" size={40} className="text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2 text-foreground">
                Official Template Detected
              </h3>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                <AppIcon name="circleCheck" size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
                  All 16 standard columns mapped automatically
                </span>
              </div>
            </div>
          </div>
        ) : (
          // Custom File View
          <div className="flex flex-col w-full">
            <div className="flex justify-between items-center mb-3 flex-shrink-0">
              <div>
                <h3 className="text-base font-bold flex items-center gap-1.5 text-foreground">
                  <AppIcon name="settings" size={16} className="text-primary" />
                  Map Columns
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    Mapped Successfully
                  </span>
                  <Badge
                    variant="secondary"
                    className="px-1.5 py-0 text-[10px] font-bold bg-primary/10 text-primary border-none"
                  >
                    {Object.keys(mapping).length} of {CRM_FIELDS.length}
                  </Badge>
                </div>
              </div>

              {/* Summary Badges */}
              <div className="flex items-center gap-3 bg-muted/30 px-3 py-1.5 rounded-full border border-border/70 text-[11px]">
                <div className="flex items-center gap-1 font-medium text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>{" "}
                  Auto Mapped
                </div>
                <div className="flex items-center gap-1 font-medium text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>{" "}
                  Manual
                </div>
                <div className="flex items-center gap-1 font-medium text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-destructive"></div>{" "}
                  Missing
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3.5 flex-1 min-h-0">
              {/* Mapping Table Area */}
              <div className="flex-1 flex flex-col min-h-0 bg-card border border-border/70 rounded-xl shadow-2xs overflow-hidden max-h-[310px]">
                {(() => {
                  const unmappedBasic = getUnmappedFields(
                    CRM_FIELDS.filter((f) => !f.advanced),
                  );
                  const unmappedAdvanced = getUnmappedFields(
                    CRM_FIELDS.filter((f) => f.advanced),
                  );
                  const hasMissingRequired =
                    getMissingRequiredFields().length > 0;

                  // If everything basic is mapped and we aren't showing advanced
                  if (unmappedBasic.length === 0 && !showAdvancedMapping) {
                    return (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-muted/10">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 shadow-2xs border border-emerald-500/20">
                          <AppIcon name="circleCheck" size={24} />
                        </div>
                        <h4 className="text-sm font-bold mb-1">
                          No Action Required
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-xs mb-4">
                          All primary fields have been successfully mapped.
                        </p>
                        {unmappedAdvanced.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAdvancedMapping(true)}
                            className="rounded-xl font-semibold text-xs border-border bg-background shadow-2xs hover:bg-muted cursor-pointer gap-1.5 h-8"
                          >
                            <span>Show Advanced Mapping</span>
                            <AppIcon name="chevronDown" size={12} />
                          </Button>
                        )}
                      </div>
                    );
                  }

                  // Show the table
                  return (
                    <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[290px]">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/40 sticky top-0 z-10 border-b border-border/70 text-[11px] uppercase tracking-wider text-muted-foreground">
                          <tr>
                            <th className="px-4 py-2.5 font-bold text-foreground w-1/3">
                              CRM Field
                            </th>
                            <th className="px-4 py-2.5 font-bold text-foreground">
                              File Column
                            </th>
                            <th className="px-4 py-2.5 font-bold text-foreground text-center w-14">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {hasMissingRequired && (
                            <tr>
                              <td
                                colSpan={3}
                                className="px-4 py-2 bg-destructive/5 text-destructive text-xs font-semibold border-b border-destructive/10"
                              >
                                <div className="flex items-center gap-1.5">
                                  <AppIcon name="alert" size={14} /> Required
                                  fields are missing. Please map them to
                                  continue.
                                </div>
                              </td>
                            </tr>
                          )}

                          {/* Unmapped Basic Fields */}
                          {unmappedBasic.map((field) => (
                            <tr
                              key={field.key}
                              className="bg-destructive/5 hover:bg-destructive/10 transition-colors"
                            >
                              <td className="px-4 py-2">
                                <span className="font-semibold text-foreground">
                                  {field.label}
                                </span>
                                {field.required && (
                                  <span className="ml-1 text-destructive font-bold">
                                    *
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2">
                                <select
                                  className="w-full max-w-[200px] bg-background border border-destructive/40 rounded-lg px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-2xs cursor-pointer outline-none"
                                  value={mapping[field.key] || ""}
                                  onChange={(e) =>
                                    setMapping({
                                      ...mapping,
                                      [field.key]: e.target.value,
                                    })
                                  }
                                >
                                  <option
                                    value=""
                                    className="text-muted-foreground"
                                  >
                                    -- Ignore Column --
                                  </option>
                                  {fileHeaders.map((h) => (
                                    <option key={h} value={h}>
                                      {h}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-2 text-center">
                                <div className="w-2.5 h-2.5 rounded-full bg-destructive mx-auto shadow-2xs"></div>
                              </td>
                            </tr>
                          ))}

                          {/* Advanced Mapping Section */}
                          {showAdvancedMapping && (
                            <>
                              <tr>
                                <td
                                  colSpan={3}
                                  className="px-4 py-2 bg-muted/20 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-y border-border/70"
                                >
                                  Optional Mappings
                                </td>
                              </tr>
                              {CRM_FIELDS.filter(
                                (f) =>
                                  f.advanced || (mapping[f.key] && !f.advanced),
                              ).map((field) => (
                                <tr
                                  key={field.key}
                                  className="hover:bg-muted/10 transition-colors"
                                >
                                  <td className="px-4 py-2">
                                    <span className="font-medium text-foreground">
                                      {field.label}
                                    </span>
                                    {field.required && (
                                      <span className="ml-1 text-destructive font-bold">
                                        *
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2">
                                    <select
                                      className={`w-full max-w-[200px] bg-background border rounded-lg px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-2xs cursor-pointer outline-none ${!mapping[field.key] ? "border-border text-muted-foreground" : "border-primary/30 text-foreground"}`}
                                      value={mapping[field.key] || ""}
                                      onChange={(e) =>
                                        setMapping({
                                          ...mapping,
                                          [field.key]: e.target.value,
                                        })
                                      }
                                    >
                                      <option
                                        value=""
                                        className="text-muted-foreground"
                                      >
                                        -- Ignore Column --
                                      </option>
                                      {fileHeaders.map((h) => (
                                        <option key={h} value={h}>
                                          {h}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="px-4 py-2 text-center">
                                    {mapping[field.key] ? (
                                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mx-auto shadow-2xs"></div>
                                    ) : (
                                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400 mx-auto shadow-2xs"></div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </>
                          )}

                          {!showAdvancedMapping && (
                            <tr>
                              <td
                                colSpan={3}
                                className="px-4 py-2 text-center border-t border-border/70 bg-card"
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowAdvancedMapping(true)}
                                  className="text-xs font-semibold hover:bg-muted/50 rounded-xl cursor-pointer gap-1.5 h-7"
                                >
                                  <span>Show Advanced Mapping</span>
                                  <AppIcon name="chevronDown" size={12} />
                                </Button>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* Preview Panel Area */}
              <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2.5">
                {renderPreviewCard()}
                <div className="bg-card p-3 rounded-xl border border-border/70 shadow-2xs">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Import Summary
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-medium">
                        Records Found
                      </span>
                      <span className="font-bold text-foreground bg-muted/40 px-1.5 py-0.5 rounded border border-border/50 text-[11px]">
                        {parsedData.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-medium">
                        Mapped Columns
                      </span>
                      <span className="font-bold text-foreground bg-muted/40 px-1.5 py-0.5 rounded border border-border/50 text-[11px]">
                        {Object.keys(mapping).length} / {CRM_FIELDS.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-medium">
                        Required Fields
                      </span>
                      <span className="font-bold text-foreground bg-muted/40 px-1.5 py-0.5 rounded border border-border/50 text-[11px]">
                        {
                          CRM_FIELDS.filter(
                            (f) => f.required && mapping[f.key],
                          ).length
                        }{" "}
                        / {CRM_FIELDS.filter((f) => f.required).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-3.5 flex justify-between items-center flex-shrink-0 border-t border-border/60 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="rounded-xl font-semibold text-xs h-9 px-4 cursor-pointer gap-1.5 hover:bg-muted/70"
          >
            <AppIcon name="arrowLeft" size={14} /> Back
          </Button>
          <Button
            type="button"
            onClick={onContinue}
            disabled={getMissingRequiredFields().length > 0}
            className={`rounded-xl font-bold text-xs h-9 px-6 shadow-sm hover:shadow transition-all cursor-pointer gap-2 bg-primary hover:bg-primary/90 text-primary-foreground ${isOfficialTemplate ? "w-full max-w-xs" : ""}`}
          >
            <span>Continue to Validation</span>
            <AppIcon name="arrowRight" size={14} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
