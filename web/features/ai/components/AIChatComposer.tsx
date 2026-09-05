'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowRight,
  Square,
  Plus,
  ChevronUp,
  ChevronRight,
  Mic,
  MicOff,
  Sparkles,
  Lock,
  Zap,
} from 'lucide-react';
import { SlashCommand, ModelOption } from '../types';
import {
  DropdownMenu,
  DropdownMenuContent,
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
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface AIChatComposerProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onStop: () => void;
  disabled?: boolean;
  placeholder?: string;
  isSuperAdmin?: boolean;
  entitledModels?: ModelOption[];
  selectedModel?: string;
  onSelectModel?: (modelKey: string) => void;
  planName?: string;
}

const DEFAULT_SLASH_COMMANDS: SlashCommand[] = [
  {
    command: '/leads',
    label: 'Search Leads',
    description: 'Query hot leads, stages, and recent contacts',
    prompt: 'Show my hot leads and opportunities.',
    iconName: 'Users',
  },
  {
    command: '/pipeline',
    label: 'Sales Pipeline',
    description: 'Analyze deals and pipeline velocity',
    prompt: 'Show my sales pipeline and open deals.',
    iconName: 'Briefcase',
  },
  {
    command: '/reports',
    label: 'Sales Reports',
    description: 'Analyze revenue metrics and win rate summaries',
    prompt: 'Show my sales report and performance breakdown.',
    iconName: 'TrendingUp',
  },
  {
    command: '/tasks',
    label: 'Tasks & Due Items',
    description: 'Check today’s agenda and pending action items',
    prompt: 'Show my pending tasks and action items due today.',
    iconName: 'Calendar',
  },
  {
    command: '/quotations',
    label: 'Quotations',
    description: 'Review pending proposals and client quotes',
    prompt: 'List all pending quotations and proposals.',
    iconName: 'FileText',
  },
];

const FALLBACK_MODELS: ModelOption[] = [
  {
    modelKey: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    friendlyLabel: 'Gemini 2.5 Flash',
    badge: 'Fast',
    badgeInfo: 'ⓘ',
    isLocked: false,
    hasSubmenu: true,
  },
  {
    modelKey: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    friendlyLabel: 'Gemini 2.5 Pro',
    badge: 'Deep Analysis',
    badgeInfo: 'ⓘ',
    isLocked: false,
    hasSubmenu: true,
  },
  {
    modelKey: 'claude-3-7-sonnet',
    displayName: 'Claude 3.7 Sonnet (Thinking)',
    friendlyLabel: 'Claude 3.7 Sonnet',
    badge: 'Thinking',
    isLocked: false,
  },
  {
    modelKey: 'gpt-4o',
    displayName: 'GPT-4o (Omni)',
    friendlyLabel: 'GPT-4o',
    badge: 'Omni',
    isLocked: false,
  },
  {
    modelKey: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    friendlyLabel: 'GPT-4o Mini',
    badge: 'Fast',
    badgeInfo: 'ⓘ',
    isLocked: false,
    hasSubmenu: true,
  },
];

