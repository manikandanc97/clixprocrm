'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  Sparkles,
  Users,
  Briefcase,
  TrendingUp,
  Calendar,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { SlashCommand } from '../types';

interface AIChatComposerProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onStop: () => void;
  disabled?: boolean;
  placeholder?: string;
  isSuperAdmin?: boolean;
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

export function AIChatComposer({
  onSendMessage,
  isLoading,
  onStop,
  disabled = false,
  placeholder,
  isSuperAdmin = false,
}: AIChatComposerProps) {
  const [input, setInput] = useState('');
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const slashMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        160
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
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors text-xs ${
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
        className="relative bg-card border border-border/80 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20 rounded-2xl p-2 sm:p-2.5 shadow-sm transition-all duration-200"
      >
        <div className="flex items-end gap-2">
          {/* Attach Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl transition-colors shrink-0 mb-0.5"
            title="Attach file / reference"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Input Textarea */}
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
            className="w-full bg-transparent border-none focus:outline-none resize-none min-h-[38px] max-h-40 py-2 text-xs sm:text-sm text-foreground placeholder-muted-foreground leading-relaxed"
          />

          {/* Action Button: Send or Stop */}
          {isLoading ? (
            <button
              type="button"
              onClick={onStop}
              className="p-2 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shrink-0 mb-0.5 shadow-2xs"
              title="Stop generation"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={disabled || !input.trim()}
              className={`p-2 rounded-xl transition-all shrink-0 mb-0.5 ${
                input.trim() && !disabled
                  ? 'bg-primary text-primary-foreground hover:brightness-105 shadow-2xs cursor-pointer'
                  : 'bg-muted text-muted-foreground/50 cursor-not-allowed'
              }`}
              title="Send prompt (Enter)"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </form>

      {/* Subtle Hint Footer */}
      <div className="flex items-center justify-between px-2 pt-1.5 text-[10px] text-muted-foreground/70 select-none">
        <span>Press <kbd className="font-mono bg-muted px-1 py-0.5 rounded border border-border/50">Enter ↵</kbd> to send, <kbd className="font-mono bg-muted px-1 py-0.5 rounded border border-border/50">Shift + Enter</kbd> for new line</span>
        <span className="hidden sm:inline">Type <kbd className="font-mono bg-muted px-1 py-0.5 rounded border border-border/50">/</kbd> for quick CRM commands</span>
      </div>
    </div>
  );
}
