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
import { toast } from 'sonner';

export default function AIWorkspacePage() {
  const { user } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileContextOpen, setIsMobileContextOpen] = useState(false);
  const [isContextPanelOpen, setIsContextPanelOpen] = useState(true);

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

  return (
    <div className="flex w-full h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* 1. Left Conversation Sidebar (Desktop) */}
      <aside className="hidden md:flex w-60 lg:w-68 shrink-0 h-full flex-col">
        <AIConversationSidebar
          groupedSessions={groupedSessions}
          currentSessionId={currentSessionId}
          historySearchQuery={historySearchQuery}
          onSearchChange={setHistorySearchQuery}
          onSelectSession={selectSession}
          onStartNewChat={startNewChat}
          onDeleteSession={deleteSession}
          onRenameSession={renameSession}
          onTogglePinSession={togglePinSession}
          onToggleArchiveSession={toggleArchiveSession}
          onClearAllHistory={clearAllHistory}
        />
      </aside>

      {/* Mobile History Sidebar Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-background/80 backdrop-blur-xs flex">
          <div className="w-4/5 max-w-xs h-full bg-card shadow-2xl animate-in slide-in-from-left duration-200">
            <AIConversationSidebar
              groupedSessions={groupedSessions}
              currentSessionId={currentSessionId}
              historySearchQuery={historySearchQuery}
              onSearchChange={setHistorySearchQuery}
              onSelectSession={selectSession}
              onStartNewChat={startNewChat}
              onDeleteSession={deleteSession}
              onRenameSession={renameSession}
              onTogglePinSession={togglePinSession}
              onToggleArchiveSession={toggleArchiveSession}
              onClearAllHistory={clearAllHistory}
              onCloseMobileDrawer={() => setIsMobileSidebarOpen(false)}
            />
          </div>
          <div
            className="flex-1 h-full"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        </div>
      )}

      {/* 2. Main Chat Workspace */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-background/50 relative">
        {/* Header */}
        <AIChatHeader
          onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          isSidebarOpen={isMobileSidebarOpen}
          onToggleContextPanel={() => {
            setIsContextPanelOpen(!isContextPanelOpen);
            setIsMobileContextOpen(!isMobileContextOpen);
          }}
          isContextPanelOpen={isContextPanelOpen}
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
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
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
        <div className="p-3 sm:p-4 bg-background/80 backdrop-blur-xs border-t border-border/60 shrink-0">
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
          />
        </div>
      </main>

      {/* 3. Right Expandable CRM Context Panel (Desktop) */}
      {isContextPanelOpen && (
        <aside className="hidden md:flex w-72 lg:w-80 shrink-0 h-full flex-col animate-in slide-in-from-right-4 duration-200">
          <AICrmContextPanel
            activeContext={activeContext}
            onClearContext={clearContext}
            onSelectPrompt={sendMessage}
            onClose={() => setIsContextPanelOpen(false)}
          />
        </aside>
      )}

      {/* Mobile CRM Context Drawer */}
      {isMobileContextOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-background/80 backdrop-blur-xs flex justify-end">
          <div
            className="flex-1 h-full"
            onClick={() => setIsMobileContextOpen(false)}
          />
          <div className="w-4/5 max-w-xs h-full bg-card shadow-2xl animate-in slide-in-from-right duration-200">
            <AICrmContextPanel
              activeContext={activeContext}
              onClearContext={clearContext}
              onSelectPrompt={(prompt) => {
                sendMessage(prompt);
                setIsMobileContextOpen(false);
              }}
              onClose={() => setIsMobileContextOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
