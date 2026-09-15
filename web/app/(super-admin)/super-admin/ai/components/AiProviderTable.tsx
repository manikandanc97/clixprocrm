"use client";

import React from "react";
import { Bot, Cpu, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/shared/ui/table";
import { PlatformAiModelItem } from "@/shared/lib/api/super-admin.api";

export interface ProviderGroup {
  providerKey: string;
  providerName: string;
  models: PlatformAiModelItem[];
  totalCount: number;
  enabledCount: number;
  isEnabled: boolean;
}

interface AiProviderTableProps {
  loading: boolean;
  providerGroups: ProviderGroup[];
  totalEnabledModelsCount: number;
  handleOpenManageProvider: (providerKey: string) => void;
}

export function AiProviderTable({
  loading,
  providerGroups,
  totalEnabledModelsCount,
  handleOpenManageProvider,
}: AiProviderTableProps) {
  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
              <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              AI Model Catalog
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              {totalEnabledModelsCount} enabled
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Provider-level AI catalog and platform-wide model availability.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-muted-foreground rounded-2xl bg-card border border-border flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span>Loading model catalog...</span>
        </div>
      ) : providerGroups.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted-foreground rounded-2xl bg-card border border-border">
          No AI providers configured in catalog.
        </div>
      ) : (
        <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="h-10 hover:bg-transparent">
                  <TableHead className="w-[35%]">Provider</TableHead>
                  <TableHead className="w-[30%]">Models</TableHead>
                  <TableHead className="w-[20%]">Status</TableHead>
                  <TableHead className="w-[15%] text-right pr-5">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providerGroups.map((group) => (
                  <TableRow key={group.providerKey} className="h-14 hover:bg-muted/30">
                    {/* Provider Name */}
                    <TableCell className="h-14">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          <Cpu className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-foreground text-xs">
                          {group.providerName}
                        </span>
                      </div>
                    </TableCell>

                    {/* Models Summary */}
                    <TableCell className="h-14">
                      <span className="text-xs font-medium text-foreground">
                        {group.totalCount} {group.totalCount === 1 ? "model" : "models"}{" "}
                        <span className="text-muted-foreground">
                          ({group.enabledCount} enabled)
                        </span>
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="h-14">
                      <span
                        className={`inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          group.isEnabled
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {group.isEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="h-14 text-right pr-5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenManageProvider(group.providerKey)}
                        className="h-7 text-xs font-bold px-3 rounded-lg border-border hover:bg-muted text-foreground transition-colors cursor-pointer"
                      >
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
