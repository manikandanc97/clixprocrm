'use client';

import { useChat } from '@ai-sdk/react';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { DefaultChatTransport } from 'ai';
import { useAuth } from '@/features/auth/components/auth-provider';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ChatSession, ModelOption, CrmContextData } from '../types';

export const STORAGE_KEY = 'clixpro_ai_chat_sessions_v1';

export function extractMessageText(m: any): string {
  if (!m) return '';
  if (typeof m.content === 'string' && m.content.trim()) return m.content;
  if (m.parts && Array.isArray(m.parts)) {
    const textPart = m.parts.find((p: any) => p.type === 'text' && p.text);
    if (textPart && typeof textPart.text === 'string') return textPart.text;
  }
  return '';
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(minutes / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function useAIWorkspace() {
  const auth = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Session state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [activeContext, setActiveContext] = useState<CrmContextData | null>(null);

  // Entitled AI Models state
  const [entitledModels, setEntitledModels] = useState<ModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.6-flash');
  const [planName, setPlanName] = useState<string>('');
  const [aiEnabled, setAiEnabled] = useState<boolean>(true);
  const [globalAiEnabled, setGlobalAiEnabled] = useState<boolean>(true);

  const selectedModelRef = useRef(selectedModel);
  selectedModelRef.current = selectedModel;

  const activeContextRef = useRef(activeContext);
  activeContextRef.current = activeContext;

  const isSuperAdmin = useMemo(() => {
    const norm = (auth?.user?.role || '').toUpperCase().trim().replace(/[\s_]+/g, '');
    return (
      norm === 'SUPERADMIN' ||
      (auth?.user as any)?.isSuperAdmin === true ||
      (pathname ? pathname.startsWith('/super-admin') : false)
    );
  }, [auth?.user, pathname]);

  // Load URL query context on initial mount
  useEffect(() => {
    const contextParam = searchParams.get('context');
    const typeParam = searchParams.get('type') as any;
    const idParam = searchParams.get('id');

    if (contextParam) {
      setActiveContext({
        name: contextParam,
        type: typeParam || 'general',
        id: idParam || undefined,
      });
    }
  }, [searchParams]);

  // Load sessions from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSessions(parsed);
        }
      }
    } catch (err) {
      console.error('[ClixPro AI] Error loading sessions:', err);
    }
  }, []);

  const saveSessionsToStorage = useCallback((updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
    } catch (err) {
      console.error('[ClixPro AI] Error saving sessions:', err);
    }
  }, []);

  // Fetch model options from backend and map to user-friendly labels
  useEffect(() => {
    async function loadModels() {
      try {
        const res = await fetch('/api/ai/models');
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setGlobalAiEnabled(json.data.globalAiEnabled !== false);
            setAiEnabled(json.data.aiEnabled !== false);

            const currentPlanId = (json.data.planId || 'free').toLowerCase();
            const hasAdvancedTier =
              isSuperAdmin ||
              currentPlanId === 'growth' ||
              currentPlanId === 'pro' ||
              currentPlanId === 'business' ||
              currentPlanId === 'enterprise' ||
              currentPlanId === 'pro_plus';

            const rawModels: any[] = Array.isArray(json.data.models) ? json.data.models : [];

            // Find best matching backend keys
            const fastModelKey =
              rawModels.find((m) => m.modelKey?.includes('flash') || m.modelKey?.includes('mini'))?.modelKey ||
              json.data.defaultModelKey ||
              'gemini-3.6-flash';

            const advancedModelKey =
              rawModels.find((m) => m.modelKey?.includes('pro') || m.modelKey?.includes('sonnet') || m.modelKey?.includes('gpt-4o'))?.modelKey ||
              'gemini-2.5-pro';

            const tierModels: ModelOption[] = [
              {
                modelKey: fastModelKey,
                displayName: 'Auto (Recommended)',
                friendlyLabel: 'Auto',
                description: 'Smart balanced routing for high-speed queries and instant CRM search.',
                badge: 'Fast',
                isLocked: false,
                reasoningEffort: 'standard',
              },
              {
                modelKey: fastModelKey,
                displayName: 'Fast (Instant Responses)',
                friendlyLabel: 'Fast',
                description: 'Token-efficient lightweight intelligence for everyday tasks and summaries.',
                badge: 'Lightning',
                isLocked: false,
                reasoningEffort: 'standard',
              },
              {
                modelKey: advancedModelKey,
                displayName: 'Advanced (Deep Analysis)',
                friendlyLabel: 'Advanced',
                description: hasAdvancedTier
                  ? 'Deep reasoning, root-cause analysis, and predictive win-rate forecasting.'
                  : 'Deep reasoning, root-cause diagnostics & predictive CRM intelligence. Upgrade to unlock.',
                badge: hasAdvancedTier ? 'Deep Analysis' : 'Pro Tier',
                isLocked: !hasAdvancedTier,
                requiredPlan: 'Growth / Pro',
                reasoningEffort: 'deep',
              },
            ];

            setEntitledModels(tierModels);

            if (json.data.defaultModelKey) {
              setSelectedModel(json.data.defaultModelKey);
            }
            if (json.data.planName) {
              setPlanName(json.data.planName);
            }
          }
        }
      } catch (err) {
        console.error('[ClixPro AI] Failed to load models:', err);
      }
    }
    loadModels();
  }, [isSuperAdmin]);

  // Setup transport
  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: '/api/ai/chat',
      fetch: async (url: any, options: any) => {
        try {
          const fullUrl = url.startsWith('http')
            ? url
            : typeof window !== 'undefined'
            ? `${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`
            : url;

          const headers = new Headers(options.headers || {});

          if (typeof window !== 'undefined') {
            const currency = localStorage.getItem('orbit_currency') || 'INR';
            headers.set('X-Currency', currency);

            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            const {
              data: { session },
            } = await supabase.auth.getSession();

            if (session?.access_token) {
              headers.set('Authorization', `Bearer ${session.access_token}`);
            }
          }

          // Inject selected model and CRM context if present
          let payload = options.body;
          if (options.body) {
            try {
              const parsed = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
              
              // If context exists, prepend a brief context statement to user message payload if needed
              const currentCtx = activeContextRef.current;
              payload = JSON.stringify({
                ...parsed,
                model: selectedModelRef.current,
                context: currentCtx ? { name: currentCtx.name, type: currentCtx.type, id: currentCtx.id } : undefined,
              });
            } catch {}
          }

          const response = await fetch(fullUrl, {
            method: options.method,
            body: payload,
            headers: headers,
          });

          if (!response.ok) {
            const clonedRes = response.clone();
            const text = await clonedRes.text().catch(() => '');
            console.error('[ClixPro AI] Request failed:', response.status, text);
          }

          return response;
        } catch (err: any) {
          console.error('[ClixPro AI] Connection error:', err);
          throw err;
        }
      },
    });
  }, []);

  const {
    messages,
    sendMessage,
    status,
    error,
    setMessages,
    stop,
    clearError,
  } = useChat({
    transport,
    onError: (err) => {
      let msg = err?.message || 'An unexpected error occurred.';
      if (msg.startsWith('<!DOCTYPE html>')) {
        msg = 'Server returned HTML error (404/500). Please check backend connection.';
      }
      console.error('[ClixPro AI Error]:', msg);
    },
  });

  // Sync messages into active chat session
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    const firstUserMsg = messages.find((m) => m.role === 'user');
    const firstText = firstUserMsg ? extractMessageText(firstUserMsg) : '';
    const sessionTitle =
      firstText.length > 40
        ? `${firstText.slice(0, 40)}...`
        : firstText || 'New Conversation';

    if (!currentSessionId) {
      const newSessionId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `session_${Date.now()}`;

      const newSession: ChatSession = {
        id: newSessionId,
        title: sessionTitle,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        context: activeContext?.name || null,
        messages: messages,
      };

      setCurrentSessionId(newSessionId);
      const updated = [newSession, ...sessions.filter((s) => s.id !== newSessionId)];
      saveSessionsToStorage(updated);
    } else {
      const existingIdx = sessions.findIndex((s) => s.id === currentSessionId);
      let updated: ChatSession[];

      if (existingIdx !== -1) {
        const existing = sessions[existingIdx];
        const updatedSession: ChatSession = {
          ...existing,
          title: existing.title === 'New Conversation' ? sessionTitle : existing.title,
          updatedAt: Date.now(),
          context: existing.context || (activeContext?.name ? activeContext.name : null),
          messages: messages,
        };
        updated = [
          updatedSession,
          ...sessions.filter((s) => s.id !== currentSessionId),
        ];
      } else {
        const newSession: ChatSession = {
          id: currentSessionId,
          title: sessionTitle,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          context: activeContext?.name || null,
          messages: messages,
        };
        updated = [newSession, ...sessions];
      }
      saveSessionsToStorage(updated);
    }
  }, [messages, currentSessionId, sessions, activeContext, saveSessionsToStorage]);

  const isLoading = status === 'submitted' || status === 'streaming';

  const startNewChat = useCallback(() => {
    if (isLoading) {
      stop();
    }
    setCurrentSessionId(null);
    setMessages([]);
    clearError?.();
  }, [isLoading, stop, setMessages, clearError]);

  const selectSession = useCallback((session: ChatSession) => {
    if (isLoading) {
      stop();
    }
    setCurrentSessionId(session.id);
    setMessages(session.messages || []);
    clearError?.();
    if (session.context) {
      setActiveContext({ name: session.context, type: 'general' });
    }
  }, [isLoading, stop, setMessages, clearError]);

  const deleteSession = useCallback((sessionId: string) => {
    const updated = sessions.filter((s) => s.id !== sessionId);
    saveSessionsToStorage(updated);

    if (currentSessionId === sessionId) {
      setMessages([]);
      setCurrentSessionId(null);
    }
    toast.success('Conversation deleted');
  }, [sessions, currentSessionId, saveSessionsToStorage, setMessages]);

  const renameSession = useCallback((sessionId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    const updated = sessions.map((s) =>
      s.id === sessionId ? { ...s, title: newTitle.trim(), updatedAt: Date.now() } : s
    );
    saveSessionsToStorage(updated);
    toast.success('Conversation renamed');
  }, [sessions, saveSessionsToStorage]);

  const togglePinSession = useCallback((sessionId: string) => {
    const updated = sessions.map((s) =>
      s.id === sessionId ? { ...s, isPinned: !s.isPinned, updatedAt: Date.now() } : s
    );
    saveSessionsToStorage(updated);
    const target = updated.find((s) => s.id === sessionId);
    toast.success(target?.isPinned ? 'Conversation pinned' : 'Conversation unpinned');
  }, [sessions, saveSessionsToStorage]);

  const toggleArchiveSession = useCallback((sessionId: string) => {
    const updated = sessions.map((s) =>
      s.id === sessionId ? { ...s, isArchived: !s.isArchived, updatedAt: Date.now() } : s
    );
    saveSessionsToStorage(updated);
    const target = updated.find((s) => s.id === sessionId);
    toast.success(target?.isArchived ? 'Conversation archived' : 'Conversation unarchived');
  }, [sessions, saveSessionsToStorage]);

  const clearAllHistory = useCallback(() => {
    if (isLoading) {
      stop();
    }
    saveSessionsToStorage([]);
    setCurrentSessionId(null);
    setMessages([]);
    clearError?.();
    toast.success('All conversation history cleared');
  }, [isLoading, stop, saveSessionsToStorage, setMessages, clearError]);

  // Grouped sessions for sidebar
  const groupedSessions = useMemo(() => {
    const query = historySearchQuery.trim().toLowerCase();
    const filtered = sessions.filter((s) => {
      if (!query) return true;
      const titleMatch = s.title.toLowerCase().includes(query);
      const messagesMatch = s.messages?.some((m) =>
        extractMessageText(m).toLowerCase().includes(query)
      );
      return titleMatch || messagesMatch;
    });

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;

    const pinned: ChatSession[] = [];
    const today: ChatSession[] = [];
    const yesterday: ChatSession[] = [];
    const previous7Days: ChatSession[] = [];
    const older: ChatSession[] = [];
    const archived: ChatSession[] = [];

    for (const session of filtered) {
      if (session.isArchived) {
        archived.push(session);
        continue;
      }
      if (session.isPinned) {
        pinned.push(session);
        continue;
      }

      const time = session.updatedAt || session.createdAt || now;
      const diff = now - time;

      if (diff < oneDay) {
        today.push(session);
      } else if (diff < 2 * oneDay) {
        yesterday.push(session);
      } else if (diff < sevenDays) {
        previous7Days.push(session);
      } else {
        older.push(session);
      }
    }

    return {
      pinned,
      today,
      yesterday,
      previous7Days,
      older,
      archived,
      totalCount: sessions.length,
      filteredCount: filtered.length,
    };
  }, [sessions, historySearchQuery]);

  const handleSendMessage = useCallback((text: string) => {
    if (!text.trim() || isLoading) return;
    if (sendMessage) {
      sendMessage({ text });
    }
  }, [isLoading, sendMessage]);

  const handleConfirmAction = useCallback((promptText: string) => {
    if (sendMessage) {
      sendMessage({ text: promptText });
    }
  }, [sendMessage]);

  return {
    messages,
    isLoading,
    error,
    status,
    stop,
    clearError,
    setMessages,
    sendMessage: handleSendMessage,
    confirmAction: handleConfirmAction,
    
    // Sessions
    sessions,
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
    setActiveContext,
    clearContext: () => setActiveContext(null),
    entitledModels,
    selectedModel,
    setSelectedModel,
    planName,
    aiEnabled,
    globalAiEnabled,
    isSuperAdmin,
  };
}
