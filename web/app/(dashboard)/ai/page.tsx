'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/features/auth/components/auth-provider';
import { useAIWorkspace, extractMessageText } from '@/features/ai/hooks/use-ai-workspace';
import { AIConversationSidebar } from '@/features/ai/components/AIConversationSidebar';
import { AIChatHeader } from '@/features/ai/components/AIChatHeader';
import { AIEmptyWorkspace } from '@/features/ai/components/AIEmptyWorkspace';
import { AIMessageItem } from '@/features/ai/components/AIMessageItem';
import { AIChatComposer } from '@/features/ai/components/AIChatComposer';
import { AICrmContextPanel } from '@/features/ai/components/AICrmContextPanel';
import { CRMPageContainer } from '@/shared/components/crm';
import { toast } from 'sonner';

import { MessageSquare, Database, X } from 'lucide-react';

export default function AIWorkspacePage() {
  const { user } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [activeRightTab, setActiveRightTab] = useState<'chats' | 'context'>('chats');

  const {
    messages,
    isLoading,
    error,
    stop,
    clearError,
    setMessages,
    sendMessage,
    confirmAction,

    // Sessions
    currentSessionId,
    groupedSessions,
    historySearchQuery,
    setHistorySearchQuery,
    startNewChat,
    selectSession,
    deleteSession,
    renameSession,
    togglePinSession,
    toggleArchiveSession,
    clearAllHistory,

    // Context & Models
    activeContext,
    clearContext,
    entitledModels,
    selectedModel,
    setSelectedModel,
    planName,
    aiEnabled,
    globalAiEnabled,
    isSuperAdmin,
  } = useAIWorkspace();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleCopyTranscript = async () => {
    if (messages.length === 0) {
      toast.info('No messages to copy');
      return;
    }

    try {
      const transcript = messages
        .map((m) => {
          const role = m.role === 'user' ? 'You' : 'ClixPro AI';
          const content = extractMessageText(m);
          return `${role}:\n${content}\n`;
        })
        .join('\n---\n\n');

      await navigator.clipboard.writeText(transcript);
      toast.success('Conversation transcript copied to clipboard');
    } catch {
      toast.error('Failed to copy chat transcript');
    }
  };

  const handleClearMessages = () => {
    if (messages.length === 0) return;
    if (isLoading) stop();
    setMessages([]);
    clearError?.();
    toast.success('Messages cleared');
  };

  const displayMessages = [...messages];
  if (error) {
    let errorMessage = error.message;
    try {
      const parsed = JSON.parse(error.message);
      if (parsed.message) errorMessage = parsed.message;
      if (parsed.error && parsed.error.message) errorMessage = parsed.error.message;
    } catch {}

    displayMessages.push({
      id: 'error-msg',
      role: 'system',
      parts: [
        {
          type: 'text',
          text: `Error: ${
            errorMessage ||
            'An unexpected error occurred while communicating with ClixPro AI platform.'
          }`,
        },
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  }

  const renderRightPanelContent = (isMobile = false) => {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Tab Switcher Header */}
        <div className="p-2.5 sm:p-3 border-b border-border/60 flex items-center justify-between shrink-0 bg-muted/30">
          <div className="flex items-center gap-1 bg-muted/80 p-1 rounded-xl flex-1 mr-2 border border-border/40">
            <button
              onClick={() => setActiveRightTab('chats')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeRightTab === 'chats'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chats</span>
              {groupedSessions.totalCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-bold">
                  {groupedSessions.totalCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveRightTab('context')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeRightTab === 'context'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Context</span>
              {activeContext && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
          </div>

          <button
            onClick={() => {
              if (isMobile) setIsMobileSidebarOpen(false);
              else setIsRightSidebarOpen(false);
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors shrink-0 cursor-pointer"
            title="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeRightTab === 'chats' ? (
            <div className="h-full animate-in fade-in-50 duration-150">
              <AIConversationSidebar
                groupedSessions={groupedSessions}
                currentSessionId={currentSessionId}
                historySearchQuery={historySearchQuery}
                onSearchChange={setHistorySearchQuery}
                onSelectSession={(s) => {
                  selectSession(s);
                  if (isMobile) setIsMobileSidebarOpen(false);
                }}
                onStartNewChat={() => {
                  startNewChat();
                  if (isMobile) setIsMobileSidebarOpen(false);
                }}
                onDeleteSession={deleteSession}
                onRenameSession={renameSession}
                onTogglePinSession={togglePinSession}
                onToggleArchiveSession={toggleArchiveSession}
                onClearAllHistory={clearAllHistory}
                hideHeader={true}
              />
            </div>
          ) : (
            <div className="h-full animate-in fade-in-50 duration-150">
              <AICrmContextPanel
                activeContext={activeContext}
                onClearContext={clearContext}
                onSelectPrompt={(p) => {
                  sendMessage(p);
                  if (isMobile) setIsMobileSidebarOpen(false);
                }}
                onClose={() => {
                  if (isMobile) setIsMobileSidebarOpen(false);
                  else setIsRightSidebarOpen(false);
                }}
                hideHeader={true}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <CRMPageContainer className="flex-1 h-full min-h-0 pb-20 md:pb-3.5 gap-0">
      <div className="flex w-full flex-1 min-h-0 overflow-hidden bg-card text-card-foreground border border-sidebar-border/80 dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-2xl dark:shadow-black/40 rounded-2xl">
        {/* 1. Main Chat Workspace (Center) */}
        <main className="flex-1 flex flex-col h-full min-w-0 bg-background/50 relative">
          {/* Header */}
          <AIChatHeader
            onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            isSidebarOpen={isMobileSidebarOpen}
            onToggleContextPanel={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
            isContextPanelOpen={isRightSidebarOpen}
            onOpenContextTab={() => {
              setActiveRightTab('context');
              setIsRightSidebarOpen(true);
            }}
            activeContext={activeContext}
            onClearContext={clearContext}
            entitledModels={entitledModels}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            onCopyTranscript={handleCopyTranscript}
            onClearMessages={handleClearMessages}
            hasMessages={messages.length > 0}
            planName={planName}
            isSuperAdmin={isSuperAdmin}
          />

          {/* Chat Timeline Area */}
          <div
            className={`flex-1 p-3 sm:p-4 min-h-0 ${
              displayMessages.length === 0
                ? 'flex flex-col items-center justify-center overflow-hidden'
                : 'overflow-y-auto space-y-4'
            }`}
          >
            {displayMessages.length === 0 ? (
              <AIEmptyWorkspace
                onSelectPrompt={sendMessage}
                userName={user?.name}
                isSuperAdmin={isSuperAdmin}
              />
            ) : (
              <div className="max-w-4xl mx-auto w-full">
                {displayMessages.map((msg, idx) => (
                  <AIMessageItem
                    key={msg.id || idx}
                    message={msg}
                    onConfirmAction={confirmAction}
                    isLast={idx === displayMessages.length - 1}
                  />
                ))}

                {/* Live Streaming Indicator */}
                {isLoading &&
                  (!displayMessages.length ||
                    displayMessages[displayMessages.length - 1]?.role === 'user') && (
                    <AIMessageItem
                      message={
                        {
                          id: 'streaming-temp',
                          role: 'assistant',
                          parts: [],
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        } as any
                      }
                    />
                  )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Composer Area */}
          <div className="px-3 py-2 sm:px-5 sm:py-2.5 bg-background/80 backdrop-blur-xs border-t border-border/40 shrink-0">
            <AIChatComposer
              onSendMessage={sendMessage}
              isLoading={isLoading}
              onStop={stop}
              disabled={!globalAiEnabled || !aiEnabled}
              placeholder={
                !globalAiEnabled
                  ? 'AI services are temporarily unavailable platform-wide.'
                  : !aiEnabled
                  ? 'AI Assistant is not included in your current subscription tier.'
                  : isSuperAdmin
                  ? 'Ask ClixPro Platform AI... (Type / for quick commands)'
                  : 'Ask ClixPro AI... (Type / for quick commands)'
              }
              isSuperAdmin={isSuperAdmin}
              entitledModels={entitledModels}
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
              planName={planName}
            />
          </div>
        </main>

        {/* 2. Right Expandable Sidebar with Chats (New chat, Search) & CRM Context (Desktop) */}
        <aside
          className={`hidden md:flex shrink-0 h-full flex-col bg-card/60 select-none overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] will-change-[width,opacity] ${
            isRightSidebarOpen
              ? 'w-72 lg:w-80 opacity-100 border-l border-border/60 pointer-events-auto'
              : 'w-0 opacity-0 border-l-0 border-transparent pointer-events-none'
          }`}
          aria-hidden={!isRightSidebarOpen}
        >
          <div className="w-72 lg:w-80 h-full flex flex-col shrink-0">
            {renderRightPanelContent(false)}
          </div>
        </aside>

        {/* 3. Mobile Right Drawer */}
        <div
          className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ease-in-out ${
            isMobileSidebarOpen
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          }`}
        >
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div
            className={`absolute right-0 top-0 bottom-0 w-4/5 max-w-xs h-full bg-card shadow-2xl flex flex-col border-l border-border/60 transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
              isMobileSidebarOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {renderRightPanelContent(true)}
          </div>
        </div>
      </div>
    </CRMPageContainer>
  );
}
