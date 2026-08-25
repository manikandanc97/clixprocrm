'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  PanelRight,
  PanelLeft,
  Copy,
  Trash2,
  MoreVertical,
  X,
  Lock,
  ArrowRight,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { ModelOption, CrmContextData } from '../types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { useRouter } from 'next/navigation';

interface AIChatHeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  onToggleContextPanel?: () => void;
  isContextPanelOpen?: boolean;
  activeContext: CrmContextData | null;
  onClearContext: () => void;
  entitledModels: ModelOption[];
  selectedModel: string;
  onSelectModel: (modelKey: string) => void;
  onCopyTranscript: () => void;
  onClearMessages: () => void;
  hasMessages: boolean;
  planName?: string;
  isSuperAdmin?: boolean;
}

export function AIChatHeader({
  onToggleSidebar,
  isSidebarOpen,
  onToggleContextPanel,
  isContextPanelOpen,
  activeContext,
  onClearContext,
  entitledModels,
  selectedModel,
  onSelectModel,
  onCopyTranscript,
  onClearMessages,
  hasMessages,
  planName,
  isSuperAdmin,
}: AIChatHeaderProps) {
  const router = useRouter();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [targetUpgradeModel, setTargetUpgradeModel] = useState<ModelOption | null>(null);

  const currentModelOption =
    entitledModels.find((m) => m.modelKey === selectedModel) ||
    entitledModels[0];

  const friendlyLabel = currentModelOption?.friendlyLabel || 'Auto';

  const handleModelClick = (opt: ModelOption) => {
    if (opt.isLocked) {
      setTargetUpgradeModel(opt);
      setIsUpgradeModalOpen(true);
    } else {
      onSelectModel(opt.modelKey);
    }
  };

  return (
    <>
      <header className="h-14 border-b border-border/60 bg-card/40 backdrop-blur-xs flex items-center justify-between px-3 sm:px-5 shrink-0 select-none z-20">
        {/* Left side */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Toggle history sidebar on mobile/tablet */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors md:hidden"
              title="Toggle Conversation History"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}

          {/* Title */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h1 className="text-sm font-bold tracking-tight text-foreground font-display truncate">
              ClixPro AI
            </h1>
          </div>

          {/* CRM Context Badge */}
          {activeContext && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium max-w-[200px] truncate animate-in fade-in duration-200">
              <span className="truncate">Context: {activeContext.name}</span>
              <button
                onClick={onClearContext}
                className="p-0.5 hover:bg-primary/20 rounded-full transition-colors shrink-0"
                title="Remove context"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Friendly Model Selector (Auto ▾) */}
          {entitledModels.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted text-xs font-medium text-foreground transition-colors border border-border/60">
                  <span className="text-muted-foreground text-[11px]">Model:</span>
                  <span className="font-semibold text-primary">{friendlyLabel}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 text-xs p-1.5">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center justify-between">
                  <span>AI Intelligence Tier</span>
                  {planName && (
                    <span className="text-[9px] font-mono text-primary font-bold">
                      {planName} Tier
                    </span>
                  )}
                </div>
                <div className="space-y-1 mt-1">
                  {entitledModels.map((opt) => {
                    const isSelected = !opt.isLocked && selectedModel === opt.modelKey;
                    return (
                      <div
                        key={opt.displayName}
                        onClick={() => handleModelClick(opt)}
                        className={`flex flex-col items-start py-2 px-2.5 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary/10 text-primary font-medium'
                            : opt.isLocked
                            ? 'hover:bg-muted/60 opacity-85'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-1.5">
                            {opt.isLocked && <Lock className="w-3 h-3 text-amber-500 shrink-0" />}
                            <span className="font-semibold">{opt.displayName}</span>
                          </div>
                          {opt.badge && (
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                opt.isLocked
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                  : 'bg-primary/10 text-primary'
                              }`}
                            >
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.description && (
                          <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                            {opt.description}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* CRM Context Panel Toggle */}
          {onToggleContextPanel && (
            <button
              onClick={onToggleContextPanel}
              className={`p-1.5 rounded-lg transition-colors border ${
                isContextPanelOpen
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/80 border-border/60'
              }`}
              title={isContextPanelOpen ? 'Hide CRM Context' : 'Show CRM Context'}
            >
              <PanelRight className="w-4 h-4" />
            </button>
          )}

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                title="More actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 text-xs">
              <DropdownMenuItem onClick={onCopyTranscript} disabled={!hasMessages}>
                <Copy className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                Copy Transcript
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onClearMessages}
                disabled={!hasMessages}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Clear Messages
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Plan Upgrade Dialog (ChatGPT / Claude Pro style) */}
      <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2">
              <Sparkles className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold font-display text-foreground">
              Unlock Advanced Deep Analysis AI
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
              Advanced reasoning and predictive intelligence models are available on the{' '}
              <strong className="text-foreground">Growth, Business & Enterprise</strong> plans.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 py-3">
            <div className="flex items-start gap-2.5 text-xs text-foreground/90">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Multi-step root-cause diagnostics on leads, deals & revenue</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-foreground/90">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Predictive deal win-rate scoring & customer churn forecasting</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-foreground/90">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Higher daily token quotas (up to 200,000+ tokens/day)</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-foreground/90">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Priority execution on frontier reasoning engines (Gemini Pro / Claude Sonnet / GPT-4o)</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUpgradeModalOpen(false)}
              className="text-xs"
            >
              Maybe Later
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setIsUpgradeModalOpen(false);
                router.push('/pricing');
              }}
              className="bg-primary text-primary-foreground text-xs font-medium gap-1.5 shadow-sm"
            >
              <span>View Subscription Plans</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
