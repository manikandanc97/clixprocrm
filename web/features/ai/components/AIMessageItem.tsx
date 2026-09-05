'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { UIMessage } from '@ai-sdk/react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';

interface AIMessageItemProps {
  message: UIMessage & { id: string; toolInvocations?: any[] };
  onConfirmAction?: (prompt: string) => void;
  isLast?: boolean;
}

function getToolStatusLabel(toolName?: string): string {
  if (!toolName || toolName === 'unknown') return 'ClixPro AI is thinking...';
  const name = toolName.replace(/^tool-/, '').toLowerCase();
  if (name.includes('platformoverview') || name.includes('platform_overview')) return 'Gathering platform-wide telemetry & tenant stats...';
  if (name.includes('platformanalytics') || name.includes('platform_analytics') || name.includes('mrr')) return 'Calculating MRR, ARR, and financial growth analytics...';
  if (name.includes('platformorganization') || name.includes('platform_organization')) return 'Scanning multi-tenant fleet and organizations...';
  if (name.includes('platformsecurity') || name.includes('platform_security')) return 'Performing SecOps threat triage & telemetry check...';
  if (name.includes('platformaudit') || name.includes('platform_audit')) return 'Auditing platform security logs and administrative events...';
  if (name.includes('platformai') || name.includes('platform_ai')) return 'Analyzing AI ecosystem, token burn rates, and quotas...';
  if (name.includes('diagnosis') || name.includes('deep')) return 'Running comprehensive multi-dimensional platform diagnosis...';
  if (name.includes('lead')) return 'Searching CRM leads...';
  if (name.includes('customer')) return 'Looking up customer accounts...';
  if (name.includes('deal') || name.includes('pipeline')) return 'Analyzing sales pipeline...';
  if (name.includes('task') || name.includes('activity')) return 'Checking tasks & activities...';
  if (name.includes('report') || name.includes('sales')) return 'Compiling sales report analytics...';
  if (name.includes('quotation')) return 'Retrieving quotations & proposals...';
  return 'Processing CRM intelligence request...';
}

export function AIMessageItem({ message, onConfirmAction }: AIMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  // Extract content
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content =
    (message as any).content ||
    (message.parts?.find((p: any) => p.type === 'text') as any)?.text ||
    '';
  const isError = message.role === 'system' && content.includes('Error:');

  // Compatibility for tool invocations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toolInvocations =
    message.toolInvocations ||
    message.parts
      ?.filter(
        (p: any) =>
          p.type === 'tool-invocation' ||
          p.type?.startsWith('tool-') ||
          p.type === 'dynamic-tool'
      )
      .map((p: any) => ({
        toolName:
          p.toolName ||
          (p.type?.startsWith('tool-') ? p.type.replace('tool-', '') : 'unknown'),
        hasResult:
          'output' in p ||
          'result' in p ||
          p.state === 'output-available' ||
          p.state === 'output-error',
        result: p.output || p.result,
        ...p,
      })) ||
    [];

  const activeTool = toolInvocations.find((t: any) => !t.hasResult);
  const loadingStatusText = getToolStatusLabel(
    activeTool?.toolName || toolInvocations[0]?.toolName
  );

  // Check if any tool output requested confirmation
  const confirmationReq = toolInvocations.find(
    (t: any) => t.result && t.result.confirmationRequired === true
  );

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-6 group animate-in fade-in duration-200">
        <div className="flex items-start gap-2.5 max-w-[85%] sm:max-w-[75%]">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-xs px-4 py-3 shadow-xs">
            <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">
              {content}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6 group animate-in fade-in duration-200">
      <div className="flex gap-3 max-w-full sm:max-w-[92%] w-full">
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isError
                ? 'bg-destructive/10 text-destructive'
                : 'bg-primary/10 text-primary border border-primary/20'
            } shadow-2xs`}
          >
            {isError ? <AlertCircle className="w-4 h-4" /> : <Sparkles className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* Content Box */}
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          {/* AI Header Line */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-foreground/90 font-display">
              ClixPro AI
            </span>
            {content && !isError && (
              <button
                onClick={handleCopyText}
                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-opacity"
                title="Copy response"
              >
                {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Body */}
          <div
            className={`rounded-2xl rounded-tl-xs p-4 text-xs sm:text-sm leading-relaxed overflow-hidden border ${
              isError
                ? 'border-destructive/30 bg-destructive/5 text-destructive'
                : 'border-border/60 bg-card/60 shadow-2xs'
            }`}
          >
            {isError ? (
              <div className="font-medium text-destructive">{content}</div>
            ) : content ? (
              <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm prose-p:leading-relaxed prose-p:mb-3 prose-headings:font-display prose-headings:font-bold prose-headings:text-foreground prose-table:border-collapse prose-table:w-full prose-th:bg-muted/50 prose-th:p-2 prose-th:text-left prose-th:text-xs prose-th:font-semibold prose-th:border prose-th:border-border/80 prose-td:p-2 prose-td:text-xs prose-td:border prose-td:border-border/60 prose-tr:hover:bg-muted/30 prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[11px] prose-pre:bg-muted/80 prose-pre:border prose-pre:border-border prose-pre:p-3 prose-pre:rounded-xl">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              </div>
            ) : (
              /* Loading Tool Invocation Status */
              <div className="flex items-center gap-2.5 py-1 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                </div>
                <span className="text-xs font-medium text-muted-foreground animate-pulse">
                  {loadingStatusText}
                </span>
              </div>
            )}

            {/* Mutation Confirmation Card if write operation requires confirmation */}
            {confirmationReq && onConfirmAction && (
              <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Action Confirmation Required</span>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {confirmationReq.result.message ||
                    'ClixPro AI requires your confirmation before updating records in the CRM database.'}
                </p>

                {confirmationReq.result.proposedData && (
                  <div className="bg-background/80 p-2.5 rounded-lg border border-border/80 text-[11px] font-mono space-y-1">
                    {Object.entries(confirmationReq.result.proposedData).map(
                      ([key, val]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground uppercase">{key}:</span>
                          <span className="font-semibold text-foreground">{String(val)}</span>
                        </div>
                      )
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() =>
                      onConfirmAction(
                        `Confirmed. Please execute the ${
                          confirmationReq.toolName || 'CRM'
                        } operation now.`
                      )
                    }
                    className="bg-primary text-primary-foreground text-xs font-medium h-8 rounded-lg"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Confirm & Execute
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onConfirmAction('Cancel this action. Do not make changes.')
                    }
                    className="text-xs h-8 rounded-lg"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
