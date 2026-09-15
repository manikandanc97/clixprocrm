"use client";

import React from "react";
import { Cpu } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { PlatformAiModelItem } from "@/shared/lib/api/super-admin.api";
import { ProviderGroup } from "./AiProviderTable";

interface ProviderModelsModalProps {
  isProviderModalOpen: boolean;
  setIsProviderModalOpen: (open: boolean) => void;
  selectedProvider: ProviderGroup | null;
  togglingModelId: string | null;
  handleToggleModelStatus: (model: PlatformAiModelItem) => void;
}

export function ProviderModelsModal({
  isProviderModalOpen,
  setIsProviderModalOpen,
  selectedProvider,
  togglingModelId,
  handleToggleModelStatus,
}: ProviderModelsModalProps) {
  return (
    <Dialog open={isProviderModalOpen} onOpenChange={setIsProviderModalOpen}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border/80 shrink-0">
          <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            Manage {selectedProvider?.providerName} Models
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Enable or disable models across the entire CRM platform.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2.5 max-h-[calc(85vh-130px)]">
          {!selectedProvider || selectedProvider.models.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No models registered for this provider.
            </div>
          ) : (
            selectedProvider.models.map((model) => {
              const isEnabled = model.isAvailable && model.status === "ENABLED";
              const isToggling = togglingModelId === model.id;

              return (
                <div
                  key={model.id}
                  className="p-3 rounded-xl bg-card border border-border/80 shadow-xs flex items-center justify-between gap-3 hover:border-border transition-colors"
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground truncate">
                        {model.displayName}
                      </span>
                      {model.isDefault && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Default
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground block truncate">
                      {model.modelKey}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        isEnabled
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isEnabled ? "Enabled" : "Disabled"}
                    </span>
                    <Switch
                      checked={isEnabled}
                      disabled={isToggling}
                      onCheckedChange={() => handleToggleModelStatus(model)}
                      className="data-[state=checked]:bg-emerald-600 cursor-pointer"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-border/80 bg-muted/20 flex items-center justify-end shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsProviderModalOpen(false)}
            className="text-xs h-9 rounded-xl cursor-pointer"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