export function AIChatComposer({
  onSendMessage,
  isLoading,
  onStop,
  disabled = false,
  placeholder,
  isSuperAdmin = false,
  entitledModels,
  selectedModel = 'gemini-3.7-flash',
  onSelectModel,
}: AIChatComposerProps) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [targetUpgradeModel, setTargetUpgradeModel] = useState<ModelOption | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const slashMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const modelsList = entitledModels && entitledModels.length > 0 ? entitledModels : FALLBACK_MODELS;
  const currentModelOption =
    modelsList.find((m) => m.modelKey === selectedModel) ||
    modelsList[0] || {
      modelKey: 'gemini-3.7-flash',
      displayName: 'Gemini 3.7 Flash Medium',
      friendlyLabel: 'Gemini 3.7 Flash Medium',
    };

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  }, [input]);

  // Track slash command trigger
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    if (val.startsWith('/')) {
      setShowSlashMenu(true);
      setSelectedSlashIndex(0);
    } else {
      setShowSlashMenu(false);
    }
  };

  const filteredSlashCommands = DEFAULT_SLASH_COMMANDS.filter((cmd) =>
    cmd.command.toLowerCase().startsWith(input.toLowerCase())
  );

  const handleSelectSlashCommand = (cmd: SlashCommand) => {
    setInput(cmd.prompt);
    setShowSlashMenu(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || disabled) return;
    onSendMessage(input.trim());
    setInput('');
    setShowSlashMenu(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSlashMenu && filteredSlashCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSlashIndex((prev) => (prev + 1) % filteredSlashCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSlashIndex((prev) =>
          prev === 0 ? filteredSlashCommands.length - 1 : prev - 1
        );
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleSelectSlashCommand(filteredSlashCommands[selectedSlashIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowSlashMenu(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileName = files[0].name;
      setInput((prev) =>
        prev
          ? `${prev}\n[Attached File: ${fileName}]`
          : `Please analyze this attached file: ${fileName}`
      );
      toast.success(`Attached "${fileName}"`);
    }
  };

  const handleModelChange = (opt: ModelOption) => {
    if (opt.isLocked) {
      setTargetUpgradeModel(opt);
      setIsUpgradeModalOpen(true);
      return;
    }
    if (onSelectModel) {
      onSelectModel(opt.modelKey);
    }
  };

  const toggleVoiceDictation = () => {
    if (typeof window === 'undefined') return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.info('Voice dictation is not supported in this browser. Please use Google Chrome or Edge.');
      return;
    }

    if (isVoiceListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsVoiceListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsVoiceListening(false);
      };

      recognition.onerror = () => {
        setIsVoiceListening(false);
      };

      recognition.onend = () => {
        setIsVoiceListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsVoiceListening(true);
      toast.info('Listening... Speak into your microphone');
    } catch {
      setIsVoiceListening(false);
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileAttach}
        className="hidden"
      />

      {/* Slash Commands Dropdown */}
      {showSlashMenu && filteredSlashCommands.length > 0 && (
        <div
          ref={slashMenuRef}
          className="absolute bottom-full mb-2 left-0 right-0 max-w-md bg-card border border-border/80 rounded-2xl shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>CRM Quick Commands</span>
          </div>
          <div className="space-y-0.5 mt-1 max-h-48 overflow-y-auto">
            {filteredSlashCommands.map((cmd, idx) => {
              const isSelected = idx === selectedSlashIndex;
              return (
                <button
                  key={cmd.command}
                  type="button"
                  onClick={() => handleSelectSlashCommand(cmd)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors text-xs cursor-pointer ${
                    isSelected
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground/80 hover:bg-muted'
                  }`}
                >
                  <span className="font-mono font-semibold text-primary">
                    {cmd.command}
                  </span>
                  <span className="text-foreground truncate flex-1">{cmd.label}</span>
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">
                    {cmd.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Composer Box */}
      <form
        onSubmit={handleSubmit}
        className="relative bg-card/95 border border-border/70 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15 rounded-xl p-1.5 sm:p-2 shadow-xs transition-all duration-200"
      >
        <div className="flex flex-col gap-0.5">
          {/* Input Textarea Area */}
          <div className="px-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={
                placeholder ||
                (isSuperAdmin
                  ? 'Ask ClixPro Platform AI... (Type / for quick commands)'
                  : 'Ask ClixPro AI... (Type / for quick commands)')
              }
              rows={1}
              className="w-full bg-transparent border-none focus:outline-none resize-none min-h-[24px] max-h-36 text-xs sm:text-[13px] text-foreground placeholder:text-muted-foreground/60 leading-snug py-0.5"
            />
          </div>

          {/* Bottom Controls Bar (Model Selector + Tools + Send Button) */}
          <div className="flex items-center justify-between pt-0.5 gap-2 select-none">
            {/* Left side: Plus (+) button & Model selector */}
            <div className="flex items-center gap-1 min-w-0">
              {/* Plus Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 rounded-md transition-colors cursor-pointer shrink-0"
                title="Attach file or context"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              {/* Model Selector Dropdown Trigger */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="h-6 flex items-center gap-1 px-2 rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer border border-transparent hover:border-border/50 max-w-[220px] sm:max-w-xs truncate group"
                  >
                    <span className="truncate">{currentModelOption.displayName}</span>
                    <ChevronUp className="w-3 h-3 text-muted-foreground group-hover:text-foreground shrink-0 transition-transform duration-150" />
                  </button>
                </DropdownMenuTrigger>

                {/* Model Selector Popup Menu */}
                <DropdownMenuContent
                  side="top"
                  align="start"
                  sideOffset={8}
                  className="w-72 sm:w-80 p-1.5 rounded-2xl bg-popover text-popover-foreground border border-border/80 shadow-2xl z-50 text-xs animate-in fade-in-0 zoom-in-95 duration-150"
                >
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground tracking-tight select-none">
                    Model
                  </div>
                  <div className="space-y-0.5 mt-0.5">
                    {modelsList.map((opt) => {
                      const isSelected = selectedModel === opt.modelKey;
                      return (
                        <button
                          key={opt.modelKey + opt.displayName}
                          type="button"
                          onClick={() => handleModelChange(opt)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all text-left group cursor-pointer ${
                            isSelected
                              ? 'bg-muted text-foreground font-semibold shadow-2xs'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                          }`}
                        >
                          <span className="truncate pr-2">{opt.displayName}</span>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {opt.badge && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted/90 text-muted-foreground font-mono border border-border/40 flex items-center gap-0.5">
                                {opt.badge}
                                {opt.badgeInfo && (
                                  <span className="text-[9px] opacity-75">{opt.badgeInfo}</span>
                                )}
                              </span>
                            )}
                            {opt.hasSubmenu && (
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                            )}
                            {opt.isLocked && (
                              <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Right side: Mic voice button + Circular Send/Stop Button */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Mic Dictation Button */}
              <button
                type="button"
                onClick={toggleVoiceDictation}
                className={`w-6 h-6 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
                  isVoiceListening
                    ? 'bg-destructive/10 text-destructive animate-pulse'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}
                title={isVoiceListening ? 'Listening... click to stop' : 'Voice input (Dictation)'}
              >
                {isVoiceListening ? (
                  <MicOff className="w-3.5 h-3.5" />
                ) : (
                  <Mic className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Action Button: Send or Stop */}
              {isLoading ? (
                <button
                  type="button"
                  onClick={onStop}
                  className="w-7 h-7 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center justify-center shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
                  title="Stop generation"
                >
                  <Square className="w-3 h-3 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={disabled || !input.trim()}
                  className={`w-7 h-7 rounded-full flex items-center justify-center shadow-xs transition-all shrink-0 ${
                    input.trim() && !disabled
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer hover:scale-105 active:scale-95'
                      : 'bg-muted text-muted-foreground/40 cursor-not-allowed'
                  }`}
                  title="Send message (Enter)"
                >
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Subtle Compact Hint Footer */}
      <div className="flex items-center justify-between px-1 pt-1 text-[10px] text-muted-foreground/60 select-none">
        <span>
          <kbd className="font-mono bg-muted/60 px-1 py-0.2 rounded border border-border/40 text-[9px]">Enter ↵</kbd> to send, <kbd className="font-mono bg-muted/60 px-1 py-0.2 rounded border border-border/40 text-[9px]">Shift + Enter</kbd> for new line
        </span>
        <span className="hidden sm:inline">
          <kbd className="font-mono bg-muted/60 px-1 py-0.2 rounded border border-border/40 text-[9px]">/</kbd> for commands
        </span>
      </div>

      {/* Tier Upgrade Dialog */}
      <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2">
              <Zap className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold">
              Upgrade to Unlock {targetUpgradeModel?.displayName}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {targetUpgradeModel?.description ||
                'This advanced reasoning model is available exclusively on Growth, Pro, and Enterprise subscription plans.'}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/40 rounded-xl p-3 border border-border/60 space-y-2 text-xs">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Included with Advanced Tier:</span>
            </div>
            <ul className="space-y-1 text-muted-foreground pl-5 list-disc text-[11px]">
              <li>Extended Thinking & Complex Architecture Reasoning</li>
              <li>Predictive Lead Scoring & Churn Forecasting</li>
              <li>Autonomous Multi-step Workflow Automation</li>
            </ul>
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUpgradeModalOpen(false)}
              className="flex-1 sm:flex-none text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setIsUpgradeModalOpen(false);
                router.push('/upgrade');
              }}
              className="flex-1 sm:flex-none text-xs gap-1.5 bg-primary text-primary-foreground"
            >
              <span>View Plans</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
